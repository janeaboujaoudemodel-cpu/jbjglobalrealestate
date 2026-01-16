import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Simple inline validation (avoiding external zod import for deployment stability)
const validateRequest = (data: unknown): { success: boolean; data?: any; error?: string } => {
  if (!data || typeof data !== 'object') return { success: false, error: 'Invalid request body' };
  const obj = data as Record<string, unknown>;
  
  if (!obj.message || typeof obj.message !== 'string' || obj.message.length === 0 || obj.message.length > 5000) {
    return { success: false, error: 'Message is required and must be 1-5000 characters' };
  }
  
  const history = Array.isArray(obj.history) ? obj.history.slice(0, 20) : [];
  const validServices = ['real_estate', 'partner_intro', 'legal', 'design_build', 'mortgage', 'property_management', 'general'];
  const service = typeof obj.service === 'string' && validServices.includes(obj.service) ? obj.service : 'general';
  const userName = typeof obj.userName === 'string' ? obj.userName.slice(0, 100) : undefined;
  
  return { success: true, data: { message: obj.message, history, service, userName } };
};

const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
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

// Rate limiting configuration - 30 messages per 5 minutes per user
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 30;

// Auto-block configuration
const AUTO_BLOCK_THRESHOLD = 5; // Block after 5 rate limit violations
const AUTO_BLOCK_DURATION_HOURS = 12; // Block for 12 hours

// Rate limit entry type
interface RateLimitEntry {
  id: string;
  function_name: string;
  rate_key: string;
  window_start: string;
  request_count: number;
}

// Get client IP from request headers
function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

// Check if IP is blocklisted
async function checkIPBlocklist(
  supabaseAdmin: any,
  clientIp: string
): Promise<{ blocked: boolean; reason?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("ip_blocklist")
      .select("*")
      .eq("ip_address", clientIp)
      .maybeSingle();

    if (error) {
      console.error("IP blocklist check error:", error);
      return { blocked: false };
    }

    if (!data) {
      return { blocked: false };
    }

    // Check if block has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabaseAdmin.from("ip_blocklist").delete().eq("id", data.id);
      return { blocked: false };
    }

    // Update last attempt and block count
    await supabaseAdmin
      .from("ip_blocklist")
      .update({ 
        last_attempt_at: new Date().toISOString(),
        block_count: (data.block_count || 1) + 1
      })
      .eq("id", data.id);

    console.warn(`Blocked IP attempted access: ${clientIp.substring(0, 8)}***`);
    return { blocked: true, reason: data.reason || "IP is blocked" };
  } catch (err) {
    console.error("IP blocklist check exception:", err);
    return { blocked: false };
  }
}

// Rate limiting function with auto-block capability
async function checkRateLimit(
  supabaseAdmin: any,
  rateKey: string,
  clientIp: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number; shouldAutoBlock?: boolean }> {
  const functionName = "ai-chat-support";
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

  const { data: existingEntry, error: fetchError } = await supabaseAdmin
    .from("function_rate_limits")
    .select("*")
    .eq("function_name", functionName)
    .eq("rate_key", rateKey)
    .gte("window_start", windowStart.toISOString())
    .order("window_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("Rate limit check error:", fetchError);
    return { allowed: true };
  }

  const entry = existingEntry as RateLimitEntry | null;

  if (entry) {
    if (entry.request_count >= MAX_REQUESTS_PER_WINDOW) {
      const windowEndTime = new Date(entry.window_start).getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
      const retryAfterSeconds = Math.ceil((windowEndTime - Date.now()) / 1000);
      console.warn(`Rate limit exceeded for key: ${rateKey.substring(0, 8)}***`);
      
      // Check if we should auto-block this IP
      const violationCount = await trackRateLimitViolation(supabaseAdmin, clientIp, functionName);
      const shouldAutoBlock = violationCount >= AUTO_BLOCK_THRESHOLD;
      
      if (shouldAutoBlock) {
        await autoBlockIP(supabaseAdmin, clientIp, functionName, violationCount);
      }
      
      return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 0), shouldAutoBlock };
    }

    await supabaseAdmin
      .from("function_rate_limits")
      .update({ request_count: entry.request_count + 1 })
      .eq("id", entry.id);
  } else {
    await supabaseAdmin
      .from("function_rate_limits")
      .insert({
        function_name: functionName,
        rate_key: rateKey,
        window_start: new Date().toISOString(),
        request_count: 1,
      });
  }

  return { allowed: true };
}

// Track rate limit violations for auto-blocking
async function trackRateLimitViolation(
  supabaseAdmin: any,
  clientIp: string,
  functionName: string
): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const { data: violations, error } = await supabaseAdmin
    .from("function_rate_limits")
    .select("*")
    .eq("rate_key", clientIp)
    .gte("window_start", oneDayAgo.toISOString())
    .gte("request_count", MAX_REQUESTS_PER_WINDOW);

  if (error) {
    console.error("Error tracking violations:", error);
    return 0;
  }

  return violations?.length || 0;
}

// Send email notification to admins when IP is auto-blocked
async function sendAutoBlockNotification(
  clientIp: string,
  functionName: string,
  violationCount: number,
  blockCount: number,
  expiresAt: Date
): Promise<void> {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured, skipping auto-block notification");
      return;
    }

    const maskedIp = `${clientIp.substring(0, 8)}***`;
    const expiresAtFormatted = expiresAt.toLocaleString("en-US", { 
      timeZone: "Asia/Dubai",
      dateStyle: "medium",
      timeStyle: "short"
    });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "JBJ Global Real Estate Security <security@jbj.ae>",
        to: ["contact@jbj.ae", "jane@jbj.ae"],
        subject: `🚨 Security Alert: IP Auto-Blocked on ${functionName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="color: #c9a962; margin: 0; font-size: 24px;">🚨 Security Alert</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0;">IP Address Auto-Blocked</p>
            </div>
            <div style="background: #f8f9fa; padding: 25px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #1a1a2e; margin-top: 0;">Block Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #666;"><strong>IP Address:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #1a1a2e;">${maskedIp}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #666;"><strong>Function:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #1a1a2e;">${functionName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #666;"><strong>Violations (24h):</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #dc3545; font-weight: bold;">${violationCount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #666;"><strong>Total Blocks:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #1a1a2e;">${blockCount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #666;"><strong>Expires At:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #1a1a2e;">${expiresAtFormatted} (Dubai Time)</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Block Duration:</strong></td>
                  <td style="padding: 10px 0; color: #1a1a2e;">${AUTO_BLOCK_DURATION_HOURS} hours</td>
                </tr>
              </table>
              
              <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>Action Required:</strong> Review this IP in the Admin Dashboard. 
                  Consider making the block permanent if the activity appears malicious.
                </p>
              </div>
              
              <p style="color: #666; font-size: 12px; margin-top: 20px; text-align: center;">
                This is an automated security notification from JBJ Global Real Estate.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send auto-block notification:", errorText);
    } else {
      console.log("Auto-block notification sent successfully");
    }
  } catch (err) {
    console.error("Error sending auto-block notification:", err);
  }
}

// Auto-block an IP after exceeding threshold
async function autoBlockIP(
  supabaseAdmin: any,
  clientIp: string,
  functionName: string,
  violationCount: number
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + AUTO_BLOCK_DURATION_HOURS * 60 * 60 * 1000);
    
    const { data: existing } = await supabaseAdmin
      .from("ip_blocklist")
      .select("id, block_count")
      .eq("ip_address", clientIp)
      .maybeSingle();

    let blockCount = 1;

    if (existing) {
      blockCount = (existing.block_count || 1) + 1;
      await supabaseAdmin
        .from("ip_blocklist")
        .update({
          expires_at: expiresAt.toISOString(),
          block_count: blockCount,
          reason: `Auto-blocked: ${violationCount} rate limit violations on ${functionName}`,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      
      console.warn(`Extended auto-block for IP: ${clientIp.substring(0, 8)}*** (${blockCount} blocks)`);
    } else {
      await supabaseAdmin
        .from("ip_blocklist")
        .insert({
          ip_address: clientIp,
          reason: `Auto-blocked: ${violationCount} rate limit violations on ${functionName}`,
          is_permanent: false,
          expires_at: expiresAt.toISOString(),
          block_count: 1,
        });
      
      console.warn(`Auto-blocked IP: ${clientIp.substring(0, 8)}*** for ${AUTO_BLOCK_DURATION_HOURS} hours`);
    }

    // Send email notification to admins
    await sendAutoBlockNotification(clientIp, functionName, violationCount, blockCount, expiresAt);
  } catch (err) {
    console.error("Error auto-blocking IP:", err);
  }
}

// Approved contact information - single source of truth for AI responses
const APPROVED_CONTACT_INFO = {
  phone: '+971 56 591 1000',
  email: 'contact@jbj.ae',
  privacyEmail: 'privacy@jbj.ae',
  website: 'jbj.ae',
};

// Approved emails list
const APPROVED_EMAILS = [
  "contact@jbj.ae",
  "privacy@jbj.ae",
  "partnerships@jbj.ae",
  "collaboration@jbj.ae",
  "careers@jbj.ae",
  "security@jbj.ae",
  "jane@jbj.ae",
];

// Sanitize AI output to remove any unapproved contact information
function sanitizeContactInfo(text: string): string {
  // UAE phone number patterns (various formats)
  const phonePatterns = [
    /\+971[\s\-]?5[0-9][\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g,
    /\+971[\s\-]?[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g,
    /0?5[0-9][\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g,
    /\+971[\s\-]?[0-9]{9,10}/g,
  ];
  
  // Email pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  
  let sanitized = text;
  
  // Replace any phone numbers that aren't our approved one
  phonePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, (match) => {
      // Normalize for comparison
      const normalized = match.replace(/[\s\-]/g, '');
      if (normalized.includes('565911000')) {
        return match; // Keep approved number
      }
      return APPROVED_CONTACT_INFO.phone; // Replace with approved
    });
  });
  
  // Replace any emails that aren't our approved ones
  sanitized = sanitized.replace(emailPattern, (match) => {
    const lowerMatch = match.toLowerCase();
    if (APPROVED_EMAILS.includes(lowerMatch) || lowerMatch.endsWith('@jbj.ae')) {
      return match; // Keep approved emails
    }
    return APPROVED_CONTACT_INFO.email; // Replace with approved
  });
  
  return sanitized;
}

// Input validation is now handled by the validateRequest function defined at the top

// Comprehensive website knowledge base
const WEBSITE_KNOWLEDGE = `
JBJ GLOBAL REAL ESTATE - COMPLETE SERVICES & INFORMATION:

COMPANY OVERVIEW:
- JBJ Global Real Estate is a Dubai-based real estate brokerage specializing in property sales, leasing, and holiday homes across the UAE
- Founded by Jane Abou Jaoude
- Headquarters: Dubai, UAE
- Serving UAE-based and international clients interested in UAE real estate

CONTACT INFORMATION (USE ONLY THESE - DO NOT INVENT ANY OTHER NUMBERS):
- Email: ${APPROVED_CONTACT_INFO.email}
- Phone: ${APPROVED_CONTACT_INFO.phone}
- WhatsApp: ${APPROVED_CONTACT_INFO.phone}
- Website: ${APPROVED_CONTACT_INFO.website}

SERVICES:

1. REAL ESTATE BROKERAGE (UAE-Wide):
   - Off-plan properties in Dubai, Abu Dhabi, Sharjah, Ras Al Khaimah
   - Ready-to-move properties
   - AI Home Finder - personalized property matching
   - Property comparison and evaluation tools
   - Real estate guidance for property goals
   - Featured communities: Dubai Marina, Downtown Dubai, Palm Jumeirah, Business Bay, JBR, Dubai Hills, Creek Harbour, Jumeirah Village Circle, Dubai South, Mohammed Bin Rashid City
   - Top developers: Emaar, DAMAC, Nakheel, Sobha, Meraas, Azizi, Danube, Ellington, Binghatti

2. PARTNER INTRODUCTIONS:
   - Legal partner introductions for property transactions
   - Mortgage partner introductions
   - Property management partner introductions
   Note: JBJ Global Real Estate provides brokerage support and partner introductions only. Legal, mortgage, and property management services are provided by independent licensed professionals.

3. DESIGN & BUILD:
   - Interior design services
   - Fit-out and renovation
   - Smart home integration
   - Furniture packages
   - Project management

AI TOOLS AVAILABLE ON WEBSITE:
- AI Home Finder Quiz - Match properties to preferences
- Property Evaluator - Get property valuations
- Interior Design AI - Visualize room designs
- AI Budget Planner - Calculate and plan budgets
- Property Comparison - Compare up to 4 properties
- Rental Index Analysis - Check rental yields

PROPERTY BENEFITS IN UAE:
- 0% property tax
- 0% income tax
- Golden Visa eligibility (AED 2M+ property)
- High rental yields (6-10% average)
- Strong capital appreciation
- Safe and regulated market
- World-class infrastructure
`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Create service client for rate limiting
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Authentication check - require valid user session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('AI chat request rejected: No authorization header');
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          response: `Please sign in to use the AI chat assistant. If you need immediate help, contact our team:\n\n📧 Email: ${APPROVED_CONTACT_INFO.email}\n📞 Phone: ${APPROVED_CONTACT_INFO.phone}\n💬 WhatsApp: ${APPROVED_CONTACT_INFO.phone}`
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('AI chat request rejected: Invalid token', authError?.message);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid authentication token',
          response: `Your session has expired. Please sign in again to continue using the AI chat assistant.\n\n📧 Email: ${APPROVED_CONTACT_INFO.email}\n📞 Phone: ${APPROVED_CONTACT_INFO.phone}\n💬 WhatsApp: ${APPROVED_CONTACT_INFO.phone}`
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check IP blocklist first
    const clientIp = getClientIp(req);
    const blocklistResult = await checkIPBlocklist(supabaseService, clientIp);
    
    if (blocklistResult.blocked) {
      console.warn(`Blocked IP attempted AI chat: ${clientIp.substring(0, 8)}***`);
      return new Response(
        JSON.stringify({ 
          error: 'Access denied',
          response: 'Your access has been restricted. Please contact support if you believe this is an error.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit using user ID
    const rateLimitResult = await checkRateLimit(supabaseService, user.id, clientIp);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user: ${user.id}`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          response: `You've sent too many messages. Please wait ${Math.ceil((rateLimitResult.retryAfterSeconds || 300) / 60)} minutes before trying again, or contact our team directly:\n\n📧 Email: ${APPROVED_CONTACT_INFO.email}\n📞 Phone: ${APPROVED_CONTACT_INFO.phone}\n💬 WhatsApp: ${APPROVED_CONTACT_INFO.phone}`
        }),
        {
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfterSeconds || 300)
          } 
        }
      );
    }

    console.log(`AI chat request from authenticated user: ${user.id}`);

    // Parse and validate input
    const rawBody = await req.json();
    const parseResult = validateRequest(rawBody);

    if (!parseResult.success) {
      console.log('Validation failed:', parseResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          response: 'I couldn\'t process your request. Please try again with a shorter message.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, history, service, userName } = parseResult.data;

    // Build service-specific context
    let serviceContext = '';
    switch(service) {
      case 'real_estate':
        serviceContext = 'The user is interested in real estate. Focus on properties, developers, communities, property benefits, and the property buying/selling/renting process in UAE.';
        break;
      case 'partner_intro':
        serviceContext = `The user needs partner introductions. JBJ GLOBAL REAL ESTATE facilitates introductions to licensed partners for mortgage, legal, visa, and company setup services. 
CRITICAL: You MUST say "JBJ GLOBAL REAL ESTATE facilitates introductions to licensed partners for this service." 
NEVER say: "We provide", "We handle", "We process", "We offer", or "Our [service]" when referring to mortgage, legal, visa, or corporate services.`;
        break;
      case 'legal':
        serviceContext = `The user needs legal partner introductions. JBJ GLOBAL REAL ESTATE facilitates introductions to licensed law firms for property transactions, documentation, and contract review.
CRITICAL: You MUST say "JBJ GLOBAL REAL ESTATE facilitates introductions to licensed legal partners." 
NEVER say: "We provide legal services", "We handle legal matters", "We process legal documents", or "Our legal team".`;
        break;
      case 'design_build':
        serviceContext = 'The user is interested in design and build services. Focus on interior design, fit-out, renovation, and smart home solutions.';
        break;
      case 'mortgage':
        serviceContext = `The user needs mortgage partner introductions. JBJ GLOBAL REAL ESTATE facilitates introductions to licensed mortgage brokers and banks.
CRITICAL: You MUST say "JBJ GLOBAL REAL ESTATE facilitates introductions to licensed mortgage partners."
NEVER say: "We provide mortgage services", "We handle mortgage approvals", "We offer financing", or "Our mortgage team".`;
        break;
      case 'property_management':
        serviceContext = `The user needs property management partner introductions. JBJ GLOBAL REAL ESTATE facilitates introductions to licensed property management companies.
CRITICAL: You MUST say "JBJ GLOBAL REAL ESTATE facilitates introductions to licensed property management partners."
NEVER say: "We manage properties", "We handle property management", or "Our property management services".`;
        break;
      case 'visa':
        serviceContext = `The user needs visa partner introductions. JBJ GLOBAL REAL ESTATE facilitates introductions to licensed immigration consultants for Golden Visa, investor visa, and residency services.
CRITICAL: You MUST say "JBJ GLOBAL REAL ESTATE facilitates introductions to licensed visa partners."
NEVER say: "We provide visa services", "We handle visa applications", "We process visas", or "Our visa team".`;
        break;
      case 'company_setup':
        serviceContext = `The user needs company setup partner introductions. JBJ GLOBAL REAL ESTATE facilitates introductions to licensed corporate service providers for mainland and free zone company formation.
CRITICAL: You MUST say "JBJ GLOBAL REAL ESTATE facilitates introductions to licensed corporate service partners."
NEVER say: "We provide company setup services", "We handle company formation", or "Our corporate services".`;
        break;
      default:
        serviceContext = 'Help the user discover which of our services best suits their needs. Remember: JBJ GLOBAL REAL ESTATE is licensed for BUY, SELL & RENT (LEASING) only. For mortgage, legal, visa, and corporate services, we facilitate introductions to licensed partners only.';
    }

    // Build messages array with comprehensive system prompt
    const messages = [
      {
        role: 'system',
        content: `You are Sara, a friendly and knowledgeable property consultant at JBJ Global Real Estate. You're chatting with real clients about Dubai real estate.

## WHO YOU ARE:
- Your name is Sara - use it naturally when introducing yourself
- You're a real person who genuinely loves helping people find their dream property in Dubai
- You've lived in Dubai for years and know every neighborhood, developer, and market trend
- You're warm, approachable, and talk like a friend - not a corporate bot

## HOW YOU TALK:
- Be casual and conversational - use contractions (I'm, you'll, don't, etc.)
- Keep answers SHORT and punchy - 2-3 sentences max for simple stuff
- Use first person naturally ("I'd suggest...", "In my experience...", "I love that area!")
- Add personality - throw in the occasional emoji 😊 but don't overdo it
- Sound enthusiastic about properties you genuinely think are great deals
- It's okay to use phrases like "honestly", "to be real with you", "between us"

## CRITICAL COMPLIANCE - PARTNER SERVICES (MUST FOLLOW EXACTLY):
JBJ GLOBAL REAL ESTATE is licensed for BUY, SELL & RENT (LEASING) only.
For Mortgage, Legal, Visa, and Company Setup services:
- You MUST say: "JBJ GLOBAL REAL ESTATE facilitates introductions to licensed partners for [service]."
- NEVER say: "We provide", "We handle", "We process", "We offer [service]", or "Our [service] team"
- Correct: "For mortgage assistance, JBJ Global Real Estate facilitates introductions to licensed mortgage brokers."
- WRONG (NEVER SAY): "We can help with your mortgage" or "We provide visa services" or "Our legal team"

## WHAT YOU KNOW:
${WEBSITE_KNOWLEDGE}

${serviceContext}

## TALKING TO:
${userName || 'this client'} - use their name naturally in conversation

## WHEN THINGS GET COMPLEX:
If they need detailed help, scheduling, or want to move forward, say something casual like:
"Hey, why don't we take this to WhatsApp? Much easier to share photos and details there! Just tap the button above 📱"

## CONTACT INFO (only use these):
📧 ${APPROVED_CONTACT_INFO.email}
📞 ${APPROVED_CONTACT_INFO.phone}

Remember: You're Sara from JBJ Global Real Estate. Be real, be helpful, be you.`
      },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    // Call Lovable AI with optimized settings for speed
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY') || ''}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite', // Faster model for chat
        messages,
        max_tokens: 400, // Shorter for faster responses
        temperature: 0.6, // Slightly more focused
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          response: `I apologize, but we're experiencing high demand right now. Please try again in a moment, or contact our team directly:\n\n📧 Email: ${APPROVED_CONTACT_INFO.email}\n📞 Phone: ${APPROVED_CONTACT_INFO.phone}\n💬 WhatsApp: ${APPROVED_CONTACT_INFO.phone}`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Service temporarily unavailable',
          response: `I apologize, but our AI service is temporarily unavailable. Please contact our team directly for immediate assistance:\n\n📧 Email: ${APPROVED_CONTACT_INFO.email}\n📞 Phone: ${APPROVED_CONTACT_INFO.phone}\n💬 WhatsApp: ${APPROVED_CONTACT_INFO.phone}`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || `I apologize, but I was unable to process your request. Please contact our team directly:\n\n📧 Email: ${APPROVED_CONTACT_INFO.email}\n📞 Phone: ${APPROVED_CONTACT_INFO.phone}\n💬 WhatsApp: ${APPROVED_CONTACT_INFO.phone}`;

    // CRITICAL: Sanitize any unapproved contact info from AI output
    aiResponse = sanitizeContactInfo(aiResponse);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in ai-chat-support function:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred',
        response: `I apologize for the technical difficulty. Please contact our team directly for assistance:\n\n📧 Email: ${APPROVED_CONTACT_INFO.email}\n📞 Phone: ${APPROVED_CONTACT_INFO.phone}\n💬 WhatsApp: ${APPROVED_CONTACT_INFO.phone}\n\nOur team is available to help you with any questions.`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
