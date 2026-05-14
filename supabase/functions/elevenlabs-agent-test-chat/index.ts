// Free text-only tester: streams the configured ElevenLabs agent prompt through
// the Lovable AI gateway so the owner can iterate on the prompt without burning
// ElevenLabs voice credits. Owner-only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Unauthorized" }, 401);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
  const isOwner = (roles ?? []).some((r: { role: string }) => r.role === "owner" || r.role === "admin");
  if (!isOwner) return json({ error: "Forbidden" }, 403);

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) return json({ error: "AI gateway not configured" }, 500);

  const { systemPrompt, messages } = await req.json().catch(() => ({ systemPrompt: "", messages: [] }));
  if (!Array.isArray(messages)) return json({ error: "messages required" }, 400);

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": lovableKey,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: String(systemPrompt || "You are a helpful concierge.") },
        ...messages,
      ],
    }),
  });

  if (!r.ok) {
    const t = await r.text();
    return json({ error: `AI gateway ${r.status}: ${t}` }, 500);
  }
  const data = await r.json();
  const reply = data?.choices?.[0]?.message?.content ?? "";
  return json({ reply });
});
