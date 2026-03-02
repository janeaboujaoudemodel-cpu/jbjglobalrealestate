import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const LOGO_URL = "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/jbj-monogram-dark.png?v=3";
const SITE_URL = "https://jbj.ae";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IdeaApprovedRequest {
  ideaId: string;
  userId: string;
  userEmail: string;
  userName: string;
  ideaTitle: string;
  pointsAwarded: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ideaId, userId, userEmail, userName, ideaTitle, pointsAwarded }: IdeaApprovedRequest = await req.json();

    if (!userEmail || !ideaTitle) {
      throw new Error("Missing required fields: userEmail and ideaTitle");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (userId) {
      await supabase.from("user_notifications").insert({
        user_id: userId,
        type: "idea_approved",
        title: "Idea Approved!",
        message: `Congratulations! Your idea "${ideaTitle}" has been approved. You earned ${pointsAwarded} loyalty points!`,
        metadata: { ideaId, pointsAwarded },
      });
    }

    const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;background-color:#F5F0E6;font-family:'Segoe UI',Arial,sans-serif;}
@media only screen and (max-width:620px){.wrapper{width:100%!important;padding:0 8px!important;}.content-pad{padding:24px 16px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E6;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#FFFFFF,#FDFBF7,#F5F0E6);border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(200,167,102,0.18);">

<!-- Header -->
<tr><td style="background:#000000;padding:36px 40px 20px;text-align:center;border-radius:20px 20px 0 0;">
<img src="${LOGO_URL}" alt="JBJ Global Real Estate" width="180" style="max-width:180px;height:auto;display:block;margin:0 auto 14px;" />
<p style="color:#C8A766;margin:0;font-size:14px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</p>
</td></tr>
<!-- Sub-header -->
<tr><td style="background:linear-gradient(135deg,#C8A766,#B8956E,#A07D4A);padding:20px 32px;text-align:center;">
<p style="font-size:18px;font-weight:bold;color:#fff;margin:0;">Idea Approved</p>
</td></tr>

<!-- Content -->
<tr><td class="content-pad" style="padding:32px;">

<!-- Profile icon -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
<tr>
<td width="52" style="vertical-align:top;padding-right:14px;">
<img src="${LOGO_URL}" alt="JBJ" width="48" style="width:48px;height:48px;border-radius:50%;object-fit:contain;border:2px solid #C8A766;" />
</td>
<td style="vertical-align:middle;">
<p style="margin:0;font-size:18px;font-weight:700;color:#1a1a1a;">Congratulations, ${userName || 'Valued Customer'}!</p>
</td>
</tr>
</table>

<!-- Points Card -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:24px;text-align:center;">
<p style="font-size:36px;font-weight:bold;color:#C8A766;margin:0 0 8px;">+${pointsAwarded} Points</p>
<p style="font-size:16px;color:#333;font-style:italic;margin:0;">"${ideaTitle}"</p>
</td></tr>
</table>

<p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 16px;">
Great news! Your creative idea has been reviewed and approved by our team. As a token of our appreciation, we've added <strong>${pointsAwarded} loyalty points</strong> to your account.
</p>
<p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 16px;">
Your ideas help us improve and innovate. Keep sharing your brilliant suggestions — every approved idea earns you more points!
</p>

<!-- CTA -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td align="center">
<a href="${SITE_URL}/my-account" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">View My Account</a>
</td></tr>
</table>

<!-- Recommended Actions -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border-top:2px solid #C8A76633;padding-top:20px;">
<tr><td style="text-align:center;">
<p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 12px;">Recommended For You</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="33%" style="text-align:center;padding:4px;"><a href="${SITE_URL}/ai-tools" style="display:block;padding:14px 8px;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:10px;text-decoration:none;"><p style="margin:0 0 4px;font-size:20px;">&#9881;</p><p style="margin:0;font-size:11px;color:#1a1a1a;font-weight:600;">AI Tools</p></a></td>
<td width="33%" style="text-align:center;padding:4px;"><a href="${SITE_URL}/guides" style="display:block;padding:14px 8px;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:10px;text-decoration:none;"><p style="margin:0 0 4px;font-size:20px;">&#128218;</p><p style="margin:0;font-size:11px;color:#1a1a1a;font-weight:600;">Guides</p></a></td>
<td width="33%" style="text-align:center;padding:4px;"><a href="${SITE_URL}/properties" style="display:block;padding:14px 8px;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:10px;text-decoration:none;"><p style="margin:0 0 4px;font-size:20px;">&#127969;</p><p style="margin:0;font-size:11px;color:#1a1a1a;font-weight:600;">Properties</p></a></td>
</tr>
</table>
</td></tr>
</table>

<!-- Review -->
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #C8A76633;padding-top:20px;">
<tr><td align="center">
<p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 4px;">We Value Your Feedback</p>
<p style="color:#888;font-size:12px;margin:0 0 14px;">Help us improve by sharing your experience</p>
<table cellpadding="0" cellspacing="0" align="center">
<tr>
<td style="padding:0 6px;"><a href="${SITE_URL}/reviews?source=idea" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:12px;border:1px solid #C8A76650;">Leave a Review</a></td>
<td style="padding:0 6px;"><a href="${SITE_URL}/survey?source=idea" style="display:inline-block;background:#FDFBF7;border:2px solid #C8A766;color:#1a1a1a;text-decoration:none;padding:8px 24px;border-radius:8px;font-weight:700;font-size:12px;">Take Survey</a></td>
</tr>
</table>
</td></tr>
</table>

<p style="font-size:14px;color:#333;margin-top:24px;">Best regards,<br><span style="color:#C8A766;font-weight:600;">JBJ Global Real Estate Team</span></p>

<!-- ========== ARABIC VERSION ========== -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr><td style="border-top:2px solid #C8A76650;padding-top:16px;"></td></tr></table>
<p style="text-align:center;margin:0 0 16px;font-size:12px;color:#C8A766;font-weight:700;letter-spacing:2px;">النسخة العربية — ARABIC VERSION</p>

<div style="direction:rtl;text-align:right;">
<p style="margin:0;font-size:18px;font-weight:700;color:#1a1a1a;">تهانينا، ${userName || 'عميلنا الكريم'}!</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin:16px 0 24px;">
<tr><td style="padding:24px;text-align:center;">
<p style="font-size:36px;font-weight:bold;color:#C8A766;margin:0 0 8px;">+${pointsAwarded} نقطة</p>
<p style="font-size:16px;color:#333;font-style:italic;margin:0;">"${ideaTitle}"</p>
</td></tr>
</table>

<p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 16px;">
أخبار رائعة! تمت مراجعة فكرتك الإبداعية والموافقة عليها من قبل فريقنا. كتقدير لجهودك، أضفنا <strong>${pointsAwarded} نقطة ولاء</strong> إلى حسابك.
</p>
<p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 16px;">
أفكارك تساعدنا على التحسين والابتكار. استمر في مشاركة اقتراحاتك — كل فكرة معتمدة تمنحك المزيد من النقاط!
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td align="center">
<a href="${SITE_URL}/my-account" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">عرض حسابي</a>
</td></tr>
</table>

<p style="font-size:14px;color:#333;">مع أطيب التحيات،<br><span style="color:#C8A766;font-weight:600;">فريق JBJ Global Real Estate</span></p>
</div>
</td></tr>

<!-- Do not reply -->
<tr><td style="padding:0 32px 16px;text-align:center;">
<p style="margin:0;font-size:11px;color:#999;line-height:1.5;">This is an automated message. Please do not reply directly to this email.<br/>For inquiries, contact <a href="mailto:contact@jbj.ae" style="color:#C8A766;text-decoration:underline;">contact@jbj.ae</a></p>
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
<tr><td><a href="mailto:contact@jbj.ae" style="display:inline-block;padding:8px 14px;background:linear-gradient(135deg,#FDFBF7,#F5EBD7);border:1px solid #C8A766;border-radius:6px;color:#1a1a1a;text-decoration:none;font-size:11px;font-weight:600;">&#9993; contact@jbj.ae</a></td></tr>
</table>
<p style="color:#C8A766;font-size:13px;margin:0 0 4px;font-weight:600;">JBJ Global Real Estate</p>
<p style="color:#777;font-size:11px;margin:0 0 8px;">First Global Real Estate Platform of Its Kind</p>
<p style="color:#888;font-size:10px;margin:0 0 12px;white-space:nowrap;">Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span></p>
<p style="color:#C8A766;font-size:11px;margin:12px 0 0;font-weight:600;">&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
</td></tr>

</table></td></tr></table>
</body></html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "JBJ Global Real Estate <contact@jbj.ae>",
        reply_to: "contact@jbj.ae",
        to: [userEmail],
        subject: `Your idea has been approved! +${pointsAwarded} points`,
        html: emailHtml,
      }),
    });
    const emailResponse = await emailRes.json();
    if (!emailRes.ok) console.error("Resend API error:", JSON.stringify(emailResponse));

    console.log("Idea approval email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-idea-approved-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
