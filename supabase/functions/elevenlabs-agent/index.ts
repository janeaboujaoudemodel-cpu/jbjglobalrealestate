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

const DEFAULT_PROMPT = `You are the JBJ GLOBAL REAL ESTATE voice concierge. Help callers with Dubai real estate enquiries, qualify their needs professionally, and collect only the details needed for a follow-up.`;

function isMissingKnowledgeDocument(status: number, text: string): boolean {
  return status === 404 && /document_not_found|Document with id/i.test(text);
}

function friendlyElevenLabsError(status: number, text: string): string {
  if (isMissingKnowledgeDocument(status, text)) {
    return "An ElevenLabs knowledge-base document linked to this agent no longer exists. I removed the broken reference so the dashboard can keep working.";
  }
  if (status === 404) return "ElevenLabs agent not found. Please confirm ELEVENLABS_AGENT_ID starts with agent_.";
  if (status === 401 || status === 403) return "ElevenLabs API key is invalid or does not have access to this agent.";
  return `ElevenLabs ${status}: ${text}`;
}

async function resolveAgentId(key: string, configured: string): Promise<{ agentId: string; warning: string | null }> {
  if (/^agent_[A-Za-z0-9_-]+$/.test(configured)) return { agentId: configured, warning: null };

  const r = await fetch("https://api.elevenlabs.io/v1/convai/agents?page_size=100", {
    headers: { "xi-api-key": key },
  });
  if (!r.ok) return { agentId: configured, warning: "Stored ElevenLabs agent ID is invalid and agents could not be auto-discovered." };

  const data = await r.json().catch(() => ({}));
  const agents = Array.isArray(data?.agents) ? data.agents : [];
  const needle = configured.toLowerCase();
  const preferred = agents.find((a: Record<string, unknown>) => String(a?.name ?? "").toLowerCase().includes("jbj"))
    ?? agents.find((a: Record<string, unknown>) => String(a?.name ?? "").toLowerCase() === needle)
    ?? agents[0];
  const discovered = preferred?.agent_id ?? preferred?.agentId ?? preferred?.id;
  if (typeof discovered === "string" && discovered) {
    return {
      agentId: discovered,
      warning: "ELEVENLABS_AGENT_ID is not a valid agent ID, so the backend auto-selected the available ElevenLabs agent.",
    };
  }

  return { agentId: configured, warning: "Stored ElevenLabs agent ID is invalid and no ElevenLabs agents were found." };
}

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

  try {
    const resolved = await resolveAgentId(key, agentId);
    const base = `https://api.elevenlabs.io/v1/convai/agents/${resolved.agentId}`;

    if (req.method === "GET") {
      let r = await fetch(base, { headers: { "xi-api-key": key } });
      let text = await r.text();

      if (!r.ok && isMissingKnowledgeDocument(r.status, text)) {
        const repair = await fetch(base, {
          method: "PATCH",
          headers: {
            "xi-api-key": key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversation_config: {
              agent: {
                prompt: {
                  knowledge_base: [],
                },
              },
            },
          }),
        });
        if (repair.ok) {
          r = await fetch(base, { headers: { "xi-api-key": key } });
          text = await r.text();
        }
      }

      if (!r.ok) {
        return json({
          agent_id: resolved.agentId,
          name: "JBJ Voice Agent",
          prompt: DEFAULT_PROMPT,
          first_message: "Welcome to JBJ GLOBAL REAL ESTATE. How may I help you today?",
          language: "en",
          voice_id: Deno.env.get("ELEVENLABS_VOICE_ID") ?? "",
          llm: "",
          warning: resolved.warning ?? friendlyElevenLabsError(r.status, text),
          upstream_status: r.status,
        });
      }
      const data = JSON.parse(text);
      const conv = data?.conversation_config ?? {};
      const agent = conv?.agent ?? {};
      return json({
        agent_id: resolved.agentId,
        name: data?.name ?? "",
        prompt: agent?.prompt?.prompt ?? "",
        first_message: agent?.first_message ?? "",
        language: agent?.language ?? "en",
        voice_id: conv?.tts?.voice_id ?? "",
        llm: agent?.prompt?.llm ?? "",
        warning: resolved.warning,
      });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { prompt, first_message, language, voice_id } = body ?? {};

      // Build minimal patch body. ElevenLabs accepts partial conversation_config.
      const patch: Record<string, unknown> = {
        conversation_config: {
          agent: {
            ...(typeof prompt === "string" ? { prompt: { prompt, knowledge_base: [] } } : {}),
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
      if (!r.ok) return json({ error: friendlyElevenLabsError(r.status, text) }, isMissingKnowledgeDocument(r.status, text) ? 409 : 500);
      return json({ ok: true, updated: JSON.parse(text || "{}") });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
