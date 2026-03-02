import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = "https://jbj.ae";
const LOGO_URL = "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/jbj-monogram-dark.png?v=3";

const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed =>
    origin === allowed ||
    origin.endsWith(".lovableproject.com") ||
    origin.endsWith(".lovable.app")
  );
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const RequestSchema = z.object({
  userId: z.string().uuid().optional(),
  email: z.string().email().max(255),
  fullName: z.string().max(200).optional(),
  userRole: z.enum(["broker", "investor", "visitor"]).optional(),
});

/* ── Benefit row — icon character only, NO border box ── */
function benefitRow(icon: string, iconColor: string, title: string, desc: string): string {
  return `<tr><td style="padding:8px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
  <td style="width:32px;min-width:32px;vertical-align:top;padding-top:2px;font-size:20px;line-height:1;text-align:center;color:${iconColor};">${icon}</td>
  <td style="padding-left:12px;"><strong style="color:#1a1a1a;font-size:14px;">${title}</strong>
  <p style="color:#666;margin:2px 0 0;font-size:13px;line-height:1.4;">${desc}</p></td>
  </tr></table>
</td></tr>`;
}

/* ── Inquiry contact box (green border) ── */
function inquiryBox(contextLabel: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
<tr><td style="padding:18px 24px;background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;text-align:center;">
<p style="margin:0;font-size:15px;color:#333;line-height:1.6;">For inquiries about your ${contextLabel}, you can reply<br/>directly to <a href="mailto:contact@jbj.ae" style="color:#1a1a1a;font-weight:700;text-decoration:none;">contact@jbj.ae</a></p>
</td></tr>
</table>`;
}

/* ── Recommended For You — with visible icons ── */
function recommendedActionsHtml(): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border-top:2px solid #C8A76633;padding-top:20px;">
<tr><td style="text-align:center;">
<p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 14px;">Recommended For You</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="33%" style="text-align:center;padding:4px;">
<a href="${SITE_URL}/ai-tools" style="display:block;padding:16px 8px;background:#fff;border:2px solid #C8A766;border-radius:12px;text-decoration:none;">
<div style="font-size:36px;line-height:1;">&#9881;</div>
<p style="margin:8px 0 0;font-size:12px;color:#1a1a1a;font-weight:700;">AI Tools</p>
</a>
</td>
<td width="33%" style="text-align:center;padding:4px;">
<a href="${SITE_URL}/guides" style="display:block;padding:16px 8px;background:#fff;border:2px solid #C8A766;border-radius:12px;text-decoration:none;">
<div style="font-size:36px;line-height:1;">&#128218;</div>
<p style="margin:8px 0 0;font-size:12px;color:#1a1a1a;font-weight:700;">Guides</p>
</a>
</td>
<td width="33%" style="text-align:center;padding:4px;">
<a href="${SITE_URL}/properties" style="display:block;padding:16px 8px;background:#fff;border:2px solid #C8A766;border-radius:12px;text-decoration:none;">
<div style="font-size:36px;line-height:1;">&#127968;</div>
<p style="margin:8px 0 0;font-size:12px;color:#1a1a1a;font-weight:700;">Properties</p>
</a>
</td>
</tr>
</table>
</td></tr>
</table>`;
}

/* ── Feedback section ── */
function feedbackHtml(): string {
  const reviewUrl = `${SITE_URL}/reviews?source=email`;
  const surveyUrl = `${SITE_URL}/ticket-survey?source=email`;
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #C8A76633;padding-top:20px;margin-top:4px;">
<tr><td align="center">
<p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 4px;">We Value Your Feedback</p>
<p style="color:#888;font-size:13px;margin:0 0 16px;">Help us improve by sharing your experience</p>
<table cellpadding="0" cellspacing="0" align="center">
<tr>
<td style="padding:0 6px;"><a href="${reviewUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:13px;border:1px solid #C8A76650;">Leave a Review</a></td>
<td style="padding:0 6px;"><a href="${surveyUrl}" style="display:inline-block;background:#FDFBF7;border:2px solid #C8A766;color:#1a1a1a;text-decoration:none;padding:10px 28px;border-radius:8px;font-weight:700;font-size:13px;">Take Survey</a></td>
</tr>
</table>
</td></tr>
</table>`;
}

function sharedHeader(departmentLabel: string): string {
  return `
<!-- Header — Black with centered monogram + wordmark -->
<tr><td style="background:#000000;padding:24px 40px 20px;text-align:center;border-radius:24px 24px 0 0;">
<img src="${LOGO_URL}" alt="JBJ Global Real Estate" width="180" style="max-width:180px;height:auto;display:block;margin:0 auto 12px;" />
<p style="color:#C8A766;margin:0;font-size:14px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</p>
</td></tr>
<!-- Sub-header band -->
<tr><td style="background:linear-gradient(135deg,#C8A766,#B8956E,#A07D4A);padding:20px 32px;text-align:center;">
<p style="font-size:18px;font-weight:bold;color:#fff;margin:0 0 4px;">${departmentLabel}</p>
<table role="presentation" width="60%" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:8px;">
<tr><td style="height:2px;background:rgba(255,255,255,0.4);border-radius:2px;"></td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">
<tr>
<td style="text-align:center;padding:4px 8px;"><a href="mailto:contact@jbj.ae" style="color:#fff;text-decoration:underline;font-size:12px;">contact@jbj.ae</a></td>
<td style="text-align:center;padding:4px 8px;"><a href="tel:+971565911000" style="color:#fff;text-decoration:none;font-size:12px;">+971 56 591 1000</a></td>
</tr></table>
</td></tr>`;
}

function sharedFooterHtml(): string {
  return `
<!-- Do not reply notice -->
<tr><td style="padding:0 32px 16px;text-align:center;">
<p style="margin:0;font-size:11px;color:#999;line-height:1.5;">This is an automated message. Please do not reply directly to this email.<br/>For any inquiries, contact us at <a href="mailto:contact@jbj.ae" style="color:#C8A766;text-decoration:underline;font-weight:600;">contact@jbj.ae</a></p>
</td></tr>
<!-- Footer -->
<tr><td style="background:#000000;padding:30px 40px;text-align:center;border-radius:0 0 20px 20px;">
<p style="color:#C8A766;font-size:14px;margin:0 0 14px;">Need assistance? We're here to help.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td align="center">
<a href="tel:+971565911000" style="color:#ffffff;text-decoration:none;font-size:13px;">+971 56 591 1000</a>
<span style="color:#444;margin:0 12px;">|</span>
<a href="mailto:Contact@JBJ.ae" style="color:#ffffff;text-decoration:underline;font-size:13px;">Contact@JBJ.ae</a>
</td></tr>
</table>
<p style="color:#C8A766;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Follow Us &middot; Stay in the Loop</p>
<table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:14px;">
<tr>
<td style="padding:0 4px;"><a href="https://www.instagram.com/jbj.ae" style="display:inline-block;padding:8px 14px;background:linear-gradient(135deg,#FDFBF7,#F5EBD7);border:1px solid #C8A766;border-radius:6px;color:#1a1a1a;text-decoration:none;font-size:11px;font-weight:600;">Instagram</a></td>
<td style="padding:0 4px;"><a href="https://www.facebook.com/share/1G7CgSaV2L/" style="display:inline-block;padding:8px 14px;background:linear-gradient(135deg,#FDFBF7,#F5EBD7);border:1px solid #C8A766;border-radius:6px;color:#1a1a1a;text-decoration:none;font-size:11px;font-weight:600;">Facebook</a></td>
<td style="padding:0 4px;"><a href="https://www.linkedin.com/company/jbj-global-real-estate/" style="display:inline-block;padding:8px 14px;background:linear-gradient(135deg,#FDFBF7,#F5EBD7);border:1px solid #C8A766;border-radius:6px;color:#1a1a1a;text-decoration:none;font-size:11px;font-weight:600;">LinkedIn</a></td>
<td style="padding:0 4px;"><a href="https://youtube.com/@jbjglobalrealestate" style="display:inline-block;padding:8px 14px;background:linear-gradient(135deg,#FDFBF7,#F5EBD7);border:1px solid #C8A766;border-radius:6px;color:#1a1a1a;text-decoration:none;font-size:11px;font-weight:600;">YouTube</a></td>
</tr>
</table>
<table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:16px;">
<tr><td style="padding:0 4px;"><a href="mailto:contact@jbj.ae" style="display:inline-block;padding:8px 14px;background:linear-gradient(135deg,#FDFBF7,#F5EBD7);border:1px solid #C8A766;border-radius:6px;color:#1a1a1a;text-decoration:none;font-size:11px;font-weight:600;">contact@jbj.ae</a></td></tr>
</table>
<p style="color:#C8A766;font-size:13px;margin:0 0 4px;font-weight:600;">JBJ Global Real Estate</p>
<p style="color:#777;font-size:11px;margin:0 0 8px;">First Global Real Estate Platform of Its Kind</p>
<p style="color:#888;font-size:10px;margin:0 0 12px;white-space:nowrap;">
Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span>
</p>
<p style="color:#C8A766;font-size:11px;margin:12px 0 0;font-weight:600;">
&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.
</p>
</td></tr>`;
}

function emailShell(departmentLabel: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;background-color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;}
@media only screen and (max-width:620px){.wrapper{width:100%!important;padding:0 8px!important;}.content-pad{padding:24px 16px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#F5F0E6;border-radius:24px;overflow:hidden;">
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(180deg,#FFFFFF,#FDFBF7,#F5F0E6);border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(200,167,102,0.18);">
${sharedHeader(departmentLabel)}
${bodyContent}
${sharedFooterHtml()}
</table>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

function buildWelcomeHtml(displayName: string, email: string, role: string, ctaText: string, ctaUrl: string, benefitsHtml: string): string {
  const arabicGreeting = role === 'broker' ? 'مرحباً بك في دائرة وسطاء JBJ!' : role === 'investor' ? 'مرحباً بك في JBJ — رحلتك الاستثمارية تبدأ!' : 'مرحباً بك في JBJ Global Real Estate!';

  const bodyContent = `
<!-- Content -->
<tr><td class="content-pad" style="padding:32px;">

<!-- Welcome Headline -->
<p style="margin:0 0 6px;font-size:28px;font-weight:800;color:#1a1a1a;line-height:1.2;">Thank You for Joining Us, ${displayName}</p>
<p style="margin:0 0 24px;font-size:18px;color:#C8A766;font-weight:600;line-height:1.3;">Your JBJ account is ready — we're thrilled to have you.</p>

<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
You have successfully created your account with <strong>JBJ Global Real Estate</strong>. As a valued member, you now have access to our full suite of services and tools.
</p>

<!-- Account Details -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="padding:18px 22px;background:linear-gradient(135deg,#F5EBD7 0%,#FDFBF7 100%);border-radius:12px;border:1px solid #C8A766;">
<p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 10px;">Your Account Details</p>
<p style="color:#555;font-size:13px;margin:0;"><strong>Registered Email:</strong> ${email}</p>
</td></tr>
</table>

<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
As a Dubai-based real estate brokerage, we specialize in connecting clients with exceptional properties across the UAE.
</p>

<!-- Benefits — icon only, no border boxes -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
${benefitsHtml}
</table>

<!-- CTA -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:0 0 28px;">
<a href="${ctaUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 40px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.5px;border:1px solid #C8A76650;">
${ctaText}
</a>
</td></tr>
</table>

${inquiryBox("account")}

${recommendedActionsHtml()}

${feedbackHtml()}

<p style="font-size:14px;color:#333;margin-top:24px;">Best regards,<br><span style="color:#C8A766;font-weight:600;">JBJ Global Real Estate Team</span></p>
</td></tr>

<!-- ═══ Arabic Content ═══ -->
<tr><td style="padding:24px 32px 0;text-align:center;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:2px solid #C8A76650;"></td></tr></table>
</td></tr>
<tr><td class="content-pad" style="padding:32px;direction:rtl;text-align:right;">

<p style="margin:0;font-size:28px;font-weight:800;color:#1a1a1a;line-height:1.2;">${arabicGreeting}</p>
<p style="margin:8px 0 0;font-size:18px;color:#C8A766;font-weight:600;">حسابك في JBJ جاهز — يسعدنا انضمامك إلينا.</p>

<p style="color:#555;font-size:15px;line-height:1.6;margin:16px 0 20px;">
لقد قمت بإنشاء حسابك بنجاح مع <strong>JBJ Global Real Estate</strong>. بصفتك عضواً مميزاً، يمكنك الآن الوصول إلى جميع خدماتنا وأدواتنا.
</p>

<!-- Arabic Account Details -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="padding:18px 22px;background:linear-gradient(135deg,#F5EBD7 0%,#FDFBF7 100%);border-radius:12px;border:1px solid #C8A766;">
<p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 10px;">تفاصيل حسابك</p>
<p style="color:#555;font-size:13px;margin:0;"><strong>البريد الإلكتروني المسجل:</strong> ${email}</p>
</td></tr>
</table>

<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
بصفتنا شركة وساطة عقارية مقرها دبي، نحن متخصصون في ربط العملاء بأفضل العقارات في جميع أنحاء الإمارات.
</p>

<!-- Arabic CTA -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:0 0 28px;">
<a href="${ctaUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 40px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.5px;border:1px solid #C8A76650;">
ابدأ التصفح
</a>
</td></tr>
</table>

<p style="font-size:14px;color:#333;margin-top:24px;text-align:right;">مع أطيب التحيات،<br><span style="color:#C8A766;font-weight:600;">فريق JBJ Global Real Estate</span></p>
</td></tr>`;

  return emailShell("Welcome to JBJ Global Real Estate", bodyContent);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      const isInternalCall = req.headers.get('x-supabase-webhook') === 'true';
      if (!isInternalCall) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, email, fullName, userRole } = parseResult.data;
    const displayName = fullName || email.split('@')[0];
    const role = userRole || "visitor";

    const subjectByRole: Record<string, string> = {
      broker: "Welcome to the JBJ Broker Circle!",
      investor: "Welcome to JBJ Global Real Estate — Your Investment Journey Begins!",
      visitor: "Welcome to JBJ Global Real Estate!",
    };

    const ctaByRole: Record<string, { text: string; url: string }> = {
      broker: { text: "Access Broker Toolkit", url: `${SITE_URL}/broker-toolkit` },
      investor: { text: "Explore Properties", url: `${SITE_URL}/properties` },
      visitor: { text: "Start Browsing", url: `${SITE_URL}/properties` },
    };

    // Benefits with Unicode icons that render in all email clients
    const benefitsByRole: Record<string, string> = {
      broker:
        benefitRow('&#9881;', '#1a1a1a', 'Free AI Tools', 'Unlimited access to property analysis, market reports, and smart recommendations.') +
        benefitRow('&#127891;', '#1a1a1a', 'Free Training Academy', 'Complete courses and videos to boost your real estate career.') +
        benefitRow('&#128101;', '#1a1a1a', 'Dedicated HR Manager & Personal Assistant', 'Jessica and our team provide dedicated support for all your inquiries.') +
        benefitRow('&#127915;', '#dc2626', 'Support Tickets & Events', 'Submit tickets for any query and join exclusive company events and webinars.'),
      investor:
        benefitRow('&#127970;', '#1a1a1a', 'Premium Properties', 'Browse exclusive listings across Dubai and the UAE.') +
        benefitRow('&#9881;', '#1a1a1a', 'AI Property Analysis', 'Smart insights and ROI calculations for better investment decisions.') +
        benefitRow('&#127915;', '#dc2626', 'Support Tickets & Events', 'Submit tickets for any query and join exclusive company events.'),
      visitor:
        benefitRow('&#127970;', '#1a1a1a', 'Browse Premium Properties', 'Explore our curated selection of UAE properties across all emirates.') +
        benefitRow('&#10084;', '#1a1a1a', 'Save Your Favorites', 'Shortlist properties you love and access them anytime from your dashboard.') +
        benefitRow('&#128222;', '#16a34a', 'Expert Support 24/7', 'Our dedicated team is ready to assist with any property inquiry.') +
        benefitRow('&#127915;', '#dc2626', 'Support Tickets & Events', 'Submit tickets, get help, and stay updated on company events.'),
    };

    const cta = ctaByRole[role] || ctaByRole.visitor;
    const emailHtml = buildWelcomeHtml(displayName, email, role, cta.text, cta.url, benefitsByRole[role] || benefitsByRole.visitor);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "JBJ Global Real Estate <contact@jbj.ae>",
        reply_to: "contact@jbj.ae",
        to: [email],
        subject: subjectByRole[role] || subjectByRole.visitor,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error('Failed to send email via Resend');
    }

    const emailResult = await emailResponse.json();
    console.log("Welcome email sent successfully:", emailResult);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('leads').upsert({
      email,
      full_name: fullName,
      source: 'signup_welcome_email',
    }, { onConflict: 'email' });

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: 'Failed to send welcome email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
