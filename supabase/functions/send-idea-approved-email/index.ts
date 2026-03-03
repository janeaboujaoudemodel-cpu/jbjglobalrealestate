import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SITE_URL, emailShell, inquiryBox, recommendedActionsHtml, suggestedActionsHtml, ticketSupportEmbed, feedbackHtml, progressSteps, arabicDivider } from "../_shared/email-html.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    if (!userEmail || !ideaTitle) throw new Error("Missing required fields: userEmail and ideaTitle");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (userId) {
      await supabase.from("user_notifications").insert({
        user_id: userId, type: "idea_received",
        title: "Idea Received!",
        message: `Your idea "${ideaTitle}" has been received. You earned ${pointsAwarded} loyalty points!`,
        metadata: { ideaId, pointsAwarded },
      });
    }

    const bodyContent = `
<!-- Content -->
<tr><td class="content-pad" style="padding:32px;">

<p style="margin:0 0 8px;font-size:28px;font-weight:800;color:#1a1a1a;">Congratulations, ${userName || 'Valued Customer'}!</p>

<!-- Progress Steps -->
${progressSteps(['Received', 'Under Review', 'Accepted'], [true, false, false], [true, false, false])}

<!-- Points Card -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:24px;text-align:center;">
<p style="font-size:36px;font-weight:bold;color:#C8A766;margin:0 0 8px;">+${pointsAwarded} Points</p>
<p style="font-size:16px;color:#333;font-style:italic;margin:0;">"${ideaTitle}"</p>
</td></tr>
</table>

<p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 16px;">
Great news! Your creative idea has been received by our team. As a token of our appreciation, we've added <strong>${pointsAwarded} loyalty points</strong> to your account.
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

${inquiryBox("idea submission")}

${ticketSupportEmbed()}

${recommendedActionsHtml()}

${suggestedActionsHtml()}

${feedbackHtml("idea")}

<p style="font-size:14px;color:#333;margin-top:24px;">Best regards,<br><span style="color:#C8A766;font-weight:600;">JBJ Global Real Estate Team</span></p>

<!-- ═══ Arabic Content ═══ -->
${arabicDivider()}

<div style="direction:rtl;text-align:right;">
<p style="margin:0;font-size:28px;font-weight:800;color:#1a1a1a;">تهانينا، ${userName || 'عميلنا الكريم'}!</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin:16px 0 24px;">
<tr><td style="padding:24px;text-align:center;">
<p style="font-size:36px;font-weight:bold;color:#C8A766;margin:0 0 8px;">+${pointsAwarded} نقطة</p>
<p style="font-size:16px;color:#333;font-style:italic;margin:0;">"${ideaTitle}"</p>
</td></tr>
</table>

<p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 16px;">
أخبار رائعة! تم استلام فكرتك الإبداعية من قبل فريقنا. كتقدير لجهودك، أضفنا <strong>${pointsAwarded} نقطة ولاء</strong> إلى حسابك.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td align="center">
<a href="${SITE_URL}/my-account" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;border:1px solid #C8A76650;">عرض حسابي</a>
</td></tr>
</table>

<p style="font-size:14px;color:#333;">مع أطيب التحيات،<br><span style="color:#C8A766;font-weight:600;">فريق JBJ Global Real Estate</span></p>
</div>
</td></tr>`;

    const emailHtml = emailShell("Idea Received", bodyContent);

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "JBJ Global Real Estate <contact@jbj.ae>",
        reply_to: "CONTACT@JBJ.AE",
        to: [userEmail],
        subject: `Your idea has been received! +${pointsAwarded} points`,
        html: emailHtml,
      }),
    });
    const emailResponse = await emailRes.json();
    if (!emailRes.ok) console.error("Resend API error:", JSON.stringify(emailResponse));

    console.log("Idea received email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-idea-approved-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
