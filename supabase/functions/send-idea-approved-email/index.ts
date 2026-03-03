import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SITE_URL, emailShell, progressSteps, arabicDivider, sharedSections } from "../_shared/email-html.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IdeaEmailRequest {
  ideaId: string;
  userId: string;
  userEmail: string;
  userName: string;
  ideaTitle: string;
  status: "received" | "approved";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ideaId, userId, userEmail, userName, ideaTitle, status }: IdeaEmailRequest = await req.json();

    if (!userEmail || !ideaTitle) throw new Error("Missing required fields: userEmail and ideaTitle");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const isApproved = status === "approved";

    if (userId) {
      const notifTitle = isApproved ? "Idea Approved! +50 Points" : "Idea Received!";
      const notifMessage = isApproved
        ? `Your idea "${ideaTitle}" has been approved! You earned 50 loyalty points!`
        : `Your idea "${ideaTitle}" has been received and is under review.`;
      await Promise.all([
        supabase.from("user_notifications").insert({
          user_id: userId, type: isApproved ? "idea_approved" : "idea_received",
          title: notifTitle, message: notifMessage,
          metadata: { ideaId, pointsAwarded: isApproved ? 50 : 0, action_url: "/my-account" },
        }),
        supabase.from("notifications").insert({
          user_id: userId, title: notifTitle,
          body: notifMessage, notification_type: isApproved ? "approval" : "event",
          action_url: "/my-account",
        }),
      ]);
    }

    const displayName = userName || 'Valued Customer';
    const displayNameAr = userName || 'عميلنا الكريم';

    let bodyContent: string;

    if (isApproved) {
      // STRUCTURE: EN → divider → AR → sharedSections (LTR, ONCE)
      bodyContent = `<tr><td class="content-pad" style="padding:32px;">
<p style="margin:0 0 8px;font-size:28px;font-weight:800;color:#1a1a1a;">Congratulations, ${displayName}!</p>
${progressSteps(['Received', 'Under Review', 'Accepted'], [true, true, true], [true, true, true])}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #22c55e;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:24px;text-align:center;">
<p style="font-size:36px;font-weight:bold;color:#16a34a;margin:0 0 8px;">+50 Points</p>
<p style="font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">LOYALTY POINTS EARNED</p>
<p style="font-size:16px;color:#333;font-style:italic;margin:0;">"${ideaTitle}"</p>
</td></tr></table>
<p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 16px;">Your creative idea has been <strong>approved</strong> by our team! As a reward, we've added <span style="color:#16a34a;font-weight:700;">50 loyalty points</span> to your account.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td align="center">
<a href="${SITE_URL}/my-account" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">View My Account</a>
</td></tr></table>
${arabicDivider()}
</td></tr>
<tr><td class="content-pad" style="padding:32px;direction:rtl;text-align:right;">
<p style="margin:0;font-size:28px;font-weight:800;color:#1a1a1a;">تهانينا، ${displayNameAr}!</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #22c55e;border-radius:18px;margin:16px 0 24px;">
<tr><td style="padding:24px;text-align:center;">
<p style="font-size:36px;font-weight:bold;color:#16a34a;margin:0 0 8px;">+50 نقطة</p>
<p style="font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">نقاط الولاء المكتسبة</p>
<p style="font-size:16px;color:#333;font-style:italic;margin:0;">"${ideaTitle}"</p>
</td></tr></table>
<p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 16px;">تمت الموافقة على فكرتك الإبداعية! كمكافأة، أضفنا <span style="color:#16a34a;font-weight:700;">50 نقطة ولاء</span> إلى حسابك.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td align="center">
<a href="${SITE_URL}/my-account" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">عرض حسابي</a>
</td></tr></table>
${sharedSections("idea submission")}`;
    } else {
      bodyContent = `<tr><td class="content-pad" style="padding:32px;">
<p style="margin:0 0 8px;font-size:28px;font-weight:800;color:#1a1a1a;">Thank You, ${displayName}!</p>
${progressSteps(['Received', 'Under Review', 'Accepted'], [true, false, false], [true, false, false])}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:24px;text-align:center;">
<p style="font-size:16px;color:#333;font-style:italic;margin:0;">"${ideaTitle}"</p>
</td></tr></table>
<p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 16px;">Your idea has been received and is now under review by our team. If approved, you will earn <span style="color:#16a34a;font-weight:700;">50 loyalty points</span>!</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td align="center">
<a href="${SITE_URL}/my-account" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">View My Account</a>
</td></tr></table>
${arabicDivider()}
</td></tr>
<tr><td class="content-pad" style="padding:32px;direction:rtl;text-align:right;">
<p style="margin:0;font-size:28px;font-weight:800;color:#1a1a1a;">شكراً لك، ${displayNameAr}!</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;margin:16px 0 24px;">
<tr><td style="padding:24px;text-align:center;">
<p style="font-size:16px;color:#333;font-style:italic;margin:0;">"${ideaTitle}"</p>
</td></tr></table>
<p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 16px;">تم استلام فكرتك وهي الآن قيد المراجعة. إذا تمت الموافقة عليها، ستحصل على <span style="color:#16a34a;font-weight:700;">50 نقطة ولاء</span>!</p>
${sharedSections("idea submission")}`;
    }

    const emailHtml = emailShell(isApproved ? "Idea Approved" : "Idea Received", bodyContent);
    const subject = isApproved
      ? `Your idea has been approved! +50 points`
      : `Your idea has been received — under review`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "JBJ Global Real Estate <contact@jbj.ae>",
        reply_to: "CONTACT@JBJ.AE",
        to: [userEmail],
        subject,
        html: emailHtml,
      }),
    });
    const emailResponse = await emailRes.json();
    if (!emailRes.ok) console.error("Resend API error:", JSON.stringify(emailResponse));

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-idea-approved-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
