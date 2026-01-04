import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MarketReportRequest {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  language: string;
}

const sendEmail = async (to: string, subject: string, html: string) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "JJ Global Capital <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to send email: ${error}`);
  }
  
  return res.json();
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, email, phone, nationality, language }: MarketReportRequest = await req.json();

    // Send email to company (invest@jjglobalcapital.com and jane@jjglobalcapital.com)
    const companyEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 40px; }
          .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; padding: 30px; border: 1px solid #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid rgba(168, 146, 90, 0.3); padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 700; letter-spacing: 0.1em; }
          .logo span { color: #A8925A; }
          .badge { display: inline-block; padding: 8px 16px; background: rgba(168, 146, 90, 0.2); border-radius: 50px; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #A8925A; margin-bottom: 20px; }
          h1 { color: #A8925A; font-size: 22px; margin-bottom: 20px; }
          .field { margin-bottom: 16px; padding: 15px; background: #0a0a0a; border-radius: 8px; border: 1px solid #333; }
          .label { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px; }
          .value { color: #fff; font-size: 16px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">JJ <span>|</span> GLOBAL CAPITAL</div>
          </div>
          <div class="badge">New Market Report Download</div>
          <h1>New Lead from Market Report</h1>
          <p style="color: #aaa; margin-bottom: 25px;">A visitor has downloaded the UAE Market Intelligence book.</p>
          
          <div class="field">
            <div class="label">Full Name</div>
            <div class="value">${fullName}</div>
          </div>
          
          <div class="field">
            <div class="label">Email</div>
            <div class="value"><a href="mailto:${email}" style="color: #A8925A;">${email}</a></div>
          </div>
          
          <div class="field">
            <div class="label">Phone</div>
            <div class="value"><a href="tel:${phone}" style="color: #A8925A;">${phone}</a></div>
          </div>
          
          <div class="field">
            <div class="label">Nationality</div>
            <div class="value">${nationality}</div>
          </div>
          
          <div class="field">
            <div class="label">Preferred Language</div>
            <div class="value">${language}</div>
          </div>
          
          <div class="footer">
            <p>This lead was captured from the Market Report download page.</p>
            <p style="margin-top: 10px;">JJ Global Capital • Part of JJ Holding Group</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = `New Market Report Download: ${fullName}`;

    // Send to both email addresses
    await Promise.all([
      sendEmail("invest@jjglobalcapital.com", subject, companyEmailHtml),
      sendEmail("jane@jjglobalcapital.com", subject, companyEmailHtml),
    ]);

    console.log("Emails sent successfully to company addresses");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-market-report-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
