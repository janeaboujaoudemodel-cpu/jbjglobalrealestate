import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 registration attempts per 15 minutes per IP

// Rate limit entry type
interface RateLimitEntry {
  id: string;
  function_name: string;
  rate_key: string;
  window_start: string;
  request_count: number;
}

// Rate limiting function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkRateLimit(
  supabaseAdmin: any,
  clientIp: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
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
      return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 0) };
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

    // Check rate limit before processing
    const clientIp = getClientIp(req);
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
