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

const iconSvg = {
  lock: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="10" width="14" height="10" rx="2" stroke="#111" stroke-width="1.8"/><path d="M8 10V7.5C8 5.57 9.57 4 11.5 4H12.5C14.43 4 16 5.57 16 7.5V10" stroke="#111" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  ai: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3.5" stroke="#111" stroke-width="1.8"/><path d="M12 2V5M12 19V22M2 12H5M19 12H22M4.9 4.9L7 7M17 17L19.1 19.1M19.1 4.9L17 7M7 17L4.9 19.1" stroke="#111" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  market: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 18V6" stroke="#111" stroke-width="1.8" stroke-linecap="round"/><path d="M4 18H20" stroke="#111" stroke-width="1.8" stroke-linecap="round"/><path d="M7.5 15L11 11.5L13.5 14L18 9.5" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  library: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="5" width="4" height="14" stroke="#111" stroke-width="1.8"/><rect x="10" y="5" width="4" height="14" stroke="#111" stroke-width="1.8"/><rect x="16" y="5" width="4" height="14" stroke="#111" stroke-width="1.8"/></svg>`,
  properties: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11.5L12 4L21 11.5" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 10V20H17.5V10" stroke="#111" stroke-width="1.8"/><rect x="10" y="14" width="4" height="6" stroke="#111" stroke-width="1.8"/></svg>`,
};

const recommendationCard = (icon: string, label: string, href: string) => `
<td width="50%" style="text-align:center;padding:6px;">
  <a href="${href}" style="display:block;padding:14px 8px;background:#fff;border:2px solid #C8A766;border-radius:12px;text-decoration:none;">
    <div style="height:30px;display:flex;align-items:center;justify-content:center;">${icon}</div>
    <p style="margin:8px 0 0;font-size:12px;color:#111;font-weight:700;">${label}</p>
  </a>
</td>`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, userAgent, timestamp }: PasswordChangeRequest = await req.json();
    if (!email) throw new Error("Email is required");

    const recipientName = name?.trim() || "User";
    const changeTime = timestamp || new Date().toISOString();
    const formattedDate = new Date(changeTime).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const formattedTime = new Date(changeTime).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const ua = userAgent || "Unknown device";
    let deviceInfo = "Unknown device";
    let browserInfo = "Unknown browser";

    if (ua.includes("iPhone") || ua.includes("iPad")) deviceInfo = "Apple iOS Device";
    else if (ua.includes("Android")) deviceInfo = "Android Device";
    else if (ua.includes("Windows")) deviceInfo = "Windows PC";
    else if (ua.includes("Mac")) deviceInfo = "macOS Device";
    else if (ua.includes("Linux")) deviceInfo = "Linux Device";

    if (ua.includes("Chrome") && !ua.includes("Edge")) browserInfo = "Google Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browserInfo = "Safari";
    else if (ua.includes("Firefox")) browserInfo = "Firefox";
    else if (ua.includes("Edge")) browserInfo = "Microsoft Edge";

    const reviewUrl = `${SITE_URL}/reviews?source=password_change&mode=quick`;
    const surveyUrl = `${SITE_URL}/ticket-survey?source=password_change&context=password_change`;

    const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{margin:0;padding:0;background-color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;}
  @media only screen and (max-width:620px){.wrapper{width:100%!important;padding:0 8px!important;}.content-pad{padding:24px 16px!important;}}
</style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#F5F0E6;border-radius:24px;overflow:hidden;">
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(180deg,#FFFFFF,#FDFBF7,#F5F0E6);border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(200,167,102,0.18);">

<tr><td style="background:#000000;padding:24px 40px 20px;text-align:center;border-radius:24px 24px 0 0;">
  <img src="${LOGO_URL}" alt="JBJ Global Real Estate" width="180" style="max-width:180px;height:auto;display:block;margin:0 auto 12px;" />
  <p style="color:#C8A766;margin:0;font-size:14px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</p>
</td></tr>

<tr><td style="background:#111;padding:26px 32px;text-align:center;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="width:86px;height:86px;background:linear-gradient(135deg,#C8A766,#D4B87A);border-radius:50%;text-align:center;vertical-align:middle;">${iconSvg.lock}</td></tr></table>
  <h1 style="color:#fff;font-size:30px;font-weight:800;margin:18px 0 6px;line-height:1.2;">Password Changed Successfully</h1>
  <p style="font-size:18px;color:#C8A766;margin:0;font-weight:700;">Your account security has been updated</p>
</td></tr>

<tr><td class="content-pad" style="padding:30px;">
  <p style="margin:0;font-size:16px;font-weight:600;color:#1a1a1a;">Dear ${recipientName},</p>
  <p style="margin:8px 0 20px;font-size:14px;line-height:1.6;color:#444;">Your password was changed. If this was you, no further action is needed.</p>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:20px;">
    <tr><td style="padding:18px;">
      <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1a1a1a;border-bottom:1px solid #C8A76640;padding-bottom:10px;">Activity Details</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding:7px 0;color:#666;font-size:13px;width:40%;">Date</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${formattedDate}</td></tr>
        <tr><td style="padding:7px 0;color:#666;font-size:13px;">Time</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${formattedTime} (GMT)</td></tr>
        <tr><td style="padding:7px 0;color:#666;font-size:13px;">Device</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${deviceInfo}</td></tr>
        <tr><td style="padding:7px 0;color:#666;font-size:13px;">Browser</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${browserInfo}</td></tr>
      </table>
    </td></tr>
  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;margin-bottom:20px;">
    <tr><td style="padding:16px;">
      <p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;"><strong>Didn't make this change?</strong><br/>Please contact our support team immediately.</p>
    </td></tr>
  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
    <tr><td align="center">
      <a href="mailto:contact@jbj.ae?subject=Unauthorized Password Change" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">Report Unauthorized Access</a>
    </td></tr>
  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr><td style="padding:18px 24px;background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;text-align:center;">
      <p style="margin:0;font-size:15px;color:#333;line-height:1.6;">For inquiries about your account security, you can reply directly to <a href="mailto:contact@jbj.ae" style="color:#1a1a1a;font-weight:700;text-decoration:none;">contact@jbj.ae</a></p>
    </td></tr>
  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border-top:2px solid #C8A76633;padding-top:20px;">
    <tr><td style="text-align:center;">
      <p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 12px;">Recommended For You</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${recommendationCard(iconSvg.ai, "AI Tools", `${SITE_URL}/ai-tools`)}
          ${recommendationCard(iconSvg.market, "Market Reports", `${SITE_URL}/market-reports`)}
        </tr>
        <tr>
          ${recommendationCard(iconSvg.library, "Library & Guides", `${SITE_URL}/guides`)}
          ${recommendationCard(iconSvg.properties, "Properties", `${SITE_URL}/properties`)}
        </tr>
      </table>
    </td></tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #C8A76633;padding-top:20px;margin-top:4px;">
    <tr><td align="center">
      <p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 4px;">We Value Your Feedback</p>
      <p style="color:#888;font-size:13px;margin:0 0 16px;">Help us improve by sharing your experience</p>
      <table cellpadding="0" cellspacing="0" align="center"><tr>
        <td style="padding:0 6px;"><a href="${reviewUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:700;font-size:13px;border:1px solid #C8A76650;">Leave a Review</a></td>
        <td style="padding:0 6px;"><a href="${surveyUrl}" style="display:inline-block;background:#FDFBF7;border:2px solid #C8A766;color:#1a1a1a;text-decoration:none;padding:10px 26px;border-radius:8px;font-weight:700;font-size:13px;">Take Survey</a></td>
      </tr></table>
    </td></tr>
  </table>

  <p style="font-size:14px;color:#333;margin-top:22px;">Best regards,<br><span style="color:#C8A766;font-weight:600;">JBJ Global Real Estate Team</span></p>
</td></tr>

<tr><td style="padding:0 32px 16px;text-align:center;">
  <p style="margin:0;font-size:11px;color:#999;line-height:1.5;">This is a security notification.<br/>For inquiries contact <a href="mailto:contact@jbj.ae" style="color:#C8A766;text-decoration:underline;font-weight:600;">contact@jbj.ae</a></p>
</td></tr>

<tr><td style="background:#000000;padding:28px 36px;text-align:center;border-radius:0 0 20px 20px;">
  <p style="color:#C8A766;font-size:13px;margin:0 0 6px;font-weight:600;">JBJ Global Real Estate</p>
  <p style="color:#777;font-size:11px;margin:0 0 10px;">First Global Real Estate Platform of Its Kind</p>
  <p style="color:#888;font-size:10px;margin:0 0 8px;white-space:nowrap;">Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span></p>
  <p style="color:#C8A766;font-size:11px;margin:0;font-weight:600;">&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
</td></tr>

</table></td></tr></table></td></tr></table>
</body></html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
