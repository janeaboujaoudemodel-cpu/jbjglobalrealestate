// Sends a TEST copy of the Send-for-Signature email to the owner's own inbox
// (defaults to infoo.jane@gmail.com). Uses the EXACT same shared renderer as the real
// send, so what you see in your inbox is byte-for-byte what the client will get.
// It does NOT mark recipients as sent, does NOT change envelope status, and does
// NOT consume signing tokens.

import { getCorsHeaders, corsJsonResponse, corsErrorResponse } from "../_shared/cors-utils.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { quotaGuardedFetch } from "../_shared/quotaGuardedFetch.ts";
import { buildEnvelopeEmailHtml, buildSenderSignatureHtml, escapeHtml } from "../_shared/envelope-email-html.ts";
import { fetchEmailAttachment } from "../_shared/fetchEmailAttachment.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");

const TEST_RECIPIENT_DEFAULT = "infoo.jane@gmail.com";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(origin) });

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
      interpolated_body_html,
      signature_html,
      docusign_url,
      attachment_name,
      attachment_url,
      extra_attachments,
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
    const primary = recipients[0] || { name: "Client", email: toEmail };
    const docNumber = (envelope.metadata as any)?.doc_number || "";
    const fieldVals = (envelope.template_field_values as any) || {};
    const senderName = envelope.sender_name || "Jane Bou Jaoude";
    const senderTitle = (envelope as any).sender_title || "Founder & CEO";
    const SIG_SENTINEL = "@@JBJ_SENDER_SIGNATURE_BLOCK@@";
    const sigPlain = `— ${senderName}\n${senderTitle}\nJBJ GLOBAL REAL ESTATE`;
    const sigHtml = buildSenderSignatureHtml(senderName, senderTitle);

    const tokens: Record<string, string> = {
      client_name: primary.name || fieldVals.landlord_name || "Client",
      landlord_name: primary.name || fieldVals.landlord_name || "Client",
      doc_number: docNumber,
      doc_title: envelope.name || "Document",
      sender_signature: SIG_SENTINEL,
      owner_name: senderName,
      sender_title: senderTitle,
      signing_link: "",
    };
    const interp = (s: string) =>
      String(s || "").replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? `{{${k}}}`);

    const finalSubject = (interpolated_subject
      ? interp(interpolated_subject)
      : interp(envelope.email_subject || `Signature Pending — {{doc_title}}${docNumber ? " · {{doc_number}}" : ""}`)
    ).replace(SIG_SENTINEL, sigPlain);

    let finalBodyHtml: string;
    if (typeof interpolated_body_html === "string" && interpolated_body_html.trim()) {
      finalBodyHtml = interpolated_body_html;
    } else {
      const rawBody = interpolated_body
        ? interpolated_body
        : (envelope.email_message || `Dear {{client_name}},\n\nPlease find the attached PDF document for your review.\n\nOnce reviewed, kindly proceed with signing the document via DocuSign at your earliest convenience and return the signed copy by replying to this email.\n\nShould you require any clarification, please do not hesitate to contact me.\n\nThank you,\n\n{{sender_signature}}`);
      finalBodyHtml = escapeHtml(interp(rawBody))
        .replace(/\n/g, "<br/>")
        .replace(SIG_SENTINEL, sigHtml);
    }

    // Defensive (v2): decode escaped HTML markers whenever they appear,
    // even if the body also contains real tags. Drop leftover merge tokens.
    {
      for (let pass = 0; pass < 2; pass++) {
        if (!/&lt;\s*\/?\s*[a-z]/i.test(finalBodyHtml)) break;
        finalBodyHtml = finalBodyHtml
          .replace(/&nbsp;/gi, " ")
          .replace(/&quot;/gi, '"')
          .replace(/&#39;/gi, "'")
          .replace(/&lt;/gi, "<")
          .replace(/&gt;/gi, ">")
          .replace(/&amp;/gi, "&");
      }
      finalBodyHtml = finalBodyHtml
        .replace(/\{\{\s*sender_signature\s*\}\}/gi, "")
        .replace(/\{\{\s*signing_link\s*\}\}/gi, "");
    }

    // Inject a tiny invisible per-send unique marker so Gmail does NOT
    // collapse the body as duplicate content under the "..." trim toggle.
    const uniqueMarker = `<span style="display:none;visibility:hidden;opacity:0;color:transparent;font-size:0;line-height:0;mso-hide:all;">[ref:${crypto.randomUUID()}]</span>`;
    const bodyHtmlWithMarker = uniqueMarker + finalBodyHtml;

    const baseUrl = Deno.env.get("SITE_URL") || "https://jbj.ae";
    const fallbackSignUrl = primary?.signing_token
      ? `${baseUrl}/sign/${primary.signing_token}`
      : `${baseUrl}/sign/${envelope.id}`;

    // Resolve envelope-authoritative attachment metadata FIRST so the email
    // shell, plain-text alt, and the actual attached PDF all reference the
    // exact same latest filename/URL.
    const envelopeDocUrlEarly = (envelope as any).document_url ? String((envelope as any).document_url) : "";
    const envelopeDocNameEarly = (envelope as any).document_filename
      ? String((envelope as any).document_filename)
      : `${envelope.name || "Document"}.pdf`;
    const clientDocUrlEarly = typeof attachment_url === "string" ? attachment_url : "";
    const clientDocNameEarly = typeof attachment_name === "string" ? attachment_name : "";
    const resolvedAttachmentUrl = envelopeDocUrlEarly || clientDocUrlEarly;
    const resolvedAttachmentName = envelopeDocUrlEarly
      ? envelopeDocNameEarly
      : (clientDocNameEarly || envelopeDocNameEarly);

    const emailHtml = buildEnvelopeEmailHtml({
      subject: finalSubject,
      bodyHtml: bodyHtmlWithMarker,
      signatureHtml: typeof signature_html === "string" && signature_html.trim() ? signature_html : sigHtml,
      docNumber,
      senderName,
      senderTitle,
      docusignUrl: typeof docusign_url === "string" ? docusign_url.trim() : "",
      fallbackSignUrl,
      attachmentName: resolvedAttachmentName || undefined,
      attachmentUrl: resolvedAttachmentUrl || undefined,
    });

    // Plain-text alternative — Gmail uses this for the inbox snippet and
    // is far less likely to collapse multipart text+html messages behind "...".
    const plainText = [
      finalBodyHtml.replace(/<style[\s\S]*?<\/style>/gi, "")
                   .replace(/<[^>]+>/g, " ")
                   .replace(/\s+/g, " ")
                   .trim(),
      "",
      resolvedAttachmentName ? `Attached: ${resolvedAttachmentName}` : "",
      "",
      "— JBJ GLOBAL REAL ESTATE · contact@jbj.ae · www.jbj.ae",
    ].filter(Boolean).join("\n");

    if (!resendApiKey) {
      return corsErrorResponse("Email provider not configured (RESEND_API_KEY missing)", 500, origin);
    }

    // Use the resolved envelope-authoritative attachment metadata computed
    // earlier so the actual attached PDF matches the email shell text.
    const attachmentUrlStr = resolvedAttachmentUrl;
    const attachmentNameStr = resolvedAttachmentName;
    const pdfAttachment = attachmentUrlStr && attachmentNameStr
      ? await fetchEmailAttachment(attachmentUrlStr, attachmentNameStr, "application/pdf")
      : null;
    if (attachmentUrlStr && attachmentNameStr && !pdfAttachment) {
      return corsErrorResponse(
        `Could not attach ${attachmentNameStr} — the PDF could not be fetched from storage. Re-export the document and try again.`,
        502,
        origin,
      );
    }
    const allAttachments = pdfAttachment ? [pdfAttachment] : [];
    if (Array.isArray(extra_attachments)) {
      for (const e of extra_attachments) {
        const a = await fetchEmailAttachment(
          String(e?.url || ""),
          String(e?.name || ""),
          String(e?.content_type || "application/octet-stream"),
        );
        if (a) allAttachments.push(a);
        else if (e?.url && e?.name) console.warn(`[esign-send-test-email] skipped extra attachment ${e.name}`);
      }
    }
    const payload: Record<string, unknown> = {
      from: "JBJ Global Real Estate <noreply@jbj.ae>",
      to: [toEmail],
      cc: toEmail.toLowerCase() === "infoo.jane@gmail.com" ? [] : ["infoo.jane@gmail.com"],
      reply_to: "contact@jbj.ae",
      subject: finalSubject,
      html: emailHtml,
      text: plainText,
      headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
    };
    if (allAttachments.length) payload.attachments = allAttachments;

    const res = await quotaGuardedFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Resend test send error:", JSON.stringify(resData));
      return corsErrorResponse(`Resend error: ${resData?.message || res.statusText}`, 502, origin);
    }

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
