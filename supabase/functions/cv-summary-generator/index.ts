import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, title, skills, experience, education, languages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const expSummary = (experience || [])
      .filter((e: { title?: string }) => e.title)
      .map((e: { title?: string; company?: string; period?: string }) => `${e.title} at ${e.company} (${e.period})`)
      .join("; ") || "professional background";

    const systemPrompt = `You are an expert CV writer. Write a compelling, concise professional summary for a CV/resume. 
The summary must be 3–4 sentences. Be specific, impactful, and results-oriented. Use active voice. 
Do NOT include generic filler phrases. Return ONLY the summary text, no titles or labels.`;

    const userPrompt = `Write a professional CV summary for:
- Name: ${name || "Professional"}
- Title / Role: ${title || "Professional"}
- Key Skills: ${skills || "professional skills"}
- Work Experience: ${expSummary}
- Education: ${(education || []).map((e: { degree?: string; institution?: string }) => `${e.degree} from ${e.institution}`).join(", ") || "relevant education"}
- Languages: ${languages || "English"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage credits required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error: " + response.status);
    }

    const result = await response.json();
    const summary = result.choices?.[0]?.message?.content?.trim() || "";

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("cv-summary-generator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
