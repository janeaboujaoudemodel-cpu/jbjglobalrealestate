import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const { job_title, experience_text, existing_skills = "" } = await req.json();

    if (!job_title && !experience_text) {
      return new Response(JSON.stringify({ error: "Provide job_title or experience_text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a professional CV/Resume expert. Based on the following job information, suggest 10-15 relevant professional skills.

Job Title: ${job_title || "Not specified"}
Experience: ${experience_text || "Not specified"}
Existing Skills (avoid duplicates): ${existing_skills}

Return ONLY a JSON array of skill strings, no explanation:
["Skill 1", "Skill 2", "Skill 3", ...]

Focus on:
- Technical skills specific to the role
- Soft skills that are highly relevant
- Industry-standard tools and methodologies
- Keep each skill concise (1-4 words max)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: "AI call failed", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let rawContent = data.choices?.[0]?.message?.content?.trim() || "[]";
    rawContent = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let skills: string[];
    try {
      skills = JSON.parse(rawContent);
      if (!Array.isArray(skills)) skills = [];
    } catch {
      skills = [];
    }

    return new Response(JSON.stringify({ skills }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("CV skills suggest error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
