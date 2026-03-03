import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SITE_URL, emailShell, sharedSections, teamReplyCard, inquiryStages } from "../_shared/email-html.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const VERIFIED_SENDER = "contact@jbj.ae";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(payload: { from: string; reply_to: string; to: string[]; subject: string; html: string }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) { console.error("Resend API error:", JSON.stringify(data)); return { error: data }; }
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
    case "career": case "hr": case "cv": return "JBJ HR Team";
    case "partnership": case "partnerships": return "JBJ Partnerships Team";
    case "listing": case "listings": return "JBJ Listings Team";
    case "support": case "ticket": return "JBJ Support Team";
    default: return "JBJ Team";
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
  inquiryStage?: 'received' | 'reviewing' | 'responded';
}

function buildEmailHtml(req: AdminMessageRequest): string {
  const typeLabel = getServiceLabel(req.serviceCategory);
  const departmentLabel = getDepartmentLabel(req.serviceCategory);
  const isInquiry = req.serviceCategory?.toLowerCase() === 'inquiry' || req.serviceCategory?.toLowerCase() === 'inquiries';

  // Admin messages: EN only with sharedSections at end (LTR)
  const bodyContent = `<tr><td style="padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="background:linear-gradient(135deg,#F5EBD7 0%,#FDFBF7 100%);padding:16px 32px 14px;">
<p style="margin:0;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:2px;">Department Inquiry</p>
<p style="margin:4px 0 0;font-size:16px;color:#1a1a1a;font-weight:700;">${typeLabel}</p>
</td></tr></table>
</td></tr>
<tr><td class="content-pad" style="padding:28px 40px;">
<p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">Dear <strong>${req.recipientName}</strong>,</p>
${isInquiry && req.inquiryStage ? inquiryStages(req.inquiryStage) : ''}
${req.referenceLabel ? `
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#FDFBF7;border:1px solid #C8A76633;border-radius:18px;margin:0 0 24px;">
<tr><td style="padding:16px 20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:5px 0;color:#888;font-size:12px;width:100px;border-right:1px solid #C8A76630;padding-right:12px;">Reference</td><td style="padding:5px 0 5px 12px;color:#333;font-size:13px;font-weight:600;">${req.referenceId ? req.referenceId.substring(0, 8).toUpperCase() : 'N/A'}</td></tr>
<tr><td style="padding:5px 0;color:#888;font-size:12px;border-right:1px solid #C8A76630;padding-right:12px;">Regarding</td><td style="padding:5px 0 5px 12px;color:#333;font-size:13px;font-weight:600;">${req.referenceLabel}</td></tr>
<tr><td style="padding:5px 0;color:#888;font-size:12px;border-right:1px solid #C8A76630;padding-right:12px;">Type</td><td style="padding:5px 0 5px 12px;color:#333;font-size:13px;">${typeLabel}</td></tr>
</table></td></tr></table>` : ''}
${teamReplyCard(`${departmentLabel} Reply`, req.message)}
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:8px 0 20px;">
<a href="${SITE_URL}/my-account" style="display:inline-block;background:#000000;color:#C8A766;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">View My Account</a>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#FDFBF7;border:1px solid #C8A76630;border-radius:18px;margin:0 0 24px;">
<tr><td style="padding:14px 20px;">
<p style="margin:0;font-size:13px;color:#555;line-height:1.6;">You have also received a notification in your account. You can access updates from your <strong>Account Notifications</strong>, <strong>Tasks</strong>, or <strong>Inbox</strong>.</p>
</td></tr></table>
${sharedSections(typeLabel.toLowerCase())}`;

  return emailShell(`${departmentLabel} — Message`, bodyContent);
}

async function logToInbox(supabaseClient: any, req: AdminMessageRequest, direction: 'outbound') {
  try {
    const { data: existingThread } = await supabaseClient.from('owner_comm_threads').select('id').eq('contact_identifier', req.recipientEmail).eq('channel_type', 'email').maybeSingle();
    let threadId = existingThread?.id;
    if (!threadId) {
      const { data: newThread } = await supabaseClient.from('owner_comm_threads').insert({ contact_identifier: req.recipientEmail, contact_name: req.recipientName, channel_type: 'email', status: 'active', last_message_preview: req.message.substring(0, 100), last_message_at: new Date().toISOString(), unread_count: 0, metadata: { service: req.serviceCategory, reference_id: req.referenceId } }).select('id').single();
      threadId = newThread?.id;
    } else {
      await supabaseClient.from('owner_comm_threads').update({ last_message_preview: req.message.substring(0, 100), last_message_at: new Date().toISOString(), status: 'active' }).eq('id', threadId);
    }
    if (threadId) {
      await supabaseClient.from('owner_comm_messages').insert({ thread_id: threadId, direction, content: req.message, sender_identifier: 'JBJ Team', metadata: { subject: req.subject, service: req.serviceCategory, reference_id: req.referenceId } });
    }
  } catch (e) { console.error("Inbox logging error:", e); }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AdminMessageRequest = await req.json();
    if (!body.recipientEmail || !body.message || !body.subject) {
      return new Response(JSON.stringify({ error: "Missing required fields: recipientEmail, message, subject" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const emailResult = await sendEmail({ from: `JBJ Global Real Estate <${VERIFIED_SENDER}>`, reply_to: "CONTACT@JBJ.AE", to: [body.recipientEmail], subject: body.subject, html: buildEmailHtml(body) });
    if (emailResult.error) {
      console.error("Email send failed:", emailResult.error);
      return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await logToInbox(supabaseClient, body, 'outbound');

    if (body.userId) {
      await Promise.all([
        supabaseClient.from("user_notifications").insert({ user_id: body.userId, type: body.serviceCategory || "general", title: body.subject, message: body.message, metadata: { reference_id: body.referenceId, service: body.serviceCategory, action_url: "/my-account" }, is_read: false }),
        supabaseClient.from("notifications").insert({ user_id: body.userId, title: body.subject, body: body.message, notification_type: "message", action_url: "/my-account" }),
      ]);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Error in send-admin-message:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
