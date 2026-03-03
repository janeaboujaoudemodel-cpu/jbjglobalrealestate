import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { emailShell, lockIconBadge, sharedSections, ticketSummaryCard, arabicDivider } from "../_shared/email-html.ts";

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

    const bodyContent = `<tr><td class="content-pad" style="padding:32px;">
<p style="margin:0 0 8px;font-size:26px;font-weight:800;color:#1a1a1a;line-height:1.2;">Password Changed Successfully</p>
<p style="margin:0 0 20px;font-size:15px;color:#C8A766;font-weight:700;">Your account security has been updated</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
<tr><td style="text-align:center;">${lockIconBadge(74)}</td></tr>
</table>
<p style="margin:0;font-size:16px;font-weight:600;color:#1a1a1a;">Dear ${recipientName},</p>
<p style="margin:8px 0 20px;font-size:14px;line-height:1.6;color:#444;">Your password was changed. If this was you, no further action is needed.</p>
${ticketSummaryCard([
  { label: 'Date', value: formattedDate },
  { label: 'Time', value: `${formattedTime} (GMT)` },
  { label: 'Device', value: deviceInfo },
  { label: 'Browser', value: browserInfo },
])}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:#fef2f2;border:1px solid #fca5a5;border-radius:18px;margin-bottom:16px;">
<tr><td style="padding:16px;min-height:84px;">
<p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;"><strong>Didn't make this change?</strong><br/>Please contact our support team immediately.</p>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;"><tr><td align="center">
<a href="mailto:CONTACT@JBJ.AE?subject=Unauthorized Password Change" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">Report Unauthorized Access</a>
</td></tr></table>
${arabicDivider()}
</td></tr>
<tr><td class="content-pad" style="padding:32px;direction:rtl;text-align:right;">
<p style="margin:0 0 8px;font-size:26px;font-weight:800;color:#1a1a1a;line-height:1.2;">تم تغيير كلمة المرور بنجاح</p>
<p style="margin:0 0 20px;font-size:15px;color:#C8A766;font-weight:700;">تم تحديث أمان حسابك</p>
<p style="margin:0;font-size:16px;font-weight:600;color:#1a1a1a;">عزيزي/عزيزتي ${recipientName}،</p>
<p style="margin:8px 0 20px;font-size:14px;line-height:1.6;color:#444;">تم تغيير كلمة المرور الخاصة بك. إذا كنت أنت من قام بذلك، فلا حاجة لأي إجراء إضافي.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">ملخص الطلب</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:7px 0;color:#666;font-size:13px;width:40%;border-left:1px solid #C8A76630;padding-left:12px;">التاريخ</td><td style="padding:7px 12px 7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${formattedDate}</td></tr>
<tr><td style="padding:7px 0;color:#666;font-size:13px;border-left:1px solid #C8A76630;padding-left:12px;">الوقت</td><td style="padding:7px 12px 7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${formattedTime} (GMT)</td></tr>
<tr><td style="padding:7px 0;color:#666;font-size:13px;border-left:1px solid #C8A76630;padding-left:12px;">الجهاز</td><td style="padding:7px 12px 7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${deviceInfo}</td></tr>
<tr><td style="padding:7px 0;color:#666;font-size:13px;border-left:1px solid #C8A76630;padding-left:12px;">المتصفح</td><td style="padding:7px 12px 7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${browserInfo}</td></tr>
</table>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:#fef2f2;border:1px solid #fca5a5;border-radius:18px;margin-bottom:16px;">
<tr><td style="padding:16px;min-height:84px;">
<p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;"><strong>لم تقم بهذا التغيير؟</strong><br/>يرجى التواصل مع فريق الدعم فوراً.</p>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;"><tr><td align="center">
<a href="mailto:CONTACT@JBJ.AE?subject=Unauthorized Password Change" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">الإبلاغ عن وصول غير مصرح به</a>
</td></tr></table>
${arabicDivider()}
${sharedSections("account security", "JBJ Global Real Estate Team")}</td></tr>`;

    const emailHtml = emailShell("Security Notification", bodyContent);

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "JBJ Security <contact@jbj.ae>",
        reply_to: "CONTACT@JBJ.AE",
        to: [email],
        subject: "Your Password Was Changed — JBJ Global Real Estate",
        html: emailHtml,
      }),
    });

    const emailResponse = await emailRes.json();
    if (!emailRes.ok) console.error("Resend API error:", JSON.stringify(emailResponse));
    else console.log("Password change confirmation email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-password-change-confirmation:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
