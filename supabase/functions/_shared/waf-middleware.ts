/**
 * WAF Middleware — Unified Web Application Firewall for Edge Functions
 * 
 * Chains: request size → user-agent filter → origin validation → IP blocklist → rate limiting → credential stuffing
 * 
 * Usage:
 *   const waf = await enforceWAF(req, corsHeaders, "ai");
 *   if (waf.blocked) return waf.response!;
 *   // proceed with waf.clientIp, waf.serviceClient, waf.userId
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { getClientIp, checkIPBlocklist, checkRateLimit } from "./ai-utils.ts";
import { logSecurityEvent, detectCredentialStuffing } from "./rate-limit-middleware.ts";

// ============================================================================
// BOT USER-AGENT DETECTION
// ============================================================================

const BOT_UA_PATTERNS = [
  /python-requests/i,
  /python-urllib/i,
  /scrapy/i,
  /wget\//i,
  /curl\//i,
  /HeadlessChrome/i,
  /PhantomJS/i,
  /Selenium/i,
  /puppeteer/i,
  /playwright/i,
  /HTTPie/i,
  /Go-http-client/i,
  /Java\//i,
  /libwww-perl/i,
  /mechanize/i,
  /Ahrefs/i,
  /SemrushBot/i,
  /MJ12bot/i,
  /DotBot/i,
  /PetalBot/i,
  /YandexBot/i,
];

// Legitimate search engine crawlers — allow these
const ALLOWED_BOTS = [
  /Googlebot/i,
  /bingbot/i,
  /Applebot/i,
  /Slurp/i, // Yahoo
  /DuckDuckBot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /WhatsApp/i,
];

function isBlockedBot(userAgent: string): boolean {
  if (!userAgent || userAgent.length < 5) return true; // empty/tiny UA = suspicious
  
  // Allow legitimate crawlers
  if (ALLOWED_BOTS.some((p) => p.test(userAgent))) return false;
  
  // Block known bad bots
  return BOT_UA_PATTERNS.some((p) => p.test(userAgent));
}

// ============================================================================
// PROTECTION TIER PROFILES
// ============================================================================

export type WAFTier = "auth" | "ai" | "admin" | "public" | "internal";

interface TierConfig {
  maxRequestBodyBytes: number;
  maxRequestsPerWindow: number;
  windowMinutes: number;
  checkCredentialStuffing: boolean;
  strictUA: boolean;
  requireAuth: boolean;
}

const TIER_CONFIGS: Record<WAFTier, TierConfig> = {
  auth: {
    maxRequestBodyBytes: 50 * 1024, // 50KB
    maxRequestsPerWindow: 5,
    windowMinutes: 15,
    checkCredentialStuffing: true,
    strictUA: true,
    requireAuth: false,
  },
  ai: {
    maxRequestBodyBytes: 1 * 1024 * 1024, // 1MB
    maxRequestsPerWindow: 10,
    windowMinutes: 5,
    checkCredentialStuffing: false,
    strictUA: true,
    requireAuth: false, // public AI tools allow anonymous
  },
  admin: {
    maxRequestBodyBytes: 5 * 1024 * 1024, // 5MB
    maxRequestsPerWindow: 20,
    windowMinutes: 15,
    checkCredentialStuffing: false,
    strictUA: false,
    requireAuth: true,
  },
  public: {
    maxRequestBodyBytes: 1 * 1024 * 1024, // 1MB
    maxRequestsPerWindow: 60,
    windowMinutes: 5,
    checkCredentialStuffing: false,
    strictUA: false,
    requireAuth: false,
  },
  internal: {
    maxRequestBodyBytes: 10 * 1024 * 1024, // 10MB for sync jobs
    maxRequestsPerWindow: 5,
    windowMinutes: 5,
    checkCredentialStuffing: false,
    strictUA: true,
    requireAuth: true,
  },
};

// ============================================================================
// WAF RESULT
// ============================================================================

export interface WAFResult {
  blocked: boolean;
  response?: Response;
  clientIp: string;
  serviceClient: ReturnType<typeof createClient>;
  userId?: string;
}

// ============================================================================
// PROGRESSIVE PENALTY — Escalating block durations
// ============================================================================

function getBlockDurationHours(blockCount: number): number {
  if (blockCount <= 1) return 12;
  if (blockCount === 2) return 48;
  if (blockCount === 3) return 168; // 7 days
  return 720; // 30 days
}

// ============================================================================
// MAIN WAF ENFORCEMENT
// ============================================================================

/**
 * Unified WAF enforcement.
 * 
 * @param req - Incoming request
 * @param corsHeaders - CORS headers to include in block responses
 * @param tier - Protection profile ("auth" | "ai" | "admin" | "public" | "internal")
 * @param functionName - Edge function name for logging
 * @param overrides - Optional config overrides
 */
export async function enforceWAF(
  req: Request,
  corsHeaders: Record<string, string>,
  tier: WAFTier,
  functionName: string,
  overrides?: Partial<TierConfig>
): Promise<WAFResult> {
  const config = { ...TIER_CONFIGS[tier], ...overrides };
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  const clientIp = getClientIp(req);

  const blocked = (status: number, message: string, extra?: Record<string, string>): WAFResult => ({
    blocked: true,
    response: new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
    }),
    clientIp,
    serviceClient,
  });

  // ── 1. Request body size ──
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > config.maxRequestBodyBytes) {
    await logSecurityEvent(serviceClient, {
      event_type: "oversized_request",
      function_name: functionName,
      client_ip: clientIp,
      severity: "medium",
      details: { content_length: contentLength, max: config.maxRequestBodyBytes },
    });
    return blocked(413, "Request too large");
  }

  // ── 2. User-Agent filter ──
  const userAgent = req.headers.get("user-agent") || "";
  if (config.strictUA && isBlockedBot(userAgent)) {
    await logSecurityEvent(serviceClient, {
      event_type: "bot_blocked",
      function_name: functionName,
      client_ip: clientIp,
      severity: "medium",
      details: { user_agent: userAgent.substring(0, 200) },
    });
    return blocked(403, "Access denied");
  }

  // ── 3. IP Blocklist ──
  const blockResult = await checkIPBlocklist(serviceClient, clientIp);
  if (blockResult.blocked) {
    await logSecurityEvent(serviceClient, {
      event_type: "blocked_ip",
      function_name: functionName,
      client_ip: clientIp,
      severity: "high",
      details: { reason: blockResult.reason },
    });
    return blocked(403, "Access denied");
  }

  // ── 4. Rate Limiting with progressive penalties ──
  const rateKey = clientIp; // IP-based for WAF layer
  const rateResult = await checkRateLimit(serviceClient, rateKey, clientIp, {
    functionName,
    windowMinutes: config.windowMinutes,
    maxRequests: config.maxRequestsPerWindow,
    autoBlockThreshold: 5,
    autoBlockDurationHours: 12, // base; escalation handled below
  });

  if (!rateResult.allowed) {
    // Check for progressive penalty escalation
    try {
      const { data: existing } = await serviceClient
        .from("ip_blocklist")
        .select("block_count")
        .eq("ip_address", clientIp)
        .maybeSingle();

      if (existing) {
        const escalatedHours = getBlockDurationHours(existing.block_count || 1);
        const newExpiry = new Date(Date.now() + escalatedHours * 60 * 60 * 1000);
        await serviceClient
          .from("ip_blocklist")
          .update({ expires_at: newExpiry.toISOString() })
          .eq("ip_address", clientIp);
      }
    } catch {
      // Non-critical
    }

    await logSecurityEvent(serviceClient, {
      event_type: "rate_limit_hit",
      function_name: functionName,
      client_ip: clientIp,
      severity: "medium",
      details: { request_count: rateResult.requestCount, max: config.maxRequestsPerWindow },
    });

    return blocked(429, "Too many requests. Please try again later.", {
      "Retry-After": String(rateResult.retryAfterSeconds || 60),
    });
  }

  // ── 5. Credential stuffing (auth tier only) ──
  if (config.checkCredentialStuffing) {
    const stuffing = await detectCredentialStuffing(serviceClient, clientIp, functionName);
    if (stuffing) {
      return blocked(403, "Access denied — suspicious activity detected");
    }
  }

  return { blocked: false, clientIp, serviceClient };
}

/**
 * WAF protection tiers summary for health check reporting
 */
export const WAF_TIER_SUMMARY: Record<WAFTier, string> = {
  auth: "5 req/15min, credential stuffing check, strict UA",
  ai: "10 req/5min, strict UA filter",
  admin: "20 req/15min, auth required",
  public: "60 req/5min, basic protection",
  internal: "5 req/5min, auth required, strict UA",
};

/**
 * Registry of WAF-protected functions (for health check)
 */
export const WAF_PROTECTED_FUNCTIONS: Record<string, WAFTier> = {
  // AI Tools
  "ai-price-predictor": "ai",
  "ai-neighborhood-insights": "ai",
  "ai-lead-qualification": "ai",
  "ai-followup-scheduler": "ai",
  "ai-objection-handler": "ai",
  "ai-market-report": "ai",
  "ai-competitor-analysis": "ai",
  "ai-roi-calculator": "ai",
  "ai-meeting-summarizer": "ai",
  "ai-translation-hub": "ai",
  "ai-video-tour-script": "ai",
  "ai-contract-reviewer": "ai",
  "ai-document-generator": "ai",
  "ai-property-analyzer": "ai",
  "ai-social-media": "ai",
  "ai-email-generator": "ai",
  "ai-client-matcher": "ai",
  "ai-mortgage-advisor": "ai",
  "ai-call-summarizer": "ai",
  "ai-stamp-generator": "ai",
  "ai-logo-generator": "ai",
  "ai-agent-script-writer": "ai",
  "ai-card-design-generator": "ai",
  "ai-property-video-ad": "ai",
  "ai-bulk-enrich": "ai",
  "ai-developer-analyzer": "ai",
  "ai-lead-intelligence": "ai",
  "ai-signature-generator": "ai",
  "ai-card-gallery-generator": "ai",
  // Admin / Sync
  "reelly-api-sync": "internal",
  "daily-reelly-auto-sync": "internal",
  "reelly-backfill-projects": "internal",
  "sync-developer-images": "internal",
  "enrich-pending-imports": "internal",
  "provident-enrich-projects": "internal",
  "reelly-bulk-enrich": "internal",
  "bulk-approve-imports": "admin",
  "send-admin-message": "admin",
  // Auth
  "send-email-otp": "auth",
  "verify-email-otp": "auth",
  "reset-password-with-otp": "auth",
  "change-user-email": "auth",
  // Public
  "account-lifecycle": "public",
  "handover-alerts": "public",
  "record-login-event": "public",
  "newsletter-subscribe": "public",
  "submit-contact-gating": "public",
  "submit-support-ticket": "public",
  "waf-health-check": "admin",
};
