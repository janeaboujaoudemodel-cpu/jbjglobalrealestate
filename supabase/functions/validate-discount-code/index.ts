import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

// Rate limiting configuration - 10 validate attempts per 5 minutes per user
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 10;

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
  const functionName = "validate-discount-code";
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
    if (!resendApiKey) return;

    const maskedIp = `${clientIp.substring(0, 8)}***`;
    const expiresAtFormatted = expiresAt.toLocaleString("en-US", { timeZone: "Asia/Dubai", dateStyle: "medium", timeStyle: "short" });

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: "JBJ Security <contact@jbj.ae>",
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

// Input validation schemas
const ValidateActionSchema = z.object({
  action: z.literal('validate'),
  code: z.string().min(1, "Code is required").max(50).trim(),
  tier: z.string().max(50).optional(),
});

const ApplyActionSchema = z.object({
  action: z.literal('apply'),
  codeId: z.string().uuid("Invalid code ID"),
  originalPrice: z.number().min(0).max(1000000),
  finalPrice: z.number().min(0).max(1000000),
  subscriptionId: z.string().uuid().optional().nullable(),
});

const CreateActionSchema = z.object({
  action: z.literal('create'),
  discountType: z.enum(['percentage', 'fixed', 'free']),
  discountValue: z.number().min(0).max(100).optional(),
  description: z.string().max(500).optional(),
  maxUses: z.number().int().min(1).max(10000).optional(),
  assignedToEmail: z.string().email().max(255).optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  applicableTiers: z.array(z.string().max(50)).max(10).optional().nullable(),
});

const RequestSchema = z.discriminatedUnion('action', [
  ValidateActionSchema,
  ApplyActionSchema,
  CreateActionSchema,
]);

// SHA-256 hash function
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.toUpperCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create service client for rate limiting
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Check IP blocklist first
    const clientIp = getClientIp(req);
    const blocklistResult = await checkIPBlocklist(supabaseService, clientIp);
    
    if (blocklistResult.blocked) {
      console.warn(`Blocked IP attempted discount validation: ${clientIp.substring(0, 8)}***`);
      return new Response(
        JSON.stringify({ valid: false, success: false, error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.log('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ valid: false, success: false, error: 'Invalid request format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const validatedData = parseResult.data;

    console.log(`Discount code action: ${validatedData.action}`);

    // For validate action - authenticate user first
    if (validatedData.action === 'validate') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Authentication required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Invalid authentication token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Check rate limit using user ID
      const rateLimitResult = await checkRateLimit(supabaseService, user.id, clientIp);
      if (!rateLimitResult.allowed) {
        console.warn(`Rate limit exceeded for user: ${user.id}`);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Too many attempts. Please try again later.' 
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

      // Use verified user data, not client-supplied values
      const verifiedUserId = user.id;
      const verifiedEmail = user.email || '';
      const { code, tier } = validatedData;

      const codeHash = await hashCode(code);
      console.log(`Looking up code hash: ${codeHash.substring(0, 10)}... for user: ${verifiedUserId}`);

      // Find the discount code by hash
      const { data: discountCode, error: lookupError } = await supabaseService
        .from('discount_codes')
        .select('*')
        .eq('code_hash', codeHash)
        .eq('is_active', true)
        .single();

      if (lookupError || !discountCode) {
        console.log('Code not found or inactive');
        return new Response(
          JSON.stringify({ valid: false, error: 'Invalid or expired discount code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Check validity period
      const now = new Date();
      if (discountCode.valid_from && new Date(discountCode.valid_from) > now) {
        return new Response(
          JSON.stringify({ valid: false, error: 'This code is not yet active' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      if (discountCode.valid_until && new Date(discountCode.valid_until) < now) {
        return new Response(
          JSON.stringify({ valid: false, error: 'This code has expired' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Check max uses
      if (discountCode.max_uses !== null && discountCode.current_uses >= discountCode.max_uses) {
        return new Response(
          JSON.stringify({ valid: false, error: 'This code has reached its maximum uses' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Check if assigned to specific user - use verified email
      if (discountCode.assigned_to_email && discountCode.assigned_to_email.toLowerCase() !== verifiedEmail.toLowerCase()) {
        return new Response(
          JSON.stringify({ valid: false, error: 'This code is not assigned to your account' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      if (discountCode.assigned_to_user_id && discountCode.assigned_to_user_id !== verifiedUserId) {
        return new Response(
          JSON.stringify({ valid: false, error: 'This code is not assigned to your account' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Check applicable tiers
      if (discountCode.applicable_tiers && discountCode.applicable_tiers.length > 0 && tier) {
        if (!discountCode.applicable_tiers.includes(tier)) {
          return new Response(
            JSON.stringify({ valid: false, error: `This code is not valid for the ${tier} plan` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      }

      // Check if user already used this code (if single use per user)
      if (discountCode.is_single_use_per_user) {
        const { data: existingUsage } = await supabaseService
          .from('discount_code_usages')
          .select('id')
          .eq('discount_code_id', discountCode.id)
          .eq('user_id', verifiedUserId)
          .single();

        if (existingUsage) {
          return new Response(
            JSON.stringify({ valid: false, error: 'You have already used this discount code' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      }

      // Code is valid!
      console.log(`Code valid: ${discountCode.discount_type} - ${discountCode.discount_value}`);
      
      return new Response(
        JSON.stringify({
          valid: true,
          discountType: discountCode.discount_type,
          discountValue: discountCode.discount_value,
          description: discountCode.description,
          codeId: discountCode.id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } else if (validatedData.action === 'apply') {
      // Apply the discount code (record usage) - requires authentication
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid authentication token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Use verified user data
      const verifiedUserId = user.id;
      const verifiedEmail = user.email || '';

      const { codeId, originalPrice, finalPrice, subscriptionId } = validatedData;

      const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

      // Get discount code details
      const { data: discountCode, error: lookupError } = await supabaseService
        .from('discount_codes')
        .select('*')
        .eq('id', codeId)
        .single();

      if (lookupError || !discountCode) {
        return new Response(
          JSON.stringify({ success: false, error: 'Discount code not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Record usage with verified user data
      const { error: usageError } = await supabaseService
        .from('discount_code_usages')
        .insert({
          discount_code_id: codeId,
          user_id: verifiedUserId,
          user_email: verifiedEmail,
          subscription_id: subscriptionId || null,
          discount_applied: originalPrice - finalPrice,
          original_price: originalPrice,
          final_price: finalPrice,
        });

      if (usageError) {
        console.error('Failed to record usage:', usageError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to apply discount' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Increment usage count
      await supabaseService
        .from('discount_codes')
        .update({ current_uses: discountCode.current_uses + 1 })
        .eq('id', codeId);

      console.log(`Discount applied for user ${verifiedUserId}: ${originalPrice} -> ${finalPrice}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } else if (validatedData.action === 'create') {
      // Create a new discount code - ADMIN ONLY
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid authentication token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Verify admin role using service key to check user_roles table
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: adminRole, error: roleError } = await supabaseService
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (roleError || !adminRole) {
        console.log(`Non-admin user ${user.id} attempted to create discount code`);
        return new Response(
          JSON.stringify({ success: false, error: 'Admin access required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      console.log(`Admin user ${user.id} creating discount code`);

      const { 
        discountType, 
        discountValue, 
        description, 
        maxUses, 
        assignedToEmail, 
        validUntil, 
        applicableTiers
      } = validatedData;

      // Generate a secure random code
      const randomBytes = new Uint8Array(6);
      crypto.getRandomValues(randomBytes);
      const generatedCode = Array.from(randomBytes)
        .map(b => b.toString(36).toUpperCase())
        .join('')
        .substring(0, 8);

      const codeHash = await hashCode(generatedCode);

      const { data: newCode, error: createError } = await supabaseService
        .from('discount_codes')
        .insert({
          code: generatedCode, // Store the plain code for admin reference only
          code_hash: codeHash,
          discount_type: discountType,
          discount_value: discountValue || 0,
          description,
          max_uses: maxUses || 1,
          assigned_to_email: assignedToEmail || null,
          valid_until: validUntil || null,
          applicable_tiers: applicableTiers || null,
          created_by: user.id, // Use verified admin user ID
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create code:', createError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create discount code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log(`Admin ${user.id} created discount code: ${generatedCode}`);

      return new Response(
        JSON.stringify({ success: true, code: generatedCode, id: newCode.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Discount code error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
