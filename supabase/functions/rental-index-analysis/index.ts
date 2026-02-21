import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Security constants
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 20;
const AUTO_BLOCK_THRESHOLD = 5;
const AUTO_BLOCK_DURATION_HOURS = 12;

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
  const functionName = "rental-index-analysis";
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

  const { data: existingEntry, error: fetchError } = await supabaseAdmin
    .from("function_rate_limits").select("*").eq("function_name", functionName).eq("rate_key", rateKey)
    .gte("window_start", windowStart.toISOString()).order("window_start", { ascending: false }).limit(1).maybeSingle();

  if (fetchError) return { allowed: true };

  if (existingEntry) {
    if (existingEntry.request_count >= MAX_REQUESTS_PER_WINDOW) {
      const windowEndTime = new Date(existingEntry.window_start).getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
      const retryAfterSeconds = Math.ceil((windowEndTime - Date.now()) / 1000);
      console.warn(`Rate limit exceeded for key: ${rateKey.substring(0, 8)}***`);
      const violationCount = await trackRateLimitViolation(supabaseAdmin, clientIp, functionName);
      if (violationCount >= AUTO_BLOCK_THRESHOLD) await autoBlockIP(supabaseAdmin, clientIp, functionName, violationCount);
      return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 0) };
    }
    await supabaseAdmin.from("function_rate_limits").update({ request_count: existingEntry.request_count + 1 }).eq("id", existingEntry.id);
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
const RequestSchema = z.object({
  community: z.string().min(1, "Community is required").max(200).trim(),
  propertyType: z.enum([
    'studio', '1br', '2br', '3br', '4br', '5br+', 
    'villa', 'townhouse', 'penthouse'
  ]),
  size: z.number().min(100).max(100000).optional(),
  furnished: z.enum(['furnished', 'semi-furnished', 'unfurnished']).optional(),
});

// Dubai rental data - approximate averages by community (AED/year)
const rentalData: Record<string, Record<string, { min: number; max: number; avgPsf: number }>> = {
  "Downtown Dubai": {
    studio: { min: 55000, max: 85000, avgPsf: 140 },
    "1br": { min: 75000, max: 130000, avgPsf: 135 },
    "2br": { min: 120000, max: 200000, avgPsf: 130 },
    "3br": { min: 180000, max: 300000, avgPsf: 125 },
    "4br": { min: 280000, max: 450000, avgPsf: 120 },
    "5br+": { min: 400000, max: 700000, avgPsf: 115 },
    villa: { min: 500000, max: 1200000, avgPsf: 110 },
    townhouse: { min: 350000, max: 600000, avgPsf: 105 },
    penthouse: { min: 500000, max: 2000000, avgPsf: 150 },
  },
  "Dubai Marina": {
    studio: { min: 50000, max: 80000, avgPsf: 130 },
    "1br": { min: 70000, max: 120000, avgPsf: 125 },
    "2br": { min: 100000, max: 180000, avgPsf: 120 },
    "3br": { min: 160000, max: 280000, avgPsf: 115 },
    "4br": { min: 250000, max: 400000, avgPsf: 110 },
    "5br+": { min: 350000, max: 600000, avgPsf: 105 },
    villa: { min: 400000, max: 800000, avgPsf: 100 },
    townhouse: { min: 300000, max: 500000, avgPsf: 95 },
    penthouse: { min: 400000, max: 1500000, avgPsf: 140 },
  },
  "Palm Jumeirah": {
    studio: { min: 60000, max: 95000, avgPsf: 150 },
    "1br": { min: 90000, max: 150000, avgPsf: 145 },
    "2br": { min: 140000, max: 250000, avgPsf: 140 },
    "3br": { min: 220000, max: 380000, avgPsf: 135 },
    "4br": { min: 350000, max: 550000, avgPsf: 130 },
    "5br+": { min: 500000, max: 900000, avgPsf: 125 },
    villa: { min: 700000, max: 3000000, avgPsf: 150 },
    townhouse: { min: 500000, max: 900000, avgPsf: 120 },
    penthouse: { min: 800000, max: 4000000, avgPsf: 180 },
  },
  "Business Bay": {
    studio: { min: 45000, max: 70000, avgPsf: 120 },
    "1br": { min: 60000, max: 100000, avgPsf: 115 },
    "2br": { min: 90000, max: 150000, avgPsf: 110 },
    "3br": { min: 140000, max: 220000, avgPsf: 105 },
    "4br": { min: 200000, max: 350000, avgPsf: 100 },
    "5br+": { min: 300000, max: 500000, avgPsf: 95 },
    villa: { min: 350000, max: 600000, avgPsf: 90 },
    townhouse: { min: 280000, max: 450000, avgPsf: 88 },
    penthouse: { min: 350000, max: 1200000, avgPsf: 130 },
  },
  "Jumeirah Beach Residence (JBR)": {
    studio: { min: 55000, max: 85000, avgPsf: 135 },
    "1br": { min: 75000, max: 125000, avgPsf: 130 },
    "2br": { min: 110000, max: 180000, avgPsf: 125 },
    "3br": { min: 170000, max: 280000, avgPsf: 120 },
    "4br": { min: 260000, max: 420000, avgPsf: 115 },
    "5br+": { min: 380000, max: 650000, avgPsf: 110 },
    villa: { min: 450000, max: 900000, avgPsf: 105 },
    townhouse: { min: 350000, max: 550000, avgPsf: 100 },
    penthouse: { min: 450000, max: 1800000, avgPsf: 145 },
  },
  "Dubai Hills Estate": {
    studio: { min: 40000, max: 60000, avgPsf: 110 },
    "1br": { min: 55000, max: 90000, avgPsf: 105 },
    "2br": { min: 85000, max: 140000, avgPsf: 100 },
    "3br": { min: 130000, max: 200000, avgPsf: 95 },
    "4br": { min: 190000, max: 300000, avgPsf: 90 },
    "5br+": { min: 280000, max: 450000, avgPsf: 85 },
    villa: { min: 350000, max: 800000, avgPsf: 95 },
    townhouse: { min: 250000, max: 400000, avgPsf: 85 },
    penthouse: { min: 320000, max: 900000, avgPsf: 115 },
  },
  "Jumeirah Village Circle (JVC)": {
    studio: { min: 30000, max: 45000, avgPsf: 80 },
    "1br": { min: 40000, max: 65000, avgPsf: 75 },
    "2br": { min: 60000, max: 95000, avgPsf: 70 },
    "3br": { min: 85000, max: 130000, avgPsf: 65 },
    "4br": { min: 120000, max: 180000, avgPsf: 60 },
    "5br+": { min: 170000, max: 250000, avgPsf: 55 },
    villa: { min: 200000, max: 350000, avgPsf: 65 },
    townhouse: { min: 150000, max: 250000, avgPsf: 60 },
    penthouse: { min: 180000, max: 400000, avgPsf: 85 },
  },
  "DIFC": {
    studio: { min: 65000, max: 95000, avgPsf: 160 },
    "1br": { min: 90000, max: 150000, avgPsf: 155 },
    "2br": { min: 140000, max: 230000, avgPsf: 150 },
    "3br": { min: 220000, max: 350000, avgPsf: 145 },
    "4br": { min: 320000, max: 500000, avgPsf: 140 },
    "5br+": { min: 450000, max: 750000, avgPsf: 135 },
    villa: { min: 550000, max: 1100000, avgPsf: 130 },
    townhouse: { min: 400000, max: 700000, avgPsf: 125 },
    penthouse: { min: 600000, max: 2500000, avgPsf: 170 },
  },
  "Jumeirah Lakes Towers (JLT)": {
    studio: { min: 38000, max: 55000, avgPsf: 95 },
    "1br": { min: 50000, max: 80000, avgPsf: 90 },
    "2br": { min: 75000, max: 120000, avgPsf: 85 },
    "3br": { min: 110000, max: 170000, avgPsf: 80 },
    "4br": { min: 160000, max: 250000, avgPsf: 75 },
    "5br+": { min: 230000, max: 380000, avgPsf: 70 },
    villa: { min: 280000, max: 500000, avgPsf: 75 },
    townhouse: { min: 200000, max: 350000, avgPsf: 70 },
    penthouse: { min: 280000, max: 700000, avgPsf: 100 },
  },
  "Arabian Ranches": {
    studio: { min: 35000, max: 50000, avgPsf: 85 },
    "1br": { min: 50000, max: 75000, avgPsf: 80 },
    "2br": { min: 75000, max: 110000, avgPsf: 75 },
    "3br": { min: 110000, max: 160000, avgPsf: 70 },
    "4br": { min: 160000, max: 240000, avgPsf: 65 },
    "5br+": { min: 240000, max: 380000, avgPsf: 60 },
    villa: { min: 280000, max: 550000, avgPsf: 70 },
    townhouse: { min: 180000, max: 300000, avgPsf: 65 },
    penthouse: { min: 250000, max: 500000, avgPsf: 85 },
  },
};

// Default data for communities not specifically listed
const defaultData = {
  studio: { min: 35000, max: 55000, avgPsf: 90 },
  "1br": { min: 48000, max: 78000, avgPsf: 85 },
  "2br": { min: 70000, max: 115000, avgPsf: 80 },
  "3br": { min: 100000, max: 160000, avgPsf: 75 },
  "4br": { min: 150000, max: 240000, avgPsf: 70 },
  "5br+": { min: 220000, max: 360000, avgPsf: 65 },
  villa: { min: 250000, max: 450000, avgPsf: 70 },
  townhouse: { min: 180000, max: 320000, avgPsf: 65 },
  penthouse: { min: 280000, max: 600000, avgPsf: 95 },
};

// Market insights generator
function generateInsights(community: string, propertyType: string, data: { min: number; max: number; avgPsf: number }): string[] {
  const insights: string[] = [];
  
  const premiumAreas = ["Downtown Dubai", "Palm Jumeirah", "DIFC", "Dubai Marina", "Jumeirah Beach Residence (JBR)"];
  const growingAreas = ["Dubai Hills Estate", "Dubai Creek Harbour", "Damac Hills", "Town Square"];
  const affordableAreas = ["Jumeirah Village Circle (JVC)", "International City", "Discovery Gardens", "Al Nahda"];
  
  if (premiumAreas.includes(community)) {
    insights.push(`${community} is a premium location with high rental demand from professionals and tourists.`);
    insights.push("Properties in this area typically command 15-25% higher rents than city average.");
  } else if (growingAreas.includes(community)) {
    insights.push(`${community} is an emerging community with growing infrastructure and amenities.`);
    insights.push("Rental demand in this area has been increasing steadily.");
  } else if (affordableAreas.includes(community)) {
    insights.push(`${community} offers competitive rental rates attractive to budget-conscious tenants.`);
    insights.push("High occupancy rates due to affordability and accessibility.");
  }
  
  if (propertyType === "studio" || propertyType === "1br") {
    insights.push("Smaller units tend to have higher rental demand compared to larger properties.");
  } else if (propertyType === "villa" || propertyType === "townhouse") {
    insights.push("Villas and townhouses have seen increased demand as families prioritize space.");
  }
  
  insights.push("Dubai's rental market follows a cycle with peak demand during Q4 and Q1.");
  insights.push("Furnished properties typically command 10-20% premium over unfurnished units.");
  
  return insights;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const clientIp = getClientIp(req);

    // Check IP blocklist first
    const blocklistResult = await checkIPBlocklist(supabaseService, clientIp);
    if (blocklistResult.blocked) {
      console.warn(`Blocked IP attempted rental-index-analysis: ${clientIp.substring(0, 8)}***`);
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
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
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Rental analysis request from user: ${user.email}, IP: ${clientIp}`);

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
        JSON.stringify({ error: "Invalid request. Please check community and property type." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { community, propertyType, size, furnished } = parseResult.data;
    
    console.log(`Rental analysis request: ${community}, ${propertyType}, size: ${size}, furnished: ${furnished}`);
    
    // Get rental data for the community
    const communityData = rentalData[community] || defaultData;
    const typeData = communityData[propertyType] || defaultData[propertyType as keyof typeof defaultData];
    
    if (!typeData) {
      return new Response(
        JSON.stringify({ error: "Invalid property type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    let { min, max, avgPsf } = typeData;
    
    // Adjust for furnished status
    if (furnished === "furnished") {
      min = Math.round(min * 1.15);
      max = Math.round(max * 1.20);
    } else if (furnished === "semi-furnished") {
      min = Math.round(min * 1.08);
      max = Math.round(max * 1.12);
    }
    
    // Calculate average
    const average = Math.round((min + max) / 2);
    
    // Determine market trend and demand
    const premiumAreas = ["Downtown Dubai", "Palm Jumeirah", "DIFC", "Dubai Marina"];
    const marketTrend = premiumAreas.includes(community) ? "Upward" : 
                       ["Dubai Hills Estate", "Dubai Creek Harbour"].includes(community) ? "Strong Growth" : "Stable";
    
    const demandLevel = premiumAreas.includes(community) ? "Very High" :
                       ["Dubai Marina", "JBR", "Business Bay"].includes(community) ? "High" : "Moderate";
    
    // Generate insights
    const insights = generateInsights(community, propertyType, typeData);
    
    // Yearly increase estimate
    const yearlyIncrease = premiumAreas.includes(community) ? "+5-8%" :
                          marketTrend === "Strong Growth" ? "+8-12%" : "+3-5%";
    
    const response = {
      community,
      propertyType,
      estimatedRentMin: min,
      estimatedRentMax: max,
      averageRent: average,
      pricePerSqft: avgPsf,
      yearlyIncrease,
      marketTrend,
      demandLevel,
      insights,
      disclaimer: "These estimates are for informational purposes only and are based on aggregated market data. Actual rental values may vary based on specific property features, building quality, view, floor level, and current market conditions. For accurate rental valuations, please consult official sources such as Dubai Land Department (DLD), RERA, and licensed real estate professionals."
    };
    
    console.log("Rental analysis response:", JSON.stringify(response));
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in rental-index-analysis:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
