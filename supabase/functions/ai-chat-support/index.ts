import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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
        from: "JJ Global Capital Security <security@jjglobalcapital.com>",
        to: ["contact@jjglobalcapital.com", "jane@jjglobalcapital.com"],
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
                This is an automated security notification from JJ Global Capital.
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
  email: 'contact@jjglobalcapital.com',
  privacyEmail: 'privacy@jjglobalcapital.com',
  website: 'jjglobalcapital.com',
};

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
      if (normalized === '+97156591 1000' || normalized === '+971565911000' || normalized === '565911000') {
        return match; // Keep approved number
      }
      return APPROVED_CONTACT_INFO.phone; // Replace with approved
    });
  });
  
  // Replace any emails that aren't our approved ones
  sanitized = sanitized.replace(emailPattern, (match) => {
    const lowerMatch = match.toLowerCase();
    if (
      lowerMatch === 'contact@jjglobalcapital.com' ||
      lowerMatch === 'privacy@jjglobalcapital.com' ||
      lowerMatch === 'partnerships@jjglobalcapital.com' ||
      lowerMatch === 'collaboration@jjglobalcapital.com' ||
      lowerMatch === 'careers@jjglobalcapital.com' ||
      lowerMatch === 'security@jjglobalcapital.com' ||
      lowerMatch === 'jane@jjglobalcapital.com'
    ) {
      return match; // Keep approved emails
    }
    return APPROVED_CONTACT_INFO.email; // Replace with approved
  });
  
  return sanitized;
}

// Input validation schema
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(10000),
});

const RequestSchema = z.object({
  message: z.string().min(1, "Message is required").max(5000, "Message too long"),
  history: z.array(MessageSchema).max(20).optional().default([]),
  service: z.enum([
    'real_estate', 
    'concierge', 
    'legal', 
    'design_build', 
    'mortgage', 
    'property_management',
    'general'
  ]).optional(),
  userName: z.string().max(100).optional(),
});

// Comprehensive website knowledge base
const WEBSITE_KNOWLEDGE = `
JJ GLOBAL CAPITAL - COMPLETE SERVICES & INFORMATION:

COMPANY OVERVIEW:
- JJ Global Capital is a Dubai-based real estate brokerage specializing in property sales, leasing, and holiday homes across the UAE
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

2. LUXURY CONCIERGE SERVICES:
   - Private jet charters
   - Yacht rentals
   - VIP airport transfers
   - Exclusive event access
   - Personal shopping assistance
   - Restaurant reservations
   - Travel itinerary planning for UAE visitors

3. PARTNER INTRODUCTIONS:
   - Legal partner introductions for property transactions
   - Mortgage partner introductions
   - Property management partner introductions
   Note: JJ Global Capital provides brokerage support and partner introductions only. Legal, mortgage, and property management services are provided by independent licensed professionals.

4. DESIGN & BUILD:
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
- AI Travel Concierge - Plan UAE visits with property viewings
- Property Comparison - Compare up to 4 properties
- Rental Index Analysis - Check rental yields

INVESTMENT BENEFITS IN UAE:
- 0% property tax
- 0% income tax
- Golden Visa eligibility (AED 2M+ investment)
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
    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.log('Validation failed:', parseResult.error.errors);
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
        serviceContext = 'The user is interested in real estate investment. Focus on properties, developers, communities, investment benefits, and the property buying process in UAE.';
        break;
      case 'concierge':
        serviceContext = 'The user is interested in luxury concierge services. Focus on private jets, yachts, VIP experiences, travel planning, and exclusive services.';
        break;
      case 'legal':
        serviceContext = 'The user needs legal partner introductions. Focus on connecting them with our legal partners for property transactions, documentation, Golden Visa, and company formation. Note: We provide introductions only, not direct legal services.';
        break;
      case 'design_build':
        serviceContext = 'The user is interested in design and build services. Focus on interior design, fit-out, renovation, and smart home solutions.';
        break;
      case 'mortgage':
        serviceContext = 'The user needs mortgage partner introductions. Focus on connecting them with our mortgage partners for financing options. Note: We provide introductions only, not direct financial advice.';
        break;
      case 'property_management':
        serviceContext = 'The user needs property management partner introductions. Focus on connecting them with our property management partners. Note: We provide introductions only, not direct management services.';
        break;
      default:
        serviceContext = 'Help the user discover which of our services best suits their needs.';
    }

    // Build messages array with comprehensive system prompt
    const messages = [
      {
        role: 'system',
        content: `You are a professional, friendly AI assistant for JJ Global Capital, a real estate brokerage firm serving the entire UAE (not just Dubai).

${WEBSITE_KNOWLEDGE}

${serviceContext}

The user's name is: ${userName || 'Guest'}

Your role is to:
- Answer questions accurately using the knowledge base above
- Provide helpful, specific information about our services
- Guide users to the right service or tool on our website
- Collect lead information naturally when appropriate
- Be warm, professional, and maintain a luxury brand tone
- Always mention we serve all UAE emirates, not just Dubai
- Remember: We provide brokerage support and partner introductions only. We do not provide legal, mortgage, financial, or investment advice.

Response guidelines:
- Keep responses concise but helpful (2-4 sentences unless more detail is needed)
- Use the user's name occasionally to personalize the conversation
- If you don't know something specific, offer to connect them with our team
- Always provide contact details when ending a conversation or if they need human help
- For complex inquiries, encourage scheduling a consultation

Contact for human assistance:
📧 Email: ${APPROVED_CONTACT_INFO.email}
📞 Phone: ${APPROVED_CONTACT_INFO.phone}
💬 WhatsApp: ${APPROVED_CONTACT_INFO.phone}`
      },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY') || ''}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 600,
        temperature: 0.7,
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
