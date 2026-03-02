import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

// Rate limiting configuration - 5 generations per 5 minutes per user
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 5;

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
  const functionName = "interior-design-generate";
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
      
      const violationCount = await trackRateLimitViolation(supabaseAdmin, clientIp);
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
  clientIp: string
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

    // Send email notification
    await sendAutoBlockNotification(clientIp, functionName, violationCount, blockCount, expiresAt);
  } catch (err) {
    console.error("Error auto-blocking IP:", err);
  }
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
        from: "JBJ Security <contact@jbj.ae>",
        to: ["CONTACT@JBJ.AE"],
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

// Input validation schema
const RequestSchema = z.object({
  mode: z.enum(['concept', 'redesign', 'staging', 'chat']).optional(),
  propertyType: z.string().max(100).trim().optional(),
  propertyName: z.string().max(200).trim().optional(),
  propertySize: z.string().max(100).trim().optional(),
  designStyle: z.string().max(100).trim().optional(),
  colorPalette: z.string().max(200).trim().optional(),
  purpose: z.string().max(200).trim().optional(),
  customNotes: z.string().max(2000).trim().optional(),
  photos: z.array(z.string().max(5000000)).max(4).optional(),
  floorPlan: z.string().max(5000000).optional(),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Create service client for rate limiting and IP blocklist
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Authentication check - require valid user session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Interior design request rejected: No authorization header');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Authentication required. Please sign in to use the AI Interior Design tool.',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Interior design request rejected: Invalid token', authError?.message);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Your session has expired. Please sign in again.',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check IP blocklist
    const clientIp = getClientIp(req);
    const blocklistResult = await checkIPBlocklist(supabaseService, clientIp);
    
    if (blocklistResult.blocked) {
      console.warn(`Blocked IP attempted interior design: ${clientIp.substring(0, 8)}***`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Your access has been restricted. Please contact support if you believe this is an error.',
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
          success: false,
          error: `You've reached the design generation limit. Please wait ${Math.ceil((rateLimitResult.retryAfterSeconds || 300) / 60)} minutes before trying again.`,
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

    // Parse and validate input
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.log('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request format. Please check your inputs.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      mode,
      propertyType,
      propertyName,
      propertySize,
      designStyle,
      colorPalette,
      purpose,
      customNotes,
      photos,
      floorPlan,
    } = parseResult.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const safe = (v: string | undefined) => (v ? v.slice(0, 800) : "Not specified");
    
    // Build mode-specific prompt
    let promptText = '';
    const currentMode = mode || 'concept';
    
    if (currentMode === 'concept') {
      promptText = `Generate ONE premium, photorealistic interior design render (a single viewpoint) based on the inputs.

CONTEXT:
- Property type: ${safe(propertyType)}
- Property name: ${safe(propertyName)}
- Size: ${safe(propertySize)}
- Style: ${safe(designStyle)}
- Color palette: ${safe(colorPalette)}
- Purpose: ${safe(purpose)}
- Notes: ${safe(customNotes)}

REQUIREMENTS:
- Make it look like a high-end Dubai interior.
- Include realistic lighting, materials, and furnishings.
- Output must include an image.
- Also return 3-5 bullet points describing the key design choices.`;
    } else if (currentMode === 'redesign') {
      promptText = `Redesign the room shown in the uploaded photo(s). Transform it into a ${safe(designStyle)} style interior.

TARGET STYLE:
- Design style: ${safe(designStyle)}
- Color palette: ${safe(colorPalette)}
- Special requests: ${safe(customNotes)}

REQUIREMENTS:
- Keep the room's basic structure and layout.
- Replace furniture, decor, and finishes with ${safe(designStyle)} alternatives.
- Make it look like a high-end Dubai interior.
- Include realistic lighting and materials.
- Output must include a redesigned image.
- Also return 3-5 bullet points describing the changes made.`;
    } else if (currentMode === 'staging') {
      promptText = `Stage the empty room shown in the uploaded photo(s) with furniture and decor.

STAGING REQUIREMENTS:
- Room type: ${safe(propertyType)}
- Furniture style: ${safe(designStyle)}
- Special requests: ${safe(customNotes)}

REQUIREMENTS:
- Add realistic furniture appropriate for the room type.
- Include rugs, artwork, plants, and decorative accessories.
- Make it look professionally staged for a real estate listing.
- Output must include a fully staged room image.
- Also return 3-5 bullet points describing the staging choices.`;
    } else {
      // Chat mode - use custom notes as the main prompt
      promptText = `${safe(customNotes)}

REQUIREMENTS:
- Create a high-end Dubai interior design.
- Include realistic lighting, materials, and furnishings.
- Output must include an image.
- Also return 3-5 bullet points describing the key design choices.`;
    }

    const content: any[] = [
      {
        type: "text",
        text: promptText,
      },
    ];

    const addImage = (value: unknown) => {
      if (typeof value !== "string" || value.length < 10) return;
      const url = value.startsWith("data:") ? value : `data:image/jpeg;base64,${value}`;
      content.push({ type: "image_url", image_url: { url } });
    };

    if (Array.isArray(photos)) {
      for (const p of photos.slice(0, 4)) addImage(p);
    }
    addImage(floorPlan);

    console.log(`Interior design generation started for user: ${user.id}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "AI service rate limit reached. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI service credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI generation failed (${response.status})`);
    }

    const data = await response.json();
    console.log("AI Gateway response structure:", JSON.stringify(Object.keys(data)));
    
    // Try multiple possible image extraction paths
    const message = data?.choices?.[0]?.message;
    let imageUrl: string | undefined;
    let notes = "";
    
    // Path 1: images array with image_url object
    if (message?.images?.[0]?.image_url?.url) {
      imageUrl = message.images[0].image_url.url;
    }
    // Path 2: images array with direct URL string
    else if (message?.images?.[0] && typeof message.images[0] === 'string') {
      imageUrl = message.images[0];
    }
    // Path 3: image_url directly on message
    else if (message?.image_url?.url) {
      imageUrl = message.image_url.url;
    }
    // Path 4: content array with image parts
    else if (Array.isArray(message?.content)) {
      for (const part of message.content) {
        if (part?.type === 'image_url' && part?.image_url?.url) {
          imageUrl = part.image_url.url;
          break;
        }
        if (part?.type === 'image' && part?.image) {
          imageUrl = part.image;
          break;
        }
        if (part?.type === 'text' && part?.text) {
          notes += part.text;
        }
      }
    }
    // Path 5: inline_data format (Gemini native)
    else if (message?.content?.[0]?.inline_data?.data) {
      const mimeType = message.content[0].inline_data.mimeType || 'image/png';
      imageUrl = `data:${mimeType};base64,${message.content[0].inline_data.data}`;
    }
    
    // Get notes from content if not already extracted
    if (!notes && typeof message?.content === 'string') {
      notes = message.content;
    }

    if (!imageUrl) {
      console.error("Could not extract image from response. Message structure:", JSON.stringify(message));
      throw new Error("No image was generated. The AI response format was unexpected.");
    }
    console.log(`Interior design generation completed for user: ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        result: {
          images: [imageUrl],
          notes,
          createdAt: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("interior-design-generate error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An error occurred while generating the design. Please try again.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
