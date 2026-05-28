// Transcribes the saved call recording, generates AI summary + next step + property matches,
// and writes everything back to broker_call_logs.
// Also seeds a `broker_ai_chats` assistant row so the lead's assistant view shows the summary.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const callLogId: string = body.callLogId;
    if (!callLogId) return json({ error: "callLogId required" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load the call row; verify ownership.
    const { data: callRow, error: callErr } = await admin
      .from("broker_call_logs")
      .select("id, user_id, lead_id, recording_url, phone_number, call_status, duration_seconds")
      .eq("id", callLogId)
      .single();
    if (callErr || !callRow) return json({ error: "Call not found" }, 404);
    if (callRow.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (!callRow.recording_url) return json({ error: "No recording on this call" }, 400);

    // Download audio from storage.
    const { data: audioFile, error: dlErr } = await admin
      .storage
      .from("call-recordings")
      .download(callRow.recording_url);
    if (dlErr || !audioFile) return json({ error: "Download failed" }, 500);
    const ab = await audioFile.arrayBuffer();
    const audioBytes = new Uint8Array(ab);

    // Transcribe with ElevenLabs Scribe.
    const ELEVEN = Deno.env.get("ELEVENLABS_API_KEY");
    let transcriptText = "";
    let segments: any[] = [];
    if (ELEVEN) {
      try {
        const fd = new FormData();
        fd.append("file", new Blob([audioBytes], { type: audioFile.type || "audio/webm" }), "call.webm");
        fd.append("model_id", "scribe_v2");
        fd.append("tag_audio_events", "true");
        fd.append("diarize", "true");
        const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST", headers: { "xi-api-key": ELEVEN }, body: fd,
        });
        if (r.ok) {
          const j = await r.json();
          transcriptText = (j.text || "").toString();
          segments = j.words || [];
        } else {
          console.warn("scribe failed", r.status, await r.text());
        }
      } catch (e) { console.warn("scribe error", e); }
    }
    if (!transcriptText) {
      // Fallback: skip transcript, still produce a summary placeholder from metadata.
      transcriptText = `Call recorded (${callRow.duration_seconds || 0}s) — transcript unavailable.`;
    }

    // Pull lead + inventory for the AI evaluation.
    let lead: any = null;
    if (callRow.lead_id) {
      const { data: l } = await admin
        .from("crm_leads")
        .select("id, full_name, preferred_language, nationality, current_location_city, notes, pipeline_stage, budget_min, budget_max, budget_currency, preferred_location, property_type, bedroom_requirement, buying_purpose, lead_type, source, tags")
        .eq("id", callRow.lead_id).maybeSingle();
      lead = l;
    }

    let invQ = admin.from("projects")
      .select("id, name, slug, area_name, bedrooms_min, bedrooms_max, price_from, price_to, price_currency, property_type_label, status, developer_id")
      .eq("is_published", true).limit(40);
    if (lead?.budget_max) invQ = invQ.lte("price_from", Number(lead.budget_max) * 1.15);
    if (lead?.preferred_location) invQ = invQ.ilike("area_name", `%${lead.preferred_location}%`);
    const { data: projects } = await invQ;
    const devIds = [...new Set((projects ?? []).map((p: any) => p.developer_id).filter(Boolean))];
    const { data: devs } = devIds.length
      ? await admin.from("developers").select("id, name").in("id", devIds)
      : { data: [] as any[] };
    const devMap = new Map((devs ?? []).map((d: any) => [d.id, d.name]));
    const inventory = (projects ?? []).map((p: any) => ({
      id: p.id, name: p.name, developer: devMap.get(p.developer_id) || "JBJ",
      area: p.area_name,
      beds: [p.bedrooms_min, p.bedrooms_max].filter(Boolean).join("–") || null,
      price_from: p.price_from, currency: p.price_currency || "AED",
    })).slice(0, 25);

    // AI evaluation via Lovable AI Gateway.
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI gateway not configured" }, 500);

    const tools = [{
      type: "function",
      function: {
        name: "call_analysis",
        description: "Structured analysis of a sales call transcript.",
        parameters: {
          type: "object",
          additionalProperties: false,
          required: ["summary", "next_step", "score", "matches"],
          properties: {
            summary: { type: "string" },
            next_step: { type: "string" },
            score: { type: "integer", minimum: 0, maximum: 100 },
            matches: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["project_id", "name", "developer", "match_score", "reason"],
                properties: {
                  project_id: { type: "string" },
                  name: { type: "string" },
                  developer: { type: "string" },
                  area: { type: "string" },
                  beds: { type: "string" },
                  price_from: { type: ["number", "null"] },
                  currency: { type: "string" },
                  match_score: { type: "integer", minimum: 0, maximum: 100 },
                  reason: { type: "string" },
                },
              },
            },
          },
        },
      },
    }];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          { role: "system", content: "You are a senior Dubai real-estate sales director analysing a call between a JBJ broker and a client. Extract a concise 4-6 sentence summary, the single best next step, a 0-100 readiness score, and 1-3 inventory matches from the provided list (never invent properties)." },
          { role: "user", content: `LEAD:\n${JSON.stringify(lead, null, 2)}\n\nINVENTORY (only choose from these):\n${JSON.stringify(inventory, null, 2)}\n\nCALL TRANSCRIPT:\n${transcriptText.slice(0, 18000)}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "call_analysis" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      // still save the transcript
      await admin.from("broker_call_logs").update({
        transcript_text: transcriptText,
        transcript_segments: segments,
        ai_processed_at: new Date().toISOString(),
      }).eq("id", callLogId);
      return json({ error: "AI evaluation failed", saved_transcript: true }, 502);
    }
    const aiJson = await aiResp.json();
    const tc = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    let structured: any = null;
    try { structured = tc ? JSON.parse(tc.function.arguments) : null; } catch { structured = null; }

    await admin.from("broker_call_logs").update({
      transcript_text: transcriptText,
      transcript_segments: segments,
      ai_summary: structured?.summary ?? null,
      ai_next_step: structured?.next_step ?? null,
      ai_score: structured?.score ?? null,
      ai_matches: structured?.matches ?? null,
      ai_processed_at: new Date().toISOString(),
    }).eq("id", callLogId);

    // Mirror into the broker assistant chat thread so it shows up in /broker/ai.
    if (callRow.lead_id && structured) {
      await admin.from("broker_ai_chats").insert({
        broker_id: user.id,
        lead_id: callRow.lead_id,
        role: "assistant",
        content: `Call summary: ${structured.summary || ""}\n\nNext step: ${structured.next_step || ""}`,
        structured: {
          score: structured.score,
          score_reason: "Derived from latest recorded call.",
          matches: structured.matches,
          next_step: structured.next_step,
          reply: structured.summary,
        },
      });
    }

    return json({ ok: true, structured });
  } catch (e) {
    console.error("broker-call-process error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
