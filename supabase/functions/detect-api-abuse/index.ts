/**
 * detect-api-abuse — Automated abuse pattern detection engine
 * 
 * Runs on a schedule (every 15 minutes) to analyze api_security_events
 * and function_rate_limits for abuse patterns:
 * 
 * 1. Mass scraping: Same IP hitting many different endpoints
 * 2. API hammering: Single IP with excessive rate limit hits
 * 3. Credential stuffing bursts: Concentrated auth failures
 * 4. Distributed attacks: Many IPs hitting same endpoint simultaneously
 * 5. Stale rate limit cleanup
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AbusePattern {
  pattern_type: string;
  severity: "medium" | "high" | "critical";
  ip_address: string;
  details: Record<string, unknown>;
  action_taken: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, supabaseServiceKey);

  const detectedPatterns: AbusePattern[] = [];
  const now = new Date();
  const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // ═══════════════════════════════════════════════════════════════════
    // 1. MASS SCRAPING: IP hitting ≥8 different endpoints in 15 min
    // ═══════════════════════════════════════════════════════════════════
    const { data: recentEvents } = await admin
      .from("api_security_events")
      .select("client_ip, function_name")
      .gte("created_at", fifteenMinAgo);

    if (recentEvents && recentEvents.length > 0) {
      const ipEndpointMap = new Map<string, Set<string>>();
      for (const ev of recentEvents) {
        if (!ev.client_ip || ev.client_ip === "unknown") continue;
        if (!ipEndpointMap.has(ev.client_ip)) {
          ipEndpointMap.set(ev.client_ip, new Set());
        }
        ipEndpointMap.get(ev.client_ip)!.add(ev.function_name);
      }

      for (const [ip, endpoints] of ipEndpointMap) {
        if (endpoints.size >= 8) {
          await autoBlockIP(admin, ip, `Mass scraping: ${endpoints.size} endpoints in 15min`, "high");
          detectedPatterns.push({
            pattern_type: "mass_scraping",
            severity: "high",
            ip_address: ip,
            details: { endpoint_count: endpoints.size, endpoints: Array.from(endpoints).slice(0, 10) },
            action_taken: "auto_blocked",
          });
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. API HAMMERING: ≥10 rate limit hits from same IP in 1 hour
    // ═══════════════════════════════════════════════════════════════════
    const { data: rateLimitHits } = await admin
      .from("api_security_events")
      .select("client_ip")
      .eq("event_type", "rate_limit_hit")
      .gte("created_at", oneHourAgo);

    if (rateLimitHits && rateLimitHits.length > 0) {
      const hitCounts = new Map<string, number>();
      for (const ev of rateLimitHits) {
        if (!ev.client_ip || ev.client_ip === "unknown") continue;
        hitCounts.set(ev.client_ip, (hitCounts.get(ev.client_ip) || 0) + 1);
      }

      for (const [ip, count] of hitCounts) {
        if (count >= 10) {
          await autoBlockIP(admin, ip, `API hammering: ${count} rate limit violations in 1h`, "critical");
          detectedPatterns.push({
            pattern_type: "api_hammering",
            severity: "critical",
            ip_address: ip,
            details: { rate_limit_hits: count, window: "1h" },
            action_taken: "auto_blocked",
          });
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. CREDENTIAL STUFFING BURSTS: ≥15 auth failures from IP in 1h
    // ═══════════════════════════════════════════════════════════════════
    const { data: authFailures } = await admin
      .from("api_security_events")
      .select("client_ip")
      .eq("event_type", "auth_failure")
      .gte("created_at", oneHourAgo);

    if (authFailures && authFailures.length > 0) {
      const failCounts = new Map<string, number>();
      for (const ev of authFailures) {
        if (!ev.client_ip || ev.client_ip === "unknown") continue;
        failCounts.set(ev.client_ip, (failCounts.get(ev.client_ip) || 0) + 1);
      }

      for (const [ip, count] of failCounts) {
        if (count >= 15) {
          await autoBlockIP(admin, ip, `Credential stuffing: ${count} auth failures in 1h`, "critical");
          detectedPatterns.push({
            pattern_type: "credential_stuffing_burst",
            severity: "critical",
            ip_address: ip,
            details: { auth_failures: count, window: "1h" },
            action_taken: "auto_blocked",
          });
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. DISTRIBUTED ATTACK: ≥20 unique IPs hitting same endpoint in 15min
    // ═══════════════════════════════════════════════════════════════════
    if (recentEvents && recentEvents.length > 0) {
      const endpointIpMap = new Map<string, Set<string>>();
      for (const ev of recentEvents) {
        if (!ev.client_ip || ev.client_ip === "unknown") continue;
        if (!endpointIpMap.has(ev.function_name)) {
          endpointIpMap.set(ev.function_name, new Set());
        }
        endpointIpMap.get(ev.function_name)!.add(ev.client_ip);
      }

      for (const [endpoint, ips] of endpointIpMap) {
        if (ips.size >= 20) {
          // Don't auto-block for distributed — just alert
          await logSecurityEvent(admin, {
            event_type: "distributed_attack",
            function_name: endpoint,
            client_ip: "multiple",
            severity: "critical",
            details: { unique_ips: ips.size, sample_ips: Array.from(ips).slice(0, 5) },
          });
          detectedPatterns.push({
            pattern_type: "distributed_attack",
            severity: "critical",
            ip_address: "multiple",
            details: { endpoint, unique_ips: ips.size },
            action_taken: "alert_only",
          });
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. CLEANUP: Remove rate limit entries older than 24 hours
    // ═══════════════════════════════════════════════════════════════════
    const { count: cleanedRateLimits } = await admin
      .from("function_rate_limits")
      .delete({ count: "exact" })
      .lt("window_start", oneDayAgo);

    // Clean expired IP blocks
    const { count: cleanedBlocks } = await admin
      .from("ip_blocklist")
      .delete({ count: "exact" })
      .eq("is_permanent", false)
      .lt("expires_at", now.toISOString());

    // Clean old webhook replay log (48h)
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    await admin.from("webhook_replay_log").delete().lt("received_at", twoDaysAgo);

    // Clean old security events (30 days retention)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: cleanedEvents } = await admin
      .from("api_security_events")
      .delete({ count: "exact" })
      .lt("created_at", thirtyDaysAgo);

    // ═══════════════════════════════════════════════════════════════════
    // 6. ALERT OWNER on critical patterns
    // ═══════════════════════════════════════════════════════════════════
    const criticalPatterns = detectedPatterns.filter(p => p.severity === "critical");
    if (criticalPatterns.length > 0) {
      try {
        await admin.functions.invoke("send-owner-email", {
          body: {
            subject: `🚨 API Security Alert: ${criticalPatterns.length} critical pattern(s) detected`,
            text: `The automated abuse detection engine identified ${criticalPatterns.length} critical pattern(s):\n\n${
              criticalPatterns.map(p => `• ${p.pattern_type}: ${p.ip_address} — ${p.action_taken}`).join("\n")
            }\n\nReview at: /owner/api-security`,
          },
        });
      } catch {
        console.error("Failed to send owner alert email");
      }
    }

    return new Response(JSON.stringify({
      success: true,
      scan_time: now.toISOString(),
      patterns_detected: detectedPatterns.length,
      patterns: detectedPatterns,
      cleanup: {
        rate_limits_cleaned: cleanedRateLimits || 0,
        expired_blocks_cleaned: cleanedBlocks || 0,
        old_events_cleaned: cleanedEvents || 0,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Abuse detection error:", err);
    return new Response(JSON.stringify({ error: "Detection scan failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────

async function autoBlockIP(
  admin: ReturnType<typeof createClient>,
  ip: string,
  reason: string,
  severity: "high" | "critical"
) {
  try {
    const { data: existing } = await admin
      .from("ip_blocklist")
      .select("id, block_count")
      .eq("ip_address", ip)
      .maybeSingle();

    const blockCount = (existing?.block_count || 0) + 1;
    const hours = blockCount <= 1 ? 12 : blockCount === 2 ? 48 : blockCount === 3 ? 168 : 720;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    if (existing) {
      await admin.from("ip_blocklist").update({
        reason, block_count: blockCount, expires_at: expiresAt, last_attempt_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await admin.from("ip_blocklist").insert({
        ip_address: ip, reason, is_permanent: false, expires_at: expiresAt, block_count: 1,
      });
    }

    await logSecurityEvent(admin, {
      event_type: "auto_block",
      function_name: "detect-api-abuse",
      client_ip: ip,
      severity,
      details: { reason, block_hours: hours, block_count: blockCount },
    });
  } catch (err) {
    console.error("Auto-block failed:", err);
  }
}

async function logSecurityEvent(
  admin: ReturnType<typeof createClient>,
  event: {
    event_type: string;
    function_name: string;
    client_ip: string;
    severity: string;
    details: Record<string, unknown>;
  }
) {
  try {
    await admin.from("api_security_events").insert(event);
  } catch {
    // Non-critical
  }
}
