import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEAD_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function verifyLead(leadId: string | null): Promise<boolean> {
  if (!leadId || !/^[0-9a-f-]{36}$/i.test(leadId)) return false;
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data } = await supabase
      .from("voice_agent_leads")
      .select("id, created_at")
      .eq("id", leadId)
      .maybeSingle();
    if (!data) return false;
    const age = Date.now() - new Date(data.created_at).getTime();
    return age <= LEAD_TTL_MS;
  } catch (e) {
    console.warn("verifyLead failed", e);
    return false;
  }
}


async function resolveAgentId(key: string, configured: string): Promise<string> {
  if (/^agent_[A-Za-z0-9_-]+$/.test(configured)) return configured;

  const response = await fetch("https://api.elevenlabs.io/v1/convai/agents?page_size=100", {
    headers: { "xi-api-key": key },
  });
  if (!response.ok) return configured;

  const data = await response.json().catch(() => ({}));
  const agents = Array.isArray(data?.agents) ? data.agents : [];
  const preferred = agents.find((agent: Record<string, unknown>) => String(agent?.name ?? "").toLowerCase().includes("jessica")) ?? agents[0];
  const discovered = preferred?.agent_id ?? preferred?.agentId ?? preferred?.id;
  return typeof discovered === "string" && discovered ? discovered : configured;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Gate: require a valid voice_agent_leads.id (intake submission within 30 days)
    let leadId: string | null = null;
    try {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        leadId = body?.lead_id ?? null;
      } else {
        const url = new URL(req.url);
        leadId = url.searchParams.get("lead_id");
      }
    } catch { /* ignore */ }

    const allowed = await verifyLead(leadId);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Intake required before connecting", gate: "intake_required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      const resolvedAgentId = await resolveAgentId(key, ELEVENLABS_AGENT_ID);
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${resolvedAgentId}`,
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
