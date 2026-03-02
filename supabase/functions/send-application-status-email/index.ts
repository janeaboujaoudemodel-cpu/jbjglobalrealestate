import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_URL = "https://api.resend.com/emails";
const VERIFIED_SENDER = "contact@jbj.ae";
const LOGO_URL = "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/jbj-monogram-dark.png?v=3";

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

type ApplicationType = "partnership" | "career" | "listing";

const CHANNEL_REPLY_TO: Record<string, string> = {
  partnership: "contact@jbj.ae",
  career: "contact@jbj.ae",
  listing: "contact@jbj.ae",
};

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
    case "listing":
      return "/listing-portal/my-listings";
    case "career":
      return "/my-dashboard#notifications";
    case "partnership":
    default:
      return "/my-account";
  }
}

function buildEmailHtml(req: StatusEmailRequest): string {
  const statusColor = getStatusColor(req.newStatus);
  const typeLabel = getApplicationTypeLabel(req.applicationType);
  const normalizedStatus = req.newStatus.toLowerCase();
  const steps = [
    true,
    ["screening", "under_review", "shortlisted", "interview_scheduled", "interviewed", "offer_sent", "hired", "approved", "accepted", "published", "active", "rejected", "declined", "removed", "request_edit", "revision_needed", "info_requested"].includes(normalizedStatus),
    ["offer_sent", "hired", "approved", "accepted", "published", "active", "rejected", "declined", "removed"].includes(normalizedStatus),
  ];

  const makeStep = (num: string, label: string, active: boolean) => {
    const bg = active ? "background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;" : "background:#e5e5e5;color:#999;";
    const textColor = active ? "color:#C8A766;font-weight:600;" : "color:#999;";
    return `<td width="33%" style="text-align:center;vertical-align:top;padding:0 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td style="width:44px;height:44px;border-radius:50%;${bg}text-align:center;vertical-align:middle;line-height:44px;font-size:18px;font-weight:bold;">${num}</td></tr>
      </table>
      <p style="font-size:11px;${textColor}text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;">${label}</p>
    </td>`;
  };

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e6;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(201,168,76,0.15);">

<!-- Header -->
<tr><td style="background:#000000;padding:20px 40px;text-align:center;">
<img src="${LOGO_URL}" alt="JBJ Global Real Estate" width="120" style="max-width:120px;height:auto;margin:0 auto 10px;display:block;" />
<p style="color:#C8A766;margin:0;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</p>
</td></tr>

<!-- Status Banner -->
<tr><td style="padding:0;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="background-color:${statusColor}15;border-left:4px solid ${statusColor};padding:20px 40px;">
<p style="margin:0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:2px;">${typeLabel} Update</p>
<h2 style="margin:8px 0 0;font-size:22px;color:${statusColor};font-weight:700;">${req.statusLabel}</h2>
</td></tr>
</table>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 40px;">
<p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">Dear <strong>${req.recipientName}</strong>,</p>

<p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">
Your <strong>${typeLabel.toLowerCase()}</strong> — <strong>${req.applicationTitle}</strong> — has been updated.
</p>

<!-- Progress Tracker -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr>
${makeStep('1', 'Received', steps[0])}
${makeStep('2', 'Under Review', steps[1])}
${makeStep('3', 'Decision', steps[2])}
</tr>
</table>

<!-- Application Details -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdfbf7;border:1px solid #C9A84C33;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:16px 20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:6px 0;color:#888;font-size:13px;width:120px;">Reference:</td>
<td style="padding:6px 0;color:#333;font-size:13px;font-weight:600;">${req.applicationId.substring(0, 8).toUpperCase()}</td>
</tr>
<tr>
<td style="padding:6px 0;color:#888;font-size:13px;">Status:</td>
<td style="padding:6px 0;"><span style="background:${statusColor}15;color:${statusColor};padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid ${statusColor}40;">${req.statusLabel}</span></td>
</tr>
<tr>
<td style="padding:6px 0;color:#888;font-size:13px;">Type:</td>
<td style="padding:6px 0;color:#333;font-size:13px;">${typeLabel}</td>
</tr>
</table>
</td></tr>
</table>

${req.adminMessage ? `
<!-- Admin Message -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #3b82f633;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:16px 20px;">
<p style="margin:0 0 8px;font-size:12px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Message from JBJ Team</p>
<p style="margin:0;color:#333;font-size:14px;line-height:1.6;white-space:pre-wrap;">${req.adminMessage}</p>
</td></tr>
</table>
` : ""}

${req.actionRequired ? `
<!-- Action Required -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #f59e0b40;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:16px 20px;text-align:center;">
<p style="margin:0 0 4px;font-size:14px;color:#92400e;font-weight:700;">⚠️ Action Required</p>
<p style="margin:0;font-size:13px;color:#78350f;">${req.actionLabel || "Please review and take action on your application."}</p>
</td></tr>
</table>
` : ""}

<!-- Reply Info -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #22c55e40;border-radius:10px;margin:0 0 24px;">
<tr><td style="padding:12px 20px;text-align:center;">
<p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">For inquiries about your application, you can reply directly to <a href="mailto:contact@jbj.ae" style="color:#15803d;font-weight:700;text-decoration:none;">contact@jbj.ae</a>.</p>
</td></tr>
</table>

<!-- Review & Survey Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;border-top:2px solid #C9A84C33;padding-top:20px;">
<tr><td align="center">
<p style="color:#C9A84C;font-size:15px;font-weight:700;margin:0 0 6px;">⭐ We Value Your Feedback</p>
<p style="color:#666;font-size:12px;margin:0 0 14px;">Help us improve by sharing your experience</p>
<table cellpadding="0" cellspacing="0" align="center">
<tr>
        <td style="padding:0 6px;"><a href="https://jbj.ae/reviews?source=${encodeURIComponent(req.applicationType)}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:12px;border:1px solid #C8A76650;">Leave a Review</a></td>
        <td style="padding:0 6px;"><a href="https://jbj.ae/ticket-survey?source=${encodeURIComponent(req.applicationType)}" style="display:inline-block;background:#FDFBF7;border:2px solid #C8A766;color:#1a1a1a;text-decoration:none;padding:8px 24px;border-radius:8px;font-weight:700;font-size:12px;">Take Survey</a></td>
</tr>
</table>
</td></tr>
</table>

<!-- CTA Button -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:8px 0 24px;">
<a href="https://jbj.ae/my-account" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:14px;letter-spacing:0.5px;border:1px solid #C8A76650;">
View in My Account
</a>
</td></tr>
</table>

<!-- Footer -->
<tr><td style="background:#000;padding:28px 40px;text-align:center;">
<p style="color:#C8A766;font-size:13px;margin:0 0 4px;font-weight:600;">JBJ Global Real Estate</p>
<p style="color:#777;font-size:11px;margin:0 0 8px;">First Global Real Estate Platform of Its Kind</p>
<p style="color:#C8A766;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">Follow Us &middot; Stay in the Loop</p>
<table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:14px;">
<tr>
<td style="padding:0 5px;"><a href="https://www.instagram.com/jbj.ae" style="display:inline-block;padding:7px 14px;border:1px solid #C8A766;border-radius:6px;color:#C8A766;text-decoration:none;font-size:11px;font-weight:600;">Instagram</a></td>
<td style="padding:0 5px;"><a href="https://www.facebook.com/share/1G7CgSaV2L/" style="display:inline-block;padding:7px 14px;border:1px solid #C8A766;border-radius:6px;color:#C8A766;text-decoration:none;font-size:11px;font-weight:600;">Facebook</a></td>
<td style="padding:0 5px;"><a href="https://www.linkedin.com/company/jbj-global-real-estate/" style="display:inline-block;padding:7px 14px;border:1px solid #C8A766;border-radius:6px;color:#C8A766;text-decoration:none;font-size:11px;font-weight:600;">LinkedIn</a></td>
<td style="padding:0 5px;"><a href="https://youtube.com/@jbjglobalrealestate" style="display:inline-block;padding:7px 14px;border:1px solid #C8A766;border-radius:6px;color:#C8A766;text-decoration:none;font-size:11px;font-weight:600;">YouTube</a></td>
</tr>
</table>
<p style="color:#888;font-size:10px;margin:0 0 8px;white-space:nowrap;">Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span></p>
<p style="color:#C8A766;font-size:11px;margin:0;font-weight:600;">&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
<p style="color:#666;font-size:10px;margin:4px 0 0;">Dubai, UAE</p>
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
    const body: StatusEmailRequest = await req.json();

    if (!body.recipientEmail || !body.newStatus || !body.applicationType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const typeLabel = getApplicationTypeLabel(body.applicationType);
    const subject = `${typeLabel} Update: ${body.statusLabel} — ${body.applicationTitle}`;

    // Send email
    const replyTo = CHANNEL_REPLY_TO[body.applicationType] || "contact@jbj.ae";

    const emailResult = await sendEmail({
      from: `JBJ Global Real Estate <${VERIFIED_SENDER}>`,
      reply_to: replyTo,
      to: [body.recipientEmail],
      subject,
      html: buildEmailHtml(body),
    } as any);

    if (emailResult.error) {
      console.error("Email send failed:", emailResult.error);
    }

    // Create notification + task for user if userId provided
    if (body.userId) {
      // Insert into user_notifications (visible in bell dropdown)
      const userActionUrl = getUserActionUrl(body.applicationType);

      await supabaseClient.from("user_notifications").insert({
        user_id: body.userId,
        type: body.applicationType,
        title: `${typeLabel}: ${body.statusLabel}`,
        message: body.adminMessage || `Your ${typeLabel.toLowerCase()} "${body.applicationTitle}" status has been updated to ${body.statusLabel}.`,
        metadata: {
          application_id: body.applicationId,
          status: body.newStatus,
          action: body.newStatus,
          action_url: userActionUrl,
        },
        is_read: false,
      });

      // Also insert into legacy notifications table
      await supabaseClient.from("notifications").insert({
        user_id: body.userId,
        title: `${typeLabel}: ${body.statusLabel}`,
        body: body.adminMessage || `Your ${typeLabel.toLowerCase()} "${body.applicationTitle}" status has been updated to ${body.statusLabel}.`,
        notification_type: body.actionRequired ? "reminder" : "approval",
        action_url: userActionUrl,
      });

      // Create task if action is required
      if (body.actionRequired) {
        await supabaseClient.from("admin_tasks").insert({
          user_id: body.userId,
          title: `${body.actionLabel || `Action required on ${typeLabel.toLowerCase()}`}`,
          description: body.adminMessage || `Your ${typeLabel.toLowerCase()} "${body.applicationTitle}" requires your attention. Status: ${body.statusLabel}.`,
          category: body.applicationType,
          priority: "high",
          status: "pending",
        });
      }
    }

    // Create owner notification/task
    const ownerEmail = Deno.env.get("OWNER_EMAIL");
    if (ownerEmail) {
      const { data: ownerUser } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("email", ownerEmail)
        .maybeSingle();

      // Also try auth lookup
      if (!ownerUser) {
        const { data: { users } } = await supabaseClient.auth.admin.listUsers({ perPage: 1 });
        const owner = users?.find((u: any) => u.email === ownerEmail);
        if (owner) {
          await supabaseClient.from("notifications").insert({
            user_id: owner.id,
            title: `${typeLabel} status changed: ${body.statusLabel}`,
            body: `${body.recipientName}'s ${typeLabel.toLowerCase()} "${body.applicationTitle}" → ${body.statusLabel}`,
            notification_type: "event",
            action_url: "/admin?tab=partnerships",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-application-status-email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
