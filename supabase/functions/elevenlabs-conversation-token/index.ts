import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try both possible keys: the manually-set one and the connector-managed one.
    const candidateKeys = [
      Deno.env.get("ELEVENLABS_API_KEY"),
      Deno.env.get("ELEVENLABS_API_KEY_1"),
    ].filter((k): k is string => !!k && k.length > 0);

    const ELEVENLABS_AGENT_ID = Deno.env.get("ELEVENLABS_AGENT_ID");

    if (candidateKeys.length === 0) {
      console.error("No ElevenLabs API key configured");
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured", fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!ELEVENLABS_AGENT_ID) {
      console.error("ELEVENLABS_AGENT_ID not configured");
      return new Response(
        JSON.stringify({ error: "ElevenLabs Agent ID not configured", fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let lastStatus = 0;
    let lastErrorBody = "";
    let data: any = null;

    for (const key of candidateKeys) {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${ELEVENLABS_AGENT_ID}`,
        { headers: { "xi-api-key": key } }
      );

      if (response.ok) {
        data = await response.json();
        break;
      }

      lastStatus = response.status;
      lastErrorBody = await response.text();
      console.error(
        `ElevenLabs API error with key (len ${key.length}):`,
        response.status,
        lastErrorBody
      );
      // Only try the next key on 401/403 (auth errors). Other failures = stop.
      if (response.status !== 401 && response.status !== 403) break;
    }

    if (!data) {
      const friendly =
        lastStatus === 401 || lastStatus === 403
          ? "Voice concierge is temporarily unavailable (API key invalid or expired). Please update ELEVENLABS_API_KEY."
          : lastStatus === 404
          ? "Voice agent not found. Check ELEVENLABS_AGENT_ID."
          : `ElevenLabs API error: ${lastStatus}`;
      return new Response(
        JSON.stringify({ error: friendly, upstream_status: lastStatus, fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ token: data.token }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error getting conversation token:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
