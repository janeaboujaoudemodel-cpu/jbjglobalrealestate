// documents-send: routes a document to the recipient via Email / WhatsApp / link.
// Always BCCs contact@jbj.ae for audit. Email uses Resend connector via Lovable
// connector gateway. WhatsApp uses Twilio when configured, otherwise returns a
// wa.me deep link the caller can open.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
const TWILIO_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM"); // e.g. whatsapp:+14155551234

const FROM_EMAIL = "JBJ Global Real Estate <contact@jbj.ae>";
const BCC_EMAIL = "contact@jbj.ae";
const PUBLIC_URL = Deno.env.get("PUBLIC_APP_URL") ?? "https://jbj.ae";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "unauthorized" }, 401);

    const { document_id, channel, message } = await req.json();
    if (!document_id || !channel) return json({ error: "document_id and channel required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: doc, error } = await admin
      .from("crm_documents").select("*")
      .eq("id", document_id).eq("owner_user_id", user.id).maybeSingle();
    if (error || !doc) return json({ error: "document not found" }, 404);

    const signUrl = `${PUBLIC_URL}/sign/${doc.recipient_token}`;
    const subject = doc.title || "Property Advertising Agreement — JBJ Global Real Estate";

    if (channel === "email") {
      if (!doc.client_email) return json({ error: "client_email missing" }, 400);
      if (!LOVABLE_API_KEY || !RESEND_API_KEY) return json({ error: "Email not configured" }, 503);
      const html = renderEmail({ name: doc.client_name || "", signUrl, message });
      const r = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: FROM_EMAIL, to: [doc.client_email], bcc: [BCC_EMAIL],
          subject, html, reply_to: BCC_EMAIL,
        }),
      });
      const body = await r.json();
      if (!r.ok) return json({ error: "email_failed", detail: body }, 502);
    } else if (channel === "whatsapp") {
      if (!doc.client_phone) return json({ error: "client_phone missing" }, 400);
      const text = `${message ? message + "\n\n" : ""}Please review and sign your Property Advertising Agreement:\n${signUrl}\n\nJBJ Global Real Estate · +971 5471 67107`;
      if (LOVABLE_API_KEY && TWILIO_API_KEY && TWILIO_FROM) {
        const r = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: TWILIO_FROM, To: `whatsapp:${doc.client_phone}`, Body: text,
          }),
        });
        if (!r.ok) {
          const wa = `https://wa.me/${doc.client_phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
          return json({ ok: true, fallback_link: wa, sent: false });
        }
      } else {
        const wa = `https://wa.me/${doc.client_phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
        return json({ ok: true, fallback_link: wa, sent: false });
      }
    } else if (channel === "link") {
      return json({ ok: true, sign_url: signUrl });
    } else {
      return json({ error: "invalid channel" }, 400);
    }

    await admin.from("crm_documents")
      .update({
        status: doc.status === "draft" ? "sent" : doc.status,
        sent_at: doc.sent_at ?? new Date().toISOString(),
      })
      .eq("id", doc.id);

    return json({ ok: true, sign_url: signUrl });
  } catch (e) {
    console.error("documents-send error", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function renderEmail({ name, signUrl, message }: { name: string; signUrl: string; message?: string }) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FDFBF7;font-family:Inter,Arial,sans-serif;color:#1A1A1A;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #B89555;border-radius:6px;overflow:hidden;">
      <tr><td style="padding:24px 32px;border-bottom:1px solid #B89555;">
        <div style="font-size:18px;letter-spacing:.18em;font-weight:700;">JBJ GLOBAL REAL ESTATE</div>
        <div style="font-size:10px;letter-spacing:.18em;opacity:.65;margin-top:2px;">PRIVATE OFFICE · DUBAI</div>
      </td></tr>
      <tr><td style="padding:28px 32px;">
        <h1 style="margin:0 0 12px;font-size:20px;">Property Advertising Agreement</h1>
        <p style="margin:0 0 12px;font-size:14px;">Dear ${name || "Sir/Madam"},</p>
        <p style="margin:0 0 12px;font-size:14px;">Please review and sign your Property Advertising Agreement at your convenience using the secure link below.</p>
        ${message ? `<p style="margin:0 0 12px;font-size:14px;font-style:italic;opacity:.85;">${message}</p>` : ""}
        <div style="margin:22px 0;">
          <a href="${signUrl}" style="display:inline-block;background:#1A1A1A;color:#FFFFFF;text-decoration:none;padding:12px 22px;border-radius:4px;font-size:14px;letter-spacing:.04em;">Review & Sign</a>
        </div>
        <p style="margin:12px 0 0;font-size:12px;opacity:.7;">If the button does not work, paste this link into your browser:<br/><span style="word-break:break-all;">${signUrl}</span></p>
      </td></tr>
      <tr><td style="padding:18px 32px;border-top:1px solid #B89555;font-size:11px;opacity:.7;">
        JBJ Global Real Estate · +971 5471 67107 · contact@jbj.ae · jbj.ae
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}
