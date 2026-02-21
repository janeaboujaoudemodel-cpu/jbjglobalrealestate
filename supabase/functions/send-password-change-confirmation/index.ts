import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

    const firstName = name ? name.split(' ')[0] : 'User';
    const changeTime = timestamp || new Date().toISOString();
    const formattedDate = new Date(changeTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = new Date(changeTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Parse user agent for device info
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

    const siteUrl = "https://jbjglobalrealestate.lovable.app";

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Password Changed</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff;">
<tr><td align="center" style="padding:20px 10px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<!-- Logo Banner -->
<tr><td style="background:#ffffff;padding:24px 30px 16px;text-align:center;">
<img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/jbj-logo.png?v=1" alt="JBJ Global Real Estate" width="160" style="max-width:160px;height:auto;" />
</td></tr>

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 50%,#2a2015 100%);padding:32px 30px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:16px;">
<tr><td style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;text-align:center;line-height:56px;font-size:28px;">&#128274;</td></tr>
</table>
<p style="margin:0;font-size:22px;color:#ffffff;font-weight:600;">Password Changed Successfully</p>
<p style="margin:8px 0 0;font-size:14px;color:#B8A070;">Your account security has been updated</p>
</td></tr>
</table>
</td></tr>

<!-- Content -->
<tr><td style="background-color:#FDFBF7;padding:36px 30px;">
<p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;font-weight:600;">Dear ${firstName},</p>
<p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#444;">Your password was successfully changed. If you made this change, no further action is needed.</p>

<!-- Activity Details -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#1a1a1a;border-bottom:1px solid #C8A766;padding-bottom:12px;">
<span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;text-align:center;line-height:24px;font-size:12px;margin-right:8px;">&#9432;</span>
Activity Details</p>
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
<p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;"><strong>&#9888;&#65039; Didn't make this change?</strong><br/>If you did not change your password, your account may be compromised. Please contact our support team immediately.</p>
</td></tr>
</table>

<!-- CTA -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<a href="mailto:SUPPORT@JBJ.AE?subject=Unauthorized Password Change" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:14px;">Report Unauthorized Access</a>
</td></tr>
</table>
</td></tr>

<!-- Footer -->
<tr><td style="background:linear-gradient(135deg,#1a1a1a,#2d2d2d);padding:28px 30px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:12px;">
<tr><td style="width:48px;height:48px;border-radius:50%;background:#000000;color:#C8A766;text-align:center;line-height:48px;font-size:16px;font-weight:bold;font-family:'Georgia',serif;border:2px solid #C8A766;">JBJ</td></tr>
</table>
<p style="color:#C8A766;font-size:18px;font-weight:bold;margin:0 0 6px;">JBJ Global Real Estate</p>
<p style="color:#888;font-size:12px;margin:0 0 4px;font-style:italic;">The Only Global AI-Powered Real Estate Intelligence Platform</p>
<p style="color:#888;font-size:12px;margin:16px 0 0;">&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
<p style="color:#666;font-size:10px;margin:10px 0 0;"><strong>This is a security notification. Do not reply to this email.</strong></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "JBJ Security <noreply@jbj.ae>",
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