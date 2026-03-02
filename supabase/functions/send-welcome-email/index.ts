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

function sharedHeader(departmentLabel: string): string {
  return `
<!-- Header — Black with large monogram -->
<tr><td style="background:#000000;padding:30px 40px;text-align:center;border-radius:24px 24px 0 0;">
<img src="${LOGO_URL}" alt="JBJ Global Real Estate" width="180" style="max-width:180px;height:auto;display:block;margin:0 auto 14px;" />
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

function recommendedActionsHtml(): string {
  return `
<!-- Recommended Actions -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border-top:2px solid #C8A76633;padding-top:20px;">
<tr><td style="text-align:center;">
<p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 12px;">Recommended For You</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="33%" style="text-align:center;padding:4px;">
<a href="${SITE_URL}/ai-tools" style="display:block;padding:14px 8px;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:10px;text-decoration:none;">
<p style="margin:0 0 4px;font-size:20px;">&#9881;</p>
<p style="margin:0;font-size:11px;color:#1a1a1a;font-weight:600;">AI Tools</p>
</a>
</td>
<td width="33%" style="text-align:center;padding:4px;">
<a href="${SITE_URL}/guides" style="display:block;padding:14px 8px;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:10px;text-decoration:none;">
<p style="margin:0 0 4px;font-size:20px;">&#128218;</p>
<p style="margin:0;font-size:11px;color:#1a1a1a;font-weight:600;">Guides</p>
</a>
</td>
<td width="33%" style="text-align:center;padding:4px;">
<a href="${SITE_URL}/properties" style="display:block;padding:14px 8px;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:10px;text-decoration:none;">
<p style="margin:0 0 4px;font-size:20px;">&#127969;</p>
<p style="margin:0;font-size:11px;color:#1a1a1a;font-weight:600;">Properties</p>
</a>
</td>
</tr>
</table>
</td></tr>
</table>`;
}

function sharedFooterHtml(): string {
  return `
<!-- Do not reply notice -->
<tr><td style="padding:0 32px 16px;text-align:center;">
<p style="margin:0;font-size:11px;color:#999;line-height:1.5;">This is an automated message. Please do not reply directly to this email.<br/>For any inquiries, contact us at <a href="mailto:contact@jbj.ae" style="color:#C8A766;text-decoration:underline;font-weight:600;">contact@jbj.ae</a></p>
</td></tr>
<!-- Footer -->
<tr><td style="background:#000000;padding:32px 40px;text-align:center;border-radius:0 0 20px 20px;">
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
<tr><td style="padding:0 4px;"><a href="mailto:contact@jbj.ae" style="display:inline-block;padding:8px 14px;background:linear-gradient(135deg,#FDFBF7,#F5EBD7);border:1px solid #C8A766;border-radius:6px;color:#1a1a1a;text-decoration:none;font-size:11px;font-weight:600;">&#9993; contact@jbj.ae</a></td></tr>
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
<style>body{margin:0;padding:0;background-color:#F5F0E6;font-family:'Segoe UI',Arial,sans-serif;}
@media only screen and (max-width:620px){.wrapper{width:100%!important;padding:0 8px!important;}.content-pad{padding:24px 16px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E6;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#FFFFFF,#FDFBF7,#F5F0E6);border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(200,167,102,0.18);">
${sharedHeader(departmentLabel)}
${bodyContent}
${sharedFooterHtml()}
</table></td></tr></table>
</body></html>`;
}

function buildWelcomeHtml(displayName: string, email: string, role: string, ctaText: string, ctaUrl: string, benefitsHtml: string): string {
  const reviewUrl = `${SITE_URL}/reviews?source=welcome`;
  const surveyUrl = `${SITE_URL}/ticket-survey?source=welcome`;

  const arabicGreeting = role === 'broker' ? 'مرحباً بك في دائرة وسطاء JBJ!' : role === 'investor' ? 'مرحباً بك في JBJ — رحلتك الاستثمارية تبدأ!' : 'مرحباً بك في JBJ Global Real Estate!';

  const bodyContent = `
<!-- Content -->
<tr><td class="content-pad" style="padding:32px;">

<!-- Greeting -->
<p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1a1a1a;">Welcome on Board, ${displayName}!</p>
<p style="margin:0 0 20px;font-size:13px;color:#888;">Your JBJ account is ready</p>

<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
You have successfully created your account with <strong>JBJ Global Real Estate</strong>. We're thrilled to have you!
</p>

<!-- Account Details — Champagne Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="padding:18px 22px;background:linear-gradient(135deg,#F5EBD7 0%,#FDFBF7 100%);border-radius:12px;border:1px solid #C8A766;">
<p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 10px;">Your Account Details</p>
<p style="color:#555;font-size:13px;margin:0;"><strong>Registered Email:</strong> ${email}</p>
</td></tr>
</table>

<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
As a Dubai-based real estate brokerage, we specialize in connecting clients with exceptional properties across the UAE.
</p>

<!-- Benefits -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
${benefitsHtml}
</table>

<!-- CTA -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:0 0 28px;">
<a href="${ctaUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 40px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.5px;border:1px solid #C8A76650;">
${ctaText} &#8594;
</a>
</td></tr>
</table>

${recommendedActionsHtml()}

<!-- Review & Survey -->
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #C8A76633;padding-top:20px;">
<tr><td align="center">
<p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 4px;">We Value Your Feedback</p>
<p style="color:#888;font-size:12px;margin:0 0 14px;">Help us improve by sharing your experience</p>
<table cellpadding="0" cellspacing="0" align="center">
<tr>
<td style="padding:0 6px;"><a href="${reviewUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:12px;border:1px solid #C8A76650;">Leave a Review</a></td>
<td style="padding:0 6px;"><a href="${surveyUrl}" style="display:inline-block;background:#FDFBF7;border:2px solid #C8A766;color:#1a1a1a;text-decoration:none;padding:8px 24px;border-radius:8px;font-weight:700;font-size:12px;">Take Survey</a></td>
</tr>
</table>
</td></tr>
</table>

<p style="font-size:14px;color:#333;margin-top:24px;">Best regards,<br><span style="color:#C8A766;font-weight:600;">JBJ Global Real Estate Team</span></p>
</td></tr>

<!-- ========== ARABIC VERSION ========== -->
<tr><td style="padding:24px 32px 0;text-align:center;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:2px solid #C8A76650;"></td></tr></table>
<p style="margin:16px 0 8px;font-size:12px;color:#C8A766;font-weight:700;letter-spacing:2px;text-transform:uppercase;">النسخة العربية — ARABIC VERSION</p>
</td></tr>
<tr><td class="content-pad" style="padding:32px;direction:rtl;text-align:right;">

<p style="margin:0;font-size:18px;font-weight:700;color:#1a1a1a;">${arabicGreeting}</p>
<p style="margin:8px 0 0;font-size:13px;color:#888;">حسابك في JBJ جاهز</p>

<p style="color:#555;font-size:15px;line-height:1.6;margin:16px 0 20px;">
لقد قمت بإنشاء حسابك بنجاح مع <strong>JBJ Global Real Estate</strong>. يسعدنا انضمامك إلينا!
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
&#8592; ابدأ التصفح
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

    const benefitsByRole: Record<string, string> = {
      broker: `
        <tr><td style="padding:14px 18px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;border:1px solid #C8A76640;">
          <strong style="color:#1a1a1a;font-size:14px;">Free AI Tools</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Unlimited access to property analysis, market reports, and smart recommendations.</p>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:14px 18px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;border:1px solid #C8A76640;">
          <strong style="color:#1a1a1a;font-size:14px;">Free Training Academy</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Complete courses and videos to boost your real estate career.</p>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:14px 18px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;border:1px solid #C8A76640;">
          <strong style="color:#1a1a1a;font-size:14px;">Dedicated HR Manager &amp; Personal Assistant</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Jessica and our team provide dedicated support for all your inquiries.</p>
        </td></tr>`,
      investor: `
        <tr><td style="padding:14px 18px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;border:1px solid #C8A76640;">
          <strong style="color:#1a1a1a;font-size:14px;">Premium Properties</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Browse exclusive listings across Dubai and the UAE.</p>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:14px 18px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;border:1px solid #C8A76640;">
          <strong style="color:#1a1a1a;font-size:14px;">AI Property Analysis</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Smart insights and ROI calculations for better investment decisions.</p>
        </td></tr>`,
      visitor: `
        <tr><td style="padding:16px 20px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;border:1px solid #C8A76640;">
          <strong style="color:#1a1a1a;font-size:14px;">Browse Premium Properties</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Explore our curated selection of UAE properties across all emirates.</p>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:16px 20px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;border:1px solid #C8A76640;">
          <strong style="color:#1a1a1a;font-size:14px;">Save Your Favorites</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Shortlist properties you love and access them anytime from your dashboard.</p>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:16px 20px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;border:1px solid #C8A76640;">
          <strong style="color:#1a1a1a;font-size:14px;">Expert Support 24/7</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Our dedicated team is ready to assist with any property inquiry.</p>
        </td></tr>`,
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
