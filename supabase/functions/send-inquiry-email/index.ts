import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { emailShell, sharedSections } from "../_shared/email-html.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Allowed origins
const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
  "http://localhost:5173",
  "http://localhost:8080",
];

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 5; // 5 inquiries per 5 minutes per IP

// Auto-block configuration
const AUTO_BLOCK_THRESHOLD = 3;
const AUTO_BLOCK_DURATION_HOURS = 24;

interface RateLimitEntry {
  id: string;
  function_name: string;
  rate_key: string;
  window_start: string;
  request_count: number;
}

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

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

async function checkIPBlocklist(supabaseAdmin: any, clientIp: string): Promise<{ blocked: boolean; reason?: string }> {
  try {
    const { data, error } = await supabaseAdmin.from("ip_blocklist").select("*").eq("ip_address", clientIp).maybeSingle();
    if (error || !data) return { blocked: false };
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabaseAdmin.from("ip_blocklist").delete().eq("id", data.id);
      return { blocked: false };
    }
    await supabaseAdmin.from("ip_blocklist").update({ last_attempt_at: new Date().toISOString(), block_count: (data.block_count || 1) + 1 }).eq("id", data.id);
    return { blocked: true, reason: data.reason || "IP is blocked" };
  } catch (err) {
    console.error("IP blocklist check error:", err);
    return { blocked: false };
  }
}

async function checkRateLimit(supabaseAdmin: any, rateKey: string, clientIp: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const functionName = "send-inquiry-email";
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

  const { data: existingEntry, error: fetchError } = await supabaseAdmin
    .from("function_rate_limits").select("*").eq("function_name", functionName).eq("rate_key", rateKey)
    .gte("window_start", windowStart.toISOString()).order("window_start", { ascending: false }).limit(1).maybeSingle();

  if (fetchError) return { allowed: true };
  const entry = existingEntry as RateLimitEntry | null;

  if (entry) {
    if (entry.request_count >= MAX_REQUESTS_PER_WINDOW) {
      const windowEndTime = new Date(entry.window_start).getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
      const retryAfterSeconds = Math.ceil((windowEndTime - Date.now()) / 1000);
      console.warn(`Rate limit exceeded for key: ${rateKey.substring(0, 8)}***`);
      const violationCount = await trackRateLimitViolation(supabaseAdmin, clientIp, functionName);
      if (violationCount >= AUTO_BLOCK_THRESHOLD) await autoBlockIP(supabaseAdmin, clientIp, functionName, violationCount);
      return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 0) };
    }
    await supabaseAdmin.from("function_rate_limits").update({ request_count: entry.request_count + 1 }).eq("id", entry.id);
  } else {
    await supabaseAdmin.from("function_rate_limits").insert({ function_name: functionName, rate_key: rateKey, window_start: new Date().toISOString(), request_count: 1 });
  }
  return { allowed: true };
}

async function trackRateLimitViolation(supabaseAdmin: any, clientIp: string, functionName: string): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { data: violations } = await supabaseAdmin.from("function_rate_limits").select("*").eq("rate_key", clientIp).gte("window_start", oneDayAgo.toISOString()).gte("request_count", MAX_REQUESTS_PER_WINDOW);
  return violations?.length || 0;
}

async function sendAutoBlockNotification(clientIp: string, functionName: string, violationCount: number, blockCount: number, expiresAt: Date): Promise<void> {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) return;
    const maskedIp = `${clientIp.substring(0, 8)}***`;
    const expiresAtFormatted = expiresAt.toLocaleString("en-US", { timeZone: "Asia/Dubai", dateStyle: "medium", timeStyle: "short" });
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: "JBJ Security <contact@jbj.ae>",
        to: ["CONTACT@JBJ.AE"],
        subject: `🚨 Security Alert: IP Auto-Blocked on ${functionName}`,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px; border-radius: 8px 8px 0 0;"><h1 style="color: #c9a962; margin: 0;">🚨 Security Alert</h1><p style="color: #fff; margin: 10px 0 0;">IP Auto-Blocked</p></div><div style="background: #f8f9fa; padding: 25px; border: 1px solid #e9ecef; border-radius: 0 0 8px 8px;"><h2 style="color: #1a1a2e; margin-top: 0;">Block Details</h2><p><strong>IP:</strong> ${maskedIp}</p><p><strong>Function:</strong> ${functionName}</p><p><strong>Violations:</strong> ${violationCount}</p><p><strong>Total Blocks:</strong> ${blockCount}</p><p><strong>Expires:</strong> ${expiresAtFormatted} (Dubai)</p><p><strong>Duration:</strong> ${AUTO_BLOCK_DURATION_HOURS} hours</p><div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107;"><strong>Action Required:</strong> Review in Admin Dashboard.</div></div></div>`,
      }),
    });
    console.log("Auto-block notification sent");
  } catch (err) {
    console.error("Error sending notification:", err);
  }
}

async function autoBlockIP(supabaseAdmin: any, clientIp: string, functionName: string, violationCount: number): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + AUTO_BLOCK_DURATION_HOURS * 60 * 60 * 1000);
    const { data: existing } = await supabaseAdmin.from("ip_blocklist").select("id, block_count").eq("ip_address", clientIp).maybeSingle();
    let blockCount = 1;
    if (existing) {
      blockCount = (existing.block_count || 1) + 1;
      await supabaseAdmin.from("ip_blocklist").update({ expires_at: expiresAt.toISOString(), block_count: blockCount, reason: `Auto-blocked: ${violationCount} rate limit violations on ${functionName}`, last_attempt_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("ip_blocklist").insert({ ip_address: clientIp, reason: `Auto-blocked: ${violationCount} rate limit violations on ${functionName}`, is_permanent: false, expires_at: expiresAt.toISOString(), block_count: 1 });
    }
    console.warn(`Auto-blocked IP: ${clientIp.substring(0, 8)}*** for ${AUTO_BLOCK_DURATION_HOURS} hours`);
    await sendAutoBlockNotification(clientIp, functionName, violationCount, blockCount, expiresAt);
  } catch (err) {
    console.error("Error auto-blocking IP:", err);
  }
}

// Input validation schema - nationality and language are optional with defaults
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
    .trim()
    // E.164 (+ and 7-15 digits)
    .regex(/^\+[1-9]\d{6,14}$/, "Invalid phone number. Include country code (e.g., +971...)"),
  nationality: z.string()
    .max(100, "Nationality must be less than 100 characters")
    .trim()
    .optional()
    .default("Not specified"),
  language: z.string()
    .max(50, "Language must be less than 50 characters")
    .trim()
    .optional()
    .default("English"),
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
      from: "JBJ Global Real Estate <contact@jbj.ae>",
      to: [to],
      reply_to: "CONTACT@JBJ.AE",
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
    // Get Supabase service client for rate limiting
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const clientIp = getClientIp(req);

    // Check IP blocklist first
    const blocklistResult = await checkIPBlocklist(supabaseService, clientIp);
    if (blocklistResult.blocked) {
      console.warn(`Blocked IP attempted send-inquiry-email: ${clientIp.substring(0, 8)}***`);
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit using IP (public endpoint)
    const rateLimitResult = await checkRateLimit(supabaseService, clientIp, clientIp);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIp.substring(0, 8)}***`);
      return new Response(
        JSON.stringify({ error: "Too many inquiries. Please try again later." }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfterSeconds || 300)
          } 
        }
      );
    }

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
    const contextRows = context && Object.keys(context).length > 0
      ? Object.entries(context).map(([key, value]) => `<tr><td style="padding:6px 0;color:#666;font-size:13px;width:38%;">${escapeHtml(key)}</td><td style="padding:6px 0;color:#1a1a1a;font-size:13px;font-weight:600;">${escapeHtml(value)}</td></tr>`).join("")
      : "";

    const companyEmailHtml = emailShell("Inquiries Desk", `<tr><td class="content-pad" style="padding:32px;">
<p style="font-size:15px;color:#333;margin:0 0 16px;">A new website inquiry has been received.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Inquiry Summary</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:7px 0;color:#666;font-size:13px;width:40%;">Source</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${safeSource}</td></tr>
<tr><td style="padding:7px 0;color:#666;font-size:13px;">Property</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${safePropertyName || "General Website Inquiry"}</td></tr>
<tr><td style="padding:7px 0;color:#666;font-size:13px;">Full Name</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${safeFullName}</td></tr>
<tr><td style="padding:7px 0;color:#666;font-size:13px;">Email</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;"><a href="mailto:${safeEmail}" style="color:#1a1a1a;text-decoration:underline;">${safeEmail}</a></td></tr>
<tr><td style="padding:7px 0;color:#666;font-size:13px;">Phone</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;"><a href="tel:${safePhone}" style="color:#1a1a1a;text-decoration:underline;">${safePhone}</a></td></tr>
<tr><td style="padding:7px 0;color:#666;font-size:13px;">Nationality</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${safeNationality}</td></tr>
<tr><td style="padding:7px 0;color:#666;font-size:13px;">Preferred Language</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${safeLanguage}</td></tr>
</table>
</td></tr></table>
${safeMessage ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;"><tr><td style="padding:20px;"><p style="margin:0 0 8px;font-size:12px;color:#C8A766;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;">Client Message</p><p style="margin:0;color:#333;font-size:14px;line-height:1.8;white-space:pre-wrap;">${safeMessage}</p></td></tr></table>` : ""}
${contextRows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fdfbf7;border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;"><tr><td style="padding:20px;"><p style="margin:0 0 8px;font-size:12px;color:#666;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Search Context</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${contextRows}</table></td></tr></table>` : ""}
${sharedSections("inquiry submission", "JBJ Global Real Estate Inquiries Desk")}
</td></tr>`);

    const subject = safePropertyName 
      ? `Property Inquiry: ${safePropertyName} - ${safeFullName}`
      : `New Website Inquiry: ${safeFullName}`;

    // Send to company email (best-effort)
    // 🔒 EMAIL RULE: ALL EMAILS MUST BE FULL CAPITAL LETTERS
    let emailSent = false;
    try {
      await sendEmail("CONTACT@JBJ.AE", subject, companyEmailHtml);
      emailSent = true;
      console.log("Inquiry email sent successfully for:", safeEmail);
    } catch (sendErr) {
      // IMPORTANT: Do not fail the entire request if email delivery is blocked by provider settings.
      console.error("Inquiry email delivery failed (lead may still be saved elsewhere):", sendErr);
    }

    return new Response(JSON.stringify({ success: true, emailSent }), {
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
