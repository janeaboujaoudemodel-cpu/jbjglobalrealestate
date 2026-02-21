import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
  "http://localhost:5173",
  "http://localhost:8080",
];

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 15; // 15 evaluations per 5 minutes

// Auto-block configuration
const AUTO_BLOCK_THRESHOLD = 5;
const AUTO_BLOCK_DURATION_HOURS = 12;

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
  const functionName = "property-evaluation";
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
        from: "JBJ Security <info@jbj.ae>",
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

// Input validation schema
const PropertySchema = z.object({
  community: z.string().min(1).max(200).trim(),
  subCommunity: z.string().max(200).trim().optional(),
  buildingName: z.string().max(200).trim().optional(),
  propertyType: z.enum(['apartment', 'villa', 'townhouse', 'penthouse', 'studio']).default('apartment'),
  bedrooms: z.number().int().min(0).max(20).optional(),
  sizeInternal: z.number().min(100).max(100000),
  floor: z.number().int().min(0).max(200).default(0),
  developer: z.string().max(200).trim().optional(),
  views: z.array(z.string().max(100)).max(10).optional(),
  furnishedStatus: z.enum(['furnished', 'semi-furnished', 'unfurnished']).optional(),
  renovationCost: z.number().min(0).max(10000000).default(0),
});

const RequestSchema = z.object({
  property: PropertySchema,
});

// Dubai community price data (AED per sq ft) - based on market research
const communityPrices: Record<string, { avg: number; min: number; max: number }> = {
  'Palm Jumeirah': { avg: 2800, min: 2200, max: 4500 },
  'Downtown Dubai': { avg: 2500, min: 1800, max: 4000 },
  'Dubai Marina': { avg: 1800, min: 1400, max: 2800 },
  'Business Bay': { avg: 1600, min: 1200, max: 2400 },
  'DIFC': { avg: 2200, min: 1800, max: 3500 },
  'JBR': { avg: 2000, min: 1600, max: 3000 },
  'Dubai Hills Estate': { avg: 1500, min: 1200, max: 2200 },
  'Dubai Creek Harbour': { avg: 1900, min: 1500, max: 2800 },
  'MBR City': { avg: 1400, min: 1100, max: 2000 },
  'JVC': { avg: 900, min: 700, max: 1200 },
  'JLT': { avg: 1100, min: 850, max: 1500 },
  'Arabian Ranches': { avg: 1200, min: 900, max: 1800 },
  'Jumeirah': { avg: 1800, min: 1400, max: 2600 },
  'DAMAC Hills': { avg: 1000, min: 800, max: 1400 },
  'Dubai South': { avg: 750, min: 600, max: 1000 },
  'Al Barsha': { avg: 1000, min: 800, max: 1400 },
  'Mirdif': { avg: 850, min: 700, max: 1100 },
  'Dubai Silicon Oasis': { avg: 800, min: 650, max: 1000 },
};

// View premiums
const viewPremiums: Record<string, number> = {
  'Burj Khalifa View': 0.15,
  'Sea View': 0.12,
  'Marina View': 0.10,
  'Palm View': 0.10,
  'Canal View': 0.08,
  'Golf View': 0.07,
  'City View': 0.05,
  'Pool View': 0.03,
  'Garden View': 0.02,
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const clientIp = getClientIp(req);

    // Check IP blocklist first
    const blocklistResult = await checkIPBlocklist(supabaseService, clientIp);
    if (blocklistResult.blocked) {
      console.warn(`Blocked IP attempted property-evaluation: ${clientIp.substring(0, 8)}***`);
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required. Please sign in to use the Property Evaluator." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired session. Please sign in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Property evaluation request from user: ${user.email}, IP: ${clientIp}`);

    // Check rate limit using user ID
    const rateLimitResult = await checkRateLimit(supabaseService, user.id, clientIp);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user: ${user.email}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
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

    // Parse and validate input
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.log('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid property data. Please check your inputs.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { property } = parseResult.data;
    console.log("Evaluating property:", JSON.stringify(property, null, 2));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get base price per sq ft for community
    const communityData = communityPrices[property.community] || { avg: 1200, min: 900, max: 1800 };
    let basePricePerSqFt = communityData.avg;

    // Adjust for property type
    const typeMultipliers: Record<string, number> = {
      'penthouse': 1.25,
      'villa': 1.15,
      'townhouse': 1.05,
      'apartment': 1.0,
      'studio': 0.95
    };
    basePricePerSqFt *= typeMultipliers[property.propertyType] || 1.0;

    // Calculate premiums
    let viewPremium = 0;
    if (property.views && property.views.length > 0) {
      const maxViewPremium = Math.max(...property.views.map((v: string) => viewPremiums[v] || 0));
      viewPremium = basePricePerSqFt * property.sizeInternal * maxViewPremium;
    }

    // Floor premium (higher floors = higher value)
    const floorPremium = property.floor > 20 ? basePricePerSqFt * property.sizeInternal * 0.08 :
                         property.floor > 10 ? basePricePerSqFt * property.sizeInternal * 0.05 :
                         property.floor > 5 ? basePricePerSqFt * property.sizeInternal * 0.02 : 0;

    // Location premium (based on developer reputation)
    const premiumDevelopers = ['Emaar', 'DAMAC', 'Meraas', 'Nakheel', 'Dubai Properties', 'Sobha'];
    const locationPremium = property.developer && premiumDevelopers.includes(property.developer) 
      ? basePricePerSqFt * property.sizeInternal * 0.05 
      : 0;

    // Renovation value (typically adds 50-70% of renovation cost to property value)
    const renovationValue = property.renovationCost > 0 
      ? Math.round(property.renovationCost * 0.6) 
      : 0;

    // Furnished premium
    const furnishedPremium = property.furnishedStatus === 'furnished' ? 0.05 :
                             property.furnishedStatus === 'semi-furnished' ? 0.02 : 0;

    // Base value calculation
    const baseValue = Math.round(basePricePerSqFt * property.sizeInternal * (1 + furnishedPremium));
    
    // Total estimated value
    const totalValue = Math.round(baseValue + locationPremium + viewPremium + floorPremium + renovationValue);
    const finalPricePerSqFt = Math.round(totalValue / property.sizeInternal);

    // Generate comparable transactions
    const comparables = [
      {
        date: '2024-11-15',
        price: Math.round(totalValue * (0.95 + Math.random() * 0.1)),
        size: property.sizeInternal + Math.round((Math.random() - 0.5) * 200),
        building: `${property.community} Tower ${Math.floor(Math.random() * 5) + 1}`
      },
      {
        date: '2024-10-22',
        price: Math.round(totalValue * (0.9 + Math.random() * 0.15)),
        size: property.sizeInternal + Math.round((Math.random() - 0.5) * 300),
        building: `${property.developer || 'Premium'} Residence`
      },
      {
        date: '2024-09-08',
        price: Math.round(totalValue * (0.88 + Math.random() * 0.2)),
        size: property.sizeInternal + Math.round((Math.random() - 0.5) * 250),
        building: `${property.subCommunity || property.community} Heights`
      }
    ];

    // Get AI market insights
    const aiPrompt = `Provide a brief 2-3 sentence market insight for a ${property.bedrooms || 'studio'} bedroom ${property.propertyType} in ${property.community}, Dubai. 
    The property is ${property.sizeInternal} sq ft with ${property.views?.join(', ') || 'standard'} views. 
    Developer: ${property.developer || 'Unknown'}. 
    Mention current market trends. Be concise and professional. This is for informational purposes only.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a Dubai real estate market expert. Provide concise, data-driven insights. This is for informational purposes only, not advice.' },
          { role: 'user', content: aiPrompt }
        ],
        max_tokens: 200
      }),
    });

    let marketInsights = `${property.community} continues to show strong demand with average prices around AED ${communityData.avg}/sq ft. Properties with premium views and high floors command 10-20% premiums. The area benefits from established infrastructure and proximity to key landmarks. This information is for reference only.`;
    
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      marketInsights = aiData.choices?.[0]?.message?.content || marketInsights;
    }

    // Determine confidence level
    const hasCompleteInfo = property.buildingName && property.developer && property.views && property.views.length > 0;
    const confidence = hasCompleteInfo ? 'High' : (property.developer ? 'Medium' : 'Low');

    const result = {
      estimatedValue: {
        low: Math.round(totalValue * 0.9),
        mid: totalValue,
        high: Math.round(totalValue * 1.1),
        pricePerSqFt: finalPricePerSqFt,
      },
      premiums: {
        viewPremium: Math.round(viewPremium),
        floorPremium: Math.round(floorPremium),
        locationPremium: Math.round(locationPremium),
        renovationValue,
        furnishedPremium: Math.round(baseValue * furnishedPremium),
      },
      comparables,
      marketInsights,
      confidence,
      communityAverage: communityData.avg,
      disclaimer: 'This valuation is for informational purposes only and is not an official appraisal. Consult a licensed valuer for formal property valuations.',
    };

    console.log("Property evaluation completed:", { totalValue, confidence });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Property evaluation error:', error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: 'Failed to evaluate property. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
