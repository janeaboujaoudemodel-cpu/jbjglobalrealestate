import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_URL = "https://api.resend.com/emails";
const VERIFIED_SENDER = "noreply@jbj.ae";
const SITE_URL = "https://jbj.ae";
const LOGO_URL = "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/jbj-monogram-dark.png?v=3";

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
    case "career": case "hr": case "cv": return "Career Application";
    case "partnership": case "partnerships": return "Partnership Application";
    case "listing": case "listings": return "Listing Submission";
    case "inquiry": case "inquiries": return "Inquiry";
    case "support": case "ticket": return "Support Ticket";
    default: return "Notification";
  }
}

function getDepartmentLabel(category: string): string {
  switch (category?.toLowerCase()) {
    case "career": case "hr": case "cv": return "HR Department";
    case "partnership": case "partnerships": return "Partnerships Team";
    case "listing": case "listings": return "Listings Team";
    case "support": case "ticket": return "Support Team";
    default: return "JBJ Team";
  }
}

function sharedFooterHtml(): string {
  return `
<tr><td style="background:#000000;padding:32px 40px;text-align:center;">
<p style="color:#C8A766;font-size:14px;margin:0 0 14px;">Need assistance? We're here to help.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td align="center">
<a href="tel:+971565911000" style="color:#ffffff;text-decoration:none;font-size:13px;">+971 56 591 1000</a>
<span style="color:#444;margin:0 12px;">|</span>
<a href="mailto:Contact@JBJ.ae" style="color:#ffffff;text-decoration:none;font-size:13px;">Contact@JBJ.ae</a>
</td></tr>
</table>
<table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:22px;">
<tr>
<td style="padding:0 14px;"><a href="https://www.instagram.com/jbj.ae" style="color:#C8A766;text-decoration:none;font-size:12px;font-weight:600;">Instagram</a></td>
<td style="color:#444;font-size:10px;">&#8226;</td>
<td style="padding:0 14px;"><a href="https://www.facebook.com/share/1G7CgSaV2L/" style="color:#C8A766;text-decoration:none;font-size:12px;font-weight:600;">Facebook</a></td>
<td style="color:#444;font-size:10px;">&#8226;</td>
<td style="padding:0 14px;"><a href="https://www.linkedin.com/company/jbj-global-real-estate/" style="color:#C8A766;text-decoration:none;font-size:12px;font-weight:600;">LinkedIn</a></td>
<td style="color:#444;font-size:10px;">&#8226;</td>
<td style="padding:0 14px;"><a href="https://youtube.com/@jbjglobalrealestate" style="color:#C8A766;text-decoration:none;font-size:12px;font-weight:600;">YouTube</a></td>
</tr>
</table>
<p style="color:#C8A766;font-size:13px;margin:0 0 4px;font-weight:600;">JBJ Global Real Estate</p>
<p style="color:#777;font-size:11px;margin:0 0 8px;">First Global Real Estate Platform of Its Kind</p>
<p style="color:#555;font-size:10px;margin:0 0 12px;">
Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span>
</p>
<p style="color:#444;font-size:10px;margin:12px 0 0;">
&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.
</p>
</td></tr>`;
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
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d0;">

<!-- Header — Pure Black with Company Logo Monogram -->
<tr><td style="background:#000000;padding:28px 40px;text-align:center;">
<img src="${LOGO_URL}" alt="JBJ Global Real Estate" width="80" style="max-width:80px;height:auto;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
<p style="color:#C8A766;margin:0;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</p>
</td></tr>

<!-- Gold Accent Line -->
<tr><td style="background:linear-gradient(90deg,#C8A766,#D4C4A8,#C8A766);height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>

<!-- Category Label -->
<tr><td style="padding:24px 40px 0;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="background:linear-gradient(135deg,#F5EBD7 0%,#FDFBF7 100%);border-left:4px solid #C8A766;border-radius:0 10px 10px 0;padding:14px 20px;">
<p style="margin:0;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:2px;">Department</p>
<p style="margin:4px 0 0;font-size:16px;color:#1a1a1a;font-weight:700;">${typeLabel}</p>
</td></tr>
</table>
</td></tr>

<!-- Body -->
<tr><td style="padding:28px 40px;">
<p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">Dear <strong>${req.recipientName}</strong>,</p>

${req.referenceLabel ? `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;border:1px solid #C8A76633;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:16px 20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:5px 0;color:#888;font-size:12px;width:100px;">Reference</td>
<td style="padding:5px 0;color:#333;font-size:13px;font-weight:600;">${req.referenceId ? req.referenceId.substring(0, 8).toUpperCase() : 'N/A'}</td>
</tr>
<tr>
<td style="padding:5px 0;color:#888;font-size:12px;">Regarding</td>
<td style="padding:5px 0;color:#333;font-size:13px;font-weight:600;">${req.referenceLabel}</td>
</tr>
<tr>
<td style="padding:5px 0;color:#888;font-size:12px;">Type</td>
<td style="padding:5px 0;color:#333;font-size:13px;">${typeLabel}</td>
</tr>
</table>
</td></tr>
</table>
` : ''}

<!-- Admin Message — Champagne/Gold Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#F5EBD7 0%,#FDFBF7 100%);border:1px solid #C8A76640;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:18px 22px;">
<p style="margin:0 0 8px;font-size:11px;color:#C8A766;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Message from ${departmentLabel}</p>
<p style="margin:0;color:#333;font-size:14px;line-height:1.8;white-space:pre-wrap;">${req.message}</p>
</td></tr>
</table>

<!-- Reply Info — Green -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #22c55e40;border-radius:10px;margin:0 0 24px;">
<tr><td style="padding:12px 20px;text-align:center;">
<p style="margin:0;font-size:13px;color:#166534;">You can reply directly to <a href="mailto:${replyTo}" style="color:#15803d;font-weight:700;text-decoration:none;">${replyTo}</a></p>
</td></tr>
</table>

<!-- CTA — Premium Dark Button -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:8px 0 20px;">
<a href="${SITE_URL}/my-account" style="display:inline-block;background:#000000;color:#C8A766;text-decoration:none;padding:14px 40px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.5px;border:1px solid #C8A76650;">
View My Account
</a>
</td></tr>
</table>

<!-- Notification Guidance -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;border:1px solid #C8A76630;border-radius:10px;margin:0 0 24px;">
<tr><td style="padding:14px 20px;">
<p style="margin:0;font-size:13px;color:#555;line-height:1.6;">You have also received a notification in your account. You can access updates from your <strong>Account Notifications</strong>, <strong>Tasks</strong>, or <strong>Inbox</strong>.</p>
</td></tr>
</table>

<!-- Divider -->
<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e8e0d0;padding-top:24px;">

<!-- Review & Survey -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<p style="color:#1a1a1a;font-size:15px;font-weight:700;margin:0 0 4px;">We Value Your Feedback</p>
<p style="color:#888;font-size:12px;margin:0 0 16px;">Help us improve by sharing your experience</p>
<table cellpadding="0" cellspacing="0" align="center">
<tr>
<td style="padding:0 8px;"><a href="${reviewUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:11px 26px;border-radius:8px;font-weight:700;font-size:12px;border:1px solid #C8A76650;">&#9733;&#9733;&#9733;&#9733;&#9733; Leave a Review</a></td>
<td style="padding:0 8px;"><a href="${surveyUrl}" style="display:inline-block;background:#FDFBF7;border:1px solid #C8A766;color:#1a1a1a;text-decoration:none;padding:11px 26px;border-radius:8px;font-weight:700;font-size:12px;">Take Survey</a></td>
</tr>
</table>
</td></tr>
</table>

</td></tr></table>

</td></tr>

${sharedFooterHtml()}

</table>
</td></tr>
</table>
</body></html>`;
}

async function logToInbox(supabaseClient: any, req: AdminMessageRequest, direction: 'outbound') {
  try {
    const channelType = 'email';
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

    await logToInbox(supabaseClient, body, 'outbound');

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