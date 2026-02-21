import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Security constants
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 15;
const AUTO_BLOCK_THRESHOLD = 5;
const AUTO_BLOCK_DURATION_HOURS = 12;

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || 
    origin.endsWith(".lovableproject.com") || 
    origin.endsWith(".lovable.app")
  );
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Get client IP from request headers
function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         req.headers.get("x-real-ip") ||
         "unknown";
}

// Check if IP is blocked
async function checkIPBlocklist(supabaseAdmin: any, clientIp: string): Promise<{ blocked: boolean; reason?: string }> {
  if (clientIp === "unknown") return { blocked: false };
  
  const { data: blockEntry } = await supabaseAdmin
    .from("ip_blocklist")
    .select("*")
    .eq("ip_address", clientIp)
    .single();

  if (!blockEntry) return { blocked: false };

  // Check if block has expired
  if (blockEntry.expires_at && new Date(blockEntry.expires_at) < new Date()) {
    // Block expired, remove it
    await supabaseAdmin.from("ip_blocklist").delete().eq("id", blockEntry.id);
    return { blocked: false };
  }

  // Update last attempt
  await supabaseAdmin
    .from("ip_blocklist")
    .update({ last_attempt_at: new Date().toISOString() })
    .eq("id", blockEntry.id);

  return { blocked: true, reason: blockEntry.reason || "IP blocked" };
}

// Check rate limit
async function checkRateLimit(
  supabaseAdmin: any,
  rateKey: string,
  clientIp: string
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const functionName = "ai-travel-concierge";

  const { data: existing } = await supabaseAdmin
    .from("function_rate_limits")
    .select("*")
    .eq("rate_key", rateKey)
    .eq("function_name", functionName)
    .gte("window_start", windowStart)
    .order("window_start", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    if (existing.request_count >= MAX_REQUESTS_PER_WINDOW) {
      await trackRateLimitViolation(supabaseAdmin, clientIp, functionName);
      return { allowed: false, remaining: 0 };
    }

    await supabaseAdmin
      .from("function_rate_limits")
      .update({ request_count: existing.request_count + 1 })
      .eq("id", existing.id);

    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - existing.request_count - 1 };
  }

  await supabaseAdmin.from("function_rate_limits").insert({
    rate_key: rateKey,
    function_name: functionName,
    request_count: 1,
    window_start: new Date().toISOString(),
  });

  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
}

// Track rate limit violations and auto-block if threshold exceeded
async function trackRateLimitViolation(
  supabaseAdmin: any,
  clientIp: string,
  functionName: string
): Promise<void> {
  if (clientIp === "unknown") return;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count } = await supabaseAdmin
    .from("function_rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("function_name", functionName)
    .gte("window_start", oneHourAgo);

  const violationCount = (count || 0) + 1;

  if (violationCount >= AUTO_BLOCK_THRESHOLD) {
    await autoBlockIP(supabaseAdmin, clientIp, functionName, violationCount);
  }
}

// Auto-block IP after repeated violations
async function autoBlockIP(
  supabaseAdmin: any,
  clientIp: string,
  functionName: string,
  violationCount: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + AUTO_BLOCK_DURATION_HOURS * 60 * 60 * 1000).toISOString();
  const reason = `Auto-blocked: ${violationCount} rate limit violations in ${functionName}`;

  const { data: existing } = await supabaseAdmin
    .from("ip_blocklist")
    .select("id, block_count")
    .eq("ip_address", clientIp)
    .single();

  if (existing) {
    await supabaseAdmin
      .from("ip_blocklist")
      .update({
        expires_at: expiresAt,
        reason,
        block_count: existing.block_count + 1,
        blocked_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("ip_blocklist").insert({
      ip_address: clientIp,
      reason,
      expires_at: expiresAt,
      is_permanent: false,
      blocked_by: "system",
      block_count: 1,
    });
  }

  // Send notification
  await sendAutoBlockNotification(clientIp, functionName, violationCount);
}

// Send email notification when IP is auto-blocked
async function sendAutoBlockNotification(
  clientIp: string,
  functionName: string,
  violationCount: number
): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "JBJ Security <info@jbj.ae>",
        to: ["CONTACT@JBJ.AE"],
        subject: `[Security Alert] IP Auto-Blocked: ${clientIp}`,
        html: `
          <h2>IP Auto-Block Alert</h2>
          <p><strong>IP Address:</strong> ${clientIp}</p>
          <p><strong>Function:</strong> ${functionName}</p>
          <p><strong>Violations:</strong> ${violationCount}</p>
          <p><strong>Block Duration:</strong> ${AUTO_BLOCK_DURATION_HOURS} hours</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        `,
      }),
    });
  } catch (error) {
    console.error("Failed to send auto-block notification:", error);
  }
}

// Input validation schema
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(10000),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
  context: z.string().max(5000).optional(),
});

const APPROVED_CONTACT_INFO = {
  phone: '+971 56 591 1000',
  email: 'contact@jbj.ae',
  privacyEmail: 'privacy@jbj.ae',
  website: 'jbj.ae',
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
      lowerMatch === 'contact@jbj.ae' ||
      lowerMatch === 'privacy@jbj.ae' ||
      lowerMatch === 'partnerships@jbj.ae' ||
      lowerMatch === 'collaboration@jbj.ae' ||
      lowerMatch === 'careers@jbj.ae' ||
      lowerMatch === 'security@jbj.ae'
    ) {
      return match; // Keep approved emails
    }
    return APPROVED_CONTACT_INFO.email; // Replace with approved
  });
  
  return sanitized;
}

const systemPrompt = `You are the AI Travel & Property Assistant for JBJ Global Real Estate, a real estate brokerage firm in Dubai, UAE. Your role is to create comprehensive, personalized travel and property viewing itineraries for clients visiting the UAE.

**CRITICAL CONTACT INFORMATION RULES:**
- You MUST ONLY use these approved contact details:
- Phone: ${APPROVED_CONTACT_INFO.phone}
- Email: ${APPROVED_CONTACT_INFO.email}
- Website: ${APPROVED_CONTACT_INFO.website}
- NEVER invent, generate, or use any other phone number or email address
- If unsure, always direct users to ${APPROVED_CONTACT_INFO.email}
- DO NOT include contact information in itinerary body - it will be appended automatically

**Your Expertise:**
- Dubai & UAE real estate market
- Premium hotels and accommodations
- Fine dining and exclusive restaurants
- VIP experiences and activities
- Property viewing logistics
- Local logistics and transportation

**When Creating Itineraries, Include:**

1. **Day-by-Day Schedule** with specific times:
   - Morning activities (9:00 AM start)
   - Property viewings (typically 10:00 AM - 1:00 PM, 3:00 PM - 6:00 PM)
   - Lunch recommendations (1:00 PM - 2:30 PM)
   - Afternoon activities
   - Dinner reservations (7:30 PM - 10:00 PM)

2. **Hotel Recommendations** based on their purpose:
   - For clients: Address Downtown, Armani Hotel, Four Seasons DIFC
   - For families: Atlantis, JA Resort, Jumeirah Beach Hotel
   - For luxury: Burj Al Arab, One&Only, Bulgari Resort

3. **Property Viewing Suggestions** matching their criteria:
   - Specific developments and communities
   - Developer names (Emaar, DAMAC, Sobha, Meraas, Nakheel)
   - Price ranges and unit types
   - Key features

4. **Transportation:**
   - Private chauffeur services
   - Helicopter tours for aerial views
   - Yacht charters for waterfront properties

5. **Dining & Entertainment:**
   - Specific restaurant names and cuisines
   - Dress codes and reservation notes
   - Unique experiences (desert safari, Burj Khalifa, Dubai Frame)

**Response Format:**
- Use clear headers and bullet points
- Include specific times and locations
- Add practical tips and notes
- DO NOT include contact details at the end - they will be added automatically

**Important:** JBJ Global Real Estate provides brokerage support and partner introductions only. We do not provide legal, mortgage, financial, or investment advice.

Always be warm, professional, and enthusiastic about helping them discover the UAE. Tailor recommendations to their stated budget, interests, and travel style.`;

// Official contact block to append to all responses
const CONTACT_BLOCK = `

---

**Ready to Make This Happen?**

Contact JBJ Global Real Estate to book your personalized UAE experience:
- 📞 ${APPROVED_CONTACT_INFO.phone}
- 📧 ${APPROVED_CONTACT_INFO.email}
- 🌐 ${APPROVED_CONTACT_INFO.website}

Our team will coordinate all arrangements through our trusted partner network.`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      console.log("Authentication failed:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const userEmail = user.email || "unknown";
    const clientIp = getClientIp(req);

    console.log(`Travel assistant request from user: ${userEmail}, IP: ${clientIp}`);

    // Check IP blocklist
    const blockCheck = await checkIPBlocklist(supabaseAdmin, clientIp);
    if (blockCheck.blocked) {
      console.log(`Blocked IP attempted access: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const rateKey = `user:${userId}`;
    const rateCheck = await checkRateLimit(supabaseAdmin, rateKey, clientIp);
    if (!rateCheck.allowed) {
      console.log(`Rate limit exceeded for user: ${userEmail}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again in a few minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate input
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.log('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid request format. Please check your input." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, context } = parseResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format messages for the AI
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...(context ? [{ role: "system", content: `Context: ${context}` }] : []),
      ...messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content
      }))
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: formattedMessages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

    // CRITICAL: Sanitize any unapproved contact info from AI output
    aiResponse = sanitizeContactInfo(aiResponse);
    
    // Append official contact block (code-controlled, not AI-generated)
    aiResponse = aiResponse + CONTACT_BLOCK;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-travel-concierge:", error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ 
        error: "An error occurred",
        response: `I apologize for the technical difficulty. Please contact our team directly at ${APPROVED_CONTACT_INFO.phone} or ${APPROVED_CONTACT_INFO.email} for immediate assistance with your UAE trip planning.`
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
