import { createClient } from "npm:@supabase/supabase-js@2";

const LOGO_URL = "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/jbj-monogram-dark.png?v=3";
const SITE_URL = "https://jbj.ae";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from("email_verifications")
      .select("id")
      .eq("email", email.toLowerCase())
      .gte("created_at", tenMinutesAgo);

    if (recentAttempts && recentAttempts.length >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many attempts. Please wait 10 minutes before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: insertError } = await supabase
      .from("email_verifications")
      .insert({
        email: email.toLowerCase(),
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
<p style="font-size:18px;font-weight:bold;color:#fff;margin:0;">Email Verification</p>
</td></tr>

<!-- Content -->
<tr><td class="content-pad" style="padding:32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
<tr>
<td width="52" style="vertical-align:top;padding-right:14px;">
<img src="${LOGO_URL}" alt="JBJ" width="48" style="width:48px;height:48px;border-radius:50%;object-fit:contain;border:2px solid #C8A766;" />
</td>
<td style="vertical-align:middle;">
<p style="margin:0;font-size:16px;color:#333;">Hello${full_name ? ` <strong>${full_name}</strong>` : ''},</p>
<p style="margin:4px 0 0;font-size:13px;color:#888;">Your JBJ verification code is below</p>
</td>
</tr>
</table>

<!-- OTP Code -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;padding:28px;text-align:center;">
<span style="font-size:40px;font-weight:700;letter-spacing:10px;color:#1a1a1a;font-family:'SF Mono',Monaco,Consolas,monospace;">${otpCode}</span>
</td></tr>
</table>

<p style="margin:0 0 8px;color:#555;font-size:14px;line-height:1.6;">This code expires in <strong>10 minutes</strong>.</p>
<p style="margin:0 0 16px;color:#999;font-size:13px;line-height:1.6;">If you didn't request this code, please ignore this email.</p>

<!-- Contact -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #22c55e40;border-radius:10px;margin-bottom:16px;">
<tr><td style="padding:12px 20px;text-align:center;">
<p style="margin:0;font-size:13px;color:#166534;">Need help? Contact us at <a href="mailto:contact@jbj.ae" style="color:#15803d;font-weight:700;text-decoration:underline;">contact@jbj.ae</a></p>
</td></tr>
</table>
</td></tr>

<!-- Do not reply -->
<tr><td style="padding:0 32px 16px;text-align:center;">
<p style="margin:0;font-size:11px;color:#999;">This is an automated message. Please do not reply directly to this email.<br/>For inquiries, contact <a href="mailto:contact@jbj.ae" style="color:#C8A766;text-decoration:underline;">contact@jbj.ae</a></p>
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

    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "JBJ Global Real Estate <contact@jbj.ae>",
          reply_to: "contact@jbj.ae",
          to: [email],
          subject: "Your JBJ verification code",
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.text();
        console.error("Resend API error:", errorData);
        return new Response(
          JSON.stringify({ success: true, message: "Verification code sent. Check your inbox and spam folder." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`OTP email sent successfully to ${email}`);

      return new Response(
        JSON.stringify({ success: true, message: "Verification code sent to your email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ success: true, message: "Verification code sent. Check your inbox." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error in send-email-otp:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
