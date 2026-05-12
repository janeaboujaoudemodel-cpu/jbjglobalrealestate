// PAA AI Co-Pilot — non-streaming chat helper that can suggest field
// edits for a Property Advertising Agreement envelope. Uses Lovable AI
// Gateway (no API keys required).
import { createClient } from "npm:@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE" };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const { envelope_id, messages, current_values } = await req.json();
    if (!envelope_id || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "envelope_id + messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sys = [
      "You are the PAA Co-Pilot, an executive assistant inside the JBJ GLOBAL REAL ESTATE document studio.",
      "You help the owner refine a Property Advertising Agreement (Leasing or Resale).",
      "When the user asks to change values, respond with a short confirmation AND a JSON code block:",
      "```json\n{\"updates\": {\"field_key\": \"new value\"}}\n```",
      "Field keys are snake_case (e.g. rental_amount, sales_amount, building_name, community, bedrooms, bathrooms, bua_sqft, parking, payment_plan, service_charge_per_sqft, additional_notes, term_months).",
      "Never invent owner PII. Never include landlord_* / owner_* / passport / emirates_id / mobile / email in updates.",
      "Keep prose answers under 4 sentences. Be precise and professional.",
      `Current document field values (JSON): ${JSON.stringify(current_values || {}).slice(0, 4000)}`,
    ].join("\n");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, ...messages],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: `AI gateway ${resp.status}: ${t.slice(0, 300)}` }), {
        status: resp.status === 429 || resp.status === 402 ? resp.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || "";

    // Extract JSON updates if present
    let updates: Record<string, string> | null = null;
    const m = content.match(/```json\s*([\s\S]*?)```/i);
    if (m) {
      try {
        const parsed = JSON.parse(m[1]);
        if (parsed && typeof parsed.updates === "object") {
          const banned = /^(landlord_|owner_|passport|emirates_id|mobile|email|trn|poa|signature|unit_)/i;
          updates = {};
          for (const [k, v] of Object.entries(parsed.updates)) {
            if (banned.test(k)) continue;
            updates[k] = String(v);
          }
        }
      } catch {}
    }

    return new Response(JSON.stringify({ ok: true, content, updates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("paa-ai-copilot error", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
