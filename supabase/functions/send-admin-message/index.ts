import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_URL = "https://api.resend.com/emails";
const VERIFIED_SENDER = "noreply@jbj.ae";
const SITE_URL = "https://jbj.ae";

// Per-channel reply-to addresses
const CHANNEL_REPLY_TO: Record<string, string> = {
  hr: "HR@JBJ.AE",
  career: "HR@JBJ.AE",
  cv: "HR@JBJ.AE",
  inquiries: "INQUIRIES@JBJ.AE",
  inquiry: "INQUIRIES@JBJ.AE",
  partnerships: "PARTNERSHIPS@JBJ.AE",
  partnership: "PARTNERSHIPS@JBJ.AE",
  listings: "LISTINGS@JBJ.AE",
  listing: "LISTINGS@JBJ.AE",
  support: "SUPPORT@JBJ.AE",
  ticket: "SUPPORT@JBJ.AE",
  general: "contact@jbj.com",
};

function getReplyTo(serviceCategory: string): string {
  return CHANNEL_REPLY_TO[serviceCategory?.toLowerCase()] || "contact@jbj.com";
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(payload: { from: string; reply_to: string; to: string[]; subject: string; html: string }) {
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

function getServiceLabel(category: string): string {
  switch (category?.toLowerCase()) {
    case "career":
    case "hr":
    case "cv":
      return "Career Application";
    case "partnership":
    case "partnerships":
      return "Partnership Application";
    case "listing":
    case "listings":
      return "Listing Submission";
    case "inquiry":
    case "inquiries":
      return "Inquiry";
    case "support":
    case "ticket":
      return "Support Ticket";
    default:
      return "Notification";
  }
}

function getDepartmentLabel(category: string): string {
  switch (category?.toLowerCase()) {
    case "career":
    case "hr":
    case "cv":
      return "HR Department";
    case "partnership":
    case "partnerships":
      return "Partnerships Team";
    case "listing":
    case "listings":
      return "Listings Team";
    case "support":
    case "ticket":
      return "Support Team";
    default:
      return "JBJ Team";
  }
}

interface AdminMessageRequest {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
  serviceCategory: string;
  referenceId?: string;
  referenceLabel?: string;
  userId?: string;
}

function buildEmailHtml(req: AdminMessageRequest): string {
  const replyTo = getReplyTo(req.serviceCategory);
  const typeLabel = getServiceLabel(req.serviceCategory);
  const departmentLabel = getDepartmentLabel(req.serviceCategory);
  const reviewUrl = `${SITE_URL}/reviews?source=${encodeURIComponent(req.serviceCategory)}`;
  const surveyUrl = `${SITE_URL}/survey?source=${encodeURIComponent(req.serviceCategory)}`;

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

<!-- Category Banner -->
<tr><td style="padding:0;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="background-color:#C9A84C15;border-left:4px solid #C9A84C;padding:20px 40px;">
<p style="margin:0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:2px;">${typeLabel}</p>
<h2 style="margin:8px 0 0;font-size:22px;color:#C9A84C;font-weight:700;">Message from ${departmentLabel}</h2>
</td></tr>
</table>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 40px;">
<p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">Dear <strong>${req.recipientName}</strong>,</p>

${req.referenceLabel ? `
<!-- Reference Details -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdfbf7;border:1px solid #C9A84C33;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:16px 20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:6px 0;color:#888;font-size:13px;width:120px;">Reference:</td>
<td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${req.referenceId ? req.referenceId.substring(0, 8).toUpperCase() : 'N/A'}</td>
</tr>
<tr>
<td style="padding:6px 0;color:#888;font-size:13px;">Regarding:</td>
<td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${req.referenceLabel}</td>
</tr>
<tr>
<td style="padding:6px 0;color:#888;font-size:13px;">Type:</td>
<td style="padding:6px 0;color:#333;font-size:13px;">${typeLabel}</td>
</tr>
</table>
</td></tr>
</table>
` : ''}

<!-- Admin Message -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #3b82f633;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:16px 20px;">
<p style="margin:0 0 8px;font-size:12px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Message from ${departmentLabel}</p>
<p style="margin:0;color:#333;font-size:14px;line-height:1.8;white-space:pre-wrap;">${req.message}</p>
</td></tr>
</table>

<!-- Reply info -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #22c55e33;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:12px 20px;text-align:center;">
<p style="margin:0;font-size:13px;color:#166534;">💬 You can reply directly to this email at <a href="mailto:${replyTo}" style="color:#C9A84C;font-weight:600;">${replyTo}</a></p>
</td></tr>
</table>

<!-- CTA Button -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:8px 0 24px;">
<a href="${SITE_URL}/my-account" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#B8973F);color:#000;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:14px;letter-spacing:0.5px;">
View in My Account
</a>
</td></tr>
</table>

<!-- Review & Survey Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;border-top:2px solid #C9A84C33;padding-top:20px;">
<tr><td align="center">
<p style="color:#C9A84C;font-size:15px;font-weight:700;margin:0 0 6px;">⭐ We Value Your Feedback</p>
<p style="color:#666;font-size:12px;margin:0 0 14px;">Help us improve by sharing your experience</p>
<table cellpadding="0" cellspacing="0" align="center">
<tr>
<td style="padding:0 6px;"><a href="${reviewUrl}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#B8973F);color:#000;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:12px;">⭐ Leave a Review</a></td>
<td style="padding:0 6px;"><a href="${surveyUrl}" style="display:inline-block;background:#1a1a2e;border:2px solid #C9A84C;color:#C9A84C;text-decoration:none;padding:8px 24px;border-radius:8px;font-weight:700;font-size:12px;">📋 Take Survey</a></td>
</tr>
</table>
</td></tr>
</table>

<p style="color:#888;font-size:13px;line-height:1.5;margin:20px 0 0;">
If you have questions, reply to this email or contact our support team.
</p>
</td></tr>

<!-- Social Media & Contact Footer -->
<tr><td style="background:linear-gradient(135deg,#000 0%,#1a1a1a 100%);padding:35px 40px;text-align:center;">
<!-- Contact Info -->
<p style="color:#C8A766;font-size:14px;margin:0 0 15px 0;">Need assistance? We're here to help.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td align="center">
<a href="tel:+971565911000" style="color:#fff;text-decoration:none;font-size:14px;">📞 +971 56 591 1000</a>
<span style="color:#444;margin:0 10px;">|</span>
<a href="mailto:Contact@JBJ.ae" style="color:#fff;text-decoration:none;font-size:14px;">Contact@JBJ.ae</a>
</td></tr>
</table>

<!-- Social Media Links -->
<table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:20px;">
<tr>
<td style="padding:0 10px;"><a href="https://www.instagram.com/jbj.ae" style="color:#C8A766;text-decoration:none;font-size:13px;font-weight:600;">Instagram</a></td>
<td style="color:#444;">·</td>
<td style="padding:0 10px;"><a href="https://www.facebook.com/share/1G7CgSaV2L/" style="color:#C8A766;text-decoration:none;font-size:13px;font-weight:600;">Facebook</a></td>
<td style="color:#444;">·</td>
<td style="padding:0 10px;"><a href="https://www.linkedin.com/company/jbj-global-real-estate/" style="color:#C8A766;text-decoration:none;font-size:13px;font-weight:600;">LinkedIn</a></td>
<td style="color:#444;">·</td>
<td style="padding:0 10px;"><a href="https://youtube.com/@jbjglobalrealestate" style="color:#C8A766;text-decoration:none;font-size:13px;font-weight:600;">YouTube</a></td>
</tr>
</table>

<!-- Brand Attribution -->
<p style="color:#C8A766;font-size:14px;margin:0 0 5px 0;font-weight:600;">JBJ Global Real Estate</p>
<p style="color:#888;font-size:12px;margin:0 0 10px 0;">First Global Real Estate Platform of Its Kind</p>
<p style="color:#666;font-size:11px;margin:0 0 15px 0;">
Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span>
</p>
<p style="color:#555;font-size:11px;margin:15px 0 0 0;">
JBJ Global Real Estate provides brokerage support and partner introductions only.<br>
We do not provide legal, mortgage, financial, or advisory services.
</p>
<p style="color:#444;font-size:10px;margin:15px 0 0 0;">
© ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.
</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

async function logToInbox(supabaseClient: any, req: AdminMessageRequest, direction: 'outbound') {
  try {
    const channelType = 'email';

    // Find or create thread
    const { data: existingThread } = await supabaseClient
      .from('owner_comm_threads')
      .select('id')
      .eq('contact_identifier', req.recipientEmail)
      .eq('channel_type', channelType)
      .maybeSingle();

    let threadId = existingThread?.id;

    if (!threadId) {
      const { data: newThread } = await supabaseClient
        .from('owner_comm_threads')
        .insert({
          contact_identifier: req.recipientEmail,
          contact_name: req.recipientName,
          channel_type: channelType,
          status: 'active',
          last_message_preview: req.message.substring(0, 100),
          last_message_at: new Date().toISOString(),
          unread_count: 0,
          metadata: { service: req.serviceCategory, reference_id: req.referenceId },
        })
        .select('id')
        .single();
      threadId = newThread?.id;
    } else {
      await supabaseClient
        .from('owner_comm_threads')
        .update({
          last_message_preview: req.message.substring(0, 100),
          last_message_at: new Date().toISOString(),
          status: 'active',
        })
        .eq('id', threadId);
    }

    if (threadId) {
      await supabaseClient.from('owner_comm_messages').insert({
        thread_id: threadId,
        direction: direction,
        content: req.message,
        sender_identifier: 'JBJ Team',
        metadata: { subject: req.subject, service: req.serviceCategory, reference_id: req.referenceId },
      });
    }
  } catch (e) {
    console.error("Inbox logging error:", e);
  }
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

    const replyTo = getReplyTo(body.serviceCategory);

    // Send email with reply-to
    const emailResult = await sendEmail({
      from: `JBJ Global Real Estate <${VERIFIED_SENDER}>`,
      reply_to: replyTo,
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

    // Log outbound email to inbox
    await logToInbox(supabaseClient, body, 'outbound');

    // Create user notification if userId provided
    if (body.userId) {
      const { error: notifErr } = await supabaseClient.from("user_notifications").insert({
        user_id: body.userId,
        type: body.serviceCategory || "general",
        title: body.subject,
        message: body.message,
        metadata: { reference_id: body.referenceId, service: body.serviceCategory, action_url: "/my-account" },
        is_read: false,
      });
      if (notifErr) console.error("Notification insert error:", notifErr);

      const { error: legacyErr } = await supabaseClient.from("notifications").insert({
        user_id: body.userId,
        title: body.subject,
        body: body.message,
        notification_type: "message",
        action_url: "/my-account",
      });
      if (legacyErr) console.error("Legacy notification error:", legacyErr);
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
