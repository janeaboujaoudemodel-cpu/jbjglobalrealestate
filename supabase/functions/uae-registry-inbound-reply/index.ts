// Inbound reply ingestion for UAE Developers + Brokerages registry.
// Invoked by resend-inbound-email-webhook when a reply matches a registry record.
// Matches by email_thread_id, email_message_id (in_reply_to), outreach/registration
// email exact, sender domain vs website_domain, then fuzzy company name.
// Logs the reply, calls Lovable AI for summary + extraction, and updates the master record.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InboundBody {
  from: string;
  subject: string;
  text?: string;
  html?: string;
  message_id?: string | null;
  in_reply_to?: string | null;
  thread_id?: string | null;
}

function senderDomainOf(from: string): string {
  const m = from.match(/<([^>]+)>/);
  const email = (m?.[1] ?? from).trim().toLowerCase();
  return email.split("@")[1] ?? "";
}

function senderEmailOf(from: string): string {
  const m = from.match(/<([^>]+)>/);
  return (m?.[1] ?? from).trim().toLowerCase();
}

async function findRecord(supabase: any, body: InboundBody) {
  const senderEmail = senderEmailOf(body.from);
  const domain = senderDomainOf(body.from);

  // 1. Match by email thread / message id in our log
  if (body.thread_id || body.in_reply_to || body.message_id) {
    const { data: log } = await supabase
      .from("uae_registry_log")
      .select("developer_id, brokerage_id")
      .or([
        body.thread_id ? `email_thread_id.eq.${body.thread_id}` : "",
        body.in_reply_to ? `email_message_id.eq.${body.in_reply_to}` : "",
        body.message_id ? `email_message_id.eq.${body.message_id}` : "",
      ].filter(Boolean).join(","))
      .limit(1).maybeSingle();
    if (log?.developer_id) return { type: "developer" as const, id: log.developer_id };
    if (log?.brokerage_id) return { type: "brokerage" as const, id: log.brokerage_id };
  }

  // 2. Exact match on registration_email / outreach_email
  const { data: dev } = await supabase.from("uae_dev_registry").select("id")
    .eq("registration_email", senderEmail).limit(1).maybeSingle();
  if (dev) return { type: "developer" as const, id: dev.id };
  const { data: brk } = await supabase.from("uae_brk_registry").select("id")
    .eq("outreach_email", senderEmail).limit(1).maybeSingle();
  if (brk) return { type: "brokerage" as const, id: brk.id };

  // 3. Sender domain matches website_domain
  if (domain) {
    const { data: dev2 } = await supabase.from("uae_dev_registry").select("id")
      .eq("website_domain", domain).limit(1).maybeSingle();
    if (dev2) return { type: "developer" as const, id: dev2.id };
    const { data: brk2 } = await supabase.from("uae_brk_registry").select("id")
      .eq("website_domain", domain).limit(1).maybeSingle();
    if (brk2) return { type: "brokerage" as const, id: brk2.id };
  }

  return null;
}

async function aiExtract(text: string): Promise<Record<string, unknown> | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Extract structured info from a real-estate company reply. Reply ONLY with JSON: {summary, requested_documents:[], contact_person, registration_instructions, deadline, recommended_next_action, draft_response_html}." },
          { role: "user", content: text.slice(0, 8000) },
        ],
      }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const raw = j.choices?.[0]?.message?.content ?? "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    return JSON.parse(m[0]);
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Service-role only (called by webhook handler).
  const auth = req.headers.get("Authorization") ?? "";
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "__none__";
  if (!auth.includes(svc)) return new Response("Forbidden", { status: 403 });

  let body: InboundBody;
  try { body = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }
  if (!body?.from) return new Response(JSON.stringify({ matched: false, reason: "no from" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const match = await findRecord(supabase, body);
  if (!match) return new Response(JSON.stringify({ matched: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const text = body.text || body.html?.replace(/<[^>]+>/g, " ") || "";
  const ai = await aiExtract(`Subject: ${body.subject}\n\n${text}`);

  await supabase.from("uae_registry_log").insert({
    [match.type === "developer" ? "developer_id" : "brokerage_id"]: match.id,
    channel: "Email",
    direction: "Inbound",
    summary: ai?.summary ?? `Reply from ${senderEmailOf(body.from)}: ${body.subject}`.slice(0, 240),
    full_message: body.html || body.text || "",
    language: "en",
    email_thread_id: body.thread_id ?? null,
    email_message_id: body.message_id ?? null,
    ai_extracted: ai ?? null,
  });

  const table = match.type === "developer" ? "uae_dev_registry" : "uae_brk_registry";
  await supabase.from(table).update({
    outreach_status: "Replied",
    last_reply_received_at: new Date().toISOString(),
    last_response_summary: (ai?.summary as string) ?? null,
    required_next_action: (ai?.recommended_next_action as string) ?? null,
    next_follow_up_date: null,
  }).eq("id", match.id);

  return new Response(JSON.stringify({ matched: true, type: match.type, id: match.id, ai_extracted: !!ai }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
