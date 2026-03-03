import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { emailShell, sharedSections, progressSteps } from "../_shared/email-html.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const VERIFIED_SENDER = "contact@jbj.ae";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(payload: { from: string; to: string[]; subject: string; html: string }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, reply_to: "CONTACT@JBJ.AE" }),
  });
  const data = await res.json();
  if (!res.ok) { console.error("Resend API error:", JSON.stringify(data)); return { error: data }; }
  return { data };
}

type ApplicationType = "partnership" | "career" | "listing";

interface StatusEmailRequest {
  applicationType: ApplicationType;
  recipientEmail: string;
  recipientName: string;
  applicationId: string;
  newStatus: string;
  statusLabel: string;
  adminMessage?: string;
  applicationTitle: string;
  actionRequired?: boolean;
  actionLabel?: string;
  userId?: string;
}

function getStatusColor(status: string): string {
  if (["approved", "accepted", "published", "active"].includes(status)) return "#22c55e";
  if (["rejected", "declined", "removed"].includes(status)) return "#ef4444";
  if (["request_edit", "revision_needed", "info_requested"].includes(status)) return "#f59e0b";
  return "#C9A84C";
}

function getApplicationTypeLabel(type: ApplicationType): string {
  switch (type) {
    case "partnership": return "Partnership Application";
    case "career": return "Career Application";
    case "listing": return "Listing Submission";
  }
}

function getUserActionUrl(type: ApplicationType): string {
  switch (type) {
    case "listing": return "/listing-portal/my-listings";
    case "career": return "/my-dashboard#notifications";
    case "partnership": default: return "/my-account";
  }
}

function buildEmailHtml(req: StatusEmailRequest): string {
  const statusColor = getStatusColor(req.newStatus);
  const typeLabel = getApplicationTypeLabel(req.applicationType);
  const normalizedStatus = req.newStatus.toLowerCase();
  const steps: [boolean, boolean, boolean] = [
    true,
    ["screening", "under_review", "shortlisted", "interview_scheduled", "interviewed", "offer_sent", "hired", "approved", "accepted", "published", "active", "rejected", "declined", "removed", "request_edit", "revision_needed", "info_requested"].includes(normalizedStatus),
    ["offer_sent", "hired", "approved", "accepted", "published", "active", "rejected", "declined", "removed"].includes(normalizedStatus),
  ];

  const bodyContent = `<tr><td style="padding:0;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="background-color:${statusColor}15;border-left:4px solid ${statusColor};padding:20px 40px;">
<p style="margin:0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:2px;">${typeLabel} Update</p>
<h2 style="margin:8px 0 0;font-size:22px;color:${statusColor};font-weight:700;">${req.statusLabel}</h2>
</td></tr></table>
</td></tr>
<tr><td class="content-pad" style="padding:32px 40px;">
<p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">Dear <strong>${req.recipientName}</strong>,</p>
<p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">
Your <strong>${typeLabel.toLowerCase()}</strong> — <strong>${req.applicationTitle}</strong> — has been updated.
</p>
${progressSteps(['Received', 'Under Review', 'Decision'], steps, [steps[0], steps[1], false])}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdfbf7;border:1px solid #C9A84C33;border-radius:18px;margin:0 0 24px;">
<tr><td style="padding:16px 20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:6px 0;color:#888;font-size:13px;width:120px;">Reference:</td><td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${req.applicationId.substring(0, 8).toUpperCase()}</td></tr>
<tr><td style="padding:6px 0;color:#888;font-size:13px;">Status:</td><td style="padding:6px 0;"><span style="background:${statusColor}15;color:${statusColor};padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid ${statusColor}40;">${req.statusLabel}</span></td></tr>
<tr><td style="padding:6px 0;color:#888;font-size:13px;">Type:</td><td style="padding:6px 0;color:#333;font-size:13px;">${typeLabel}</td></tr>
</table>
</td></tr></table>
${req.adminMessage ? `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #3b82f633;border-radius:18px;margin:0 0 24px;"><tr><td style="padding:16px 20px;"><p style="margin:0 0 8px;font-size:12px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Message from JBJ Team</p><p style="margin:0;color:#333;font-size:14px;line-height:1.6;white-space:pre-wrap;">${req.adminMessage}</p></td></tr></table>` : ""}
${req.actionRequired ? `<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #f59e0b40;border-radius:18px;margin:0 0 24px;"><tr><td style="padding:16px 20px;text-align:center;"><p style="margin:0 0 4px;font-size:14px;color:#92400e;font-weight:700;">Action Required</p><p style="margin:0;font-size:13px;color:#78350f;">${req.actionLabel || "Please review and take action."}</p></td></tr></table>` : ""}
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:8px 0 24px;">
<a href="https://jbj.ae/my-account" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">View in My Account</a>
</td></tr></table>
${sharedSections(typeLabel.toLowerCase())}
</td></tr>`;

  return emailShell(`${typeLabel} Update`, bodyContent);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: StatusEmailRequest = await req.json();
    if (!body.recipientEmail || !body.newStatus || !body.applicationType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const typeLabel = getApplicationTypeLabel(body.applicationType);
    const subject = `${typeLabel} Update: ${body.statusLabel} — ${body.applicationTitle}`;

    const emailResult = await sendEmail({ from: `JBJ Global Real Estate <${VERIFIED_SENDER}>`, to: [body.recipientEmail], subject, html: buildEmailHtml(body) });
    if (emailResult.error) console.error("Email send failed:", emailResult.error);

    if (body.userId) {
      const userActionUrl = getUserActionUrl(body.applicationType);
      await Promise.all([
        supabaseClient.from("user_notifications").insert({ user_id: body.userId, type: body.applicationType, title: `${typeLabel}: ${body.statusLabel}`, message: body.adminMessage || `Your ${typeLabel.toLowerCase()} "${body.applicationTitle}" status has been updated to ${body.statusLabel}.`, metadata: { application_id: body.applicationId, status: body.newStatus, action: body.newStatus, action_url: userActionUrl }, is_read: false }),
        supabaseClient.from("notifications").insert({ user_id: body.userId, title: `${typeLabel}: ${body.statusLabel}`, body: body.adminMessage || `Your ${typeLabel.toLowerCase()} "${body.applicationTitle}" status has been updated to ${body.statusLabel}.`, notification_type: body.actionRequired ? "reminder" : "approval", action_url: userActionUrl }),
      ]);
      if (body.actionRequired) {
        await supabaseClient.from("admin_tasks").insert({ user_id: body.userId, title: `${body.actionLabel || `Action required on ${typeLabel.toLowerCase()}`}`, description: body.adminMessage || `Your ${typeLabel.toLowerCase()} "${body.applicationTitle}" requires your attention.`, category: body.applicationType, priority: "high", status: "pending" });
      }
    }

    const ownerEmail = Deno.env.get("OWNER_EMAIL");
    if (ownerEmail) {
      const { data: { users } } = await supabaseClient.auth.admin.listUsers({ perPage: 1 });
      const owner = users?.find((u: any) => u.email === ownerEmail);
      if (owner) {
        await supabaseClient.from("notifications").insert({ user_id: owner.id, title: `${typeLabel} status changed: ${body.statusLabel}`, body: `${body.recipientName}'s ${typeLabel.toLowerCase()} "${body.applicationTitle}" → ${body.statusLabel}`, notification_type: "event", action_url: "/admin?tab=partnerships" });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Error in send-application-status-email:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
