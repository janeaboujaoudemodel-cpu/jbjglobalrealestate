// CV AI Parse — extracts structured CV data from raw text (or text extracted client-side from PDF/DOCX).
// Uses Lovable AI Gateway with openai/gpt-5.5 + tool-calling for structured output.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const CV_TOOL = {
  type: "function",
  function: {
    name: "emit_cv",
    description: "Emit the structured CV data extracted from the user's resume.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        fullName: { type: "string" },
        headline: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        website: { type: "string" },
        linkedin: { type: "string" },
        summary: { type: "string" },
        experience: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              role: { type: "string" },
              company: { type: "string" },
              location: { type: "string" },
              start: { type: "string" },
              end: { type: "string" },
              bullets: { type: "string", description: "One bullet per line, no leading dash." },
            },
            required: ["role", "company", "start", "end", "bullets", "location"],
          },
        },
        education: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              degree: { type: "string" },
              school: { type: "string" },
              location: { type: "string" },
              start: { type: "string" },
              end: { type: "string" },
              notes: { type: "string" },
            },
            required: ["degree", "school", "location", "start", "end", "notes"],
          },
        },
        skills: { type: "array", items: { type: "string" } },
        languages: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: { name: { type: "string" }, level: { type: "string" } },
            required: ["name", "level"],
          },
        },
        certifications: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              issuer: { type: "string" },
              date: { type: "string" },
            },
            required: ["name", "issuer", "date"],
          },
        },
      },
      required: [
        "fullName", "headline", "email", "phone", "location", "website",
        "linkedin", "summary", "experience", "education", "skills",
        "languages", "certifications",
      ],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { rawText } = await req.json();
    if (typeof rawText !== "string" || rawText.trim().length < 20) {
      return new Response(JSON.stringify({ error: "rawText required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const r = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          {
            role: "system",
            content:
              "You extract structured CV data from raw resume text. Be faithful: do not invent facts. If a field is missing, return an empty string or empty array. Normalise dates as 'MMM YYYY' (e.g., 'Jan 2022'). Bullets must be one per line, no leading dashes.",
          },
          { role: "user", content: rawText.slice(0, 30000) },
        ],
        tools: [CV_TOOL],
        tool_choice: { type: "function", function: { name: "emit_cv" } },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      const status = r.status === 429 ? 429 : r.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: t }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await r.json();
    const call = j.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("AI did not return structured data");
    const cv = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify({ cv }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
