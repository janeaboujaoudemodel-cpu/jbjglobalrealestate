import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { enforceRateLimit } from "../_shared/rate-limit-middleware.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_VIOLATION_TYPES = new Set([
  "devtools_open", "right_click", "view_source", "copy_attempt",
  "screenshot_attempt", "automation_detected", "rapid_navigation",
  "scraping_pattern", "console_access", "iframe_breakout",
]);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: aggressive per-IP rate limit so an attacker can't spam this
  // unauthenticated endpoint to fill security_events / scraping_blocks.
  const rl = await enforceRateLimit(
    req,
    { functionName: "log-security-event", maxRequests: 30, windowMinutes: 5, keyType: "ip" },
    corsHeaders,
  );
  if (rl.response) return rl.response;


  try {
    // In Lovable preview/dev, resize + iframe behavior can trigger false positives.
    // We NEVER hard-block preview requests; we only log best-effort.
    const origin = req.headers.get('origin') ?? '';
    const referer = req.headers.get('referer') ?? '';
    const isLovablePreviewRequest =
      origin.includes('lovableproject.com') ||
      referer.includes('lovableproject.com') ||
      origin.includes('lovable.app') ||
      referer.includes('lovable.app') ||
      origin.includes('localhost') ||
      referer.includes('localhost');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const {
      violation_type,
      fingerprint,
      user_agent,
      violation_count,
    } = body ?? {};

    // Strict payload validation
    if (typeof violation_type !== "string" || !ALLOWED_VIOLATION_TYPES.has(violation_type)) {
      return new Response(JSON.stringify({ error: "Invalid violation_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (fingerprint && (typeof fingerprint !== "string" || fingerprint.length > 128)) {
      return new Response(JSON.stringify({ error: "Invalid fingerprint" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const ua = typeof user_agent === "string" ? user_agent.slice(0, 512) : null;
    const vc = typeof violation_count === "number" && violation_count >= 0 ? Math.min(violation_count, 1000) : 0;

    // Get IP from headers
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    // Check if this fingerprint is already blocked (never enforce blocks in Lovable preview/dev)
    if (!isLovablePreviewRequest && fingerprint) {
      const { data: existingBlock } = await supabase
        .from('scraping_blocks')
        .select('id')
        .eq('fingerprint', fingerprint)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (existingBlock) {
        return new Response(
          JSON.stringify({ blocked: true, message: 'Access blocked' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
    }

    // Log the security event
    const { error: logError } = await supabase
      .from('security_events')
      .insert({
        event_type: 'unauthorized_access',
        severity: vc >= 3 ? 'high' : 'medium',
        description: `Security violation: ${violation_type}`,
        metadata: {
          ip_address: ip,
          fingerprint,
          user_agent: ua,
          violation_type,
          violation_count: vc,
          timestamp: new Date().toISOString()
        }
      });

    if (logError) {
      console.error('Failed to log security event:', logError);
    }

    // After 5 violations from same fingerprint, block it (but NEVER block Lovable preview/dev)
    if (!isLovablePreviewRequest && fingerprint && vc >= 5) {
      await supabase
        .from('scraping_blocks')
        .insert({
          fingerprint,
          ip_address: ip,
          block_reason: `Multiple security violations: ${violation_type}`,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });

      return new Response(
        JSON.stringify({ blocked: true, message: 'Access blocked due to security violations' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    return new Response(
      JSON.stringify({ logged: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in log-security-event:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
