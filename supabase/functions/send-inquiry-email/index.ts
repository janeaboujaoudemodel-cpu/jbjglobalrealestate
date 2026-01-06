import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Allowed origins
const ALLOWED_ORIGINS = [
  "https://jjglobalcapital.com",
  "https://www.jjglobalcapital.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith(".lovableproject.com") || origin.endsWith(".lovable.app")
  );
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Input validation schema
const InquiryRequestSchema = z.object({
  fullName: z.string()
    .min(1, "Full name is required")
    .max(100, "Full name must be less than 100 characters")
    .trim(),
  email: z.string()
    .email("Invalid email address")
    .max(200, "Email must be less than 200 characters")
    .trim()
    .toLowerCase(),
  phone: z.string()
    .min(1, "Phone number is required")
    .max(30, "Phone number must be less than 30 characters")
    .trim(),
  nationality: z.string()
    .min(1, "Nationality is required")
    .max(100, "Nationality must be less than 100 characters")
    .trim(),
  language: z.string()
    .min(1, "Language is required")
    .max(50, "Language must be less than 50 characters")
    .trim(),
  message: z.string()
    .max(1000, "Message must be less than 1000 characters")
    .trim()
    .optional(),
  source: z.string().max(100).optional(),
  propertyName: z.string().max(200).optional(),
  context: z.record(z.string()).optional(),
});

// HTML escape function
function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
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
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const rawBody = await req.json();
    const parseResult = InquiryRequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request data", 
          details: parseResult.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { fullName, email, phone, nationality, language, message, source, propertyName, context } = parseResult.data;

    // Escape all user inputs
    const safeFullName = escapeHtml(fullName);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeNationality = escapeHtml(nationality);
    const safeLanguage = escapeHtml(language);
    const safeMessage = message ? escapeHtml(message) : '';
    const safeSource = source ? escapeHtml(source) : 'Website';
    const safePropertyName = propertyName ? escapeHtml(propertyName) : '';

    console.log("Processing inquiry from:", safeEmail);

    // Build context section if exists
    let contextHtml = '';
    if (context && Object.keys(context).length > 0) {
      contextHtml = `
        <div style="margin-top: 20px; padding: 15px; background: #0a0a0a; border-radius: 8px; border: 1px solid #333;">
          <div style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;">Search Context</div>
          ${Object.entries(context).map(([key, value]) => `
            <div style="color: #aaa; font-size: 14px; margin-bottom: 5px;">
              <span style="color: #666;">${escapeHtml(key)}:</span> ${escapeHtml(value)}
            </div>
          `).join('')}
        </div>
      `;
    }

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
          .message-box { margin-top: 20px; padding: 20px; background: #0a0a0a; border-radius: 8px; border: 1px solid #A8925A; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">JJ <span>|</span> GLOBAL CAPITAL</div>
          </div>
          <div class="badge">${safeSource} Inquiry</div>
          <h1>${safePropertyName ? `Property Inquiry: ${safePropertyName}` : 'New Website Inquiry'}</h1>
          <p style="color: #aaa; margin-bottom: 25px;">A potential client has submitted an inquiry through the website.</p>
          
          <div class="field">
            <div class="label">Full Name</div>
            <div class="value">${safeFullName}</div>
          </div>
          
          <div class="field">
            <div class="label">Email</div>
            <div class="value"><a href="mailto:${safeEmail}" style="color: #A8925A;">${safeEmail}</a></div>
          </div>
          
          <div class="field">
            <div class="label">Phone</div>
            <div class="value"><a href="tel:${safePhone}" style="color: #A8925A;">${safePhone}</a></div>
          </div>
          
          <div class="field">
            <div class="label">Nationality</div>
            <div class="value">${safeNationality}</div>
          </div>
          
          <div class="field">
            <div class="label">Preferred Language</div>
            <div class="value">${safeLanguage}</div>
          </div>
          
          ${safeMessage ? `
          <div class="message-box">
            <div class="label">Message</div>
            <div class="value" style="margin-top: 10px; white-space: pre-wrap;">${safeMessage}</div>
          </div>
          ` : ''}
          
          ${contextHtml}
          
          <div class="footer">
            <p>This inquiry was submitted from the website.</p>
            <p style="margin-top: 10px;">JJ Global Capital • Part of JJ Holding Group</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = safePropertyName 
      ? `Property Inquiry: ${safePropertyName} - ${safeFullName}`
      : `New Website Inquiry: ${safeFullName}`;

    // Send to both email addresses
    await Promise.all([
      sendEmail("contact@jjglobalcapital.com", subject, companyEmailHtml),
      sendEmail("jane@jjglobalcapital.com", subject, companyEmailHtml),
    ]);

    console.log("Inquiry emails sent successfully for:", safeEmail);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-inquiry-email function:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
