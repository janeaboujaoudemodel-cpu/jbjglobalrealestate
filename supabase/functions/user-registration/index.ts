import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 registration attempts per 15 minutes per IP

// Auto-block configuration
const AUTO_BLOCK_THRESHOLD = 3; // Block after 3 rate limit violations
const AUTO_BLOCK_DURATION_HOURS = 24; // Block for 24 hours

// Rate limit entry type
interface RateLimitEntry {
  id: string;
  function_name: string;
  rate_key: string;
  window_start: string;
  request_count: number;
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
      // Block expired, remove it
      await supabaseAdmin
        .from("ip_blocklist")
        .delete()
        .eq("id", data.id);
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkRateLimit(
  supabaseAdmin: any,
  clientIp: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number; shouldAutoBlock?: boolean }> {
  const functionName = "user-registration";
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

  // Clean up old rate limit entries and get current count
  const { data: existingEntry, error: fetchError } = await supabaseAdmin
    .from("function_rate_limits")
    .select("*")
    .eq("function_name", functionName)
    .eq("rate_key", clientIp)
    .gte("window_start", windowStart.toISOString())
    .order("window_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("Rate limit check error:", fetchError);
    // Allow on error to not block legitimate users
    return { allowed: true };
  }

  const entry = existingEntry as RateLimitEntry | null;

  if (entry) {
    if (entry.request_count >= MAX_REQUESTS_PER_WINDOW) {
      const windowEndTime = new Date(entry.window_start).getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
      const retryAfterSeconds = Math.ceil((windowEndTime - Date.now()) / 1000);
      console.warn(`Rate limit exceeded for IP: ${clientIp.substring(0, 8)}***`);
      
      // Check if we should auto-block this IP
      const violationCount = await trackRateLimitViolation(supabaseAdmin, clientIp, functionName);
      const shouldAutoBlock = violationCount >= AUTO_BLOCK_THRESHOLD;
      
      if (shouldAutoBlock) {
        await autoBlockIP(supabaseAdmin, clientIp, functionName, violationCount);
      }
      
      return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 0), shouldAutoBlock };
    }

    // Increment counter
    await supabaseAdmin
      .from("function_rate_limits")
      .update({ request_count: entry.request_count + 1 })
      .eq("id", entry.id);
  } else {
    // Create new entry
    await supabaseAdmin
      .from("function_rate_limits")
      .insert({
        function_name: functionName,
        rate_key: clientIp,
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
  
  // Count how many times this IP has exceeded rate limits in the past 24 hours
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
    
    // Check if already blocked
    const { data: existing } = await supabaseAdmin
      .from("ip_blocklist")
      .select("id, block_count")
      .eq("ip_address", clientIp)
      .maybeSingle();

    let blockCount = 1;

    if (existing) {
      blockCount = (existing.block_count || 1) + 1;
      // Update existing block - extend duration and increment count
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
      // Create new block
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

// Get client IP from request headers
function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

// Comprehensive input validation schema
const registrationSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
    .transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-']+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
    .optional(),
  profilePicture: z
    .object({
      base64: z.string().max(5 * 1024 * 1024, "Profile picture must be less than 5MB"),
      mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
      fileName: z.string().max(255).optional(),
    })
    .optional(),
});

// ============================================================================
// BREACHED PASSWORD CHECK (HaveIBeenPwned k-Anonymity API)
// ============================================================================

async function sha1Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/**
 * Checks if a password has been exposed in known data breaches using HaveIBeenPwned.
 * Uses k-anonymity: only sends first 5 chars of SHA-1 hash, checks locally.
 * Privacy-preserving - actual password never leaves the server.
 */
async function isPasswordBreached(password: string): Promise<{ breached: boolean; count?: number }> {
  try {
    const hash = await sha1Hash(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "User-Agent": "JBJ-Global-Real-Estate-Security-Check",
        "Add-Padding": "true", // Adds padding to prevent response size analysis
      },
    });

    if (!response.ok) {
      console.error("HIBP API error:", response.status);
      // Don't block registration if API is unavailable
      return { breached: false };
    }

    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix?.trim() === suffix) {
        const count = parseInt(countStr?.trim() || "0", 10);
        console.warn(`Breached password detected: appeared ${count} times in data breaches`);
        return { breached: true, count };
      }
    }

    return { breached: false };
  } catch (err) {
    console.error("Breached password check error:", err);
    // Don't block registration if check fails
    return { breached: false };
  }
}

// Magic bytes for image validation
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  "image/gif": [0x47, 0x49, 0x46, 0x38],
};

function validateMagicBytes(buffer: Uint8Array, expectedMimeType: string): boolean {
  const expectedBytes = MAGIC_BYTES[expectedMimeType];
  if (!expectedBytes) return false;

  for (let i = 0; i < expectedBytes.length; i++) {
    if (buffer[i] !== expectedBytes[i]) return false;
  }
  return true;
}

function base64ToUint8Array(base64: string): Uint8Array {
  // Handle data URI format
  const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: URIs
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client early for rate limiting
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase configuration");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check IP blocklist first
    const clientIp = getClientIp(req);
    const blocklistResult = await checkIPBlocklist(supabaseAdmin, clientIp);
    
    if (blocklistResult.blocked) {
      console.warn(`Blocked IP attempted registration: ${clientIp.substring(0, 8)}***`);
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check rate limit before processing
    const rateLimitResult = await checkRateLimit(supabaseAdmin, clientIp);

    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit blocked registration attempt from IP: ${clientIp.substring(0, 8)}***`);
      return new Response(
        JSON.stringify({ 
          error: "Too many registration attempts. Please try again later.",
          retryAfterSeconds: rateLimitResult.retryAfterSeconds
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfterSeconds || 900)
          } 
        }
      );
    }

    const body = await req.json();

    // Validate input
    const validationResult = registrationSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Validation failed",
          details: validationResult.error.errors.map(e => ({
            field: e.path.join("."),
            message: e.message
          }))
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, fullName, profilePicture } = validationResult.data;

    // Check if password has been exposed in data breaches (HaveIBeenPwned)
    const breachCheck = await isPasswordBreached(password);
    if (breachCheck.breached) {
      const timesExposed = breachCheck.count ? ` (found ${breachCheck.count.toLocaleString()} times)` : "";
      return new Response(
        JSON.stringify({ 
          error: "Password security risk",
          details: [{
            field: "password",
            message: `This password has been exposed in known data breaches${timesExposed}. Please choose a different, unique password for your security.`
          }]
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedFullName = fullName ? sanitizeInput(fullName) : undefined;

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUser?.users?.some(
      (u) => u.email?.toLowerCase() === sanitizedEmail
    );

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "An account with this email already exists" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: true, // Auto-confirm for development
      user_metadata: {
        full_name: sanitizedFullName,
      },
    });

    if (authError) {
      console.error("Auth error:", authError.message);
      return new Response(
        JSON.stringify({ error: "Failed to create account. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;
    let profilePictureUrl: string | null = null;

    // Handle profile picture upload
    if (profilePicture) {
      try {
        const fileBuffer = base64ToUint8Array(profilePicture.base64);

        // Validate file size (max 5MB)
        if (fileBuffer.length > 5 * 1024 * 1024) {
          console.warn("Profile picture exceeds 5MB limit");
        } else if (!validateMagicBytes(fileBuffer, profilePicture.mimeType)) {
          console.warn("Profile picture magic bytes don't match declared MIME type");
        } else {
          // Generate secure filename
          const extension = profilePicture.mimeType.split("/")[1];
          const secureFileName = `${userId}/${crypto.randomUUID()}.${extension}`;

          // Upload to storage
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from("profile-pictures")
            .upload(secureFileName, fileBuffer, {
              contentType: profilePicture.mimeType,
              upsert: true,
            });

          if (uploadError) {
            console.error("Profile picture upload error:", uploadError.message);
          } else {
            const { data: urlData } = supabaseAdmin.storage
              .from("profile-pictures")
              .getPublicUrl(uploadData.path);
            profilePictureUrl = urlData.publicUrl;
          }
        }
      } catch (uploadErr) {
        console.error("Profile picture processing error:", uploadErr);
        // Continue without profile picture
      }
    }

    // Update profile with full name and picture URL if available
    if (sanitizedFullName || profilePictureUrl) {
      await supabaseAdmin
        .from("profiles")
        .upsert({
          id: userId,
          email: sanitizedEmail,
          full_name: sanitizedFullName,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
    }

    // Send welcome email
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          email: sanitizedEmail,
          fullName: sanitizedFullName || "Valued Member",
        }),
      });
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
      // Continue - email failure shouldn't fail registration
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account created successfully",
        user: {
          id: userId,
          email: sanitizedEmail,
          fullName: sanitizedFullName,
          profilePictureUrl,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
