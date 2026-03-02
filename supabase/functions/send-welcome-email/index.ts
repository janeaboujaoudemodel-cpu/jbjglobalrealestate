import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { LOGO_URL, SITE_URL, emailShell, inquiryBox, recommendedActionsHtml, suggestedActionsHtml, ticketSupportEmbed, feedbackHtml } from "../_shared/email-html.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin.endsWith(".lovableproject.com") || origin.endsWith(".lovable.app")
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

/* ── Benefit row — table-based centering, monogram icon ── */
function benefitRow(iconChar: string, title: string, desc: string): string {
  return `<tr><td style="padding:8px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td style="width:40px;min-width:40px;vertical-align:top;padding-top:2px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="width:36px;height:36px;border:2px solid #111;border-radius:10px;text-align:center;vertical-align:middle;font-size:18px;line-height:36px;">${iconChar}</td>
</tr></table>
</td>
<td style="padding-left:12px;"><strong style="color:#1a1a1a;font-size:14px;">${title}</strong>
<p style="color:#666;margin:2px 0 0;font-size:13px;line-height:1.4;">${desc}</p></td>
</tr></table>
</td></tr>`;
}

function buildWelcomeHtml(displayName: string, email: string, role: string, ctaText: string, ctaUrl: string, benefitsHtml: string): string {
  const arabicGreeting = role === 'broker' ? 'مرحباً بك في دائرة وسطاء JBJ!' : role === 'investor' ? 'مرحباً بك في JBJ — رحلتك الاستثمارية تبدأ!' : 'مرحباً بك في JBJ Global Real Estate!';

  const bodyContent = `
<!-- Content -->
<tr><td class="content-pad" style="padding:32px;">

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

<!-- Benefits -->
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

${ticketSupportEmbed()}

${recommendedActionsHtml()}

${suggestedActionsHtml()}

${feedbackHtml("welcome")}

<p style="font-size:14px;color:#333;margin-top:24px;">Best regards,<br><span style="color:#C8A766;font-weight:600;">JBJ Global Real Estate Team</span></p>
</td></tr>

<!-- ═══ Arabic Content ═══ -->
<tr><td style="padding:24px 32px 0;text-align:center;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:2px solid #C8A76650;"></td></tr></table>
<p style="margin:16px 0 8px;font-size:12px;color:#C8A766;font-weight:700;letter-spacing:2px;">النسخة العربية — ARABIC VERSION</p>
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

    const benefitsByRole: Record<string, string> = {
      broker:
        benefitRow('⚙', 'Free AI Tools', 'Unlimited access to property analysis, market reports, and smart recommendations.') +
        benefitRow('🎓', 'Free Training Academy', 'Complete courses and videos to boost your real estate career.') +
        benefitRow('🎧', 'Dedicated HR Manager & Personal Assistant', 'Jessica and our team provide dedicated support for all your inquiries.') +
        benefitRow('🎫', 'Support Tickets & Events', 'Submit tickets for any query and join exclusive company events and webinars.'),
      investor:
        benefitRow('🏢', 'Premium Properties', 'Browse exclusive listings across Dubai and the UAE.') +
        benefitRow('📊', 'AI Property Analysis', 'Smart insights and ROI calculations for better investment decisions.') +
        benefitRow('🎫', 'Support Tickets & Events', 'Submit tickets for any query and join exclusive company events.'),
      visitor:
        benefitRow('🏢', 'Browse Premium Properties', 'Explore our curated selection of UAE properties across all emirates.') +
        benefitRow('❤', 'Save Your Favorites', 'Shortlist properties you love and access them anytime from your dashboard.') +
        benefitRow('🎧', 'Expert Support 24/7', 'Our dedicated team is ready to assist with any property inquiry.') +
        benefitRow('🎫', 'Support Tickets & Events', 'Submit tickets, get help, and stay updated on company events.'),
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
        reply_to: "CONTACT@JBJ.AE",
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
