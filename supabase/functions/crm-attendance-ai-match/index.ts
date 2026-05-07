import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Owner/admin only
    const { data: roles } = await userClient.from("user_roles").select("role").eq("user_id", u.user.id);
    const ok = (roles || []).some((r: any) => r.role === "admin" || r.role === "owner");
    if (!ok) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { event_id, brokerage_id, raw_text } = await req.json();
    if (!event_id || !brokerage_id || !raw_text) {
      return new Response(JSON.stringify({ error: "Missing event_id, brokerage_id or raw_text" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: existingAgents } = await admin
      .from("crm_brokerage_agents")
      .select("id, name, phone, email")
      .eq("brokerage_id", brokerage_id);

    // Ask Lovable AI to extract & match using tool calling
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const sys = `You match a pasted attendance list to existing brokers in a brokerage. Return strict JSON via the tool call.
Existing brokers (id, name, phone, email): ${JSON.stringify(existingAgents || [])}
For each line in the user input, decide:
 - matched: line corresponds to an existing broker → return their id
 - new: looks like a new broker → return name/phone/email parsed
Skip empty/header lines.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: raw_text }],
        tools: [{
          type: "function",
          function: {
            name: "register_attendance",
            description: "Return matched and new attendees parsed from the input text",
            parameters: {
              type: "object",
              properties: {
                matched: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { agent_id: { type: "string" }, name: { type: "string" } },
                    required: ["agent_id", "name"],
                  },
                },
                new_brokers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { name: { type: "string" }, phone: { type: "string" }, email: { type: "string" } },
                    required: ["name"],
                  },
                },
              },
              required: ["matched", "new_brokers"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "register_attendance" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI gateway failed");
    }

    const ai = await aiRes.json();
    const args = ai?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { matched: [], new_brokers: [] };

    // Insert new brokers first
    let newAgentsInserted: any[] = [];
    if (parsed.new_brokers?.length) {
      const ins = parsed.new_brokers.map((b: any) => ({
        brokerage_id, name: b.name, phone: b.phone || null, email: b.email || null,
        role: "broker", status: "active", source: "ai_attendance",
      }));
      const { data: newAgents, error: nErr } = await admin
        .from("crm_brokerage_agents").insert(ins).select("id, name, phone, email");
      if (nErr) throw nErr;
      newAgentsInserted = newAgents || [];
    }

    // Build attendees list
    const matchedAttendees = (parsed.matched || []).map((m: any) => ({
      event_id, brokerage_id, agent_id: m.agent_id,
      name: (existingAgents || []).find((a: any) => a.id === m.agent_id)?.name || m.name,
      phone: null, email: null, matched_via: "ai_paste",
    }));
    const newAttendees = newAgentsInserted.map((a) => ({
      event_id, brokerage_id, agent_id: a.id, name: a.name, phone: a.phone, email: a.email,
      matched_via: "ai_paste",
    }));
    const allAttendees = [...matchedAttendees, ...newAttendees];

    if (allAttendees.length) {
      const { error: aErr } = await admin.from("crm_brokerage_event_attendees").insert(allAttendees);
      if (aErr) throw aErr;
    }

    return new Response(JSON.stringify({
      matched_count: matchedAttendees.length,
      created_count: newAttendees.length,
      total: allAttendees.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
