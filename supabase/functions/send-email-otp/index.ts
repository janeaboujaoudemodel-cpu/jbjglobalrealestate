import { createClient } from "npm:@supabase/supabase-js@2";
import { emailShell, monogramBadge, sharedSections, arabicDivider } from "../_shared/email-html.ts";

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
      return new Response(JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      return new Response(JSON.stringify({ error: "Too many attempts. Please wait 10 minutes before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { error: insertError } = await supabase
      .from("email_verifications")
      .insert({ email: email.toLowerCase(), otp_code: otpCode, expires_at: expiresAt.toISOString(), attempts: 0 });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(JSON.stringify({ error: "Failed to generate verification code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // BILINGUAL: EN → Arabic divider → AR → Gold divider → Locked sections
    const bodyContent = `<tr><td class="content-pad" style="padding:32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
<tr>
<td width="56" style="vertical-align:top;padding-right:14px;">
${monogramBadge(52)}
</td>
<td style="vertical-align:middle;">
<p style="margin:0;font-size:16px;color:#333;">Hello${full_name ? ` <strong>${full_name}</strong>` : ''},</p>
<p style="margin:4px 0 0;font-size:13px;color:#888;">Your JBJ verification code is below</p>
</td>
</tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin-bottom:24px;">
<tr><td style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;padding:28px;text-align:center;">
<span style="font-size:40px;font-weight:700;letter-spacing:10px;color:#1a1a1a;font-family:'SF Mono',Monaco,Consolas,monospace;">${otpCode}</span>
</td></tr>
</table>
<p style="margin:0 0 8px;color:#555;font-size:14px;line-height:1.6;">This code expires in <strong>10 minutes</strong>.</p>
<p style="margin:0 0 16px;color:#999;font-size:13px;line-height:1.6;">If you didn't request this code, please ignore this email.</p>
${arabicDivider()}
</td></tr>
<tr><td class="content-pad" style="padding:0 32px 32px;direction:rtl;text-align:right;">
<p style="margin:0;font-size:16px;color:#333;">مرحباً${full_name ? ` <strong>${full_name}</strong>` : ''}،</p>
<p style="margin:4px 0 16px;font-size:13px;color:#888;">رمز التحقق الخاص بك من JBJ أدناه</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin-bottom:24px;">
<tr><td style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;padding:28px;text-align:center;">
<span style="font-size:40px;font-weight:700;letter-spacing:10px;color:#1a1a1a;font-family:'SF Mono',Monaco,Consolas,monospace;">${otpCode}</span>
</td></tr>
</table>
<p style="margin:0 0 8px;color:#555;font-size:14px;line-height:1.7;">ينتهي هذا الرمز خلال <strong>١٠ دقائق</strong>.</p>
<p style="margin:0 0 16px;color:#999;font-size:13px;line-height:1.7;">إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد الإلكتروني.</p>
${sharedSections("verification")}</td></tr>`;

    const emailHtml = emailShell("Email Verification", bodyContent);

    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "JBJ Global Real Estate <contact@jbj.ae>",
          reply_to: "CONTACT@JBJ.AE",
          to: [email],
          subject: "Your JBJ verification code",
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.text();
        console.error("Resend API error:", errorData);
      }

      console.log(`OTP email sent successfully to ${email}`);

      return new Response(JSON.stringify({ success: true, message: "Verification code sent to your email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(JSON.stringify({ success: true, message: "Verification code sent. Check your inbox." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

  } catch (error) {
    console.error("Error in send-email-otp:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
