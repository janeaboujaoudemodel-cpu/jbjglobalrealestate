/**
 * Shared AI Utilities for Edge Functions
 * Centralizes common patterns: CORS, rate limiting, security, AI gateway calls
 */

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
  "http://localhost:5173",
  "http://localhost:8080",
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(
    (allowed) =>
      origin === allowed ||
      origin.endsWith(".lovableproject.com") ||
      origin.endsWith(".lovable.app")
  );
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// ============================================================================
// APPROVED CONTACT INFO (Single Source of Truth) - JBJ GLOBAL REAL ESTATE
// ============================================================================

export const APPROVED_CONTACT = {
  phone: "+971 56 591 1000",
  email: "contact@JBJ.ae",
  privacyEmail: "privacy@JBJ.ae",
  website: "jbj.ae",
  whatsapp: "+971565911000",
  companyName: "JBJ Global Real Estate",
  companyFull: "JBJ Global Real Estate L.L.C S.O.C.",
  founder: "Jane Bou Jaoude",
};

export const APPROVED_EMAILS = [
  "contact@jbj.ae",
  "privacy@jbj.ae",
  "partnerships@jbj.ae",
  "collaboration@jbj.ae",
  "careers@jbj.ae",
  "security@jbj.ae",
  "jane@jbj.ae",
];

// ============================================================================
// CONTACT SANITIZATION
// ============================================================================

/**
 * Sanitizes AI output to replace any unapproved phone/email with approved ones
 */
export function sanitizeContactInfo(text: string): string {
  const phonePatterns = [
    /\+971[\s\-]?5[0-9][\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g,
    /\+971[\s\-]?[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g,
    /0?5[0-9][\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g,
    /\+971[\s\-]?[0-9]{9,10}/g,
  ];

  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  let sanitized = text;

  // Replace non-approved phone numbers
  phonePatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, (match) => {
      const normalized = match.replace(/[\s\-]/g, "");
      if (normalized.includes("565911000")) return match;
      return APPROVED_CONTACT.phone;
    });
  });

  // Replace non-approved emails
  const toCanonicalJbjEmail = (value: string) => value.replace(/@jbj\.ae$/i, "@JBJ.ae");

  sanitized = sanitized.replace(emailPattern, (match) => {
    const lower = match.toLowerCase();
    // Allow any @jbj.ae address, but force JBJ casing in output
    if (lower.endsWith("@jbj.ae")) return toCanonicalJbjEmail(match);
    return APPROVED_CONTACT.email;
  });

  return sanitized;
}

/**
 * Sanitizes string for use in AI prompts (prevents injection)
 */
export function sanitizeForPrompt(str: string | number | null | undefined, maxLength = 500): string {
  if (str === null || str === undefined) return "";
  const strValue = String(str);
  return strValue
    .replace(/[<>]/g, "")
    .replace(/```/g, "")
    .replace(/\${/g, "")
    .substring(0, maxLength);
}

// ============================================================================
// CLIENT IP EXTRACTION
// ============================================================================

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

// ============================================================================
// SUPABASE CLIENT HELPERS
// ============================================================================

export interface SupabaseClients {
  service: SupabaseClient;
  user: SupabaseClient;
}

export function createSupabaseClients(authHeader: string | null): SupabaseClients {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const service = createClient(supabaseUrl, supabaseServiceKey);
  const user = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });

  return { service, user };
}

// ============================================================================
// IP BLOCKLIST
// ============================================================================

export interface BlocklistResult {
  blocked: boolean;
  reason?: string;
}

export async function checkIPBlocklist(
  supabaseAdmin: SupabaseClient,
  clientIp: string
): Promise<BlocklistResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from("ip_blocklist")
      .select("*")
      .eq("ip_address", clientIp)
      .maybeSingle();

    if (error || !data) return { blocked: false };

    // Check if block expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabaseAdmin.from("ip_blocklist").delete().eq("id", data.id);
      return { blocked: false };
    }

    // Update attempt tracking
    await supabaseAdmin
      .from("ip_blocklist")
      .update({
        last_attempt_at: new Date().toISOString(),
        block_count: (data.block_count || 1) + 1,
      })
      .eq("id", data.id);

    console.warn(`Blocked IP attempted access: ${clientIp.substring(0, 8)}***`);
    return { blocked: true, reason: data.reason || "IP is blocked" };
  } catch (err) {
    console.error("IP blocklist check error:", err);
    return { blocked: false };
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export interface RateLimitConfig {
  functionName: string;
  windowMinutes: number;
  maxRequests: number;
  autoBlockThreshold?: number;
  autoBlockDurationHours?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  requestCount?: number;
}

export async function checkRateLimit(
  supabaseAdmin: SupabaseClient,
  rateKey: string,
  clientIp: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const {
    functionName,
    windowMinutes,
    maxRequests,
    autoBlockThreshold = 5,
    autoBlockDurationHours = 12,
  } = config;

  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  try {
    const { data: existingEntry, error } = await supabaseAdmin
      .from("function_rate_limits")
      .select("*")
      .eq("function_name", functionName)
      .eq("rate_key", rateKey)
      .gte("window_start", windowStart.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Rate limit check error:", error);
      return { allowed: true };
    }

    if (existingEntry) {
      if (existingEntry.request_count >= maxRequests) {
        const windowEndTime =
          new Date(existingEntry.window_start).getTime() + windowMinutes * 60 * 1000;
        const retryAfterSeconds = Math.ceil((windowEndTime - Date.now()) / 1000);

        console.warn(`Rate limit exceeded for ${functionName}: ${rateKey.substring(0, 8)}***`);

        // Track violations for auto-blocking
        const violations = await countRecentViolations(supabaseAdmin, clientIp, functionName, maxRequests);
        if (violations >= autoBlockThreshold) {
          await autoBlockIP(supabaseAdmin, clientIp, functionName, violations, autoBlockDurationHours);
        }

        return {
          allowed: false,
          retryAfterSeconds: Math.max(retryAfterSeconds, 0),
          requestCount: existingEntry.request_count,
        };
      }

      await supabaseAdmin
        .from("function_rate_limits")
        .update({ request_count: existingEntry.request_count + 1 })
        .eq("id", existingEntry.id);

      return { allowed: true, requestCount: existingEntry.request_count + 1 };
    }

    // Create new rate limit entry
    await supabaseAdmin.from("function_rate_limits").insert({
      function_name: functionName,
      rate_key: rateKey,
      window_start: new Date().toISOString(),
      request_count: 1,
    });

    return { allowed: true, requestCount: 1 };
  } catch (err) {
    console.error("Rate limit error:", err);
    return { allowed: true };
  }
}

async function countRecentViolations(
  supabaseAdmin: SupabaseClient,
  clientIp: string,
  functionName: string,
  maxRequests: number
): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { data } = await supabaseAdmin
    .from("function_rate_limits")
    .select("*")
    .eq("rate_key", clientIp)
    .gte("window_start", oneDayAgo.toISOString())
    .gte("request_count", maxRequests);
  return data?.length || 0;
}

async function autoBlockIP(
  supabaseAdmin: SupabaseClient,
  clientIp: string,
  functionName: string,
  violationCount: number,
  durationHours: number
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    const { data: existing } = await supabaseAdmin
      .from("ip_blocklist")
      .select("id, block_count")
      .eq("ip_address", clientIp)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("ip_blocklist")
        .update({
          expires_at: expiresAt.toISOString(),
          block_count: (existing.block_count || 1) + 1,
          reason: `Auto-blocked: ${violationCount} rate limit violations on ${functionName}`,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("ip_blocklist").insert({
        ip_address: clientIp,
        reason: `Auto-blocked: ${violationCount} rate limit violations on ${functionName}`,
        is_permanent: false,
        expires_at: expiresAt.toISOString(),
        block_count: 1,
      });
    }

    console.warn(`Auto-blocked IP: ${clientIp.substring(0, 8)}*** for ${durationHours} hours`);
  } catch (err) {
    console.error("Auto-block error:", err);
  }
}

// ============================================================================
// LOVABLE AI GATEWAY
// ============================================================================

export interface AIRequestOptions {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  status?: number;
}

/**
 * Calls Lovable AI Gateway with standardized error handling
 * Supports both old signature (systemPrompt, userPrompt) and new (options object)
 */
export async function callLovableAI(
  systemPromptOrOptions: string | AIRequestOptions,
  userPrompt?: string
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    throw new Error("AI service not configured");
  }

  // Handle both old and new signatures
  let options: AIRequestOptions;
  if (typeof systemPromptOrOptions === "string") {
    options = {
      systemPrompt: systemPromptOrOptions,
      userPrompt: userPrompt || "",
    };
  } else {
    options = systemPromptOrOptions;
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.userPrompt },
        ],
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        stream: options.stream || false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limits exceeded, please try again later.");
      }
      if (response.status === 402) {
        throw new Error("AI service temporarily unavailable.");
      }

      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response generated");
    }

    return sanitizeContactInfo(content);
  } catch (err) {
    console.error("AI call error:", err);
    throw err;
  }
}

// ============================================================================
// AI USAGE TRACKING
// ============================================================================

export interface AIUsageRecord {
  functionName: string;
  userId?: string;
  clientIp: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  success: boolean;
  errorType?: string;
  responseTimeMs?: number;
  processingTimeMs?: number; // alias for responseTimeMs
}

export async function trackAIUsage(
  supabaseAdmin: SupabaseClient,
  usage: AIUsageRecord
): Promise<void> {
  try {
    await supabaseAdmin.from("ai_usage_logs").insert({
      function_name: usage.functionName,
      user_id: usage.userId,
      client_ip_hash: hashIP(usage.clientIp),
      model: usage.model || "google/gemini-2.5-flash",
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      success: usage.success,
      error_type: usage.errorType,
      response_time_ms: usage.responseTimeMs || usage.processingTimeMs,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Don't fail the request if logging fails
    console.error("AI usage tracking error:", err);
  }
}

function hashIP(ip: string): string {
  // Simple hash for privacy - stores pattern, not actual IP
  return ip
    .split(".")
    .map((part, i) => (i < 2 ? part : "x"))
    .join(".");
}

// ============================================================================
// STANDARD ERROR RESPONSES
// ============================================================================

export function errorResponse(
  corsHeaders: Record<string, string>,
  message: string,
  status: number,
  retryAfter?: number
): Response {
  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };
  if (retryAfter) {
    headers["Retry-After"] = String(retryAfter);
  }
  return new Response(JSON.stringify({ error: message }), { status, headers });
}

export function successResponse(
  corsHeaders: Record<string, string>,
  data: Record<string, unknown>
): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================================
// BROKER ACCESS VERIFICATION
// ============================================================================

export interface BrokerAccessResult {
  authenticated: boolean;
  hasBrokerAccess: boolean;
  isOwner: boolean;
  userId?: string;
  email?: string;
}

/**
 * Verify if the user has broker access (authenticated + broker subscription OR owner)
 * For use in broker-only edge functions
 */
export async function verifyBrokerAccess(
  supabaseUser: SupabaseClient,
  supabaseAdmin: SupabaseClient
): Promise<BrokerAccessResult> {
  try {
    // Get authenticated user
    const { data: { user }, error } = await supabaseUser.auth.getUser();
    
    if (error || !user) {
      return { authenticated: false, hasBrokerAccess: false, isOwner: false };
    }

    const userId = user.id;
    const email = user.email?.toLowerCase() || "";

    // Check if owner
    const ownerEmail = Deno.env.get("OWNER_EMAIL")?.toLowerCase();
    if (ownerEmail && email === ownerEmail) {
      return {
        authenticated: true,
        hasBrokerAccess: true,
        isOwner: true,
        userId,
        email,
      };
    }

    // Check broker subscription
    const { data: subscription } = await supabaseAdmin
      .from("broker_subscriptions")
      .select("status")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    // Also check CRM users profile as fallback
    const { data: crmProfile } = await supabaseAdmin
      .from("crm_users_profile")
      .select("is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    const hasBrokerAccess = !!subscription || !!crmProfile;

    return {
      authenticated: true,
      hasBrokerAccess,
      isOwner: false,
      userId,
      email,
    };
  } catch (err) {
    console.error("Broker access verification error:", err);
    return { authenticated: false, hasBrokerAccess: false, isOwner: false };
  }
}
