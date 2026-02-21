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

// Rate limiting configuration - 10 measurements per 5 minutes per user
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 10;

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
  const functionName = "property-measurement";
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
        from: "JBJ Security <info@jbj.ae>",
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
  images: z.array(z.string().max(5000000)).min(1, "At least 1 image is required").max(10, "Maximum 10 images allowed"),
  propertyType: z.string().max(100).trim().optional(),
  propertyName: z.string().max(200).trim().optional(),
  unitPreference: z.enum(['metric', 'imperial', 'both']).optional(),
  roomLabels: z.array(z.string().max(100)).max(20).optional(),
  roomList: z.string().max(500).trim().optional(),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
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
      console.log('Property measurement request rejected: No authorization header');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Authentication required. Please sign in to use the Property Measurement tool.',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Property measurement request rejected: Invalid token', authError?.message);
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
      console.warn(`Blocked IP attempted property measurement: ${clientIp.substring(0, 8)}***`);
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
          error: `You've reached the measurement limit. Please wait ${Math.ceil((rateLimitResult.retryAfterSeconds || 300) / 60)} minutes before trying again.`,
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

    // Parse and validate input with Zod
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.log('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: parseResult.error.errors[0]?.message || "Invalid request format",
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { images, propertyType, propertyName, unitPreference, roomLabels, roomList } = parseResult.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing ${images.length} images for property measurement (user: ${user.id})`);
    console.log(`Property type: ${propertyType}, Name: ${propertyName || 'Unnamed'}`);

    // Build the content array with images and room context
    const roomContext = roomLabels && roomLabels.length > 0 
      ? `The user has labeled these images by room: ${roomLabels.join(', ')}.`
      : '';

    const content: any[] = [
      {
        type: "text",
        text: `You are an expert AI property measurement system with advanced computer vision capabilities. Analyze these property photos to estimate room dimensions and total property size.

PROPERTY DETAILS:
- Type: ${propertyType || 'Unknown'}
- Name: ${propertyName || 'Unnamed Property'}
- Unit preference: ${unitPreference || 'both'}
- Rooms to measure: ${roomList || 'All visible rooms'}
${roomContext}

ANALYSIS INSTRUCTIONS:
1. Examine each photo carefully to identify the specific room/space it shows
2. Look for visual cues: doors (standard ~7ft/2.1m height), windows, furniture, tiles, fixtures
3. Use perspective and spatial relationships to estimate dimensions
4. ONLY include rooms that you can actually see photos of
5. Do NOT guess rooms that have no photos provided
6. Estimate each room's approximate area in square feet

IMPORTANT CALIBRATION REFERENCES:
- Standard door height: 6.8-7 feet (2.0-2.1 meters)
- Standard door width: 2.5-3 feet (0.76-0.9 meters)
- Standard ceiling height: 9-10 feet (2.7-3 meters)
- Standard floor tiles: 2x2 feet or 60x60 cm
- Standard bathtub: 5 feet long (1.5 meters)
- Standard kitchen counter height: 3 feet (0.9 meters)

RESPONSE FORMAT:
Respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "totalArea": <number in sq ft - sum of all room areas>,
  "rooms": [
    { "name": "<room name>", "area": <number in sq ft>, "dimensions": "<length x width estimate>" }
  ],
  "confidence": "<high|medium|low>",
  "notes": "<any important observations about the measurement accuracy or rooms you couldn't measure>"
}

CRITICAL RULES:
- Only measure rooms you can see in the provided photos
- Be realistic and conservative with estimates
- If you cannot determine a room's size from the photos, note it in "notes" field
- Sum all room areas to get the totalArea
- For ${propertyType || 'residential'} properties in Dubai/UAE, typical sizes range from:
  - Studio: 400-600 sq ft
  - 1BR: 600-900 sq ft
  - 2BR: 900-1400 sq ft
  - 3BR: 1400-2000 sq ft
  - Villa: 2000-5000+ sq ft`
      }
    ];

    // Add images to the content
    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      // Check if it's already a data URL or needs formatting
      const imageUrl = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
      
      content.push({
        type: "image_url",
        image_url: {
          url: imageUrl
        }
      });
    }

    console.log("Calling Lovable AI for image analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service rate limit reached. Please try again later.", success: false }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please contact support.", success: false }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    const aiResponse = data.choices?.[0]?.message?.content;
    if (!aiResponse) {
      throw new Error("No response from AI model");
    }

    console.log("Raw AI response:", aiResponse);

    // Parse the JSON response
    let measurementResult;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith("```")) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();
      
      measurementResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Response was:", aiResponse);
      throw new Error("Failed to parse measurement results");
    }

    // Validate the response structure
    if (!measurementResult.totalArea || !Array.isArray(measurementResult.rooms)) {
      throw new Error("Invalid measurement result structure");
    }

    // Recalculate total from rooms to ensure accuracy
    const calculatedTotal = measurementResult.rooms.reduce((sum: number, room: any) => sum + (room.area || 0), 0);
    if (Math.abs(calculatedTotal - measurementResult.totalArea) > 50) {
      measurementResult.totalArea = calculatedTotal;
    }

    console.log(`Measurement complete for user: ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        result: {
          totalArea: measurementResult.totalArea,
          rooms: measurementResult.rooms,
          unit: unitPreference || "both",
          confidence: measurementResult.confidence || "medium",
          notes: measurementResult.notes || "",
          propertyType,
          propertyName,
          analyzedImages: images.length,
          timestamp: new Date().toISOString(),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in property-measurement function:", error);
    return new Response(
      JSON.stringify({ 
        error: "An error occurred while processing your request. Please try again.",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
