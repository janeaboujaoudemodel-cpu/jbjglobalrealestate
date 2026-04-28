// Generates AI summary + next-action recommendation for a brokerage / client / developer-registry record.
// Uses Lovable AI Gateway. Owner-only (admin).
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "forbidden" }, 403);

    const { kind, recordId } = await req.json();
    if (!["brokerage", "client", "developer_registry"].includes(kind))
      return json({ error: "invalid kind" }, 400);

    const tableMap: Record<string, string> = {
      brokerage: "crm_brokerages",
      client: "crm_clients",
      developer_registry: "crm_developer_registry",
    };
    const { data: record, error } = await supabase.from(tableMap[kind]).select("*").eq("id", recordId).single();
    if (error || !record) return json({ error: "record not found" }, 404);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

    const systemPrompt = `You are a senior CRM assistant for a Dubai-based real-estate developer/broker.
Analyze the record and return ONE concise summary (1-2 sentences) and ONE specific recommended next action with a deadline window.
Be tactical, never generic. Focus on relationship momentum, missed follow-ups, document expiries, and revenue impact.`;

    const userPrompt = `Record kind: ${kind}\nData:\n${JSON.stringify(record, null, 2)}\nToday: ${new Date().toISOString().slice(0, 10)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "save_recommendation",
            description: "Save the AI summary and next action",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "1-2 sentence relationship status summary" },
                next_action: { type: "string", description: "specific recommended next action, including suggested timeframe" },
              },
              required: ["summary", "next_action"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_recommendation" } },
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limited, try again shortly" }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }, 402);
    if (!aiRes.ok) return json({ error: "AI gateway error" }, 500);

    const aiJson = await aiRes.json();
    const args = aiJson.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { summary: "", next_action: "" };

    await supabase.from(tableMap[kind]).update({
      ai_summary: parsed.summary,
      ai_next_action: parsed.next_action,
      ai_generated_at: new Date().toISOString(),
    }).eq("id", recordId);

    return json({ ok: true, ...parsed });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
