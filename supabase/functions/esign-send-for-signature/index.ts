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

    const { envelope_id, channels, cc_emails: ccOverride, bcc_emails: bccOverride, interpolated_subject, interpolated_body, interpolated_body_html, signature_html, additional_recipients, docusign_url, attachment_name, attachment_url } = await req.json();
    const channelList: string[] = Array.isArray(channels) && channels.length
      ? channels
      : ["email"];
    const extraTos: string[] = Array.isArray(additional_recipients)
      ? Array.from(new Set(additional_recipients.map((e: any) => String(e || "").trim().toLowerCase()).filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))))
      : [];
    const docusignUrlClean = typeof docusign_url === "string" ? docusign_url.trim() : "";

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
      const senderName = envelope.sender_name || "Jane Bou Jaoude";
      const senderTitle = (envelope as any).sender_title || "Founder & CEO";
      const SIG_SENTINEL = "@@JBJ_SENDER_SIGNATURE_BLOCK@@";
      const sigPlain = `— ${senderName}\n${senderTitle}\nJBJ GLOBAL REAL ESTATE`;
      const sigHtml = buildSenderSignatureHtml(senderName, senderTitle);

      const tokens: Record<string, string> = {
        client_name: recipient.name || fieldVals.landlord_name || "Client",
        landlord_name: recipient.name || fieldVals.landlord_name || "Client",
        doc_number: docNumber,
        doc_title: envelope.name || "Document",
        sender_signature: SIG_SENTINEL,
        owner_name: senderName,
        sender_title: senderTitle,
        signing_link: "", // DocuSign-only — never embed an internal signing URL
      };
      const interp = (s: string) =>
        String(s || "").replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? `{{${k}}}`);

      const finalSubject = interpolated_subject
        ? interp(interpolated_subject).replace(SIG_SENTINEL, sigPlain)
        : interp(envelope.email_subject || `Signature Pending — {{doc_title}}${docNumber ? " · {{doc_number}}" : ""}`).replace(SIG_SENTINEL, sigPlain);

      // New path: client sends pre-rendered, sanitized HTML (locked-send,
      // matches the iframe preview byte-for-byte). Legacy path: plain text.
      let finalBodyHtml: string;
      if (typeof interpolated_body_html === "string" && interpolated_body_html.trim()) {
        finalBodyHtml = interpolated_body_html;
      } else {
        const rawBody = interpolated_body
          ? interpolated_body
          : (envelope.email_message || `Dear {{client_name}},\n\nPlease find your {{doc_title}} attached.\n\n{{sender_signature}}`);
        finalBodyHtml = escapeHtml(interp(rawBody))
          .replace(/\n/g, "<br/>")
          .replace(SIG_SENTINEL, sigHtml);
      }

      const emailHtml = buildEnvelopeEmailHtml({
        subject: finalSubject,
        bodyHtml: finalBodyHtml,
        signatureHtml: typeof signature_html === "string" && signature_html.trim() ? signature_html : sigHtml,
        docNumber,
        senderName,
        senderTitle,
        docusignUrl: docusignUrlClean,
        attachmentName: typeof attachment_name === "string" ? attachment_name : undefined,
        attachmentUrl: typeof attachment_url === "string" ? attachment_url : undefined,
      });

      // Build the To list: the persisted recipient + any extra addresses
      // the owner picked in the dialog (deduped, recipient first).
      const primaryEmail = String(recipient.email || "").toLowerCase();
      const allTos = Array.from(new Set(
        [primaryEmail, ...extraTos].filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      ));

      const persistedCcs: string[] = Array.isArray((envelope.metadata as any)?.cc_emails)
        ? (envelope.metadata as any).cc_emails
        : [];
      const incomingCcs: string[] = Array.isArray(ccOverride) ? ccOverride : [];
      // Default CC: owner's test inbox (always CC'd unless it IS the recipient)
      const DEFAULT_CC = "infoo.jane@gmail.com";
      const ccEmails = Array.from(new Set([...persistedCcs, ...incomingCcs, DEFAULT_CC]
        .map((e) => String(e || "").trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
        .filter((e) => !allTos.includes(e))
      ));
      const persistedBccs: string[] = Array.isArray((envelope.metadata as any)?.bcc_emails)
        ? (envelope.metadata as any).bcc_emails
        : [];
      const incomingBccs: string[] = Array.isArray(bccOverride) ? bccOverride : [];
      const bccEmails = Array.from(new Set([...persistedBccs, ...incomingBccs, "contact@jbj.ae"]
        .map((e) => String(e || "").trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
        .filter((e) => !allTos.includes(e) && !ccEmails.includes(e))
      ));

      if (channelList.includes("email") && resendApiKey && allTos.length) {
        try {
          const res = await quotaGuardedFetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "JBJ Global Real Estate <noreply@jbj.ae>",
              to: allTos,
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
          console.error("Failed to send email to", allTos.join(","), emailError);
        }
      } else if (channelList.includes("email")) {
        console.log("Resend not configured or no recipients; skipping email.");
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
