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

    const mimeType = audioFile.type || inferAudioMime(callRow.recording_url) || "audio/webm";

    // Transcribe with ElevenLabs Scribe first, then Lovable AI fallback.
    const ELEVEN = Deno.env.get("ELEVENLABS_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let transcriptText = "";
    let segments: any[] = [];
    if (ELEVEN) {
      try {
        const fd = new FormData();
        fd.append("file", new Blob([audioBytes], { type: mimeType }), `call.${mimeToExt(mimeType)}`);
        fd.append("model_id", "scribe_v2");
        fd.append("tag_audio_events", "true");
        fd.append("diarize", "true");
        fd.append("timestamps_granularity", "word");
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
    // NOTE: We intentionally do NOT fall back to Gemini "image_url" for audio —
    // it does not actually transcribe audio and will hallucinate a transcript,
    // which produced AI summaries unrelated to the real call.
    const transcriptUnavailable = !transcriptText || transcriptText.trim().length < 4;
    if (transcriptUnavailable) {
      // Save a clear placeholder, skip AI analysis entirely so we never fabricate.
      await admin.from("broker_call_logs").update({
        transcript_text: "",
        transcript_segments: segments,
        ai_summary: "Transcript unavailable — AI analysis skipped to avoid fabricating call details. Please re-record in a quieter environment or check that ElevenLabs Scribe is configured.",
        ai_next_step: null,
        ai_score: null,
        ai_matches: [],
        ai_processed_at: new Date().toISOString(),
      }).eq("id", callLogId);
      return json({ ok: true, transcript_unavailable: true });
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

    if (!LOVABLE_API_KEY) return json({ error: "AI gateway not configured" }, 500);

    const tools = [{
      type: "function",
      function: {
        name: "call_analysis",
        description: "Structured analysis of a sales call transcript.",
        parameters: {
          type: "object",
          additionalProperties: false,
          required: ["summary", "next_step", "score", "topic", "related_to_real_estate", "suggestions", "matches"],
          properties: {
            summary: { type: "string" },
            next_step: { type: "string" },
            score: { type: "integer", minimum: 0, maximum: 100 },
            topic: { type: "string" },
            related_to_real_estate: { type: "boolean" },
            suggestions: { type: "array", items: { type: "string" } },
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
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You analyse broker call recordings. CRITICAL: base your output STRICTLY on the provided CALL TRANSCRIPT — never use the lead profile, inventory list, or your training data to invent topics, claims, names, prices, or matches that are not literally spoken in the transcript. If the transcript is empty, silent, ambient noise, music, or otherwise has no intelligible speech, return summary='No intelligible speech detected in the recording.', topic='unknown', related_to_real_estate=false, suggestions=[], matches=[], next_step='Re-record the call in a quieter environment.', score=0. If the call is about Dubai real estate, act as a senior JBJ real-estate sales director: summarize ONLY what was actually said, score readiness, and ONLY return inventory matches that the caller explicitly asked for (area, budget, beds). If the call is not about real estate, identify the real topic from the transcript and give practical suggestions about that exact topic. Never force property matches. Never invent facts." },
          { role: "user", content: `LEAD (for context only — DO NOT use to invent content not in the transcript):\n${JSON.stringify(lead, null, 2)}\n\nINVENTORY (only choose from these if the caller explicitly discussed property requirements):\n${JSON.stringify(inventory, null, 2)}\n\nCALL TRANSCRIPT (this is the ONLY source of truth):\n${transcriptText.slice(0, 18000)}` },

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

    const suggestionText = Array.isArray(structured?.suggestions) && structured.suggestions.length
      ? `\n\nSuggestions:\n${structured.suggestions.slice(0, 5).map((s: string) => `• ${s}`).join("\n")}`
      : "";
    const topicPrefix = structured?.topic ? `Topic: ${structured.topic}\n` : "";
    const finalSummary = structured?.summary ? `${topicPrefix}${structured.summary}${suggestionText}` : null;
    const finalMatches = structured?.related_to_real_estate === false ? [] : (structured?.matches ?? null);

    await admin.from("broker_call_logs").update({
      transcript_text: transcriptText,
      transcript_segments: segments,
      ai_summary: finalSummary,
      ai_next_step: structured?.next_step ?? null,
      ai_score: structured?.score ?? null,
      ai_matches: finalMatches,
      ai_processed_at: new Date().toISOString(),
    }).eq("id", callLogId);

    // Mirror into the broker assistant chat thread so it shows up in /broker/ai.
    if (callRow.lead_id && structured) {
      await admin.from("broker_ai_chats").insert({
        broker_id: user.id,
        lead_id: callRow.lead_id,
        role: "assistant",
        content: `Call summary: ${finalSummary || ""}\n\nNext step: ${structured.next_step || ""}`,
        structured: {
          score: structured.score,
          score_reason: "Derived from latest recorded call.",
          matches: finalMatches,
          next_step: structured.next_step,
          reply: finalSummary,
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

function inferAudioMime(path?: string | null) {
  if (!path) return null;
  const lower = path.toLowerCase();
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".mp4") || lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  return "audio/webm";
}

function mimeToExt(mime: string) {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4") || mime.includes("m4a")) return "mp4";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  return "webm";
}

async function transcribeWithLovableAI(audioBytes: Uint8Array, mimeType: string, apiKey: string) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < audioBytes.length; i += chunkSize) {
    binary += String.fromCharCode(...audioBytes.subarray(i, i + chunkSize));
  }
  const audioDataUrl = `data:${mimeType};base64,${btoa(binary)}`;
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Transcribe this call audio as accurately as possible. Return only the transcript text. If no speech is audible, return an empty string." },
          { type: "image_url", image_url: { url: audioDataUrl } },
        ],
      }],
      max_tokens: 6000,
    }),
  });
  if (!response.ok) throw new Error(`Lovable AI transcription failed: ${response.status}`);
  const data = await response.json();
  return (data?.choices?.[0]?.message?.content || "").toString().trim();
}
