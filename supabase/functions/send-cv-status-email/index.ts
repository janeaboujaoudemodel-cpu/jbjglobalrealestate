import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_URL = "https://api.resend.com/emails";
const VERIFIED_SENDER = 'noreply@jbj.ae';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(payload: { from: string; to: string[]; subject: string; html: string }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Resend API error:", JSON.stringify(data));
    return { error: data };
  }
  return { data };
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (m) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[m] || m;
  });
}

interface CVEmailRequest {
  email: string;
  fullName: string;
  status: 'submitted' | 'under_review' | 'pending' | 'approved' | 'rejected';
  position?: string;
  userId?: string;
  adminNote?: string;
}

function makeStep(num: string, label: string, active: boolean, isCheck: boolean) {
  const bg = active ? 'background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;' : 'background:#e5e5e5;color:#999;';
  const textColor = active ? 'color:#C8A766;font-weight:600;' : 'color:#999;';
  const icon = isCheck ? '&#10003;' : num;
  return `<td width="33%" style="text-align:center;vertical-align:top;padding:0 8px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
      <tr><td style="width:44px;height:44px;border-radius:50%;${bg}text-align:center;vertical-align:middle;line-height:44px;font-size:18px;font-weight:bold;">${icon}</td></tr>
    </table>
    <p style="font-size:11px;${textColor}text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;">${label}</p>
  </td>`;
}

function buildEmailHtml(req: CVEmailRequest): { html: string; subject: string } {
  const name = escapeHtml(req.fullName);
  const position = escapeHtml(req.position) || 'General Application';
  const adminNote = escapeHtml(req.adminNote);

  const statusConfig: Record<string, { title: string; subtitle: string; steps: [boolean, boolean, boolean]; stepChecks: [boolean, boolean, boolean]; extraHtml: string }> = {
    submitted: {
      title: "CV Application Received",
      subtitle: "Thank you for your interest in joining JBJ Global Real Estate. We've received your application and our HR team will begin reviewing your profile shortly.",
      steps: [true, false, false],
      stepChecks: [true, false, false],
      extraHtml: `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border-radius:10px;margin-bottom:24px;border:1px solid #C8A766;">
<tr><td style="padding:24px;">
<p style="font-weight:bold;color:#1a1a1a;margin:0 0 12px;font-size:15px;">What happens next?</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:4px 0;font-size:13px;color:#555;">&#8226; Our HR team will review your CV within <strong>3-5 business days</strong></td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#555;">&#8226; You'll receive email updates as your application progresses</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#555;">&#8226; Check your notification inbox on our platform for real-time status</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#555;">&#8226; Qualified candidates will be contacted for an interview</td></tr>
</table>
</td></tr></table>`,
    },
    under_review: {
      title: "Your CV Is Under Review",
      subtitle: "Great news! Our HR team is now actively reviewing your application. We'll be in touch soon with an update.",
      steps: [true, true, false],
      stepChecks: [true, true, false],
      extraHtml: adminNote ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;"><tr><td style="padding:20px;"><p style="font-weight:bold;color:#1a1a1a;margin:0 0 8px;">HR Team Note:</p><p style="color:#555;margin:0;">${adminNote}</p></td></tr></table>` : '',
    },
    approved: {
      title: "Congratulations! Your Application Has Been Approved",
      subtitle: "We're excited to inform you that your application has been approved. Our team will reach out shortly to discuss the next steps, including scheduling an interview.",
      steps: [true, true, true],
      stepChecks: [true, true, true],
      extraHtml: `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #22c55e;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:24px;text-align:center;">
<p style="font-size:36px;margin:0 0 8px;">🎉</p>
<p style="color:#166534;font-size:16px;font-weight:bold;margin:0 0 8px;">Welcome Aboard!</p>
<p style="color:#15803d;font-size:13px;margin:0;">We'll be in touch within 48 hours to discuss interview scheduling and next steps.</p>
</td></tr></table>`,
    },
    rejected: {
      title: "Application Update",
      subtitle: "Thank you for your interest in JBJ Global Real Estate. After careful review, we've decided to pursue other candidates at this time. We appreciate your effort and encourage you to apply for future openings.",
      steps: [true, true, true],
      stepChecks: [true, true, false],
      extraHtml: `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border-radius:10px;margin-bottom:24px;border:1px solid #C8A766;">
<tr><td style="padding:24px;text-align:center;">
<p style="color:#1a1a1a;font-size:15px;font-weight:bold;margin:0 0 8px;">Don't Give Up!</p>
<p style="color:#555;font-size:13px;margin:0 0 16px;">New positions open regularly. Stay connected for future opportunities.</p>
<a href="https://jbjglobalrealestate.lovable.app/join" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Open Positions</a>
</td></tr></table>`,
    },
  };

  const normalizedStatus = req.status === 'pending' ? 'under_review' : req.status;
  const config = statusConfig[normalizedStatus] || statusConfig.submitted;

  const subjectMap: Record<string, string> = {
    submitted: `CV Received – ${name} | JBJ Global Real Estate`,
    under_review: `Your CV Is Under Review | JBJ Global Real Estate`,
    pending: `Your CV Is Under Review | JBJ Global Real Estate`,
    approved: `Congratulations! Application Approved | JBJ Global Real Estate`,
    rejected: `Application Update | JBJ Global Real Estate`,
  };

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;background-color:#F5EBD7;font-family:'Segoe UI',Arial,sans-serif;}
@media only screen and (max-width:620px){.wrapper{width:100%!important;padding:0 8px!important;}.hero-pad{padding:32px 20px!important;}.content-pad{padding:24px 16px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#F5EBD7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5EBD7;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#FFFFFF,#FDFBF7,#F5F0E6);border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(200,167,102,0.15);">

<!-- Logo -->
<tr><td style="background:#000000;padding:24px 0 16px;text-align:center;border-radius:20px 20px 0 0;">
<img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/jbj-monogram-dark.png?v=3" alt="JBJ Global Real Estate" width="120" style="max-width:120px;height:auto;" />
</td></tr>

<!-- Hero -->
<tr><td class="hero-pad" style="background:linear-gradient(135deg,#C8A766,#B8956E,#A07D4A);padding:40px 32px;text-align:center;">
<p style="font-size:28px;font-weight:bold;color:#1a1a1a;margin:0 0 8px;">JBJ Global Real Estate</p>
<p style="font-size:16px;color:#2d2d2d;margin:0 0 20px;font-weight:500;">Careers & Recruitment</p>
<table role="presentation" width="80%" cellpadding="0" cellspacing="0" border="0" align="center">
<tr><td style="height:3px;background:linear-gradient(90deg,transparent,#1a1a1a 20%,#1a1a1a 80%,transparent);border-radius:2px;"></td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
<tr>
<td style="text-align:center;padding:4px 8px;"><a href="mailto:careers@jbj.ae" style="color:#1a1a1a;text-decoration:none;font-size:13px;"><span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#1a1a1a;color:#C8A766;text-align:center;line-height:28px;font-size:14px;margin-bottom:4px;">&#9993;</span><br>careers@jbj.ae</a></td>
<td style="text-align:center;padding:4px 8px;"><a href="tel:+971565911000" style="color:#1a1a1a;text-decoration:none;font-size:13px;"><span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#1a1a1a;color:#C8A766;text-align:center;line-height:28px;font-size:14px;margin-bottom:4px;">&#9742;</span><br>+971 56 591 1000</a></td>
</tr></table>
</td></tr>

<!-- Content -->
<tr><td class="content-pad" style="padding:32px;">

<!-- Title Card -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:24px 20px;text-align:center;">
<p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a1a1a;">${config.title}</p>
<p style="margin:0;font-size:13px;color:#C8A766;font-weight:600;">Position: ${position}</p>
</td></tr></table>

<!-- Greeting -->
<p style="font-size:15px;color:#333;margin:0 0 16px;">Dear <strong>${name}</strong>,</p>
<p style="font-size:14px;color:#555;margin:0 0 24px;">${config.subtitle}</p>

<!-- Progress Tracker -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr>
${makeStep('1', 'Received', config.steps[0], config.stepChecks[0])}
${makeStep('2', 'Under Review', config.steps[1], config.stepChecks[1])}
${makeStep('3', 'Decision', config.steps[2], config.stepChecks[2])}
</tr></table>

<!-- Status Badge -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td style="text-align:center;">
<span style="display:inline-block;padding:8px 24px;border-radius:20px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;${
  normalizedStatus === 'approved' ? 'background:#dcfce7;color:#166534;border:1px solid #22c55e;' :
  normalizedStatus === 'rejected' ? 'background:#fef2f2;color:#991b1b;border:1px solid #ef4444;' :
  normalizedStatus === 'under_review' ? 'background:#fef3c7;color:#92400e;border:1px solid #f59e0b;' :
  'background:#dbeafe;color:#1e40af;border:1px solid #3b82f6;'
}">${
  normalizedStatus === 'approved' ? '✅ APPROVED' :
  normalizedStatus === 'rejected' ? 'NOT SELECTED' :
  normalizedStatus === 'under_review' ? '🔍 UNDER REVIEW' :
  '📩 APPLICATION RECEIVED'
}</span>
</td></tr></table>

${config.extraHtml}

<!-- CTA -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td style="text-align:center;">
<a href="https://jbjglobalrealestate.lovable.app/my-dashboard#notifications" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">View My Application Status</a>
</td></tr></table>

<!-- Warning -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border:1px solid #f59e0b;border-radius:10px;margin-bottom:24px;">
<tr><td style="padding:16px 20px;">
<p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;"><strong>&#9888;&#65039; Important:</strong> For inquiries about your application, contact us at <a href="mailto:HR@JBJ.AE" style="color:#C8A766;">HR@JBJ.AE</a> or reply to this email.</p>
</td></tr></table>

<!-- Review & Survey Section -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;border-top:2px solid #C8A76633;padding-top:20px;">
<tr><td align="center">
<p style="color:#C8A766;font-size:15px;font-weight:700;margin:0 0 6px;">★★★★★ Rate Your Experience</p>
<p style="color:#666;font-size:12px;margin:0 0 14px;">Leave a 5-star review and complete our quick 1-minute survey.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td style="padding:0 6px;"><a href="https://jbjglobalrealestate.lovable.app/reviews?source=career" style="display:inline-block;background:linear-gradient(135deg,#C8A766,#B8956E);color:#000;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:12px;">★★★★★ Leave 5-Star Review</a></td>
<td style="padding:0 6px;"><a href="https://jbjglobalrealestate.lovable.app/survey?source=career" style="display:inline-block;background:#1a1a2e;border:2px solid #C8A766;color:#C8A766;text-decoration:none;padding:8px 20px;border-radius:8px;font-weight:700;font-size:12px;white-space:nowrap;">Take Quick Survey (1 min)</a></td>
</tr>
</table>
</td></tr>
</table>

<p style="font-size:14px;color:#333;">Best regards,<br><span style="color:#C8A766;font-weight:600;">JBJ Global Real Estate HR Team</span></p>
</td></tr>

<!-- Footer -->
<tr><td style="background:linear-gradient(135deg,#1a1a1a,#2d2d2d);text-align:center;padding:24px;">
<p style="color:#C8A766;font-size:16px;font-weight:bold;margin:0 0 4px;">JBJ Global Real Estate</p>
<p style="color:#888;font-size:11px;margin:0 0 8px;font-style:italic;">The Only Global AI-Powered Real Estate Intelligence Platform</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:12px 0;">
<tr>
<td style="padding:0 6px;"><a href="https://www.instagram.com/jbj.ae" style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#333;text-align:center;line-height:32px;font-size:13px;color:#C8A766;text-decoration:none;font-weight:700;">IG</a></td>
<td style="padding:0 6px;"><a href="https://www.linkedin.com/company/jbj-global-real-estate/" style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#333;text-align:center;line-height:32px;font-size:13px;color:#C8A766;text-decoration:none;font-weight:700;">in</a></td>
<td style="padding:0 6px;"><a href="https://www.facebook.com/share/1G7CgSaV2L/?mibextid=wwXIfr" style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#333;text-align:center;line-height:32px;font-size:13px;color:#C8A766;text-decoration:none;font-weight:700;">f</a></td>
<td style="padding:0 6px;"><a href="https://youtube.com/@jbjglobalrealestate" style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#333;text-align:center;line-height:32px;font-size:13px;color:#C8A766;text-decoration:none;font-weight:700;">▶</a></td>
</tr></table>
<p style="color:#888;font-size:11px;margin:0;">&copy; 2026 JBJ Global Real Estate. All rights reserved.</p>
</td></tr>

</table></td></tr></table>
</body></html>`;

  return { html, subject: subjectMap[req.status] || 'CV Application Update | JBJ Global Real Estate' };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CVEmailRequest & { bulkSend?: boolean; targetStatus?: string } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Bulk send mode - send to all existing applicants with a certain status
    if (body.bulkSend) {
      const results: { sent: number; failed: number; errors: string[] } = { sent: 0, failed: 0, errors: [] };

      // Fetch all applications from both tables
      const [appsRes, subsRes] = await Promise.all([
        supabaseClient.from('hr_applications').select('id, full_name, email, status, user_id, department_category').order('created_at', { ascending: false }),
        supabaseClient.from('hr_cv_submissions').select('id, full_name, email, status, user_id, position_applied').order('created_at', { ascending: false }),
      ]);

      const allApps = [
        ...(appsRes.data || []).map((a: any) => ({ ...a, position: a.department_category, source: 'hr_applications' })),
        ...(subsRes.data || []).map((a: any) => ({ ...a, position: a.position_applied, source: 'hr_cv_submissions' })),
      ];

      for (const app of allApps) {
        if (!app.email) continue;
        const emailStatus = app.status === 'approved' ? 'approved' : app.status === 'rejected' ? 'rejected' : 'under_review';
        const { html, subject } = buildEmailHtml({
          email: app.email,
          fullName: app.full_name || 'Applicant',
          status: emailStatus,
          position: app.position,
          userId: app.user_id,
        });

        const result = await sendEmail({
          from: `JBJ Careers <${VERIFIED_SENDER}>`,
          to: [app.email],
          subject,
          html,
        });

        if (result.error) {
          results.failed++;
          results.errors.push(`${app.email}: ${JSON.stringify(result.error)}`);
        } else {
          results.sent++;
        }

        // Create notification for user
        if (app.user_id) {
          await supabaseClient.from('user_notifications').insert({
            user_id: app.user_id,
            type: 'cv_application',
            title: emailStatus === 'approved' ? 'Application Approved!' :
                   emailStatus === 'rejected' ? 'Application Update' :
                   'Your CV is Under Review',
            message: emailStatus === 'approved' ? 'Congratulations! Your application has been approved. We will contact you shortly.' :
                     emailStatus === 'rejected' ? 'Thank you for applying. After review, we\'ve decided to pursue other candidates at this time.' :
                     'Your CV is currently being reviewed by our HR team. You\'ll be notified once a decision is made.',
            is_read: false,
            metadata: { status: emailStatus, category: 'cv', action_url: '/my-dashboard#notifications' },
          });
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 200));
      }

      return new Response(JSON.stringify({ success: true, ...results }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single email mode
    if (!body.email || !body.fullName || !body.status) {
      return new Response(JSON.stringify({ error: "Missing email, fullName, or status" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { html, subject } = buildEmailHtml(body);

    const result = await sendEmail({
      from: `JBJ Careers <${VERIFIED_SENDER}>`,
      reply_to: "HR@JBJ.AE",
      to: [body.email],
      subject,
      html,
    } as any);

    if (result.error) {
      console.error("CV email failed:", result.error);
      return new Response(JSON.stringify({ error: "Email send failed", details: result.error }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user notification
    if (body.userId) {
      const normalizedBodyStatus = body.status === 'pending' ? 'under_review' : body.status;
      const notifTitle = normalizedBodyStatus === 'submitted' ? 'CV Application Received' :
                         normalizedBodyStatus === 'under_review' ? 'Your CV is Under Review' :
                         normalizedBodyStatus === 'approved' ? 'Application Approved!' :
                         'Application Update';
      const notifMessage = normalizedBodyStatus === 'submitted' ? 'Your CV has been received. Our HR team will review your profile shortly.' :
                           normalizedBodyStatus === 'under_review' ? 'Your CV is currently being reviewed by our HR team.' :
                           normalizedBodyStatus === 'approved' ? 'Congratulations! Your application has been approved.' :
                           'Thank you for applying. We\'ve decided to pursue other candidates at this time.';

      await supabaseClient.from('user_notifications').insert({
        user_id: body.userId,
        type: 'cv_application',
        title: notifTitle,
        message: notifMessage,
        is_read: false,
        metadata: { status: body.status, category: 'cv', action_url: '/my-dashboard#notifications' },
      });
    }

    console.log(`CV status email sent to ${body.email} -> ${body.status}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in send-cv-status-email:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
