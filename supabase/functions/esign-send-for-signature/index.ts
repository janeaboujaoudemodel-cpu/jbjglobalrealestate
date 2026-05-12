import { corsHeaders, getCorsHeaders, corsJsonResponse, corsErrorResponse } from "../_shared/cors-utils.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { quotaGuardedFetch } from "../_shared/quotaGuardedFetch.ts";
import { buildEnvelopeEmailHtml, buildSenderSignatureHtml, escapeHtml } from "../_shared/envelope-email-html.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return corsErrorResponse("Unauthorized", 401, origin);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return corsErrorResponse("Unauthorized", 401, origin);
    }

    const { envelope_id, channels, cc_emails: ccOverride, bcc_emails: bccOverride, interpolated_subject, interpolated_body, interpolated_body_html, additional_recipients } = await req.json();
    const channelList: string[] = Array.isArray(channels) && channels.length
      ? channels
      : ["email"];
    const extraTos: string[] = Array.isArray(additional_recipients)
      ? Array.from(new Set(additional_recipients.map((e: any) => String(e || "").trim().toLowerCase()).filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))))
      : [];

    if (!envelope_id) {
      return corsErrorResponse("envelope_id is required", 400, origin);
    }

    // Fetch envelope with recipients
    const { data: envelope, error: envelopeError } = await supabase
      .from("esign_envelopes")
      .select(`
        *,
        esign_recipients (*)
      `)
      .eq("id", envelope_id)
      .eq("sender_id", user.id)
      .single();

    if (envelopeError || !envelope) {
      return corsErrorResponse("Envelope not found", 404, origin);
    }

    if (envelope.status !== "draft") {
      return corsErrorResponse("Envelope has already been sent", 400, origin);
    }

    // Send emails to all recipients
    const recipients = envelope.esign_recipients || [];
    
    if (recipients.length === 0) {
      return corsErrorResponse("No recipients found", 400, origin);
    }

    // Use direct fetch to Resend global API (SDK AP endpoint causes issues)

    const baseUrl = Deno.env.get("SITE_URL") || "https://jbj.ae";

    for (const recipient of recipients) {
      const signingUrl = `${baseUrl}/sign/${recipient.signing_token}`;
      const docNumber = (envelope.metadata as any)?.doc_number || "";
      const fieldVals = (envelope.template_field_values as any) || {};

      // Build merge-tag context — use interpolated values from client if provided.
      // {{sender_signature}} is the brand sign-off at the bottom of the email.
      // It is always YOUR side (Jane · JBJ), never the client.
      const senderName = envelope.sender_name || "Jane Bou Jaoude";
      const senderTitle = (envelope as any).sender_title || "Founder & CEO";
      const SIG_SENTINEL = "@@JBJ_SENDER_SIGNATURE_BLOCK@@";
      const sigPlain = `— ${senderName}\n${senderTitle}\nJBJ GLOBAL REAL ESTATE`;
      // Premium HTML signature: ONE name (luxury serif italic) + gold hairline + title + brand
      const sigHtml = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-collapse:collapse;font-family:Inter,Arial,sans-serif;">
  <tr><td style="padding-bottom:6px;">
    <span style="font-family:'Cormorant Garamond','Playfair Display',Georgia,serif;font-style:italic;font-weight:500;font-size:28px;color:#1A1A1A;letter-spacing:.01em;line-height:1;">${senderName}</span>
  </td></tr>
  <tr><td style="padding:6px 0 12px;"><div style="width:72px;height:1px;background:#B89555;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
  <tr><td style="font-size:10.5px;font-weight:500;letter-spacing:.16em;color:#1A1A1A;text-transform:uppercase;padding-bottom:8px;">${senderTitle}</td></tr>
  <tr><td style="font-size:11px;font-weight:700;letter-spacing:.22em;color:#1A1A1A;text-transform:uppercase;padding-bottom:3px;">JBJ GLOBAL REAL ESTATE</td></tr>
  <tr><td style="font-size:10.5px;color:#1A1A1A;opacity:.7;letter-spacing:.04em;padding-bottom:1px;">Downtown Dubai, UAE</td></tr>
  <tr><td style="font-size:10.5px;color:#1A1A1A;opacity:.7;letter-spacing:.04em;padding-bottom:1px;">CONTACT@JBJ.AE &nbsp;·&nbsp; +971 54 716 7107</td></tr>
  <tr><td style="font-size:10.5px;color:#1A1A1A;opacity:.7;letter-spacing:.04em;">WWW.JBJ.AE</td></tr>
</table>`;
      const tokens: Record<string, string> = {
        client_name: recipient.name || fieldVals.landlord_name || "Client",
        landlord_name: recipient.name || fieldVals.landlord_name || "Client",
        doc_number: docNumber,
        doc_title: envelope.name || "Property Advertising Agreement",
        sender_signature: SIG_SENTINEL,
        owner_name: senderName, // legacy alias
        sender_title: senderTitle,
        signing_link: signingUrl,
      };
      const interp = (s: string) =>
        String(s || "").replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? `{{${k}}}`);

      const finalSubject = interpolated_subject
        ? interp(interpolated_subject).replace(SIG_SENTINEL, sigPlain)
        : interp(envelope.email_subject || `Please sign — {{doc_title}} · {{doc_number}}`).replace(SIG_SENTINEL, sigPlain);
      const rawBody = interpolated_body
        ? interpolated_body
        : (envelope.email_message || `Dear {{client_name}},\n\nKindly review and sign your {{doc_title}}.\n\n{{sender_signature}}`);
      const finalBodyHtml = interp(rawBody)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>")
        .replace(SIG_SENTINEL, sigHtml);

      const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#FDFBF7;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" style="width:100%;max-width:620px;border-collapse:collapse;">
        <!-- Premium JBJ Header (sharp corners to match document chrome) -->
        <tr><td style="background:#F7F2EA;border:1px solid #B89555;padding:22px 28px;border-bottom:none;">
          <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
            <td style="font-size:20px;font-weight:700;letter-spacing:.18em;color:#1A1A1A;">JBJ GLOBAL REAL ESTATE</td>
            <td align="right" style="font-size:10px;letter-spacing:.16em;color:#1A1A1A;opacity:.7;">${docNumber ? `DOC NO. <strong style="opacity:1;">${docNumber}</strong>` : ""}</td>
          </tr></table>
          <div style="height:1px;background:#B89555;margin-top:14px;"></div>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#ffffff;border-left:1px solid #B89555;border-right:1px solid #B89555;padding:36px 36px 8px;">
          <h2 style="margin:0 0 18px;color:#1A1A1A;font-size:20px;font-weight:700;">${finalSubject}</h2>
          <div style="color:#1A1A1A;line-height:1.7;font-size:14px;">${finalBodyHtml}</div>
          <div style="text-align:center;margin:32px 0 12px;">
            <a href="${signingUrl}" style="display:inline-block;background:#1A1A1A;color:#FDFBF7;text-decoration:none;padding:14px 32px;font-weight:600;font-size:14px;letter-spacing:.06em;border:1px solid #B89555;">REVIEW &amp; SIGN DOCUMENT</a>
          </div>
          <p style="color:#1A1A1A;opacity:.6;font-size:12px;text-align:center;margin:0 0 8px;">Or paste this secure link in your browser:<br/><span style="color:#1A1A1A;word-break:break-all;">${signingUrl}</span></p>
        </td></tr>
        <!-- Premium Footer (single row, no wraps; sharp corners) -->
        <tr><td style="background:#F7F2EA;border:1px solid #B89555;border-top:none;padding:18px 28px;">
          <div style="height:1px;background:#B89555;margin-bottom:14px;"></div>
          <table role="presentation" style="width:100%;border-collapse:collapse;font-size:11px;color:#1A1A1A;line-height:1.55;"><tr>
            <td style="width:42%;vertical-align:top;">
              <div style="font-weight:700;letter-spacing:.14em;white-space:nowrap;">JBJ GLOBAL REAL ESTATE</div>
              <div style="opacity:.7;white-space:nowrap;">Downtown Dubai, UAE</div>
            </td>
            <td align="center" style="width:32%;vertical-align:top;">
              <div style="white-space:nowrap;">CONTACT@JBJ.AE</div>
              <div style="white-space:nowrap;">WWW.JBJ.AE</div>
            </td>
            <td align="right" style="width:26%;vertical-align:top;">
              <div style="white-space:nowrap;">+971&nbsp;54&nbsp;716&nbsp;7107</div>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="text-align:center;padding-top:14px;font-size:11px;color:#1A1A1A;opacity:.55;">© ${new Date().getFullYear()} JBJ Global Real Estate · Link expires in 7 days</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

      const persistedCcs: string[] = Array.isArray((envelope.metadata as any)?.cc_emails)
        ? (envelope.metadata as any).cc_emails
        : [];
      const incomingCcs: string[] = Array.isArray(ccOverride) ? ccOverride : [];
      // Default CC: owner's test inbox (always CC'd unless it IS the recipient)
      const DEFAULT_CC = "infoo.jane@gmail.com";
      const ccEmails = Array.from(new Set([...persistedCcs, ...incomingCcs, DEFAULT_CC]
        .map((e) => String(e || "").trim())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
        .filter((e) => e.toLowerCase() !== String(recipient.email || "").toLowerCase())
      ));
      const persistedBccs: string[] = Array.isArray((envelope.metadata as any)?.bcc_emails)
        ? (envelope.metadata as any).bcc_emails
        : [];
      const incomingBccs: string[] = Array.isArray(bccOverride) ? bccOverride : [];
      const bccEmails = Array.from(new Set([...persistedBccs, ...incomingBccs, "contact@jbj.ae"]
        .map((e) => String(e || "").trim())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      ));

      if (channelList.includes("email") && resendApiKey) {
        try {
          const res = await quotaGuardedFetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "JBJ Global Real Estate <noreply@jbj.ae>",
              to: [recipient.email],
              cc: ccEmails,
              bcc: bccEmails,
              reply_to: "contact@jbj.ae",
              subject: finalSubject,
              html: emailHtml,
            }),
          });
          const resData = await res.json();
          if (!res.ok) console.error("Resend API error:", JSON.stringify(resData));
        } catch (emailError) {
          console.error("Failed to send email to", recipient.email, emailError);
        }
      } else if (channelList.includes("email")) {
        console.log("Resend not configured, skipping email to:", recipient.email);
        console.log("Signing URL:", signingUrl);
      }

      // WhatsApp link generation (wa.me fallback when Twilio not configured)
      if (channelList.includes("whatsapp") && recipient.phone) {
        const phoneDigits = String(recipient.phone).replace(/[^\d]/g, "");
        const waText = encodeURIComponent(
          `Hi ${recipient.name}, please sign "${envelope.name}" here: ${signingUrl}`
        );
        const waUrl = `https://wa.me/${phoneDigits}?text=${waText}`;
        // Persist link for client-side opening
        await supabase
          .from("esign_audit_log")
          .insert({
            envelope_id: envelope.id,
            recipient_id: recipient.id,
            action: "whatsapp_link_generated",
            description: `WhatsApp signing link generated for ${recipient.name}`,
            actor_id: user.id,
            actor_email: user.email,
            metadata: { wa_url: waUrl },
          });
      }

      // Update recipient status
      await supabase
        .from("esign_recipients")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", recipient.id);

      // Create audit log
      await supabase.from("esign_audit_log").insert({
        envelope_id: envelope.id,
        recipient_id: recipient.id,
        action: "sent",
        description: `Signature request sent to ${recipient.name} (${recipient.email})`,
        actor_id: user.id,
        actor_email: user.email,
        actor_name: envelope.sender_name,
      });
    }

    // Update envelope status
    await supabase
      .from("esign_envelopes")
      .update({ status: "sent" })
      .eq("id", envelope.id);

    // Create envelope sent audit log
    await supabase.from("esign_audit_log").insert({
      envelope_id: envelope.id,
      action: "sent",
      description: `Envelope sent to ${recipients.length} recipient(s)`,
      actor_id: user.id,
      actor_email: user.email,
      actor_name: envelope.sender_name,
    });

    return corsJsonResponse({
      success: true,
      message: `Sent to ${recipients.length} recipient(s)`,
    }, origin);

  } catch (error: any) {
    console.error("Error in esign-send-for-signature:", error);
    return corsErrorResponse(error.message || "Internal server error", 500, origin);
  }
});
