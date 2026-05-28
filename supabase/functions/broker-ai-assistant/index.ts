// Broker AI Sales Assistant — per-lead chat with structured insights.
// Auth: requires a logged-in broker (or owner). Uses Lovable AI Gateway.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the broker's "Head of Sales" — a senior Dubai real-estate sales director helping a JBJ GLOBAL REAL ESTATE broker close their lead faster.

Your job EVERY turn:
1. Read the lead profile + interest notes + chat history.
2. Score the lead 0–100 for closing readiness, with a one-line reason.
3. From the JBJ inventory provided, pick up to 3 best matches with a 0–100 match score each. NEVER invent properties — only use ones present in the provided "inventory" list. If nothing fits, say so.
4. Recommend ONE concrete next step (e.g. "send the brochure for X then book a site visit Tue 4pm").
5. Draft a ready-to-send message addressed to the lead BY NAME, in their preferred language if known, friendly and concise, ready to copy into WhatsApp.

Always call the tool "assistant_reply" — do not return plain text.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const leadId: string = body.leadId;
    const userMessage: string = (body.message ?? "").toString().slice(0, 4000);
    const mode: string = body.mode ?? "freeform";
    if (!leadId) {
      return new Response(JSON.stringify({ error: "leadId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch lead
    const { data: lead, error: leadErr } = await supabase
      .from("crm_leads")
      .select("id, full_name, preferred_language, nationality, current_location_city, current_location_country, notes, internal_comments, lead_intent, pipeline_stage, budget_min, budget_max, budget_currency, preferred_location, preferred_project, property_type, bedroom_requirement, buying_purpose, lead_type, source, tags, ai_score, last_contacted_at, created_at, whatsapp_e164, phone_e164")
      .eq("id", leadId)
      .maybeSingle();
    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role for inventory + chat history (RLS-safe reads of published projects)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Inventory — filter loosely by lead preferences
    let invQuery = admin
      .from("projects")
      .select("id, name, slug, area_name, bedrooms_min, bedrooms_max, price_from, price_to, price_currency, property_type_label, status, developer_id")
      .eq("is_published", true)
      .limit(40);
    if (lead.budget_max) invQuery = invQuery.lte("price_from", Number(lead.budget_max) * 1.15);
    if (lead.budget_min) invQuery = invQuery.gte("price_to", Number(lead.budget_min) * 0.85);
    if (lead.preferred_location) invQuery = invQuery.ilike("area_name", `%${lead.preferred_location}%`);
    const { data: projects } = await invQuery;

    // Developer names
    const devIds = [...new Set((projects ?? []).map(p => p.developer_id).filter(Boolean))];
    const { data: devs } = devIds.length
      ? await admin.from("developers").select("id, name").in("id", devIds)
      : { data: [] as any[] };
    const devMap = new Map((devs ?? []).map((d: any) => [d.id, d.name]));

    const inventory = (projects ?? []).map(p => ({
      id: p.id, name: p.name, slug: p.slug,
      developer: devMap.get(p.developer_id) || "JBJ",
      area: p.area_name,
      beds: [p.bedrooms_min, p.bedrooms_max].filter(Boolean).join("–") || null,
      price_from: p.price_from, price_to: p.price_to,
      currency: p.price_currency || "AED",
      type: p.property_type_label,
      status: p.status,
    })).slice(0, 25);

    // Prior chat (last 20)
    const { data: prior } = await supabase
      .from("broker_ai_chats")
      .select("role, content")
      .eq("broker_id", user.id)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "system",
        content: `LEAD PROFILE:\n${JSON.stringify(lead, null, 2)}\n\nINVENTORY (only choose from these):\n${JSON.stringify(inventory, null, 2)}\n\nMODE: ${mode}`,
      },
      ...((prior ?? []).map((m: any) => ({ role: m.role, content: m.content }))),
    ];
    if (userMessage) messages.push({ role: "user", content: userMessage });

    const tools = [{
      type: "function",
      function: {
        name: "assistant_reply",
        description: "Structured sales-assistant reply.",
        parameters: {
          type: "object",
          additionalProperties: false,
          required: ["score", "score_reason", "matches", "next_step", "draft_message", "reply"],
          properties: {
            score: { type: "integer", minimum: 0, maximum: 100 },
            score_reason: { type: "string" },
            matches: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["project_id", "name", "developer", "match_score", "reason"],
                properties: {
                  project_id: { type: "string" },
                  name: { type: "string" },
                  developer: { type: "string" },
                  area: { type: "string" },
                  beds: { type: "string" },
                  price_from: { type: ["number", "null"] },
                  currency: { type: "string" },
                  match_score: { type: "integer", minimum: 0, maximum: 100 },
                  reason: { type: "string" },
                },
              },
            },
            next_step: { type: "string" },
            draft_message: { type: "string", description: "Ready-to-send message addressed to the lead by first name." },
            reply: { type: "string", description: "Short conversational answer to the broker." },
          },
        },
      },
    }];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages,
        tools,
        tool_choice: { type: "function", function: { name: "assistant_reply" } },
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded — try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted — please add credits in Workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error", status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const tc = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    let structured: any = null;
    try { structured = tc ? JSON.parse(tc.function.arguments) : null; } catch { structured = null; }

    if (!structured) {
      return new Response(JSON.stringify({ error: "AI returned no structured reply" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist both turns
    const rows: any[] = [];
    if (userMessage) rows.push({ broker_id: user.id, lead_id: leadId, role: "user", content: userMessage });
    rows.push({ broker_id: user.id, lead_id: leadId, role: "assistant", content: structured.reply || "", structured });
    if (rows.length) await supabase.from("broker_ai_chats").insert(rows);

    return new Response(JSON.stringify({ structured }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("broker-ai-assistant error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
