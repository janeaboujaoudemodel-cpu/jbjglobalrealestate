/**
 * Rate Limit Middleware — Unified wrapper for edge functions
 * Combines IP blocklist check + rate limiting + security event logging
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { getClientIp, checkIPBlocklist, checkRateLimit, type RateLimitConfig } from "./ai-utils.ts";

export interface RateLimitMiddlewareConfig {
  functionName: string;
  maxRequests: number;
  windowMinutes: number;
  keyType?: 'ip' | 'user' | 'email';
  customKey?: string;
}

export interface MiddlewareResult {
  blocked: boolean;
  response?: Response;
  clientIp: string;
  serviceClient: ReturnType<typeof createClient>;
}

/**
 * Logs a security event to api_security_events table
 */
export async function logSecurityEvent(
  serviceClient: ReturnType<typeof createClient>,
  event: {
    event_type: string;
    function_name: string;
    client_ip: string;
    user_id?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await serviceClient.from('api_security_events').insert({
      event_type: event.event_type,
      function_name: event.function_name,
      client_ip: event.client_ip,
      user_id: event.user_id || null,
      severity: event.severity,
      details: event.details || {},
    });
  } catch (err) {
    console.error('[SecurityEvent] Failed to log:', err);
  }
}

/**
 * Detects credential stuffing patterns — >10 failed attempts from same IP in 30 min
 */
export async function detectCredentialStuffing(
  serviceClient: ReturnType<typeof createClient>,
  clientIp: string,
  functionName: string
): Promise<boolean> {
  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { count } = await serviceClient
      .from('api_security_events')
      .select('*', { count: 'exact', head: true })
      .eq('client_ip', clientIp)
      .eq('event_type', 'auth_failure')
      .gte('created_at', thirtyMinAgo);

    if (count && count >= 10) {
      await logSecurityEvent(serviceClient, {
        event_type: 'credential_stuffing',
        function_name: functionName,
        client_ip: clientIp,
        severity: 'critical',
        details: { failed_attempts: count, window_minutes: 30 },
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Checks webhook replay — returns true if event_id already processed
 */
export async function checkWebhookReplay(
  serviceClient: ReturnType<typeof createClient>,
  webhookSource: string,
  eventId: string
): Promise<boolean> {
  try {
    const { error } = await serviceClient
      .from('webhook_replay_log')
      .insert({ webhook_source: webhookSource, event_id: eventId });

    // If insert fails due to unique constraint, it's a replay
    if (error && error.code === '23505') {
      return true; // replay detected
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Clean up old webhook replay entries (>48 hours)
 */
export async function cleanupWebhookReplayLog(
  serviceClient: ReturnType<typeof createClient>
): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await serviceClient
      .from('webhook_replay_log')
      .delete()
      .lt('received_at', cutoff);
  } catch {
    // Non-critical, ignore
  }
}

/**
 * enforceRateLimit — Single call that checks IP blocklist + rate limit + logs events
 * Returns null if allowed, or a Response if blocked.
 */
export async function enforceRateLimit(
  req: Request,
  config: RateLimitMiddlewareConfig,
  corsHeaders: Record<string, string>,
  userId?: string
): Promise<{ response: Response | null; clientIp: string; serviceClient: ReturnType<typeof createClient> }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  const clientIp = getClientIp(req);

  // 1. Check IP blocklist
  const blockResult = await checkIPBlocklist(serviceClient, clientIp);
  if (blockResult.blocked) {
    await logSecurityEvent(serviceClient, {
      event_type: 'blocked_ip',
      function_name: config.functionName,
      client_ip: clientIp,
      severity: 'high',
      details: { reason: blockResult.reason },
    });

    return {
      response: new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }),
      clientIp,
      serviceClient,
    };
  }

  // 2. Rate limit check
  const rateKey = config.customKey || (config.keyType === 'user' && userId ? userId : clientIp);
  const rateLimitConfig: RateLimitConfig = {
    functionName: config.functionName,
    windowMinutes: config.windowMinutes,
    maxRequests: config.maxRequests,
  };

  const rateResult = await checkRateLimit(serviceClient, rateKey, clientIp, rateLimitConfig);

  if (!rateResult.allowed) {
    await logSecurityEvent(serviceClient, {
      event_type: 'rate_limit_hit',
      function_name: config.functionName,
      client_ip: clientIp,
      user_id: userId,
      severity: 'medium',
      details: {
        rate_key: rateKey.substring(0, 8) + '***',
        request_count: rateResult.requestCount,
        max_requests: config.maxRequests,
        window_minutes: config.windowMinutes,
      },
    });

    return {
      response: new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(rateResult.retryAfterSeconds || 60),
        },
      }),
      clientIp,
      serviceClient,
    };
  }

  return { response: null, clientIp, serviceClient };
}
