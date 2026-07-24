import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = new Set([
  "janeaboujaoudenails@gmail.com",
  "janeaboujaoudemodel@gmail.com",
  "infoo.jane@gmail.com",
  "helpdesk@jbj.ae",
]);

function clean(value: unknown, max = 4000) {
  return String(value ?? "")
    .replace(/<!doctype[\s\S]*?>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function fallbackDraft(input: any) {
  const source = `${clean(input.inboundReply)} ${clean(input.subject)} ${clean(input.sentContent)}`;
  if (/registered|approved|agency code|channel partner/i.test(source)) {
    return "Thank you for confirming our registration. Please share the agency code, portal access, WhatsApp group details, and the current marketing-material link so our team can update the records and proceed with the next step.";
  }
  if (/document|requirement|trade license|rera|form|agreement|pending/i.test(source)) {
    return "Thank you for sharing the registration requirements. We will review the requested documents and revert on this same thread with the completed registration pack. If any item is pending from JBJ, please highlight it so we can resolve it quickly.";
  }
  if (/meeting|calendar|briefing|slot|call/i.test(source)) {
    return "Thank you for your reply. Please share the preferred meeting slot, or confirm if you would like us to send a calendar invitation on this same thread.";
  }
  return "Thank you for your reply. We reviewed your message and will continue from our previous outreach on this same thread. Please confirm the next step required from JBJ Global Real Estate.";
}

function cleanThreadHistory(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .slice(-12)
    .map((item, index) => {
      const direction = clean(item?.direction, 60) || "message";
      const at = clean(item?.at, 80);
      const from = clean(item?.from, 120);
      const subject = clean(item?.subject, 220);
      const body = clean(item?.body, 1800);
      return `#${index + 1} ${direction}${from ? ` from ${from}` : ""}${at ? ` at ${at}` : ""}\nSubject: ${subject}\nBody: ${body}`;
    })
    .join("\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("NO_AUTH");
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !OWNER_EMAILS.has(String(user.email || "").toLowerCase())) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const input = await req.json();
    const fallback = fallbackDraft(input);
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: true, draft: fallback, source: "fallback" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const threadHistory = cleanThreadHistory(input.threadHistory);
    const prompt = `Write a concise, premium CRM email reply body for JBJ Global Real Estate. Do not include a subject. Do not use emojis. Keep it under 130 words.\n\nCritical context:\n- JBJ/CITI started the outreach. The recipient is replying to us. Never write “thank you for reaching out” or imply they approached us first.\n- Read the actual thread below. Answer only the latest relevant inbound reply.\n- If the latest inbound reply asks for registration documents, requirements, a form, a portal link, agency code, project material, meeting slot, or clarification, respond directly to that request.\n- Be professional and specific. Do not use cheap filler such as “to proceed effectively on this thread”.\n- Do not mention CRM internals.\n\nPortal: ${clean(input.kind, 60)}\nRecipient: ${clean(input.recipient, 120)}\nCampaign subject: ${clean(input.subject, 220)}\nFull thread history, oldest to newest:\n${threadHistory || "No structured history provided."}\n\nLatest inbound reply:\n${clean(input.inboundReply, 2400)}\n\nLast email JBJ/CITI sent:\n${clean(input.sentContent, 1600)}\n\nCurrent draft to improve:\n${clean(input.currentDraft, 1200)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: "You write polished, concise CRM email replies for a Dubai real-estate brokerage. You must infer who initiated the conversation from the thread and never reverse sender/recipient roles." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });
    const data = await response.json().catch(() => ({}));
    const draft = clean(data?.choices?.[0]?.message?.content, 2000) || fallback;
    return new Response(JSON.stringify({ ok: true, draft, source: response.ok ? "ai" : "fallback" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message || "Draft failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});