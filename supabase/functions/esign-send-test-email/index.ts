// Sends a TEST copy of the Send-for-Signature email to the owner's own inbox
// (defaults to infoo.jane@gmail.com). Uses the EXACT same HTML/body as the real
// send, so what you see in your inbox is byte-for-byte what the client will get.
// It does NOT mark recipients as sent, does NOT change envelope status, and does
// NOT consume signing tokens.

import { corsHeaders, getCorsHeaders, corsJsonResponse, corsErrorResponse } from "../_shared/cors-utils.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { quotaGuardedFetch } from "../_shared/quotaGuardedFetch.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");

const TEST_RECIPIENT_DEFAULT = "infoo.jane@gmail.com";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return corsErrorResponse("Unauthorized", 401, origin);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return corsErrorResponse("Unauthorized", 401, origin);

    const {
      envelope_id,
      interpolated_subject,
      interpolated_body,
      test_recipient,
    } = await req.json();

    if (!envelope_id) return corsErrorResponse("envelope_id is required", 400, origin);

    const toEmail = String(test_recipient || TEST_RECIPIENT_DEFAULT).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      return corsErrorResponse("Invalid test recipient", 400, origin);
    }

    const { data: envelope, error: envErr } = await supabase
      .from("esign_envelopes")
      .select("*, esign_recipients(*)")
      .eq("id", envelope_id)
      .eq("sender_id", user.id)
      .single();
    if (envErr || !envelope) return corsErrorResponse("Envelope not found", 404, origin);

    const recipients = envelope.esign_recipients || [];
    const primary = recipients[0] || { name: "Client", email: toEmail, signing_token: "preview-token" };

    const baseUrl = Deno.env.get("SITE_URL") || "https://jbj.ae";
    const signingUrl = `${baseUrl}/sign/${primary.signing_token || "preview-token"}`;
    const docNumber = (envelope.metadata as any)?.doc_number || "";
    const fieldVals = (envelope.template_field_values as any) || {};
    const senderName = envelope.sender_name || "Jane Bou Jaoude";
    const senderTitle = (envelope as any).sender_title || "Founder & Chief Executive";
    const SIG_SENTINEL = "@@JBJ_SENDER_SIGNATURE_BLOCK@@";
    const sigPlain = `— ${senderName}\n${senderTitle}\nJBJ GLOBAL REAL ESTATE`;
    const sigHtml = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-collapse:collapse;font-family:Inter,Arial,sans-serif;">
  <tr><td style="padding-bottom:6px;">
    <span style="font-family:'Cormorant Garamond','Playfair Display',Georgia,serif;font-style:italic;font-weight:500;font-size:26px;color:#1A1A1A;letter-spacing:.01em;line-height:1;">${senderName}</span>
  </td></tr>
  <tr><td style="padding:4px 0 10px;"><div style="width:64px;height:1px;background:#B89555;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
  <tr><td style="font-size:11px;font-weight:700;letter-spacing:.18em;color:#1A1A1A;text-transform:uppercase;padding-bottom:2px;">${senderName}</td></tr>
  <tr><td style="font-size:10.5px;font-weight:500;letter-spacing:.14em;color:#1A1A1A;opacity:.75;text-transform:uppercase;padding-bottom:6px;">${senderTitle}</td></tr>
  <tr><td style="font-size:11px;font-weight:700;letter-spacing:.22em;color:#1A1A1A;text-transform:uppercase;padding-bottom:2px;">JBJ GLOBAL REAL ESTATE</td></tr>
  <tr><td style="font-size:10.5px;color:#1A1A1A;opacity:.7;letter-spacing:.04em;padding-bottom:1px;">Private Office · Dubai, UAE</td></tr>
  <tr><td style="font-size:10.5px;color:#1A1A1A;opacity:.7;letter-spacing:.04em;padding-bottom:1px;">contact@jbj.ae · +971 54 716 7107</td></tr>
  <tr><td style="font-size:10.5px;color:#1A1A1A;opacity:.7;letter-spacing:.04em;">www.jbj.ae</td></tr>
</table>`;

    const tokens: Record<string, string> = {
      client_name: primary.name || fieldVals.landlord_name || "Client",
      landlord_name: primary.name || fieldVals.landlord_name || "Client",
      doc_number: docNumber,
      doc_title: envelope.name || "Property Advertising Agreement",
      sender_signature: SIG_SENTINEL,
      owner_name: senderName,
      sender_title: senderTitle,
      signing_link: signingUrl,
    };
    const interp = (s: string) =>
      String(s || "").replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? `{{${k}}}`);

    const finalSubject = `[TEST] ${
      (interpolated_subject
        ? interp(interpolated_subject)
        : interp(envelope.email_subject || "Please sign — {{doc_title}} · {{doc_number}}")
      ).replace(SIG_SENTINEL, sigPlain)
    }`;
    const rawBody = interpolated_body
      ? interpolated_body
      : (envelope.email_message || `Dear {{client_name}},\n\nKindly review and sign your {{doc_title}}.\n\n{{sender_signature}}`);
    const finalBodyHtml = interp(rawBody)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>")
      .replace(SIG_SENTINEL, sigHtml);

    // Mirror the real send HTML exactly so the preview = delivered.
    const emailHtml = `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500<meta name="viewport" content="width=device-width, initial-scale=1"></head>display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#FDFBF7;">
  <table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 20px;">
    <table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;">
      <tr><td style="background:#FBE9C8;color:#1A1A1A;border:1px solid #B89555;border-radius:14px;padding:10px 14px;font-size:12px;letter-spacing:.08em;text-align:center;margin-bottom:10px;">
        ⚠ THIS IS A TEST PREVIEW · Sent to ${toEmail} · The real client did NOT receive this
      </td></tr>
      <tr><td style="height:10px;"></td></tr>
      <tr><td style="background:#F7F2EA;border:1px solid #B89555;border-radius:14px 14px 0 0;padding:22px 28px;border-bottom:none;">
        <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
          <td style="font-size:20px;font-weight:700;letter-spacing:.18em;color:#1A1A1A;">JBJ GLOBAL REAL ESTATE</td>
          <td align="right" style="font-size:10px;letter-spacing:.16em;color:#1A1A1A;opacity:.7;">${docNumber ? `DOC NO. <strong style="opacity:1;">${docNumber}</strong>` : ""}</td>
        </tr></table>
        <div style="height:1px;background:#B89555;margin-top:14px;"></div>
      </td></tr>
      <tr><td style="background:#ffffff;border-left:1px solid #B89555;border-right:1px solid #B89555;padding:36px 36px 8px;">
        <h2 style="margin:0 0 18px;color:#1A1A1A;font-size:20px;font-weight:700;">${finalSubject}</h2>
        <div style="color:#1A1A1A;line-height:1.7;font-size:14px;">${finalBodyHtml}</div>
        <div style="text-align:center;margin:32px 0 12px;">
          <a href="${signingUrl}" style="display:inline-block;background:#1A1A1A;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:.06em;border:1px solid #B89555;">REVIEW &amp; SIGN DOCUMENT</a>
        </div>
        <p style="color:#1A1A1A;opacity:.6;font-size:12px;text-align:center;margin:0 0 8px;">Or paste this secure link in your browser:<br/><span style="color:#1A1A1A;">${signingUrl}</span></p>
      </td></tr>
      <tr><td style="background:#F7F2EA;border:1px solid #B89555;border-top:none;border-radius:0 0 14px 14px;padding:18px 28px;">
        <div style="height:1px;background:#B89555;margin-bottom:14px;"></div>
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:11px;color:#1A1A1A;"><tr>
          <td style="opacity:.85;"><strong style="letter-spacing:.14em;">JBJ GLOBAL REAL ESTATE</strong><br/><span style="opacity:.7;">Private Office · Dubai, UAE</span></td>
          <td align="center" style="opacity:.85;">CONTACT@JBJ.AE<br/>WWW.JBJ.AE</td>
          <td align="right" style="opacity:.85;">+971 54 716 7107</td>
        </tr></table>
      </td></tr>
      <tr><td style="text-align:center;padding-top:14px;font-size:11px;color:#1A1A1A;opacity:.55;">© ${new Date().getFullYear()} JBJ Global Real Estate · Test preview</td></tr>
    </table>
  </td></tr></table>
</body></html>`;

    if (!resendApiKey) {
      return corsErrorResponse("Email provider not configured (RESEND_API_KEY missing)", 500, origin);
    }

    const res = await quotaGuardedFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "JBJ Global Real Estate <contact@jbj.ae>",
        to: [toEmail],
        subject: finalSubject,
        html: emailHtml,
      }),
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Resend test send error:", JSON.stringify(resData));
      return corsErrorResponse(`Resend error: ${resData?.message || res.statusText}`, 502, origin);
    }

    // Best-effort audit log (ignore if table doesn't accept this action)
    try {
      await supabase.from("esign_audit_log").insert({
        envelope_id: envelope.id,
        action: "test_email_sent",
        description: `Test preview sent to ${toEmail}`,
        actor_id: user.id,
        actor_email: user.email,
        actor_name: envelope.sender_name,
        metadata: { resend_id: resData?.id || null },
      });
    } catch (_) { /* non-fatal */ }

    return corsJsonResponse({
      success: true,
      message_id: resData?.id || null,
      delivered_to: toEmail,
    }, origin);
  } catch (error: any) {
    console.error("esign-send-test-email error:", error);
    return corsErrorResponse(error.message || "Internal server error", 500, origin);
  }
});
