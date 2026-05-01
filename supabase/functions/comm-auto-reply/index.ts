// Comm Hub v2: AI tone-matched reply
// Reads user's last 200 outbound messages as a tone corpus, generates a draft
// using Lovable AI gateway, and either auto-sends (if enabled) or stores as a
// draft suggestion.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logChannelAudit } from "../_shared/channelAudit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const body = await req.json();
    const { thread_id, message_id } = body;
    if (!thread_id || !message_id) {
      return new Response(JSON.stringify({ error: "thread_id and message_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Resolve thread + user (+ channel binding)
    const { data: thread } = await admin
      .from("owner_comm_threads")
      .select("id, user_id, channel_id, channel_type, contact_name, contact_identifier")
      .eq("id", thread_id)
      .maybeSingle();
    if (!thread) {
      return new Response(JSON.stringify({ error: "thread not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-channel auto-reply gate. The Comm Hub lets the owner toggle
    // auto-reply per channel; if this thread's channel is OFF, bail early.
    let channelToneProfileId: string | null = null;
    if (thread.channel_id) {
      const { data: ch } = await admin
        .from("owner_comm_channels")
        .select("auto_reply_enabled, tone_profile_id, is_active")
        .eq("id", thread.channel_id)
        .maybeSingle();
      if (ch && (ch.auto_reply_enabled === false || ch.is_active === false)) {
        await logChannelAudit(admin, {
          user_id: thread.user_id,
          channel_id: thread.channel_id,
          channel_type: thread.channel_type,
          event_type: "auto_reply_skipped",
          details: { reason: ch.auto_reply_enabled === false ? "auto_reply_disabled" : "channel_inactive", thread_id: thread.id, message_id },
        });
        return new Response(
          JSON.stringify({ ok: true, skipped: "auto_reply_disabled_for_channel" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      channelToneProfileId = ch?.tone_profile_id ?? null;
    }

    // Tone profile — prefer the channel's pinned profile, fall back to the
    // user's active default profile.
    let tone: any = null;
    if (channelToneProfileId) {
      const { data } = await admin
        .from("owner_comm_tone_profiles")
        .select("*")
        .eq("id", channelToneProfileId)
        .eq("user_id", thread.user_id)
        .maybeSingle();
      tone = data;
    }
    if (!tone) {
      const { data } = await admin
        .from("owner_comm_tone_profiles")
        .select("*")
        .eq("user_id", thread.user_id)
        .eq("is_active", true)
        .maybeSingle();
      tone = data;
    }

    const { data: settings } = await admin
      .from("owner_comm_settings")
      .select("*")
      .eq("user_id", thread.user_id)
      .maybeSingle();

    // Last 30 thread messages
    const { data: recentMsgs } = await admin
      .from("owner_comm_messages")
      .select("direction, content, sender_name, created_at")
      .eq("thread_id", thread_id)
      .order("created_at", { ascending: true })
      .limit(30);

    // Last 200 outbound messages by this user across all threads (tone corpus)
    const { data: corpus } = await admin
      .from("owner_comm_messages")
      .select("content")
      .eq("user_id", thread.user_id)
      .eq("direction", "outbound")
      .eq("is_ai_generated", false)
      .order("created_at", { ascending: false })
      .limit(200);

    const toneProfile = tone
      ? `Profile: ${tone.profile_name}. Formality: ${tone.formality_level}/5. Emoji usage: ${tone.emoji_usage}/5. Length: ${tone.message_length}. Signature: ${tone.signature || "(none)"}.`
      : "Default professional tone.";

    const corpusSamples = (corpus ?? [])
      .map((c) => c.content?.toString().trim())
      .filter((s) => s && s.length > 5 && s.length < 500)
      .slice(0, 50)
      .map((s, i) => `EXAMPLE ${i + 1}: ${s}`)
      .join("\n");

    const conversation = (recentMsgs ?? [])
      .map((m) => `${m.direction === "inbound" ? (m.sender_name || "Them") : "Me"}: ${m.content}`)
      .join("\n");

    const systemPrompt = [
      "You are an executive assistant drafting a reply on behalf of the user.",
      `Channel: ${thread.channel_type}. Recipient: ${thread.contact_name || thread.contact_identifier}.`,
      `Tone profile: ${toneProfile}`,
      "",
      "STUDY THE FOLLOWING REAL MESSAGES THE USER HAS SENT IN THE PAST. Imitate the rhythm,",
      "phrasing, opening words, sign-off, vocabulary, and punctuation. NEVER copy verbatim —",
      "but write so it would pass for the user.",
      "",
      corpusSamples || "(no corpus available)",
    ].join("\n");

    const userPrompt = [
      "Recent conversation:",
      conversation,
      "",
      "Write the next reply from Me. Keep it natural, in the same style as the examples.",
      "Output only the reply text — no labels, no quotes, no explanation.",
    ].join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!aiResp.ok) {
      const t = await aiResp.text();
      throw new Error(`AI gateway failed [${aiResp.status}]: ${t}`);
    }
    const aiJson = await aiResp.json();
    const draft: string = aiJson?.choices?.[0]?.message?.content?.trim() || "";

    if (!draft) {
      return new Response(JSON.stringify({ error: "empty draft" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const autoSend = !!settings?.auto_send_enabled;

    // Always store as a draft message; mark as sent only when auto-send is on
    // AND we successfully dispatch via the appropriate channel. Dispatch is
    // intentionally deferred to a follow-up patch (Twilio/Gmail send) — for
    // now we always store as a draft suggestion.
    await admin.from("owner_comm_messages").insert({
      user_id: thread.user_id,
      thread_id,
      direction: "outbound",
      content: draft,
      content_type: "text",
      sender_identifier: "ai-draft",
      sender_name: "AI Draft",
      status: autoSend ? "draft_pending_send" : "draft_suggested",
      is_ai_generated: true,
      ai_model_used: "google/gemini-2.5-pro",
    });

    return new Response(JSON.stringify({ ok: true, draft }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[comm-auto-reply]", err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
