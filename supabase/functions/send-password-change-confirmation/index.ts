import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const LOGO_URL = "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/jbj-monogram-dark.png?v=3";
const SITE_URL = "https://jbj.ae";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PasswordChangeRequest {
  email: string;
  name?: string;
  userAgent?: string;
  timestamp?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, userAgent, timestamp }: PasswordChangeRequest = await req.json();
    if (!email) throw new Error("Email is required");

    const recipientName = name?.trim() || 'User';
    const changeTime = timestamp || new Date().toISOString();
    const formattedDate = new Date(changeTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = new Date(changeTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const ua = userAgent || 'Unknown device';
    let deviceInfo = 'Unknown device';
    let browserInfo = 'Unknown browser';

    if (ua.includes('iPhone') || ua.includes('iPad')) deviceInfo = 'Apple iOS Device';
    else if (ua.includes('Android')) deviceInfo = 'Android Device';
    else if (ua.includes('Windows')) deviceInfo = 'Windows PC';
    else if (ua.includes('Mac')) deviceInfo = 'macOS Device';
    else if (ua.includes('Linux')) deviceInfo = 'Linux Device';

    if (ua.includes('Chrome') && !ua.includes('Edge')) browserInfo = 'Google Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browserInfo = 'Safari';
    else if (ua.includes('Firefox')) browserInfo = 'Firefox';
    else if (ua.includes('Edge')) browserInfo = 'Microsoft Edge';

    const reviewUrl = `${SITE_URL}/reviews?source=password-change`;
    const surveyUrl = `${SITE_URL}/ticket-survey?source=password-change`;

    const emailHtml = `<!DOCTYPE html>
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

<!-- Header — Black with monogram + wordmark -->
<tr><td style="background:#000000;padding:24px 40px 20px;text-align:center;border-radius:20px 20px 0 0;">
<img src="${LOGO_URL}" alt="JBJ Global Real Estate" width="180" style="max-width:180px;height:auto;display:block;margin:0 auto 12px;" />
<p style="color:#C8A766;margin:0;font-size:14px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</p>
</td></tr>

<!-- Lock Icon Frame — Gold circle with lock (matching screenshot) -->
<tr><td style="background:linear-gradient(135deg,#2a2a2a,#1a1a1a);padding:40px 32px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr><td style="width:90px;height:90px;background:linear-gradient(135deg,#C8A766,#D4B87A);border-radius:50%;text-align:center;vertical-align:middle;">
<span style="font-size:44px;line-height:90px;">&#128274;</span>
</td></tr>
</table>
<h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:24px 0 8px;line-height:1.2;">Password Changed<br/>Successfully</h1>
<p style="font-size:16px;color:#C8A766;margin:0;font-weight:500;">Your account security has been updated</p>
</td></tr>

<!-- Content -->
<tr><td class="content-pad" style="padding:32px;">

<p style="margin:0;font-size:16px;font-weight:600;color:#1a1a1a;">Dear ${recipientName},</p>
<p style="margin:8px 0 24px;font-size:14px;line-height:1.7;color:#444;">Your password was successfully changed. If you made this change, no further action is needed.</p>

<!-- Activity Details -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#1a1a1a;border-bottom:1px solid #C8A76640;padding-bottom:12px;">Activity Details</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:8px 0;color:#666;font-size:13px;width:40%;">Date</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${formattedDate}</td></tr>
<tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:8px 0;color:#666;font-size:13px;">Time</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${formattedTime} (GMT)</td></tr>
<tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:8px 0;color:#666;font-size:13px;">Device</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${deviceInfo}</td></tr>
<tr><td style="padding:8px 0;color:#666;font-size:13px;">Browser</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${browserInfo}</td></tr>
</table>
</td></tr>
</table>

<!-- Warning -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;"><strong>Didn't make this change?</strong><br/>If you did not change your password, your account may be compromised. Please contact our support team immediately.</p>
</td></tr>
</table>

<!-- CTA -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td align="center">
<a href="mailto:contact@jbj.ae?subject=Unauthorized Password Change" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">Report Unauthorized Access</a>
</td></tr>
</table>

<!-- Inquiry Box -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
<tr><td style="padding:18px 24px;background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;text-align:center;">
<p style="margin:0;font-size:15px;color:#333;line-height:1.6;">For inquiries about your account security, you can reply<br/>directly to <a href="mailto:contact@jbj.ae" style="color:#1a1a1a;font-weight:700;text-decoration:none;">contact@jbj.ae</a></p>
</td></tr>
</table>

<!-- Recommended For You -->
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
</table>

<!-- Feedback -->
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
</table>

<p style="font-size:14px;color:#333;margin-top:24px;">Best regards,<br><span style="color:#C8A766;font-weight:600;">JBJ Global Real Estate Team</span></p>

<!-- ═══ Arabic Content ═══ -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:2px solid #C8A76650;padding-top:16px;"></td></tr></table>

<div style="direction:rtl;text-align:right;">
<p style="margin:0;font-size:16px;font-weight:600;color:#1a1a1a;">عزيزي/عزيزتي ${recipientName}،</p>
<p style="margin:8px 0 24px;font-size:14px;color:#444;">تم تغيير كلمة المرور الخاصة بك بنجاح. إذا قمت بهذا التغيير، فلا حاجة لاتخاذ أي إجراء إضافي.</p>

<!-- Arabic Activity Details -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#1a1a1a;border-bottom:1px solid #C8A76640;padding-bottom:12px;">تفاصيل النشاط</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="direction:rtl;">
<tr><td style="padding:8px 0;color:#666;font-size:13px;width:40%;">التاريخ</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${formattedDate}</td></tr>
<tr><td style="padding:8px 0;color:#666;font-size:13px;">الوقت</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${formattedTime} (GMT)</td></tr>
<tr><td style="padding:8px 0;color:#666;font-size:13px;">الجهاز</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${deviceInfo}</td></tr>
<tr><td style="padding:8px 0;color:#666;font-size:13px;">المتصفح</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${browserInfo}</td></tr>
</table>
</td></tr>
</table>

<!-- Arabic Warning -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;"><strong>لم تقم بهذا التغيير؟</strong><br/>إذا لم تقم بتغيير كلمة المرور، فقد يكون حسابك معرضاً للخطر. يرجى التواصل مع فريق الدعم فوراً.</p>
</td></tr>
</table>

<!-- Arabic CTA -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td align="center">
<a href="mailto:contact@jbj.ae?subject=تغيير كلمة مرور غير مصرح" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">الإبلاغ عن وصول غير مصرح</a>
</td></tr>
</table>
</div>

</td></tr>

<!-- Do not reply -->
<tr><td style="padding:0 32px 16px;text-align:center;">
<p style="margin:0;font-size:11px;color:#999;line-height:1.5;">This is a security notification. Please do not reply directly to this email.<br/>For any inquiries, contact us at <a href="mailto:contact@jbj.ae" style="color:#C8A766;text-decoration:underline;font-weight:600;">contact@jbj.ae</a></p>
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
<tr><td><a href="mailto:contact@jbj.ae" style="display:inline-block;padding:8px 14px;background:linear-gradient(135deg,#FDFBF7,#F5EBD7);border:1px solid #C8A766;border-radius:6px;color:#1a1a1a;text-decoration:none;font-size:11px;font-weight:600;">contact@jbj.ae</a></td></tr>
</table>
<p style="color:#C8A766;font-size:13px;margin:0 0 4px;font-weight:600;">JBJ Global Real Estate</p>
<p style="color:#777;font-size:11px;margin:0 0 8px;">First Global Real Estate Platform of Its Kind</p>
<p style="color:#888;font-size:10px;margin:0 0 12px;white-space:nowrap;">Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span></p>
<p style="color:#C8A766;font-size:11px;margin:12px 0 0;font-weight:600;">&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
</td></tr>

</table>
</td></tr>
</table></td></tr></table>
</body></html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "JBJ Security <contact@jbj.ae>",
        reply_to: "contact@jbj.ae",
        to: [email],
        subject: "Your Password Was Changed — JBJ Global Real Estate",
        html: emailHtml,
      }),
    });

    const emailResponse = await emailRes.json();
    if (!emailRes.ok) {
      console.error("Resend API error:", JSON.stringify(emailResponse));
    } else {
      console.log("Password change confirmation email sent:", emailResponse);
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-password-change-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
