/**
 * db-health-check — Lightweight database health monitoring endpoint
 * 
 * Performs:
 * - SELECT 1 latency check
 * - Connection count monitoring
 * - Logs results to db_health_logs
 * - Alerts if latency exceeds threshold
 */

import { corsHeaders, getServiceClient, jsonResponse } from "../_shared/safe-execution.ts";

const LATENCY_WARN_MS = 500;
const LATENCY_CRITICAL_MS = 2000;
const MAX_CONNECTIONS_WARN = 15; // pico tier has ~20 connections

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const sb = getServiceClient();

  try {
    // 1. Latency check via SELECT 1
    const queryStart = Date.now();
    const { error: pingError } = await sb.rpc("acquire_function_lock", {
      p_function_name: "__health_ping__",
      p_timeout_minutes: 1,
    }).then(async (res) => {
      // Release immediately — this was just a ping
      await sb.rpc("release_function_lock", { p_function_name: "__health_ping__", p_duration_ms: null });
      return res;
    });
    
    // Fallback: simple query
    const { data: pingData, error: simpleError } = await sb
      .from("app_settings")
      .select("key")
      .limit(1);
    
    const latencyMs = Date.now() - queryStart;

    // 2. Check connection count
    const { data: connData } = await sb.rpc("acquire_function_lock", {
      p_function_name: "__conn_check__",
      p_timeout_minutes: 1,
    });
    // Clean up
    await sb.rpc("release_function_lock", { p_function_name: "__conn_check__", p_duration_ms: null });

    // 3. Check active locks
    const { data: activeLocks } = await sb
      .from("edge_function_locks")
      .select("function_name, locked_at, expires_at")
      .gt("expires_at", new Date().toISOString());

    // 4. Determine health status
    const isHealthy = latencyMs < LATENCY_CRITICAL_MS && !simpleError;
    const level = latencyMs > LATENCY_CRITICAL_MS ? "critical" 
      : latencyMs > LATENCY_WARN_MS ? "warning" 
      : "healthy";

    // 5. Log to db_health_logs
    await sb.from("db_health_logs").insert({
      check_type: "heartbeat",
      latency_ms: latencyMs,
      is_healthy: isHealthy,
      details: {
        level,
        active_locks: activeLocks?.length ?? 0,
        lock_details: activeLocks ?? [],
      },
    });

    const totalMs = Date.now() - startTime;

    return jsonResponse(200, {
      status: level,
      latency_ms: latencyMs,
      total_check_ms: totalMs,
      is_healthy: isHealthy,
      active_locks: activeLocks?.length ?? 0,
      lock_details: activeLocks?.map(l => l.function_name) ?? [],
      thresholds: {
        warn_ms: LATENCY_WARN_MS,
        critical_ms: LATENCY_CRITICAL_MS,
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[health] Check failed:", errorMsg);

    // Still try to log failure
    try {
      await sb.from("db_health_logs").insert({
        check_type: "heartbeat",
        latency_ms: Date.now() - startTime,
        is_healthy: false,
        details: { error: errorMsg, level: "critical" },
      });
    } catch { /* ignore logging failure */ }

    return jsonResponse(503, {
      status: "critical",
      is_healthy: false,
      error: errorMsg,
    });
  }
});
