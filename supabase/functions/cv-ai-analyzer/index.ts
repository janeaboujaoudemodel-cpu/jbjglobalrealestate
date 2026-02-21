import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const { cv_id, full_name, email, phone, cv_url } = await req.json();

    const prompt = `You are an expert HR recruiter for a premium real estate company in Dubai (JBJ Global Real Estate). Analyze this candidate and provide:
1. A concise 2-3 sentence professional summary
2. A relevance score from 1-10 (10 = perfect fit for real estate industry)

Candidate Info:
- Name: ${full_name || "Unknown"}
- Email: ${email || "N/A"}
- Phone: ${phone || "N/A"}
- CV URL: ${cv_url ? "Attached" : "Not provided"}

Return ONLY valid JSON:
{
  "summary": "2-3 sentence summary of the candidate",
  "ranking": 7,
  "key_strengths": ["strength1", "strength2"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);

    const aiData = await response.json();
    let raw = aiData.choices?.[0]?.message?.content?.trim() || "";
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed;
    try { parsed = JSON.parse(raw); } catch { parsed = { summary: raw.slice(0, 300), ranking: 5 }; }

    // Cache results in db
    if (cv_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);
      await sb.from("hr_cv_submissions").update({
        ai_summary: parsed.summary,
        ai_ranking: parsed.ranking,
      }).eq("id", cv_id);
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("cv-ai-analyzer error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
