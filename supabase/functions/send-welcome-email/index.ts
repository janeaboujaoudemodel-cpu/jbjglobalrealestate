import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = "https://jbj.ae";

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

// Shared footer HTML
function footerHtml(): string {
  return `
<!-- Footer — Pure Black -->
<tr><td style="background:#000000;padding:32px 40px;text-align:center;">

<p style="color:#C8A766;font-size:14px;margin:0 0 14px;">Need assistance? We're here to help.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td align="center">
<a href="tel:+971565911000" style="color:#ffffff;text-decoration:none;font-size:13px;">+971 56 591 1000</a>
<span style="color:#444;margin:0 12px;">|</span>
<a href="mailto:Contact@JBJ.ae" style="color:#ffffff;text-decoration:none;font-size:13px;">Contact@JBJ.ae</a>
</td></tr>
</table>

<!-- Social Links with proper spacing -->
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

function buildWelcomeHtml(displayName: string, email: string, role: string, ctaText: string, ctaUrl: string, benefitsHtml: string): string {
  const reviewUrl = `${SITE_URL}/reviews?source=welcome`;
  const surveyUrl = `${SITE_URL}/survey?source=welcome`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d0;">

<!-- Header — Pure Black with Monogram -->
<tr><td style="background:#000000;padding:28px 40px;text-align:center;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<div style="width:56px;height:56px;border-radius:12px;border:2px solid #C8A766;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
<span style="color:#ffffff;font-size:28px;font-weight:800;font-family:Georgia,serif;line-height:56px;">J</span>
</div>
</td></tr></table>
<p style="color:#C8A766;margin:0;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</p>
</td></tr>

<!-- Gold Accent Line -->
<tr><td style="background:linear-gradient(90deg,#C8A766,#D4C4A8,#C8A766);height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>

<!-- Content -->
<tr><td style="padding:28px 20px 28px 28px;">
<h2 style="color:#1a1a1a;margin:0 0 20px;font-size:20px;font-weight:700;">Welcome on Board, ${displayName}!</h2>

<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
You have successfully created your account with <strong>JBJ Global Real Estate</strong>. We're thrilled to have you!
</p>

<!-- Account Details — Champagne Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="padding:18px 22px;background:linear-gradient(135deg,#F5EBD7 0%,#FDFBF7 100%);border-radius:12px;border-left:4px solid #C8A766;">
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

<!-- CTA — Premium Outlined Button -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:0 0 28px;">
<a href="${ctaUrl}" style="display:inline-block;background:transparent;color:#1a1a1a;text-decoration:none;padding:14px 40px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.5px;border:2px solid #C8A766;">
${ctaText} &#8594;
</a>
</td></tr>
</table>
</td></tr>

<!-- Quick Links — Responsive -->
<tr><td style="padding:24px 20px;background:#FDFBF7;">
<p style="color:#1a1a1a;margin:0 0 14px;font-size:14px;font-weight:700;text-align:center;">Explore Our Platform</p>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${SITE_URL}/properties" style="display:inline-block;margin:4px;padding:10px 16px;border:1px solid #C8A766;border-radius:8px;color:#1a1a1a;text-decoration:none;font-size:13px;font-weight:600;">Properties</a>
<a href="${SITE_URL}/services" style="display:inline-block;margin:4px;padding:10px 16px;border:1px solid #C8A766;border-radius:8px;color:#1a1a1a;text-decoration:none;font-size:13px;font-weight:600;">Services</a>
<a href="${SITE_URL}/about" style="display:inline-block;margin:4px;padding:10px 16px;border:1px solid #C8A766;border-radius:8px;color:#1a1a1a;text-decoration:none;font-size:13px;font-weight:600;">About Us</a>
</td></tr>
<tr><td align="center" style="padding-top:4px;">
<a href="${SITE_URL}/market-intelligence" style="display:inline-block;margin:4px;padding:10px 16px;border:1px solid #C8A766;border-radius:8px;color:#1a1a1a;text-decoration:none;font-size:13px;font-weight:600;">Market Intelligence</a>
<a href="${SITE_URL}/contact" style="display:inline-block;margin:4px;padding:10px 16px;border:1px solid #C8A766;border-radius:8px;color:#1a1a1a;text-decoration:none;font-size:13px;font-weight:600;">Contact</a>
</td></tr>
</table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e8e0d0;"></td></tr></table></td></tr>

<!-- Review & Survey — Responsive -->
<tr><td style="padding:24px 20px;text-align:center;">
<p style="color:#1a1a1a;font-size:15px;font-weight:700;margin:0 0 4px;">We Value Your Feedback</p>
<p style="color:#888;font-size:12px;margin:0 0 16px;">Help us improve by sharing your experience</p>
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:0 0 10px;">
<a href="${reviewUrl}" style="display:inline-block;background:transparent;color:#1a1a1a;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:13px;border:2px solid #C8A766;">&#9733;&#9733;&#9733;&#9733;&#9733; Leave a Review</a>
</td>
</tr>
<tr>
<td align="center">
<a href="${surveyUrl}" style="display:inline-block;background:transparent;color:#1a1a1a;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:13px;border:2px solid #C8A766;">Take Survey &#8594;</a>
</td>
</tr>
</table>
</td></tr>

${footerHtml()}

</table>
</td></tr>
</table>
</body></html>`;
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
      console.log('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, email, fullName, userRole } = parseResult.data;
    const displayName = fullName || email.split('@')[0];
    const role = userRole || "visitor";

    console.log(`Sending welcome email to: ${email} (user: ${userId}, role: ${role})`);

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
        <tr><td style="padding:14px 18px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;margin-bottom:8px;">
          <strong style="color:#1a1a1a;font-size:14px;">Free AI Tools</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Unlimited access to property analysis, market reports, and smart recommendations.</p>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:14px 18px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;">
          <strong style="color:#1a1a1a;font-size:14px;">Free Training Academy</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Complete courses and videos to boost your real estate career.</p>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:14px 18px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;">
          <strong style="color:#1a1a1a;font-size:14px;">Dedicated HR Manager &amp; Personal Assistant</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Jessica and our team provide dedicated support for all your inquiries.</p>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:14px 18px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;">
          <strong style="color:#1a1a1a;font-size:14px;">Property Coach</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Direct access to expert guidance for your property deals.</p>
        </td></tr>`,
      investor: `
        <tr><td style="padding:14px 18px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;">
          <strong style="color:#1a1a1a;font-size:14px;">Premium Properties</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Browse exclusive listings across Dubai and the UAE.</p>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:14px 18px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;">
          <strong style="color:#1a1a1a;font-size:14px;">AI Property Analysis</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Smart insights and ROI calculations for better investment decisions.</p>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:14px 18px;background:linear-gradient(135deg,#F5EBD7,#FDFBF7);border-radius:10px;">
          <strong style="color:#1a1a1a;font-size:14px;">Market Reports</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Stay informed with the latest UAE real estate trends.</p>
        </td></tr>`,
      visitor: `
        <tr><td style="padding:16px 20px;background:#FDFBF7;border-radius:10px;border:1px solid #E8DCC8;">
          <table cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:top;padding-right:12px;"><span style="color:#C8A766;font-size:20px;">&#9632;</span></td>
          <td><strong style="color:#1a1a1a;font-size:14px;">Browse Premium Properties</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Explore our curated selection of UAE properties across all emirates.</p></td>
          </tr></table>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:16px 20px;background:#FDFBF7;border-radius:10px;border:1px solid #E8DCC8;">
          <table cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:top;padding-right:12px;"><span style="color:#C8A766;font-size:20px;">&#9829;</span></td>
          <td><strong style="color:#1a1a1a;font-size:14px;">Save Your Favorites</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Shortlist properties you love and access them anytime from your dashboard.</p></td>
          </tr></table>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:16px 20px;background:#FDFBF7;border-radius:10px;border:1px solid #E8DCC8;">
          <table cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:top;padding-right:12px;"><span style="color:#C8A766;font-size:20px;">&#9733;</span></td>
          <td><strong style="color:#1a1a1a;font-size:14px;">Expert Support 24/7</strong>
          <p style="color:#666;margin:4px 0 0;font-size:13px;">Our dedicated team is ready to assist with any property inquiry.</p></td>
          </tr></table>
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
        from: "JBJ Global Real Estate <noreply@jbj.ae>",
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
