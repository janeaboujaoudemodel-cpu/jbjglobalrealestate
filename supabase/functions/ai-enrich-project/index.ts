// AI Project Enrichment — strict no-fabrication contract.
// Owner-only. Reads optional source text, returns a per-field diff with citations.
// Never invents prices, dates, amenities, or images. Missing data → reported.

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SECTION_FIELDS: Record<string, string[]> = {
  details: ["description", "usp_bullets", "highlights", "finishing_standard"],
  amenities: ["amenities", "amenities_list"],
  location: ["location_description", "location_headline", "location_distances"],
  payment: ["payment_plan", "down_payment_percent", "payment_breakdown"],
  specs: ["total_units", "floors", "service_charge", "floor_plan_types", "unit_types"],
  faq: ["faqs"],
};

const ALL_FIELDS = Array.from(new Set(Object.values(SECTION_FIELDS).flat()));

function fieldSection(field: string): string {
  for (const [sec, fields] of Object.entries(SECTION_FIELDS)) {
    if (fields.includes(field)) return sec;
  }
  return "details";
}

const SYSTEM_PROMPT = `You are a strict real-estate data extractor for a luxury Dubai brokerage.

ABSOLUTE RULES (violating any = invalid output):
1. Use ONLY facts present in the provided SOURCE TEXT. Never invent or guess.
2. If a field is not clearly present in the source, return it inside "missing[]" with a short reason. Do NOT include it in "fields[]".
3. Never generate, fetch, or describe images. Image fields are out of scope.
4. Quote a short verbatim snippet (<=160 chars) from the source as "citation" for each extracted field.
5. Prices, percentages, dates, unit counts must match the source EXACTLY. Do not round, infer, or fill blanks.
6. Amenities must be an array of strings copied from the source (no synonyms, no additions).
7. payment_breakdown must be an array of {label, percent} objects extracted verbatim from milestones in the source. If only a free-text plan exists, populate "payment_plan" string and leave "payment_breakdown" missing.
8. location_distances must be an array of {label, time} extracted verbatim. Never invent travel times.

Output strict JSON via the provided tool. No prose.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    // Owner/admin gate
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["owner", "admin"])
      .limit(1)
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden — owner/admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { projectId, section, sourceText, overwrite } = await req.json();
    if (!projectId || typeof sourceText !== "string" || sourceText.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "projectId and sourceText (>=20 chars) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetFields = section && SECTION_FIELDS[section] ? SECTION_FIELDS[section] : ALL_FIELDS;

    // Fetch current values to compute diff + respect overwrite flag
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select(["id", "name", ...targetFields].join(","))
      .eq("id", projectId)
      .maybeSingle();
    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tool = {
      type: "function",
      function: {
        name: "extract_project_fields",
        description: "Extract real-estate project fields strictly from the source text",
        parameters: {
          type: "object",
          properties: {
            fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", enum: targetFields },
                  value: {
                    description:
                      "Extracted value. String for text fields, array for list fields, object for structured fields. Must match the source verbatim.",
                  },
                  citation: {
                    type: "string",
                    description: "Short verbatim snippet from the source supporting this value (<=160 chars).",
                  },
                },
                required: ["field", "value", "citation"],
                additionalProperties: false,
              },
            },
            missing: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  reason: { type: "string" },
                },
                required: ["field", "reason"],
                additionalProperties: false,
              },
            },
          },
          required: ["fields", "missing"],
          additionalProperties: false,
        },
      },
    };

    const userPrompt = `PROJECT: ${(project as any).name}\nALLOWED FIELDS: ${targetFields.join(", ")}\n\nSOURCE TEXT:\n"""\n${sourceText.slice(0, 12000)}\n"""\n\nExtract only the fields clearly supported by the source.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "extract_project_fields" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Top up at Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please retry in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI returned no structured output" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: { fields: any[]; missing: any[] };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build diff against current project values, honour overwrite flag
    const diffFields = [];
    const missing = parsed.missing || [];
    for (const f of parsed.fields || []) {
      if (!targetFields.includes(f.field)) continue;
      const current = (project as any)[f.field];
      const hasCurrent =
        current !== null &&
        current !== undefined &&
        current !== "" &&
        !(Array.isArray(current) && current.length === 0);

      if (hasCurrent && !overwrite) {
        missing.push({
          field: f.field,
          reason: `Field already has a value — re-run with "Overwrite" checked to replace it.`,
        });
        continue;
      }

      diffFields.push({
        section: fieldSection(f.field),
        field: f.field,
        current: current ?? null,
        proposed: f.value,
        citation: f.citation || null,
        missing: false,
      });
    }

    // Add missing entries as non-applicable rows so owner sees what to upload
    for (const m of missing) {
      diffFields.push({
        section: fieldSection(m.field),
        field: m.field,
        current: (project as any)[m.field] ?? null,
        proposed: null,
        citation: null,
        missing: true,
        reason: m.reason,
      });
    }

    return new Response(
      JSON.stringify({
        fields: diffFields,
        missing: missing.map((m: any) => ({
          section: fieldSection(m.field),
          reason: `${m.field}: ${m.reason}`,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-enrich-project error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
