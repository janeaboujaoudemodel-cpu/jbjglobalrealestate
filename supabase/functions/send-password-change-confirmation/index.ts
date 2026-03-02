import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { LOGO_URL, SITE_URL, emailShell, inquiryBox, recommendedActionsHtml, suggestedActionsHtml, ticketSupportEmbed, feedbackHtml } from "../_shared/email-html.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const recipientName = name?.trim() || "User";
    const changeTime = timestamp || new Date().toISOString();
    const formattedDate = new Date(changeTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const formattedTime = new Date(changeTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

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

    const bodyContent = `
<!-- Security Icon -->
<tr><td style="background:#111;padding:28px 32px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
<td style="width:86px;height:86px;background:linear-gradient(135deg,#C8A766,#D4B87A);border-radius:50%;text-align:center;vertical-align:middle;">
<img src="${LOGO_URL}" alt="JBJ" width="50" style="width:50px;height:50px;display:block;margin:18px auto;" />
</td>
</tr></table>
<h1 style="color:#fff;font-size:24px;font-weight:800;margin:18px 0 6px;line-height:1.2;">Password Changed Successfully</h1>
<p style="font-size:16px;color:#C8A766;margin:0;font-weight:700;">Your account security has been updated</p>
</td></tr>

<!-- Content — single unbroken card -->
<tr><td class="content-pad" style="padding:30px;">
<p style="margin:0;font-size:16px;font-weight:600;color:#1a1a1a;">Dear ${recipientName},</p>
<p style="margin:8px 0 20px;font-size:14px;line-height:1.6;color:#444;">Your password was changed. If this was you, no further action is needed.</p>

<!-- Activity Details -->
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

<!-- Warning -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;margin-bottom:20px;">
<tr><td style="padding:16px;">
<p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;"><strong>Didn't make this change?</strong><br/>Please contact our support team immediately.</p>
</td></tr>
</table>

<!-- Report Button -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
<tr><td align="center">
<a href="mailto:CONTACT@JBJ.AE?subject=Unauthorized Password Change" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">Report Unauthorized Access</a>
</td></tr>
</table>

${inquiryBox("account security")}

${ticketSupportEmbed()}

${recommendedActionsHtml()}

${suggestedActionsHtml()}

${feedbackHtml("password_change")}

<p style="font-size:14px;color:#333;margin-top:22px;">Best regards,<br><span style="color:#C8A766;font-weight:600;">JBJ Global Real Estate Team</span></p>
</td></tr>`;

    const emailHtml = emailShell("Security Notification", bodyContent);

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "JBJ Security <contact@jbj.ae>",
        reply_to: "CONTACT@JBJ.AE",
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
