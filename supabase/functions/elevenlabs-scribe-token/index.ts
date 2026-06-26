// deno-lint-ignore-file no-explicit-any
/**
 * elevenlabs-scribe-token
 * -----------------------
 * Issues a single-use realtime-STT token for the browser. The
 * ELEVENLABS_API_KEY never leaves the edge runtime.
 *
 * SECURITY: Requires an authenticated Supabase session AND enforces
 * per-user rate limits so anonymous traffic cannot burn ElevenLabs credits.
 */

import { corsHeaders, requireAuthenticatedUser, unauthorizedResponse } from "../_shared/auth-utils.ts";
import { enforceRateLimit } from "../_shared/rate-limit-middleware.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req);
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error || "Authentication required");
    }

    const rl = await enforceRateLimit(
      req,
      { functionName: "elevenlabs-scribe-token", maxRequests: 20, windowMinutes: 60, keyType: "user" },
      corsHeaders,
      auth.userId,
    );
    if (rl.response) return rl.response;

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resp = await fetch(
      "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
      { method: "POST", headers: { "xi-api-key": apiKey } },
    );

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(
        JSON.stringify({ error: text || `ElevenLabs ${resp.status}` }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await resp.json();
    return new Response(JSON.stringify({ token: data.token }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "token request failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
