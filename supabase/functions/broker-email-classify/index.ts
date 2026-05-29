// Classifies broker emails using Lovable AI Gateway and tags categories.
// POST { emailId }  — caller must own the row (RLS).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = [
  "new_launch","commission","onboarding_letter","warning_letter","termination",
  "leave_approval","internal_jbj","client_lead","contract","other",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });

    const { emailId } = await req.json();
    if (!emailId) {
      return new Response(JSON.stringify({ error: "emailId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: email, error: fetchErr } = await supabase
      .from("broker_emails")
      .select("id, subject, from_address, from_name, snippet, body_text")
      .eq("id", emailId)
      .maybeSingle();
    if (fetchErr || !email) {
      return new Response(JSON.stringify({ error: "Email not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sample = (email.body_text || email.snippet || "").slice(0, 4000);
    const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: `You categorise real-estate broker emails. Choose exactly ONE category from: ${CATEGORIES.join(", ")}. Then write a one-sentence summary and a one-line intent.` },
          { role: "user", content: `From: ${email.from_name || email.from_address}\nSubject: ${email.subject || "(no subject)"}\n\n${sample}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "classify_email",
            parameters: {
              type: "object",
              properties: {
                category: { type: "string", enum: [...CATEGORIES] },
                summary: { type: "string" },
                intent: { type: "string" },
              },
              required: ["category","summary","intent"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "classify_email" } },
      }),
    });

    if (!ai.ok) {
      const txt = await ai.text();
      return new Response(JSON.stringify({ error: "AI failed", detail: txt }), {
        status: ai.status === 429 ? 429 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await ai.json();
    const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : null;
    if (!parsed) {
      return new Response(JSON.stringify({ error: "No classification" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("broker_emails").update({
      ai_category: parsed.category,
      ai_summary: parsed.summary,
      ai_intent: parsed.intent,
      ai_processed_at: new Date().toISOString(),
    }).eq("id", emailId);

    return new Response(JSON.stringify({ ok: true, ...parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
