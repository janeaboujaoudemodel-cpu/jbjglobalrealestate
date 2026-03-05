import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

    // Build confirmation email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; }
          .header { background: linear-gradient(135deg, #000 0%, #1a1a1a 50%, #2d2d2d 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: #C8A766; margin: 0 0 10px 0; font-size: 28px; }
          .header p { color: #fff; margin: 0; font-size: 16px; }
          .content { padding: 30px; }
          .ticket-box { background: linear-gradient(135deg, #fdfbf7, #f5f0e6); border: 2px solid #C8A766; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
          .ticket-number { font-size: 28px; font-weight: bold; color: #C8A766; letter-spacing: 3px; font-family: monospace; }
          .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .summary-label { color: #666; }
          .summary-value { color: #333; font-weight: 600; }
          .footer { background: #1a1a1a; text-align: center; padding: 25px; color: #888; font-size: 12px; }
          .footer-brand { color: #C8A766; font-size: 16px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>JBJ Global Real Estate</h1>
            <p>Support Ticket Confirmation (Resent)</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${ticket.full_name}</strong>,</p>
            <p>This is a resend of your support ticket confirmation. Please save this ticket number for your reference:</p>
            
            <div class="ticket-box">
              <p style="color: #666; margin-bottom: 10px; font-size: 14px;">Your Ticket Number</p>
              <div class="ticket-number">${ticket.ticket_number}</div>
            </div>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div class="summary-row">
                <span class="summary-label">Subject:</span>
                <span class="summary-value">${ticket.subject}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Category:</span>
                <span class="summary-value">${ticket.service_category}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Status:</span>
                <span class="summary-value">${ticket.status}</span>
              </div>
            </div>
            
            <p>Our team will review your request and respond as soon as possible.</p>
            
            <p style="color: #666; font-size: 13px; margin-top: 30px;">
              For urgent matters, contact us at:<br>
              📞 +971 56 591 1000<br>
              ✉️ ${OFFICIAL_EMAILS.support}
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-brand">JBJ Global Real Estate</div>
            <p>Your Trusted Partner in UAE Property</p>
          </div>
        </div>
      </body>
      </html>
    `;

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
