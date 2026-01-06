import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Allowed origins - restrict CORS to trusted domains
const ALLOWED_ORIGINS = [
  "https://jjglobalcapital.com",
  "https://www.jjglobalcapital.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 20; // 20 comparisons per 5 minutes

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

    if (error || !data) return { blocked: false };

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabaseAdmin.from("ip_blocklist").delete().eq("id", data.id);
      return { blocked: false };
    }

    await supabaseAdmin
      .from("ip_blocklist")
      .update({ 
        last_attempt_at: new Date().toISOString(),
        block_count: (data.block_count || 1) + 1
      })
      .eq("id", data.id);

    return { blocked: true, reason: data.reason || "IP is blocked" };
  } catch (err) {
    console.error("IP blocklist check error:", err);
    return { blocked: false };
  }
}

async function checkRateLimit(
  supabaseAdmin: any,
  rateKey: string,
  clientIp: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const functionName = "compare-projects";
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
      
      const violationCount = await trackRateLimitViolation(supabaseAdmin, clientIp, functionName);
      if (violationCount >= AUTO_BLOCK_THRESHOLD) {
        await autoBlockIP(supabaseAdmin, clientIp, functionName, violationCount);
      }
      
      return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 0) };
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

async function trackRateLimitViolation(supabaseAdmin: any, clientIp: string, functionName: string): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { data: violations } = await supabaseAdmin
    .from("function_rate_limits")
    .select("*")
    .eq("rate_key", clientIp)
    .gte("window_start", oneDayAgo.toISOString())
    .gte("request_count", MAX_REQUESTS_PER_WINDOW);
  return violations?.length || 0;
}

async function autoBlockIP(supabaseAdmin: any, clientIp: string, functionName: string, violationCount: number): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + AUTO_BLOCK_DURATION_HOURS * 60 * 60 * 1000);
    const { data: existing } = await supabaseAdmin.from("ip_blocklist").select("id, block_count").eq("ip_address", clientIp).maybeSingle();

    if (existing) {
      await supabaseAdmin.from("ip_blocklist").update({
        expires_at: expiresAt.toISOString(),
        block_count: (existing.block_count || 1) + 1,
        reason: `Auto-blocked: ${violationCount} rate limit violations on ${functionName}`,
        last_attempt_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("ip_blocklist").insert({
        ip_address: clientIp,
        reason: `Auto-blocked: ${violationCount} rate limit violations on ${functionName}`,
        is_permanent: false,
        expires_at: expiresAt.toISOString(),
        block_count: 1,
      });
    }
    console.warn(`Auto-blocked IP: ${clientIp.substring(0, 8)}*** for ${AUTO_BLOCK_DURATION_HOURS} hours`);
  } catch (err) {
    console.error("Error auto-blocking IP:", err);
  }
}

// Input validation schema
const ProjectSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  developer: z.string().max(200).trim().optional().default("Unknown"),
  location: z.string().max(200).trim().optional().default(""),
  emirate: z.string().max(100).trim().optional().default(""),
  priceFrom: z.number().min(0).max(1000000000).optional().default(0),
  priceTo: z.number().min(0).max(1000000000).optional().nullable(),
  bedrooms: z.string().max(50).trim().optional().default(""),
  sizeRange: z.string().max(100).trim().optional().default(""),
  handover: z.string().max(100).trim().optional().nullable(),
  amenities: z.array(z.string().max(100).trim()).max(30).optional().default([]),
  views: z.array(z.string().max(100).trim()).max(20).optional().default([]),
  paymentPlan: z.string().max(200).trim().optional().nullable(),
});

const RequestSchema = z.object({
  projects: z.array(ProjectSchema).min(2).max(10),
});

// Sanitize string for use in prompts (prevent injection)
function sanitizeForPrompt(str: string): string {
  return str
    .replace(/[<>]/g, "") // Remove HTML-like tags
    .replace(/```/g, "") // Remove code blocks
    .replace(/\${/g, "") // Remove template literal injection
    .substring(0, 500); // Limit length
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase service client for rate limiting
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
      console.warn(`Blocked IP attempted compare-projects: ${clientIp.substring(0, 8)}***`);
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the JWT token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(supabaseService, user.id, clientIp);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user: ${user.id}`);
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

    console.log("Authenticated user:", user.id);

    // Parse and validate input
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid request data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { projects } = parseResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build sanitized project details for AI prompt
    const projectDetails = projects.map((p, i: number) => {
      const name = sanitizeForPrompt(p.name);
      const developer = sanitizeForPrompt(p.developer || "Unknown");
      const location = sanitizeForPrompt(p.location || "");
      const emirate = sanitizeForPrompt(p.emirate || "");
      const bedrooms = sanitizeForPrompt(p.bedrooms || "");
      const sizeRange = sanitizeForPrompt(p.sizeRange || "");
      const handover = sanitizeForPrompt(p.handover || "Ready");
      const paymentPlan = sanitizeForPrompt(p.paymentPlan || "Standard");
      const views = (p.views || []).map(v => sanitizeForPrompt(v)).slice(0, 10).join(", ");
      const amenities = (p.amenities || []).map(a => sanitizeForPrompt(a)).slice(0, 10).join(", ");
      
      return `
Property ${i + 1}: ${name}
- Developer: ${developer}
- Location: ${location}, ${emirate}
- Price: AED ${((p.priceFrom || 0) / 1000000).toFixed(1)}M - ${p.priceTo ? `AED ${(p.priceTo / 1000000).toFixed(1)}M` : "TBD"}
- Bedrooms: ${bedrooms}
- Size: ${sizeRange}
- Handover: ${handover}
- Payment Plan: ${paymentPlan}
- Views: ${views || "N/A"}
- Key Amenities: ${amenities || "N/A"}
`;
    }).join("\n");

    const systemPrompt = `You are a luxury real estate investment advisor specializing in UAE properties. You provide concise, professional comparisons to help investors make informed decisions.

Your analysis should:
- Be objective and balanced
- Highlight investment potential and ROI considerations
- Note lifestyle factors for end-users
- Be formatted with clear sections
- Be approximately 300-400 words
- Use professional but accessible language`;

    const userPrompt = `Compare these ${projects.length} UAE properties and provide an investment-focused analysis:

${projectDetails}

Please provide:
1. **Quick Summary** - 1-2 sentences on the best choice for different buyer types
2. **Investment Potential** - Which offers better ROI, rental yield potential, capital appreciation
3. **Lifestyle & Location** - Which suits different lifestyle preferences
4. **Value Analysis** - Price per sqft comparison, what you get for the price
5. **Recommendation** - Clear guidance based on buyer priorities

Be specific with numbers where possible. Format with markdown for readability.`;

    console.log("Sending AI request for", projects.length, "projects");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("AI Gateway error");
    }

    const data = await response.json();
    const comparison = data.choices?.[0]?.message?.content;

    if (!comparison) {
      throw new Error("No comparison generated");
    }

    console.log("Comparison generated successfully for user:", user.id);

    return new Response(JSON.stringify({ comparison }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("compare-projects error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred while processing your request" }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
