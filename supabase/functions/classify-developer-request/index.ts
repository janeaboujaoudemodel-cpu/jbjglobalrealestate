// Classify a single developer email message — extracts request_type,
// confidence, suggested reply. Inserts into developer_action_items.

import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an executive assistant classifying inbound developer/agency emails for a Dubai real-estate brokerage.
Classify each message into ONE of: docs_library, vat_certificate, mou, license, registration, contract_signature, other.
- docs_library: developer asks for general company documents (trade license, KYC, brokerage certificate set)
- vat_certificate: developer specifically asks for VAT/TRN certificate
- mou: developer asks for an MOU / cooperation agreement
- license: developer asks for trade license only
- registration: developer asks to register the brokerage / wants brokerage registration form
- contract_signature: developer is sending a contract/agreement to be signed
- other: anything else (lead, marketing, complaint, etc.)
Return strict JSON: {"request_type": string, "confidence": number 0-1, "summary": string, "suggested_reply": string}.
suggested_reply must be a polite, concise English response (3-6 sentences) ready for the owner to send.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { thread_id, message_id, subject, from_email, from_name, body } = await req.json();
  if (!thread_id || !body) {
    return new Response(JSON.stringify({ error: "thread_id and body required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Try to match a developer in the registry by email
  let developerId: string | null = null;
  let developerName: string | null = null;
  if (from_email) {
    const { data: dev } = await supabase
      .from("crm_developer_registry")
      .select("id, developer_name")
      .eq("developer_email", from_email)
      .maybeSingle();
    if (dev) { developerId = dev.id; developerName = dev.developer_name; }
  }

  // AI call
  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `From: ${from_name || ""} <${from_email || ""}>\nSubject: ${subject || ""}\n\n${body}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!aiRes.ok) {
    const t = await aiRes.text();
    return new Response(JSON.stringify({ error: `AI failed [${aiRes.status}]: ${t}` }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiJson = await aiRes.json();
  let parsed: any = {};
  try {
    parsed = JSON.parse(aiJson.choices?.[0]?.message?.content ?? "{}");
  } catch { parsed = {}; }

  const validTypes = ["docs_library", "vat_certificate", "mou", "license", "registration", "contract_signature", "other"];
  const requestType = validTypes.includes(parsed.request_type) ? parsed.request_type : "other";
  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));

  // Hard skip: never create Required Action items for newsletters, marketing,
  // social notifications, banks, retail, search-console alerts, etc.
  // These belong in the Unified Inbox categorized list — not in the action queue.
  const noiseRe = /(noreply|no-reply|no_reply|newsletter|notifications?@|alerts?@|updates?-noreply|marketing@|info@|welcome@|reminder@|emails@|news@|team@info\.|sc-noreply|googlecommunityteam|linkedin\.com|shopstyle|shein|cobone|ruelala|farfetch|reversible|canon|rotana|gitex|emiratesnbd|enbd|hsbc|adcb|mashreq|theluxurycloset|uptimerobot|github\.com|supabase\.com|hostinger\.com|mmgtalent)/i;
  const isNoise = noiseRe.test(`${from_email ?? ""} ${from_name ?? ""}`);

  // Skip noise and weak "other" classifications
  if (isNoise || (requestType === "other" && confidence < 0.7)) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: isNoise ? "noise_sender" : "low_confidence_other" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Decide auto-reply eligibility
  const autoEligible = ["docs_library", "registration", "license", "mou"].includes(requestType);
  const initialStatus = autoEligible && confidence >= 0.85 ? "auto_replied" : "pending";

  const { data: row } = await supabase
    .from("developer_action_items")
    .insert({
      user_id: auth.userId,
      thread_id,
      message_id,
      developer_id: developerId,
      developer_email: from_email,
      developer_name: developerName ?? from_name,
      request_type: requestType,
      status: initialStatus,
      extracted_summary: parsed.summary ?? null,
      suggested_reply: parsed.suggested_reply ?? null,
      confidence,
      metadata: { subject },
    })
    .select("id")
    .single();

  return new Response(
    JSON.stringify({
      ok: true,
      action_item_id: row?.id,
      request_type: requestType,
      confidence,
      auto_replied: initialStatus === "auto_replied",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
