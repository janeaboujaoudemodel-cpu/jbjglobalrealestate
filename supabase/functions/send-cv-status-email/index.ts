import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SITE_URL, emailShell, monogramBadge, inquiryBox, recommendedActionsHtml, suggestedActionsHtml, ticketSupportEmbed, feedbackHtml, progressSteps, arabicDivider } from "../_shared/email-html.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const VERIFIED_SENDER = 'contact@jbj.ae';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(payload: { from: string; to: string[]; subject: string; html: string; reply_to?: string }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) { console.error("Resend API error:", JSON.stringify(data)); return { error: data }; }
  return { data };
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
}

interface CVEmailRequest {
  email: string;
  fullName: string;
  status: 'submitted' | 'under_review' | 'pending' | 'approved' | 'rejected';
  position?: string;
  userId?: string;
  adminNote?: string;
}

function isLikelyAbbreviatedName(name: string): boolean {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  return parts[parts.length - 1].length <= 2;
}

async function resolveRecipientName(supabaseClient: any, rawName: string | null | undefined, email: string, userId?: string): Promise<string> {
  const fallback = (rawName || '').trim() || 'Applicant';
  if (fallback !== 'Applicant' && !isLikelyAbbreviatedName(fallback)) return fallback;
  try {
    if (userId) {
      const { data: byId } = await supabaseClient.auth.admin.getUserById(userId);
      const fullById = (byId?.user?.user_metadata as any)?.full_name || (byId?.user?.user_metadata as any)?.name;
      if (fullById && !isLikelyAbbreviatedName(fullById)) return String(fullById).trim();
    }
    const { data: listed } = await supabaseClient.auth.admin.listUsers({ perPage: 1000 });
    const match = listed?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    const fullByEmail = (match?.user_metadata as any)?.full_name || (match?.user_metadata as any)?.name;
    if (fullByEmail && !isLikelyAbbreviatedName(fullByEmail)) return String(fullByEmail).trim();
  } catch (e) { console.warn('Name resolution warning:', e); }
  return fallback;
}

function buildEmailHtml(req: CVEmailRequest): { html: string; subject: string } {
  const name = escapeHtml(req.fullName);
  const position = escapeHtml(req.position) || 'General Application';
  const adminNote = escapeHtml(req.adminNote);

  const statusConfig: Record<string, { title: string; titleAr: string; subtitle: string; subtitleAr: string; steps: [boolean, boolean, boolean]; stepChecks: [boolean, boolean, boolean]; extraHtml: string; extraHtmlAr: string }> = {
    submitted: {
      title: "CV Application Received", titleAr: "تم استلام طلب التوظيف",
      subtitle: "Thank you for your interest in joining JBJ Global Real Estate. We've received your application and our HR team will begin reviewing your profile shortly.",
      subtitleAr: "شكراً لاهتمامك بالانضمام إلى JBJ Global Real Estate. لقد استلمنا طلبك وسيبدأ فريق الموارد البشرية بمراجعة ملفك قريباً.",
      steps: [true, false, false], stepChecks: [true, false, false],
      extraHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border-radius:10px;margin-bottom:24px;border:1px solid #C8A766;">
<tr><td style="padding:24px;">
<p style="font-weight:bold;color:#1a1a1a;margin:0 0 12px;font-size:15px;">What happens next?</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:4px 0;font-size:13px;color:#555;">&#8226; Our HR team will review your CV within <strong>3-5 business days</strong></td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#555;">&#8226; You'll receive email updates as your application progresses</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#555;">&#8226; You will also receive notifications in your account (Notifications, Tasks, or Inbox)</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#555;">&#8226; Qualified candidates will be contacted for an interview</td></tr>
</table></td></tr></table>`,
      extraHtmlAr: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border-radius:10px;margin-bottom:24px;border:1px solid #C8A766;">
<tr><td style="padding:24px;direction:rtl;text-align:right;">
<p style="font-weight:bold;color:#1a1a1a;margin:0 0 12px;font-size:15px;">ماذا يحدث بعد ذلك؟</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="direction:rtl;">
<tr><td style="padding:4px 0;font-size:13px;color:#555;text-align:right;">&#8226; سيقوم فريق الموارد البشرية بمراجعة سيرتك الذاتية خلال <strong>٣-٥ أيام عمل</strong></td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#555;text-align:right;">&#8226; ستتلقى تحديثات عبر البريد الإلكتروني مع تقدم طلبك</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#555;text-align:right;">&#8226; ستتلقى أيضاً إشعارات في حسابك</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#555;text-align:right;">&#8226; سيتم التواصل مع المرشحين المؤهلين لإجراء مقابلة</td></tr>
</table></td></tr></table>`,
    },
    under_review: {
      title: "Your CV Is Under Review", titleAr: "سيرتك الذاتية قيد المراجعة",
      subtitle: "Great news! Our HR team is now actively reviewing your application. We'll be in touch soon with an update.",
      subtitleAr: "أخبار رائعة! يقوم فريق الموارد البشرية الآن بمراجعة طلبك بشكل فعّال. سنتواصل معك قريباً بتحديث.",
      steps: [true, true, false], stepChecks: [true, true, false],
      extraHtml: adminNote ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;"><tr><td style="padding:20px;"><p style="font-weight:bold;color:#1a1a1a;margin:0 0 8px;">HR Team Note:</p><p style="color:#555;margin:0;">${adminNote}</p></td></tr></table>` : '',
      extraHtmlAr: adminNote ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;"><tr><td style="padding:20px;direction:rtl;text-align:right;"><p style="font-weight:bold;color:#1a1a1a;margin:0 0 8px;">ملاحظة فريق الموارد البشرية:</p><p style="color:#555;margin:0;">${adminNote}</p></td></tr></table>` : '',
    },
    approved: {
      title: "Congratulations! Your Application Has Been Approved", titleAr: "تهانينا! تمت الموافقة على طلبك",
      subtitle: "We're excited to inform you that your application has been approved. Please find below the details regarding the next steps.",
      subtitleAr: "يسعدنا إبلاغك بأنه تمت الموافقة على طلبك. يرجى الاطلاع أدناه على تفاصيل الخطوات التالية.",
      steps: [true, true, true], stepChecks: [true, true, true],
      extraHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #22c55e;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:24px;">
<p style="color:#166534;font-size:16px;font-weight:bold;margin:0 0 12px;text-align:center;">Welcome Aboard!</p>
<p style="color:#15803d;font-size:13px;margin:0 0 16px;text-align:center;">Our HR team will contact you within 48 hours to discuss interview scheduling and next steps.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #22c55e40;border-radius:10px;">
<tr><td style="padding:16px 20px;">
<p style="margin:0;font-size:13px;color:#555;line-height:1.6;">You have also received a notification in your account. You can access updates from your <strong>Account Notifications</strong>, <strong>Tasks</strong>, or <strong>Inbox</strong>.</p>
</td></tr></table></td></tr></table>`,
      extraHtmlAr: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #22c55e;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:24px;direction:rtl;text-align:right;">
<p style="color:#166534;font-size:16px;font-weight:bold;margin:0 0 12px;text-align:center;">مرحباً بك معنا!</p>
<p style="color:#15803d;font-size:13px;margin:0 0 16px;text-align:center;">سيتواصل معك فريق الموارد البشرية خلال ٤٨ ساعة.</p>
</td></tr></table>`,
    },
    rejected: {
      title: "Application Update", titleAr: "تحديث الطلب",
      subtitle: "Thank you for your interest in JBJ Global Real Estate. After careful review, we've decided to pursue other candidates at this time. We appreciate your effort and encourage you to apply for future openings.",
      subtitleAr: "شكراً لاهتمامك بـ JBJ Global Real Estate. بعد مراجعة دقيقة، قررنا متابعة مرشحين آخرين في الوقت الحالي.",
      steps: [true, true, true], stepChecks: [true, true, false],
      extraHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border-radius:10px;margin-bottom:24px;border:1px solid #C8A766;">
<tr><td style="padding:24px;text-align:center;">
<p style="color:#1a1a1a;font-size:15px;font-weight:bold;margin:0 0 8px;">Don't Give Up!</p>
<p style="color:#555;font-size:13px;margin:0 0 16px;">New positions open regularly. Stay connected for future opportunities.</p>
<a href="${SITE_URL}/join" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Open Positions</a>
</td></tr></table>`,
      extraHtmlAr: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border-radius:10px;margin-bottom:24px;border:1px solid #C8A766;">
<tr><td style="padding:24px;text-align:center;direction:rtl;">
<p style="color:#1a1a1a;font-size:15px;font-weight:bold;margin:0 0 8px;">لا تستسلم!</p>
<p style="color:#555;font-size:13px;margin:0 0 16px;">تُفتح وظائف جديدة بانتظام.</p>
<a href="${SITE_URL}/join" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">عرض الوظائف المتاحة</a>
</td></tr></table>`,
    },
  };

  const normalizedStatus = req.status === 'pending' ? 'under_review' : req.status;
  const config = statusConfig[normalizedStatus] || statusConfig.submitted;
  const statusBadgeStyle = normalizedStatus === 'approved' ? 'background:#dcfce7;color:#166534;border:1px solid #22c55e;' :
    normalizedStatus === 'rejected' ? 'background:#fef2f2;color:#991b1b;border:1px solid #ef4444;' :
    normalizedStatus === 'under_review' ? 'background:#fef3c7;color:#92400e;border:1px solid #f59e0b;' :
    'background:#dbeafe;color:#1e40af;border:1px solid #3b82f6;';
  const statusBadgeText = normalizedStatus === 'approved' ? 'APPROVED' : normalizedStatus === 'rejected' ? 'NOT SELECTED' : normalizedStatus === 'under_review' ? 'UNDER REVIEW' : 'APPLICATION RECEIVED';

  const subjectMap: Record<string, string> = {
    submitted: `CV Received – ${name} | JBJ Global Real Estate`,
    under_review: `Your CV Is Under Review | JBJ Global Real Estate`,
    pending: `Your CV Is Under Review | JBJ Global Real Estate`,
    approved: `Congratulations! Application Approved | JBJ Global Real Estate`,
    rejected: `Application Update | JBJ Global Real Estate`,
  };

  const bodyContent = `
<!-- ENGLISH CONTENT -->
<tr><td class="content-pad" style="padding:32px;">

<!-- Title Card -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:24px 20px;text-align:center;">
<p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a1a1a;">${config.title}</p>
<p style="margin:0;font-size:13px;color:#C8A766;font-weight:600;">Position: ${position}</p>
</td></tr></table>

<!-- Greeting -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
<tr>
<td width="52" style="vertical-align:top;padding-right:14px;">
${monogramBadge(48)}
</td>
<td style="vertical-align:middle;">
<p style="margin:0;font-size:15px;color:#333;">Dear <strong>${name}</strong>,</p>
</td></tr></table>
<p style="font-size:14px;color:#555;margin:0 0 24px;">${config.subtitle}</p>

<!-- Progress Tracker -->
${progressSteps(['Received', 'Under Review', 'Decision'], config.steps, config.stepChecks)}

<!-- Status Badge -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td style="text-align:center;">
<span style="display:inline-block;padding:8px 24px;border-radius:20px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;${statusBadgeStyle}">${statusBadgeText}</span>
</td></tr></table>

${config.extraHtml}

<!-- CTA -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td style="text-align:center;">
<a href="${SITE_URL}/my-account" style="display:inline-block;padding:14px 32px;background:#000;color:#C8A766;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;border:1px solid #C8A76650;">View My Application Status</a>
</td></tr></table>

${inquiryBox("career application")}

${ticketSupportEmbed()}

${recommendedActionsHtml()}

${suggestedActionsHtml()}

${feedbackHtml("career")}

<p style="font-size:14px;color:#333;margin-top:24px;">Best regards,<br><span style="color:#C8A766;font-weight:600;">JBJ Global Real Estate HR Team</span></p>
</td></tr>

<!-- ========== ARABIC VERSION ========== -->
${arabicDivider()}
<tr><td class="content-pad" style="padding:32px;direction:rtl;text-align:right;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:24px 20px;text-align:center;">
<p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a1a1a;">${config.titleAr}</p>
<p style="margin:0;font-size:13px;color:#C8A766;font-weight:600;">الوظيفة: ${position}</p>
</td></tr></table>

<p style="margin:0;font-size:15px;color:#333;">عزيزي/عزيزتي <strong>${name}</strong>،</p>
<p style="font-size:14px;color:#555;margin:12px 0 24px;">${config.subtitleAr}</p>

${progressSteps(['مُستلم', 'قيد المراجعة', 'القرار'], config.steps, config.stepChecks)}

${config.extraHtmlAr}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td style="text-align:center;">
<a href="${SITE_URL}/my-account" style="display:inline-block;padding:14px 32px;background:#000;color:#C8A766;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;border:1px solid #C8A76650;">عرض حالة طلبي</a>
</td></tr></table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #22c55e40;border-radius:10px;margin-bottom:24px;">
<tr><td style="padding:14px 20px;text-align:center;">
<p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">للاستفسار حول طلبك، يمكنك التواصل مع <a href="mailto:CONTACT@JBJ.AE" style="color:#15803d;font-weight:700;text-decoration:underline;">CONTACT@JBJ.AE</a></p>
</td></tr></table>

<p style="font-size:14px;color:#333;margin-top:24px;text-align:right;">مع أطيب التحيات،<br><span style="color:#C8A766;font-weight:600;">فريق الموارد البشرية - JBJ Global Real Estate</span></p>
</td></tr>`;

  const html = emailShell("Careers & Recruitment", bodyContent);
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

    if (body.bulkSend) {
      const results: { sent: number; failed: number; errors: string[] } = { sent: 0, failed: 0, errors: [] };
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
        const recipientName = await resolveRecipientName(supabaseClient, app.full_name, app.email, app.user_id);
        const { html, subject } = buildEmailHtml({ ...app, fullName: recipientName });
        const result = await sendEmail({ from: `JBJ Careers <${VERIFIED_SENDER}>`, to: [app.email], subject, html, reply_to: "CONTACT@JBJ.AE" });
        if (result.error) { results.failed++; results.errors.push(`${app.email}: ${JSON.stringify(result.error)}`); } else { results.sent++; }
        if (app.user_id) {
          await supabaseClient.from('user_notifications').insert({ user_id: app.user_id, type: 'cv_application', title: 'CV Application Update', message: `Your CV application status has been updated.`, is_read: false, metadata: { status: app.status, category: 'cv', action_url: '/my-account' } });
        }
        await new Promise(r => setTimeout(r, 200));
      }
      return new Response(JSON.stringify({ success: true, ...results }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!body.email || !body.status) {
      return new Response(JSON.stringify({ error: "Missing email or status" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const recipientName = await resolveRecipientName(supabaseClient, body.fullName, body.email, body.userId);
    const { html, subject } = buildEmailHtml({ ...body, fullName: recipientName });
    const result = await sendEmail({ from: `JBJ Careers <${VERIFIED_SENDER}>`, to: [body.email], subject, html, reply_to: "CONTACT@JBJ.AE" });

    if (result.error) {
      console.error("CV email failed:", result.error);
      return new Response(JSON.stringify({ error: "Email send failed", details: result.error }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.userId) {
      const normalizedBodyStatus = body.status === 'pending' ? 'under_review' : body.status;
      const notifTitle = normalizedBodyStatus === 'submitted' ? 'CV Application Received' : normalizedBodyStatus === 'under_review' ? 'Your CV is Under Review' : normalizedBodyStatus === 'approved' ? 'Application Approved!' : 'Application Update';
      const notifMessage = normalizedBodyStatus === 'submitted' ? 'Your CV has been received. Our HR team will review your profile shortly.' : normalizedBodyStatus === 'under_review' ? 'Your CV is currently being reviewed by our HR team.' : normalizedBodyStatus === 'approved' ? 'Congratulations! Your application has been approved.' : 'Thank you for applying. We\'ve decided to pursue other candidates at this time.';
      await supabaseClient.from('user_notifications').insert({ user_id: body.userId, type: 'cv_application', title: notifTitle, message: notifMessage, is_read: false, metadata: { status: body.status, category: 'cv', action_url: '/my-account' } });
    }

    console.log(`CV status email sent to ${body.email} -> ${body.status}`);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Error in send-cv-status-email:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
