import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email Rule: First letter capitalized, JBJ always in capitals
const OFFICIAL_EMAILS = {
  support: 'Support@JBJ.ae',
  contact: 'Contact@JBJ.ae',
  privacy: 'Privacy@JBJ.ae',
  careers: 'Careers@JBJ.ae',
  partnerships: 'Partnerships@JBJ.ae',
  security: 'Security@JBJ.ae',
};

interface TicketRequest {
  fullName: string;
  email: string;
  phone?: string;
  serviceCategory: string;
  subject: string;
  description: string;
  priority?: string;
  escalateToTech?: boolean;
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
      priority = "normal",
      escalateToTech = false,
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

    // AI Priority Analysis - detect actual severity based on keywords
    const analyzePriority = (desc: string, subj: string, userPriority: string): string => {
      const text = `${desc} ${subj}`.toLowerCase();
      
      // Critical keywords
      const criticalKeywords = ['urgent', 'emergency', 'cannot access', 'locked out', 'security breach', 
        'data loss', 'payment failed', 'money lost', 'critical', 'immediately', 'down', 'not working at all'];
      
      // High priority keywords  
      const highKeywords = ['important', 'asap', 'broken', 'error', 'failed', 'stuck', 'blocked',
        'cannot login', 'not loading', 'crash', 'freeze'];
      
      // Low priority keywords
      const lowKeywords = ['suggestion', 'feature request', 'would be nice', 'minor', 'small issue',
        'when you have time', 'not urgent'];
      
      let detectedPriority = userPriority;
      
      if (criticalKeywords.some(kw => text.includes(kw))) {
        detectedPriority = 'critical';
      } else if (highKeywords.some(kw => text.includes(kw))) {
        detectedPriority = detectedPriority === 'low' || detectedPriority === 'normal' ? 'high' : detectedPriority;
      } else if (lowKeywords.some(kw => text.includes(kw))) {
        detectedPriority = detectedPriority === 'critical' || detectedPriority === 'high' ? 'normal' : 'low';
      }
      
      return detectedPriority;
    };

    const aiAnalyzedPriority = analyzePriority(description, subject, priority);

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
        priority: aiAnalyzedPriority,
        escalate_to_tech: escalateToTech,
        user_selected_priority: priority,
        ai_analyzed_priority: aiAnalyzedPriority
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
        to: [OFFICIAL_EMAILS.support],
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
          .ticket-box { background: linear-gradient(135deg, #C8A766, #B8956E); padding: 25px; text-align: center; border-radius: 10px; margin: 20px 0; position: relative; }
          .ticket-number { font-size: 28px; font-weight: bold; color: #fff; letter-spacing: 2px; user-select: all; cursor: pointer; }
          .copy-hint { font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 8px; }
          .message { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; background: #f0f0f0; }
          .gold { color: #C8A766; }
          .warning-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .warning-box strong { color: #856404; }
          .contact-box { background: #e8f4fd; border: 1px solid #0d6efd; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
          .email-link { color: #C8A766; font-weight: bold; text-decoration: none; font-size: 16px; }
          .email-link:hover { text-decoration: underline; }
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
              <p style="color: #fff; margin: 0 0 10px 0; font-size: 14px;">Your Ticket Number (Click to Copy)</p>
              <p class="ticket-number">${ticket.ticket_number}</p>
              <p class="copy-hint">📋 Select and copy your ticket number for reference</p>
            </div>

            <div class="message">
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our support team will review your ticket within 24 hours</li>
                <li>You'll receive updates via email</li>
                <li>Please keep your ticket number for reference</li>
              </ul>
            </div>

            <div class="warning-box">
              <strong>⚠️ Important:</strong> This is an automatic email generated from our system. <strong>Please do not reply to this email</strong> as we won't receive your message.
            </div>

            <div class="contact-box">
              <p style="margin: 0 0 10px 0; color: #333;">Need to add more information or have urgent concerns?</p>
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Copy your ticket number and add it to the subject line, then send directly to:</p>
              <a href="mailto:${OFFICIAL_EMAILS.support}?subject=[Ticket: ${ticket.ticket_number}] Follow-up" class="email-link">${OFFICIAL_EMAILS.support}</a>
            </div>

            <p>Best regards,<br><span class="gold">JBJ Global Real Estate Support Team</span></p>
          </div>
          <div class="footer">
            <p>© 2026 JBJ Global Real Estate. All rights reserved.</p>
            <p><strong>This is an automated confirmation. Do not reply to this email.</strong></p>
            <p style="font-size: 10px; color: #aaa;">If you reply to this email, your message will not be received.</p>
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
