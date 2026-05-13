// Resend inbound webhook → branded auto-reply from contact@jbj.ae
// Deploys regardless of whether the inbound route is active in Resend.
// When Resend forwards inbound mail to this URL, we send ONE acknowledgment
// back to the original sender and de-dupe by Message-Id so loops are
// impossible.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM = "JBJ Global Real Estate <contact@jbj.ae>";
const REPLY_TO = "contact@jbj.ae";

function brandedBody(originalSubject: string, senderName?: string) {
  const greet = senderName ? `Hello ${senderName},` : "Hello,";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FDFBF7;font-family:Inter,system-ui,sans-serif;color:#1A1A1A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#F7F2EA;border:1px solid rgba(184,149,85,0.35);border-radius:8px;overflow:hidden;">
        <tr><td style="padding:28px 32px;border-bottom:1px solid rgba(184,149,85,0.35);">
          <div style="font-size:11px;letter-spacing:0.18em;color:#1A1A1A;">JBJ GLOBAL REAL ESTATE</div>
        </td></tr>
        <tr><td style="padding:28px 32px;font-size:14px;line-height:1.7;color:#1A1A1A;">
          <p style="margin:0 0 14px;">${greet}</p>
          <p style="margin:0 0 14px;">Thank you for your message regarding "<strong>${escapeHtml(originalSubject || "your enquiry")}</strong>". We've received it and a member of the JBJ team will respond shortly.</p>
          <p style="margin:0 0 14px;">For urgent matters, please reply to this email and we'll prioritise your request.</p>
          <p style="margin:24px 0 4px;">Warm regards,</p>
          <p style="margin:0;font-weight:600;">Jane Aboujaoude</p>
          <p style="margin:0;"><span style="color:#B89555;font-weight:700;letter-spacing:.04em;">Founder &amp; CEO</span></p>
          <p style="margin:0;font-size:12px;color:#1A1A1A;opacity:0.7;">JBJ Global Real Estate</p>
        </td></tr>
        <tr><td style="padding:14px 32px;border-top:1px solid rgba(184,149,85,0.35);font-size:11px;color:#1A1A1A;opacity:0.65;">
          This is an automated acknowledgment. Replies are monitored at contact@jbj.ae.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function pickAddress(input: any): { email: string; name?: string } | null {
  if (!input) return null;
  if (Array.isArray(input)) return pickAddress(input[0]);
  if (typeof input === "string") {
    const m = input.match(/<([^>]+)>/);
    return { email: (m ? m[1] : input).trim() };
  }
  if (typeof input === "object" && input.email) return { email: String(input.email).trim(), name: input.name };
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "missing_resend_key" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Resend inbound shape: { type: "email.inbound", data: { from, to, subject, message_id, ... } }
  const data = payload?.data ?? payload;
  const from = pickAddress(data?.from);
  const subject: string = data?.subject ?? "";
  const messageId: string = data?.message_id ?? data?.messageId ?? data?.headers?.["message-id"] ?? "";

  if (!from?.email) {
    return new Response(JSON.stringify({ error: "no_sender" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Loop guards
  const lower = from.email.toLowerCase();
  if (lower === "contact@jbj.ae" || lower.endsWith("@jbj.ae")) {
    return new Response(JSON.stringify({ skipped: "internal_sender" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (/auto[-_ ]?reply|do[-_ ]?not[-_ ]?reply|noreply|no-reply|mailer-daemon|postmaster/i.test(subject + " " + lower)) {
    return new Response(JSON.stringify({ skipped: "auto_loop" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // De-dupe by Message-Id via a tiny table (best-effort).
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  if (messageId) {
    const { data: existing } = await supabase
      .from("esign_inbound_autoreply_log")
      .select("message_id")
      .eq("message_id", messageId)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ skipped: "duplicate" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const replySubject = subject?.toLowerCase().startsWith("re:") ? subject : `Re: ${subject || "Your message to JBJ"}`;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [from.email],
      reply_to: REPLY_TO,
      subject: replySubject,
      html: brandedBody(subject, from.name),
      headers: messageId ? { "In-Reply-To": messageId, References: messageId } : undefined,
    }),
  });

  const respJson = await resp.json().catch(() => ({}));

  if (resp.ok && messageId) {
    await supabase.from("esign_inbound_autoreply_log").insert({
      message_id: messageId,
      from_email: from.email,
      subject,
    });
  }

  return new Response(
    JSON.stringify({ ok: resp.ok, resend: respJson }),
    { status: resp.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
