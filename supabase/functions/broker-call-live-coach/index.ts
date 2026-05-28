// Live coach for an in-progress call. Takes a rolling transcript and returns 1-4
// short tips ("Listen", "Now say…", "Recommend X by Y") for the broker, fast.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { leadId, transcript } = await req.json().catch(() => ({}));
    if (!transcript || typeof transcript !== "string") return json({ tips: [] });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let lead: any = null;
    if (leadId) {
      const { data } = await admin.from("crm_leads")
        .select("full_name, preferred_language, nationality, budget_min, budget_max, budget_currency, preferred_location, property_type, bedroom_requirement, notes")
        .eq("id", leadId).maybeSingle();
      lead = data;
    }
    let inventory: any[] = [];
    if (lead) {
      let q = admin.from("projects")
        .select("id, name, area_name, bedrooms_min, bedrooms_max, price_from, price_currency, developer_id")
        .eq("is_published", true).limit(20);
      if (lead.budget_max) q = q.lte("price_from", Number(lead.budget_max) * 1.15);
      if (lead.preferred_location) q = q.ilike("area_name", `%${lead.preferred_location}%`);
      const { data: projects } = await q;
      const devIds = [...new Set((projects ?? []).map((p: any) => p.developer_id).filter(Boolean))];
      const { data: devs } = devIds.length
        ? await admin.from("developers").select("id, name").in("id", devIds)
        : { data: [] as any[] };
      const devMap = new Map((devs ?? []).map((d: any) => [d.id, d.name]));
      inventory = (projects ?? []).map((p: any) => ({
        name: p.name, developer: devMap.get(p.developer_id) || "JBJ",
        area: p.area_name,
        beds: [p.bedrooms_min, p.bedrooms_max].filter(Boolean).join("–") || null,
        price_from: p.price_from, currency: p.price_currency || "AED",
      })).slice(0, 12);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ tips: [] });

    const tools = [{
      type: "function",
      function: {
        name: "coach_tips",
        description: "Return 1-4 short live coaching tips for the broker during the call.",
        parameters: {
          type: "object",
          additionalProperties: false,
          required: ["tips"],
          properties: {
            tips: {
              type: "array",
              items: { type: "string", description: "Short imperative tip, max 18 words." },
            },
          },
        },
      },
    }];

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a real-time sales coach whispering into a broker's ear during a live Dubai real-estate call. Be specific and very short. If the client is still talking, the first tip should be 'Listen — let the client finish.' If the client just answered, propose what to say next, then suggest 1-2 matching projects from the inventory by name + developer. Never invent projects." },
          { role: "user", content: `LEAD: ${JSON.stringify(lead)}\nINVENTORY: ${JSON.stringify(inventory)}\nROLLING TRANSCRIPT (latest at end):\n${transcript.slice(-2500)}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "coach_tips" } },
      }),
    });
    if (!r.ok) return json({ tips: [] });
    const j = await r.json();
    const tc = j?.choices?.[0]?.message?.tool_calls?.[0];
    let tips: string[] = [];
    try { tips = JSON.parse(tc.function.arguments).tips || []; } catch {}
    return json({ tips });
  } catch (e) {
    console.error("broker-call-live-coach error", e);
    return json({ tips: [] });
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
