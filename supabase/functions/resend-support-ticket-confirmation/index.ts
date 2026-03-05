import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { emailShell, sharedSections, ticketSummaryCard, ticketSummaryCardAr, arabicDivider, userGreetingRow } from "../_shared/email-html.ts";

// Standard Resend API endpoint (Tokyo region is DNS verification location only, API is global)
const RESEND_API_URL = "https://api.resend.com/emails";

async function sendEmail(payload: { from: string; to: string[]; subject: string; html: string }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Resend API error:", JSON.stringify(data));
    return { error: data };
  }
  return { data };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VERIFIED_SENDER = "jbj@jbj.ae";
const ADMIN_EMAIL = "SUPPORT@JBJ.AE"; // Admin always receives a copy
const OFFICIAL_EMAILS = {
  support: "SUPPORT@JBJ.AE",
  contact: "CONTACT@JBJ.AE",
};

interface ResendRequest {
  ticketNumber: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { ticketNumber, email }: ResendRequest = await req.json();

    if (!ticketNumber || !email) {
      return new Response(
        JSON.stringify({ error: "Missing ticketNumber or email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the ticket
    const { data: ticket, error: findError } = await supabaseClient
      .from("support_tickets")
      .select("*")
      .eq("ticket_number", ticketNumber)
      .eq("email", email.toLowerCase().trim())
      .single();

    if (findError || !ticket) {
      return new Response(
        JSON.stringify({ error: "Ticket not found or email doesn't match" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const submittedAt = new Date(ticket.created_at || Date.now());
    const submittedEn = submittedAt.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const submittedAr = submittedAt.toLocaleString("ar-AE-u-nu-arab", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    const bodyContent = `<tr><td class="content-pad" style="padding:32px;">
${userGreetingRow(ticket.full_name)}
<p style="font-size:14px;color:#555;margin:0 0 22px;">This is a resend of your support ticket confirmation. Please keep your ticket details for follow-up.</p>
${ticketSummaryCard([
  { label: "Ticket Number", value: ticket.ticket_number, highlight: true },
  { label: "Subject", value: ticket.subject || "-" },
  { label: "Category", value: ticket.service_category || "General" },
  { label: "Status", value: ticket.status || "open" },
  { label: "Submitted", value: submittedEn },
])}
${arabicDivider()}
<div style="direction:rtl;text-align:right;">
${userGreetingRow(ticket.full_name, true)}
<p style="font-size:14px;color:#555;margin:0 0 22px;">هذه إعادة إرسال لتأكيد تذكرة الدعم الخاصة بك. يرجى الاحتفاظ ببيانات التذكرة للمتابعة.</p>
${ticketSummaryCardAr([
  { label: "رقم التذكرة", value: ticket.ticket_number, highlight: true },
  { label: "الموضوع", value: ticket.subject || "-" },
  { label: "الفئة", value: ticket.service_category || "عام" },
  { label: "الحالة", value: ticket.status || "مفتوحة" },
  { label: "تاريخ ووقت الإرسال", value: submittedAr },
])}
</div>
${sharedSections("support ticket", "JBJ Support Team")}
</td></tr>`;

    const emailHtml = emailShell("Support Ticket Confirmation", bodyContent);

    // Send to customer AND admin copy in parallel
    const [customerResult, adminResult] = await Promise.allSettled([
      sendEmail({
        from: `JBJ Support <${VERIFIED_SENDER}>`,
        to: [email],
        subject: `[${ticket.ticket_number}] Your Support Ticket Confirmation (Resent)`,
        html: emailHtml,
      }),
      sendEmail({
        from: `JBJ Support <${VERIFIED_SENDER}>`,
        to: [ADMIN_EMAIL],
        subject: `[ADMIN COPY - RESENT] ${ticket.ticket_number} → ${email}`,
        html: `<p><strong>Admin Copy:</strong> Confirmation resent to <strong>${email}</strong> (${ticket.full_name})</p><hr/>${emailHtml}`,
      }),
    ]);

    // Properly check Resend SDK response (returns {data, error} not throws)
    let emailSent = false;
    let emailError: string | null = null;

    if (customerResult.status === 'fulfilled') {
      const result = customerResult.value as any;
      if (result?.error) {
        emailError = result.error?.message || JSON.stringify(result.error);
        console.error("Resend error (customer):", result.error);
      } else if (result?.data?.id || result?.id) {
        emailSent = true;
        console.log("Confirmation email resent successfully to:", email);
      } else {
        emailError = "Unexpected response from email provider";
        console.error("Unexpected Resend response:", JSON.stringify(result));
      }
    } else {
      emailError = customerResult.reason?.message || "Network error";
      console.error("Failed to send resend email:", customerResult.reason);
    }

    if (adminResult.status === 'rejected') {
      console.warn("Admin copy failed (non-critical):", adminResult.reason);
    }

    // Update ticket with confirmation status
    await supabaseClient
      .from("support_tickets")
      .update({
        customer_confirmation_sent_at: emailSent ? new Date().toISOString() : null,
        customer_confirmation_status: emailSent ? "sent" : "failed",
        customer_confirmation_error: emailError,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    if (!emailSent) {
      return new Response(
        JSON.stringify({ success: false, error: emailError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Confirmation email resent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in resend confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
