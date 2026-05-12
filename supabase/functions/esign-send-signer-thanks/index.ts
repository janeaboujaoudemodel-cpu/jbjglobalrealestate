import { getCorsHeaders, corsJsonResponse, corsErrorResponse } from "../_shared/cors-utils.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { quotaGuardedFetch } from "../_shared/quotaGuardedFetch.ts";
import { premiumShell, actionButtons } from "../_shared/esignEmailShell.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    const { envelope_id, recipient_id } = await req.json();
    if (!envelope_id || !recipient_id) {
      return corsErrorResponse("envelope_id and recipient_id are required", 400, origin);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Idempotency — skip if already sent
    const { data: existing } = await supabase
      .from("esign_audit_log")
      .select("id")
      .eq("envelope_id", envelope_id)
      .eq("recipient_id", recipient_id)
      .eq("action", "signer_thanks_sent")
      .maybeSingle();
    if (existing) {
      return corsJsonResponse({ success: true, skipped: "already_sent" }, origin);
    }

    const { data: recipient, error: recErr } = await supabase
      .from("esign_recipients")
      .select("*")
      .eq("id", recipient_id)
      .single();
    if (recErr || !recipient?.email) {
      return corsErrorResponse("Recipient not found", 404, origin);
    }

    const { data: envelope, error: envErr } = await supabase
      .from("esign_envelopes")
      .select("*")
      .eq("id", envelope_id)
      .single();
    if (envErr || !envelope) {
      return corsErrorResponse("Envelope not found", 404, origin);
    }

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY missing — skipping signer thanks email");
      return corsJsonResponse({ success: true, skipped: "no_resend_key" }, origin);
    }

    const baseUrl = Deno.env.get("SITE_URL") || "https://jbj.ae";
    const docNumber = (envelope.metadata as any)?.doc_number || "";
    const signedAt = new Date(recipient.signed_at || Date.now())
      .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

    const isCompleted = envelope.status === "completed";
    const signedPdfUrl = isCompleted ? (envelope.signed_document_url || null) : null;

    // Look up audit certificate URL (if envelope already completed)
    let certificateUrl: string | null = null;
    if (isCompleted) {
      const { data: signedDoc } = await supabase
        .from("esign_signed_documents")
        .select("certificate_url")
        .eq("envelope_id", envelope.id)
        .maybeSingle();
      certificateUrl = (signedDoc as any)?.certificate_url || null;
    }

    const statusNote = isCompleted
      ? `<p style="color:#1A1A1A;line-height:1.7;font-size:14px;margin:0 0 18px;">The fully executed document is now legally binding. A signed copy and audit certificate are available below for your records.</p>`
      : `<p style="color:#1A1A1A;line-height:1.7;font-size:14px;margin:0 0 18px;">We're now collecting the remaining signatures. As soon as every party has signed, we'll send you the fully executed copy together with the audit certificate.</p>`;

    const inner = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="display:inline-block;width:56px;height:56px;background:#10b981;border-radius:50%;line-height:56px;color:#fff;font-size:28px;">✓</div>
      </div>
      <h2 style="margin:0 0 12px;color:#1A1A1A;font-size:22px;font-weight:700;text-align:center;">Thank you for signing</h2>
      <p style="color:#1A1A1A;line-height:1.7;font-size:14px;text-align:center;margin:0 0 8px;">Dear ${recipient.name || "Signer"},</p>
      <p style="color:#1A1A1A;line-height:1.7;font-size:14px;margin:0 0 18px;">
        We have received your signature on <strong>${envelope.name}</strong>${docNumber ? ` · ${docNumber}` : ""}.
      </p>
      ${statusNote}
      <div style="background:#F7F2EA;border:1px solid #B89555;border-radius:10px;padding:16px;margin:20px 0;">
        <p style="margin:0;font-weight:600;color:#1A1A1A;font-size:13px;">📄 ${envelope.name}${docNumber ? ` · ${docNumber}` : ""}</p>
        <p style="margin:6px 0 0;color:#1A1A1A;opacity:.75;font-size:12px;">Signed ${signedAt}</p>
      </div>
      ${actionButtons({ viewUrl: `${baseUrl}/e-signature/${envelope.id}`, signedPdfUrl, certificateUrl })}
      <p style="color:#1A1A1A;line-height:1.7;font-size:13px;margin:24px 0 0;">
        Any questions? Simply reply to this email or contact us at <a href="mailto:contact@jbj.ae" style="color:#1A1A1A;">contact@jbj.ae</a>.
      </p>
      <p style="color:#1A1A1A;opacity:.6;font-size:12px;text-align:center;margin:24px 0 0;">With appreciation,<br/><strong>JBJ Global Real Estate</strong></p>`;

    const res = await quotaGuardedFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "JBJ Global Real Estate <noreply@jbj.ae>",
        to: [recipient.email],
        cc: recipient.email?.toLowerCase() === "infoo.jane@gmail.com" ? [] : ["infoo.jane@gmail.com"],
        reply_to: "contact@jbj.ae",
        subject: `✓ Thank you for signing — ${envelope.name}`,
        html: premiumShell(inner, docNumber),
      }),
    });
    const resData = await res.json();
    if (!res.ok) {
      console.error("Resend signer thanks error:", JSON.stringify(resData));
      return corsErrorResponse("Failed to send email", 500, origin);
    }

    await supabase.from("esign_audit_log").insert({
      envelope_id: envelope.id,
      recipient_id: recipient.id,
      action: "signer_thanks_sent",
      description: `Thank-you email sent to ${recipient.name} <${recipient.email}>`,
      actor_email: recipient.email,
      actor_name: recipient.name,
      metadata: { envelope_completed: isCompleted },
    });

    return corsJsonResponse({ success: true }, origin);
  } catch (error: any) {
    console.error("Error in esign-send-signer-thanks:", error);
    return corsErrorResponse(error.message || "Internal server error", 500, origin);
  }
});
