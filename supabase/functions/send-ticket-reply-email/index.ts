import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VERIFIED_SENDER = "NOREPLY@JBJ.AE";

interface ReplyEmailRequest {
  ticketNumber: string;
  customerEmail: string;
  customerName: string;
  replyMessage: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketNumber, customerEmail, customerName, replyMessage }: ReplyEmailRequest = await req.json();

    if (!ticketNumber || !customerEmail || !replyMessage) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; }
          .header { background: linear-gradient(135deg, #000 0%, #1a1a1a 50%, #2d2d2d 100%); padding: 30px; text-align: center; }
          .header h1 { color: #C8A766; margin: 0 0 10px 0; font-size: 24px; }
          .header p { color: #fff; margin: 0; font-size: 14px; }
          .ticket-badge { display: inline-block; background: rgba(200,167,102,0.2); border: 1px solid #C8A766; color: #C8A766; padding: 8px 20px; border-radius: 20px; font-family: monospace; font-size: 16px; font-weight: bold; margin-top: 15px; }
          .content { padding: 30px; background: #fff; }
          .reply-box { background: linear-gradient(135deg, #fdfbf7, #f5f0e6); border: 2px solid #C8A766; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .reply-label { color: #C8A766; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 600; }
          .reply-content { color: #333; font-size: 15px; white-space: pre-wrap; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #C8A766, #B8956E); color: #000; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; margin-top: 20px; }
          .footer { background: #1a1a1a; text-align: center; padding: 25px; color: #888; font-size: 12px; }
          .footer-brand { color: #C8A766; font-size: 16px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>JBJ Global Real Estate</h1>
            <p>New Reply to Your Support Ticket</p>
            <div class="ticket-badge">${ticketNumber}</div>
          </div>
          
          <div class="content">
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>Our support team has responded to your ticket. Please see the reply below:</p>
            
            <div class="reply-box">
              <div class="reply-label">Staff Reply</div>
              <div class="reply-content">${replyMessage}</div>
            </div>
            
            <p>If you need further assistance, you can reply to this ticket by visiting our website or contacting us directly.</p>
            
            <center>
              <a href="https://jbjglobalrealestate.lovable.app/contact" class="cta-button">Contact Us</a>
            </center>
            
            <p style="margin-top: 30px; color: #666; font-size: 13px;">
              If you believe this issue is resolved, no further action is needed. We appreciate your patience.
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-brand">JBJ Global Real Estate</div>
            <p>Your Trusted Partner in UAE Property</p>
            <p>📞 +971 56 591 1000 | ✉️ SUPPORT@JBJ.AE</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResult = await resend.emails.send({
      from: `JBJ Support <${VERIFIED_SENDER}>`,
      to: [customerEmail],
      subject: `[${ticketNumber}] Update on Your Support Ticket`,
      html: emailHtml,
    });

    console.log("Reply email sent:", emailResult);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending reply email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
