// Careers Portal — AI Job Description generator + editor
// Modes:
//   "generate"  → produce a full JD from scratch given title/department/etc
//   "regenerate"→ same as generate but with stronger "rewrite from scratch" framing
//   "edit"      → revise an existing JD per a free-text user instruction
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Mode = "generate" | "regenerate" | "edit";

interface Body {
  mode?: Mode;
  title?: string;
  department?: string;
  location?: string;
  employment_type?: string;
  seniority?: string;
  salary_band?: string;
  current_description?: string;
  current_requirements?: string[];
  instruction?: string; // for "edit"
}

const SYSTEM_PROMPT = `You are an expert HR copywriter for JBJ GLOBAL REAL ESTATE,
an institutional real estate firm in Dubai, UAE. Write polished, ATS-friendly job
descriptions. No emojis. No fake numbers. Be specific and senior in tone.
Always return the structured JSON via the supplied tool. Do not invent salary
figures unless explicitly provided. Keep language inclusive and professional.`;

function buildUserPrompt(b: Body): string {
  const mode = b.mode ?? "generate";
  const base = [
    `Title: ${b.title ?? ""}`,
    `Department: ${b.department ?? ""}`,
    `Location: ${b.location ?? "Dubai, UAE"}`,
    `Employment type: ${b.employment_type ?? "full_time"}`,
    `Seniority: ${b.seniority ?? ""}`,
    `Salary band: ${b.salary_band ?? ""}`,
  ].join("\n");

  if (mode === "edit") {
    return `Existing job description:
"""
${b.current_description ?? ""}
"""
Existing requirements:
${(b.current_requirements ?? []).map((r) => `- ${r}`).join("\n")}

User instruction:
"""
${b.instruction ?? ""}
"""

Apply the user instruction and return the full updated JD. Preserve anything
the user did not ask to change. Context:
${base}`;
  }

  const verb = mode === "regenerate"
    ? "Rewrite this job description from scratch with a fresh angle."
    : "Draft a brand-new job description for this role.";
  return `${verb}\n${base}`;
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Auth: owner/admin only ─────────────────────────────────────────────
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const allowed = (roles ?? []).some(
      (r: { role: string }) => r.role === "owner" || r.role === "admin",
    );
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("auth failure", e);
    return new Response(JSON.stringify({ error: "Auth check failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Body ───────────────────────────────────────────────────────────────
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!body.title || !body.title.trim()) {
    return new Response(JSON.stringify({ error: "title is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if ((body.mode ?? "generate") === "edit" && !body.instruction?.trim()) {
    return new Response(JSON.stringify({ error: "instruction is required for edit" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Lovable AI call (tool calling for structured output) ───────────────
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = {
    model: "google/gemini-2.5-pro",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(body) },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "return_job_description",
          description: "Return a structured job description",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string", description: "1-2 paragraph role overview" },
              description_html: {
                type: "string",
                description:
                  "Full JD as clean semantic HTML using <h3>, <p>, <ul>, <li>. No inline styles.",
              },
              responsibilities: {
                type: "array",
                items: { type: "string" },
                description: "5-10 bullet responsibilities",
              },
              requirements: {
                type: "array",
                items: { type: "string" },
                description: "5-10 bullet requirements/qualifications",
              },
              benefits: {
                type: "array",
                items: { type: "string" },
              },
              ideal_candidate: { type: "string" },
              seo_blurb: {
                type: "string",
                description: "≤160 chars meta description",
              },
            },
            required: [
              "summary",
              "description_html",
              "responsibilities",
              "requirements",
            ],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: "return_job_description" },
    },
  };

  const aiRes = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (aiRes.status === 429) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (aiRes.status === 402) {
    return new Response(
      JSON.stringify({
        error: "AI credits exhausted. Add credits in Settings → Workspace → Usage.",
      }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (!aiRes.ok) {
    const txt = await aiRes.text();
    console.error("AI gateway error", aiRes.status, txt);
    return new Response(JSON.stringify({ error: "AI gateway error" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiJson = await aiRes.json();
  const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
  const argsStr = toolCall?.function?.arguments;
  if (!argsStr) {
    return new Response(JSON.stringify({ error: "Empty AI response" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(argsStr);
  } catch {
    return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, jd: parsed, mode: body.mode ?? "generate" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

Deno.serve(handler);
