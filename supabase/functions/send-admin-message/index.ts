import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_URL = "https://api.resend.com/emails";
const VERIFIED_SENDER = "noreply@jbj.ae";
const SITE_URL = "https://jbjglobalrealestate.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(payload: { from: string; to: string[]; subject: string; html: string }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Resend API error:", JSON.stringify(data));
    return { error: data };
  }
  return { data };
}

function buildReviewSurveyFooter(serviceCategory: string, recipientName: string): string {
  const reviewUrl = `${SITE_URL}/reviews?source=${encodeURIComponent(serviceCategory)}`;
  const surveyUrl = `${SITE_URL}/survey?source=${encodeURIComponent(serviceCategory)}`;

  return `
<!-- Review & Survey Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 10px;border-top:2px solid #C9A84C33;padding-top:24px;">
<tr><td align="center">
  <p style="color:#C9A84C;font-size:16px;font-weight:700;margin:0 0 6px;">⭐ We Value Your Feedback</p>
  <p style="color:#666;font-size:13px;margin:0 0 18px;">Help us improve by sharing your experience</p>
  <table cellpadding="0" cellspacing="0" align="center">
  <tr>
    <td style="padding:0 8px;">
      <a href="${reviewUrl}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#B8973F);color:#000;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:13px;">⭐ Leave a Review</a>
    </td>
    <td style="padding:0 8px;">
      <a href="${surveyUrl}" style="display:inline-block;background:#1a1a2e;border:2px solid #C9A84C;color:#C9A84C;text-decoration:none;padding:10px 28px;border-radius:10px;font-weight:700;font-size:13px;">📋 Take Survey</a>
    </td>
  </tr>
  </table>
</td></tr>
</table>`;
}

interface AdminMessageRequest {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
  serviceCategory: string; // cv, ticket, listing, partnership, inquiry, general
  referenceId?: string;
  referenceLabel?: string;
  userId?: string;
}

function buildEmailHtml(req: AdminMessageRequest): string {
  const reviewFooter = buildReviewSurveyFooter(req.serviceCategory, req.recipientName);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e6;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(201,168,76,0.15);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
<h1 style="color:#C9A84C;margin:0;font-size:24px;font-weight:700;letter-spacing:1px;">JBJ GLOBAL REAL ESTATE</h1>
<p style="color:#C9A84C99;margin:6px 0 0;font-size:12px;letter-spacing:3px;">BUY · SELL · RENT</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 40px;">
<p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">Dear <strong>${req.recipientName}</strong>,</p>

${req.referenceLabel ? `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdfbf7;border:1px solid #C9A84C33;border-radius:12px;margin:0 0 20px;">
<tr><td style="padding:12px 20px;">
<p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Reference</p>
<p style="margin:4px 0 0;color:#333;font-size:14px;font-weight:600;">${req.referenceLabel}${req.referenceId ? ` (${req.referenceId.substring(0, 8).toUpperCase()})` : ''}</p>
</td></tr>
</table>
` : ''}

<!-- Admin Message -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #3b82f633;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:16px 20px;">
<p style="margin:0 0 8px;font-size:12px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Message from JBJ Team</p>
<p style="margin:0;color:#333;font-size:14px;line-height:1.8;white-space:pre-wrap;">${req.message}</p>
</td></tr>
</table>

<!-- CTA Button -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:8px 0 24px;">
<a href="${SITE_URL}/my-account" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#B8973F);color:#000;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:14px;">
View in My Account
</a>
</td></tr>
</table>

${reviewFooter}

<p style="color:#888;font-size:13px;line-height:1.5;margin:20px 0 0;">
If you have questions, reply to this email or contact our support team.
</p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#1a1a2e;padding:24px 40px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="color:#C9A84C99;font-size:12px;">© ${new Date().getFullYear()} JBJ Global Real Estate</td>
<td align="right" style="color:#C9A84C60;font-size:11px;">Dubai, UAE</td>
</tr>
</table>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AdminMessageRequest = await req.json();

    if (!body.recipientEmail || !body.message || !body.subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: recipientEmail, message, subject" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Send email
    const emailResult = await sendEmail({
      from: `JBJ Global Real Estate <${VERIFIED_SENDER}>`,
      to: [body.recipientEmail],
      subject: body.subject,
      html: buildEmailHtml(body),
    });

    if (emailResult.error) {
      console.error("Email send failed:", emailResult.error);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user notification if userId provided
    if (body.userId) {
      await supabaseClient.from("user_notifications").insert({
        user_id: body.userId,
        type: body.serviceCategory || "general",
        title: body.subject,
        message: body.message,
        metadata: { reference_id: body.referenceId, service: body.serviceCategory, action_url: "/my-account" },
        is_read: false,
      }).catch(e => console.error("Notification insert error:", e));

      await supabaseClient.from("notifications").insert({
        user_id: body.userId,
        title: body.subject,
        body: body.message,
        notification_type: "message",
        action_url: "/my-account",
      }).catch(e => console.error("Legacy notification error:", e));
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-admin-message:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
