import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    const siteUrl = "https://jbjglobalrealestate.lovable.app";
    const firstName = name ? name.split(' ')[0] : 'Valued Member';
    const unsubUrl = `${siteUrl}/unsubscribe?token=${unsubscribe_token || ''}`;
    const prefsUrl = `${siteUrl}/email-preferences?token=${unsubscribe_token || ''}`;

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to Stay in the Loop</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff;">
<tr><td align="center" style="padding:20px 10px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<!-- Logo Banner -->
<tr><td style="background:#ffffff;padding:24px 30px 16px;text-align:center;">
<img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/jbj-monogram-dark-on-light.png?v=2" alt="JBJ Global Real Estate" width="120" style="max-width:120px;height:auto;" />
</td></tr>

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 50%,#2a2015 100%);padding:32px 30px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td align="center">
<p style="margin:0;font-size:28px;font-weight:700;color:#D4AF37;letter-spacing:3px;font-family:'Georgia',serif;">JBJ GLOBAL</p>
<p style="margin:4px 0 0;font-size:12px;color:#B8A070;letter-spacing:6px;text-transform:uppercase;">REAL ESTATE</p>
</td></tr>
<tr><td align="center" style="padding-top:24px;">
<p style="margin:0;font-size:22px;color:#ffffff;font-weight:600;">Welcome to Stay in the Loop</p>
</td></tr>
</table>
</td></tr>

<!-- Greeting -->
<tr><td style="background-color:#FDFBF7;padding:36px 30px 20px;">
<p style="margin:0;font-size:18px;color:#1a1a1a;font-weight:600;">Dear ${firstName},</p>
<p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#444;">You are now part of an exclusive real estate intelligence network. We are committed to delivering only strategic value — no spam, ever.</p>
</td></tr>

<!-- Benefits Section -->
<tr><td style="background-color:#FDFBF7;padding:0 30px 30px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#F5EBD7,#EDE4D3);border-left:4px solid #D4AF37;border-radius:0 8px 8px 0;">
<tr><td style="padding:20px;">
<p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#1a1a1a;">You will receive:</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="padding:6px 0;font-size:14px;color:#333;">&#10022; New project launches — off-plan &amp; ready</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;">&#10022; Market intelligence highlights &amp; reports</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;">&#10022; Exclusive early access &amp; priority viewing invitations</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;">&#10022; Price drops, limited offers &amp; developer promotions</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;">&#10022; AI tools hub updates, calculators &amp; comparisons</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;">&#10022; Area guides &amp; investment insights</td></tr>
</table>
</td></tr>
</table>
</td></tr>

<!-- CTA Buttons -->
<tr><td style="background-color:#FDFBF7;padding:0 30px 36px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td align="center" style="padding-bottom:12px;">
<a href="${siteUrl}/properties" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8860B);color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.5px;">Browse Properties &#8594;</a>
</td></tr>
<tr><td align="center">
<a href="${prefsUrl}" style="display:inline-block;background:#ffffff;color:#D4AF37;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;border:2px solid #D4AF37;">Manage Preferences</a>
</td></tr>
</table>
</td></tr>

<!-- Footer -->
<tr><td style="background:linear-gradient(135deg,#1a1a1a,#2d2d2d);padding:28px 30px;text-align:center;">
<!-- JBJ Monogram -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:12px;">
<tr><td style="text-align:center;"><img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/jbj-monogram-light-on-dark.png?v=2" alt="JBJ" width="64" style="max-width:64px;height:auto;" /></td></tr>
</table>
<p style="color:#C8A766;font-size:18px;font-weight:bold;margin:0 0 6px;">JBJ Global Real Estate</p>
<p style="color:#888;font-size:12px;margin:0 0 4px;font-style:italic;">The Only Global AI-Powered Real Estate Intelligence Platform</p>
<p style="color:#C8A766;font-size:22px;font-weight:bold;margin:12px 0;letter-spacing:1px;">175+ Countries &bull; 2,400+ Cities &bull; 12,000+ Clients Served</p>
<p style="margin:0 0 8px;font-size:13px;color:#888;">You can turn email notifications on/off anytime from your account settings.</p>
<p style="margin:0 0 8px;font-size:13px;color:#888;">You can unsubscribe or resubscribe anytime.</p>
<p style="margin:16px 0 0;">
<a href="${unsubUrl}" style="color:#C8A766;font-size:12px;text-decoration:underline;">Unsubscribe</a>
<span style="color:#555;margin:0 8px;">|</span>
<a href="${prefsUrl}" style="color:#C8A766;font-size:12px;text-decoration:underline;">Manage Preferences</a>
<span style="color:#555;margin:0 8px;">|</span>
<a href="mailto:contact@jbj.ae" style="color:#C8A766;font-size:12px;text-decoration:underline;">Contact Us</a>
</p>
<p style="margin:16px 0 0;font-size:11px;color:#666;">
Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span><br/>
&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.<br/>
Dubai, United Arab Emirates<br/><br/>
You are receiving this email because you opted in on jbj.ae.
</p>
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
        from: "JBJ Global Real Estate <noreply@jbj.ae>",
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