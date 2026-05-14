// GET/PATCH ElevenLabs Conversational AI agent config (prompt, voice, language, first message)
// Owner-only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function getKey(): string | null {
  return (
    Deno.env.get("ELEVENLABS_API_KEY") ||
    Deno.env.get("ELEVENLABS_API_KEY_1") ||
    null
  );
}

async function requireOwner(req: Request): Promise<{ ok: boolean; userId?: string; error?: string }> {
  const auth = req.headers.get("Authorization");
  if (!auth) return { ok: false, error: "Missing auth" };
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
  const isOwner = (roles ?? []).some((r: { role: string }) => r.role === "owner" || r.role === "admin");
  if (!isOwner) return { ok: false, error: "Forbidden" };
  return { ok: true, userId: user.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireOwner(req);
  if (!auth.ok) return json({ error: auth.error }, 401);

  const key = getKey();
  const agentId = Deno.env.get("ELEVENLABS_AGENT_ID");
  if (!key) return json({ error: "ELEVENLABS_API_KEY not configured" }, 500);
  if (!agentId) return json({ error: "ELEVENLABS_AGENT_ID not configured" }, 500);

  const base = `https://api.elevenlabs.io/v1/convai/agents/${agentId}`;

  try {
    if (req.method === "GET") {
      const r = await fetch(base, { headers: { "xi-api-key": key } });
      const text = await r.text();
      if (!r.ok) return json({ error: `ElevenLabs ${r.status}: ${text}` }, 500);
      const data = JSON.parse(text);
      const conv = data?.conversation_config ?? {};
      const agent = conv?.agent ?? {};
      return json({
        agent_id: agentId,
        name: data?.name ?? "",
        prompt: agent?.prompt?.prompt ?? "",
        first_message: agent?.first_message ?? "",
        language: agent?.language ?? "en",
        voice_id: conv?.tts?.voice_id ?? "",
        llm: agent?.prompt?.llm ?? "",
        raw: data,
      });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { prompt, first_message, language, voice_id } = body ?? {};

      // Build minimal patch body. ElevenLabs accepts partial conversation_config.
      const patch: Record<string, unknown> = {
        conversation_config: {
          agent: {
            ...(typeof prompt === "string" ? { prompt: { prompt } } : {}),
            ...(typeof first_message === "string" ? { first_message } : {}),
            ...(typeof language === "string" ? { language } : {}),
          },
          ...(typeof voice_id === "string" && voice_id
            ? { tts: { voice_id } }
            : {}),
        },
      };

      const r = await fetch(base, {
        method: "PATCH",
        headers: {
          "xi-api-key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });
      const text = await r.text();
      if (!r.ok) return json({ error: `ElevenLabs ${r.status}: ${text}` }, 500);
      return json({ ok: true, updated: JSON.parse(text || "{}") });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
