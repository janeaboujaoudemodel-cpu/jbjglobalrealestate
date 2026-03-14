import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, getClientIp } from "../_shared/ai-utils.ts";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";
import { WAF_PROTECTED_FUNCTIONS, WAF_TIER_SUMMARY } from "../_shared/waf-middleware.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Owner-only
  const authResult = await requireOwnerAuth(req);
  if (authResult.error) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. WAF protection coverage
    const protectedCount = Object.keys(WAF_PROTECTED_FUNCTIONS).length;
    const tierBreakdown: Record<string, number> = {};
    for (const tier of Object.values(WAF_PROTECTED_FUNCTIONS)) {
      tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
    }

    // 2. IP blocklist stats
    const { count: blockedIPs } = await serviceClient
      .from("ip_blocklist")
      .select("*", { count: "exact", head: true });

    const { count: activeBlocks } = await serviceClient
      .from("ip_blocklist")
      .select("*", { count: "exact", head: true })
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    // 3. Rate limit violations (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: rateLimitHits } = await serviceClient
      .from("api_security_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "rate_limit_hit")
      .gte("created_at", oneDayAgo);

    // 4. Bot blocks (last 24h)
    const { count: botBlocks } = await serviceClient
      .from("api_security_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "bot_blocked")
      .gte("created_at", oneDayAgo);

    // 5. Credential stuffing (last 24h)
    const { count: stuffingEvents } = await serviceClient
      .from("api_security_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "credential_stuffing")
      .gte("created_at", oneDayAgo);

    // 6. Recent security events summary
    const { data: recentEvents } = await serviceClient
      .from("api_security_events")
      .select("event_type, severity, function_name, created_at")
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false })
      .limit(20);

    return new Response(
      JSON.stringify({
        success: true,
        report: {
          generated_at: new Date().toISOString(),
          waf_coverage: {
            protected_functions: protectedCount,
            tier_breakdown: tierBreakdown,
            tier_descriptions: WAF_TIER_SUMMARY,
            protected_list: WAF_PROTECTED_FUNCTIONS,
          },
          ip_blocklist: {
            total_entries: blockedIPs || 0,
            active_blocks: activeBlocks || 0,
          },
          last_24h: {
            rate_limit_hits: rateLimitHits || 0,
            bot_blocks: botBlocks || 0,
            credential_stuffing_alerts: stuffingEvents || 0,
          },
          recent_events: recentEvents || [],
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("WAF health check error:", error);
    return new Response(JSON.stringify({ error: "Health check failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
