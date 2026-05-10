/**
 * compose-branded-email
 *
 * AI-drafts a branded email from a free-form brief. Returns
 * `{ subject, body_html }`. Owner/admin only. Uses Lovable AI Gateway.
 *
 * The output is plain inline-style HTML. The composer UI lets the owner
 * edit it freely, then re-uses the SAME string for both Test send and
 * Live send via the existing `outreach-lock-payload` /
 * `outreach-send-locked` pipeline — so what the owner approves in the
 * test is byte-for-byte what the recipient receives.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = [
  "janeaboujaoudenails@gmail.com",
  "infoo.jane@gmail.com",
];

interface Body {
  brief: string;
  recipient_name?: string;
  tone?: string; // e.g. "warm", "formal", "executive"
  language?: string; // ISO code: en, ar, fr, es, ru, zh, de
}

const LANG_NAMES: Record<string, string> = {
  en: "English", ar: "Arabic", fr: "French", es: "Spanish",
  ru: "Russian", zh: "Simplified Chinese", de: "German",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const email = (user.email || "").toLowerCase();
    let allowed = OWNER_EMAILS.includes(email);
    if (!allowed) {
      // Fall back to role check
      const svc = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: roles } = await svc
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      allowed = !!roles?.some((r: any) => r.role === "owner" || r.role === "admin");
    }
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const body = (await req.json()) as Body;
    const brief = (body.brief || "").trim();
    if (!brief) return json({ error: "brief required" }, 400);
    if (brief.length > 4000) return json({ error: "brief too long" }, 400);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const recipientLine = body.recipient_name
      ? `Recipient first name: ${body.recipient_name}`
      : "Recipient name unknown — open with a polite generic greeting.";

    const system = `You write branded business emails for JBJ GLOBAL REAL ESTATE, a luxury Dubai real-estate brokerage. Voice: refined, warm, concise, executive. Never use emojis. Never include unsubscribe text. Never use placeholders like {{name}} — write the final copy directly. Output JSON only: {"subject": string (max 90 chars), "body_html": string}. body_html must be safe inline-styled HTML, paragraphs in <p> tags, no <html>/<body> wrappers, no tracking pixels, no scripts. Sign off as "Jane Bou Jaoude — JBJ GLOBAL REAL ESTATE".`;

    const userMsg = `${recipientLine}\nTone: ${body.tone || "warm executive"}.\n\nBrief from the owner:\n${brief}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiResp.status === 429) return json({ error: "Rate limited — try again shortly." }, 429);
    if (aiResp.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!aiResp.ok) {
      const txt = await aiResp.text();
      return json({ error: `AI error ${aiResp.status}: ${txt.slice(0, 300)}` }, 502);
    }

    const data = await aiResp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";
    let parsed: { subject?: string; body_html?: string } = {};
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { /* ignore */ } }
    }

    const subject = String(parsed.subject || "").trim().slice(0, 250);
    const body_html = String(parsed.body_html || "").trim();
    if (!subject || !body_html) {
      return json({ error: "AI returned empty subject or body." }, 502);
    }
    // Guard against placeholders the lock function would reject
    if (/\{\{\s*[a-zA-Z_]\w*\s*\}\}/.test(subject) || /\{\{\s*[a-zA-Z_]\w*\s*\}\}/.test(body_html)) {
      return json({ error: "AI emitted unresolved placeholders — re-generate." }, 502);
    }

    return json({ subject, body_html }, 200);
  } catch (e: any) {
    return json({ error: e?.message ?? "Server error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
