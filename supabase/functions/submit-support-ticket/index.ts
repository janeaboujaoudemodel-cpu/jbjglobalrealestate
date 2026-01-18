import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketRequest {
  fullName: string;
  email: string;
  phone?: string;
  serviceCategory: string;
  subject: string;
  description: string;
  attachmentUrls?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      fullName,
      email,
      phone,
      serviceCategory,
      subject,
      description,
      attachmentUrls = []
    }: TicketRequest = await req.json();

    // Validate required fields
    if (!fullName || !email || !serviceCategory || !subject || !description) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user ID if authenticated
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await supabaseClient.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      userId = user?.id || null;
    }

    // Insert ticket into database
    const { data: ticket, error: insertError } = await supabaseClient
      .from("support_tickets")
      .insert({
        user_id: userId,
        full_name: fullName,
        email: email,
        phone: phone || null,
        service_category: serviceCategory,
        subject: subject,
        description: description,
        attachment_urls: attachmentUrls,
        status: "open",
        priority: "normal"
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create ticket" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Ticket created:", ticket.ticket_number);

    // Send email to support team
    const supportEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #C8A766, #B8956E); padding: 20px; text-align: center; }
          .header h1 { color: #fff; margin: 0; }
          .content { background: #f9f9f9; padding: 20px; }
          .ticket-info { background: #fff; padding: 15px; border-left: 4px solid #C8A766; margin: 15px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; margin-bottom: 10px; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 New Support Ticket</h1>
          </div>
          <div class="content">
            <div class="ticket-info">
              <p class="label">Ticket Number:</p>
              <p class="value" style="font-size: 24px; color: #C8A766; font-weight: bold;">${ticket.ticket_number}</p>
            </div>
            <div class="ticket-info">
              <p class="label">Customer Details:</p>
              <p class="value">Name: ${fullName}</p>
              <p class="value">Email: ${email}</p>
              ${phone ? `<p class="value">Phone: ${phone}</p>` : ""}
            </div>
            <div class="ticket-info">
              <p class="label">Service Category:</p>
              <p class="value">${serviceCategory}</p>
            </div>
            <div class="ticket-info">
              <p class="label">Subject:</p>
              <p class="value">${subject}</p>
            </div>
            <div class="ticket-info">
              <p class="label">Description:</p>
              <p class="value">${description}</p>
            </div>
            ${attachmentUrls.length > 0 ? `
              <div class="ticket-info">
                <p class="label">Attachments:</p>
                ${attachmentUrls.map((url: string) => `<p class="value"><a href="${url}">${url}</a></p>`).join("")}
              </div>
            ` : ""}
          </div>
          <div class="footer">
            <p>This ticket was submitted via JBJ Global Real Estate Support System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to support team
    try {
      await resend.emails.send({
        from: "JBJ Support <onboarding@resend.dev>",
        to: ["support@jbj.ae"],
        subject: `[${ticket.ticket_number}] New Support Ticket: ${subject}`,
        html: supportEmailHtml,
      });
      console.log("Support email sent");
    } catch (emailError) {
      console.error("Failed to send support email:", emailError);
      // Continue - don't fail the whole request
    }

    // Send confirmation email to customer
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #000, #1a1a1a); padding: 30px; text-align: center; }
          .header h1 { color: #C8A766; margin: 0; }
          .header p { color: #fff; margin: 10px 0 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .ticket-box { background: linear-gradient(135deg, #C8A766, #B8956E); padding: 25px; text-align: center; border-radius: 10px; margin: 20px 0; }
          .ticket-number { font-size: 28px; font-weight: bold; color: #fff; letter-spacing: 2px; }
          .message { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          .gold { color: #C8A766; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>JBJ Global Real Estate</h1>
            <p>Support Ticket Confirmation</p>
          </div>
          <div class="content">
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>We have received your support request and are sorry to hear you're experiencing an issue. Our team is committed to resolving this as quickly as possible.</p>
            
            <div class="ticket-box">
              <p style="color: #fff; margin: 0 0 10px 0; font-size: 14px;">Your Ticket Number</p>
              <p class="ticket-number">${ticket.ticket_number}</p>
            </div>

            <div class="message">
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our support team will review your ticket within 24 hours</li>
                <li>You'll receive updates via email</li>
                <li>Please keep your ticket number for reference</li>
              </ul>
            </div>

            <p>If you need to add more information or have urgent concerns, please reply to this email with your ticket number.</p>

            <p>Best regards,<br><span class="gold">JBJ Global Real Estate Support Team</span></p>
          </div>
          <div class="footer">
            <p>© 2026 JBJ Global Real Estate. All rights reserved.</p>
            <p>This is an automated confirmation. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send confirmation to customer
    try {
      await resend.emails.send({
        from: "JBJ Support <onboarding@resend.dev>",
        to: [email],
        subject: `Ticket Received: ${ticket.ticket_number} - We're on it!`,
        html: customerEmailHtml,
      });
      console.log("Customer confirmation email sent");
    } catch (emailError) {
      console.error("Failed to send customer email:", emailError);
      // Continue - don't fail the whole request
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticketNumber: ticket.ticket_number,
        message: "Your support ticket has been created successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in submit-support-ticket:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
