import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { emailShell, sharedSections, arabicDivider } from "../_shared/email-html.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WelcomeRequest {
  email: string;
  name?: string;
  unsubscribe_token?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, unsubscribe_token }: WelcomeRequest = await req.json();
    if (!email) throw new Error("Email is required");

    const siteUrl = "https://jbj.ae";
    const firstName = name ? name.split(' ')[0] : 'Valued Member';
    const unsubUrl = `${siteUrl}/unsubscribe?token=${unsubscribe_token || ''}`;
    const prefsUrl = `${siteUrl}/email-preferences?token=${unsubscribe_token || ''}`;

    // BILINGUAL: EN → Arabic divider → AR → Gold divider → Locked sections
    const bodyContent = `<tr><td class="content-pad" style="padding:32px;">
<p style="font-size:15px;color:#333;margin:0 0 16px;">Dear <strong>${firstName}</strong>,</p>
<p style="font-size:14px;color:#555;margin:0 0 24px;">Welcome to <strong>Stay in the Loop</strong> — you are now part of an exclusive real estate intelligence network. We are committed to delivering only strategic value — no spam, ever.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="color:#C8A766;margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">What You Will Receive</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:6px 0;font-size:14px;color:#333;"><span style="color:#C8A766;font-size:16px;">&#9733;</span> New project launches — off-plan &amp; ready</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;"><span style="color:#C8A766;font-size:16px;">&#9733;</span> Market intelligence highlights &amp; reports</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;"><span style="color:#C8A766;font-size:16px;">&#9733;</span> Exclusive early access &amp; priority viewing invitations</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;"><span style="color:#C8A766;font-size:16px;">&#9733;</span> Price drops, limited offers &amp; developer promotions</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;"><span style="color:#C8A766;font-size:16px;">&#9733;</span> AI tools hub updates, calculators &amp; comparisons</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;"><span style="color:#C8A766;font-size:16px;">&#9733;</span> Area guides &amp; investment insights</td></tr>
</table>
</td></tr></table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
<tr>
<td width="50%" style="padding:4px;"><a href="${siteUrl}/properties" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#000;border:1px solid #C8A766;border-radius:18px;text-align:center;"><span style="font-size:13px;color:#C8A766;font-weight:700;letter-spacing:0.5px;">Browse Properties</span></td></tr></table></a></td>
<td width="50%" style="padding:4px;"><a href="${prefsUrl}" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><span style="font-size:13px;color:#1a1a1a;font-weight:700;letter-spacing:0.5px;">Manage Preferences</span></td></tr></table></a></td>
</tr></table>

<p style="font-size:12px;color:#888;margin:0 0 4px;text-align:center;">You can turn email notifications on/off anytime from your account settings.</p>
<p style="margin:8px 0 0;text-align:center;">
<a href="${unsubUrl}" style="color:#C8A766;font-size:12px;text-decoration:underline;">Unsubscribe</a>
<span style="color:#555;margin:0 8px;">|</span>
<a href="${prefsUrl}" style="color:#C8A766;font-size:12px;text-decoration:underline;">Manage Preferences</a>
</p>

${arabicDivider()}
</td></tr>
<tr><td class="content-pad" style="padding:0 32px 32px;direction:rtl;text-align:right;">
<p style="font-size:15px;color:#333;margin:0 0 16px;">عزيزي/عزيزتي <strong>${firstName}</strong>،</p>
<p style="font-size:14px;color:#555;margin:0 0 24px;">مرحباً بك في <strong>ابقَ على اطلاع</strong> — أنت الآن جزء من شبكة استخبارات عقارية حصرية. نحن ملتزمون بتقديم القيمة الاستراتيجية فقط — بدون رسائل مزعجة أبداً.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:24px;direction:rtl;">
<tr><td style="padding:20px;">
<p style="color:#C8A766;margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">ما ستتلقاه</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:6px 0;font-size:14px;color:#333;text-align:right;"><span style="color:#C8A766;font-size:16px;">&#9733;</span> إطلاقات المشاريع الجديدة — على الخارطة والجاهزة</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;text-align:right;"><span style="color:#C8A766;font-size:16px;">&#9733;</span> أبرز تقارير ذكاء السوق</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;text-align:right;"><span style="color:#C8A766;font-size:16px;">&#9733;</span> وصول حصري مبكر ودعوات معاينة ذات أولوية</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;text-align:right;"><span style="color:#C8A766;font-size:16px;">&#9733;</span> تخفيضات أسعار وعروض محدودة وعروض المطورين</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;text-align:right;"><span style="color:#C8A766;font-size:16px;">&#9733;</span> تحديثات أدوات الذكاء الاصطناعي والحاسبات والمقارنات</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;text-align:right;"><span style="color:#C8A766;font-size:16px;">&#9733;</span> أدلة المناطق ورؤى الاستثمار</td></tr>
</table>
</td></tr></table>

${sharedSections("newsletter subscription", "JBJ Global Real Estate Team")}
</td></tr>`;

    const emailHtml = emailShell("Welcome to Stay in the Loop", bodyContent);

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "JBJ Global Real Estate <contact@jbj.ae>",
        reply_to: "contact@jbj.ae",
        to: [email],
        subject: "Welcome to Stay in the Loop — JBJ Global Real Estate",
        html: emailHtml,
      }),
    });

    const emailResponse = await emailRes.json();
    if (!emailRes.ok) {
      console.error("Resend API error:", JSON.stringify(emailResponse));
    } else {
      console.log("Welcome email sent:", emailResponse);
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in welcome-subscriber:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
