import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";

    // Verify caller is owner
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Auth failed" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownerEmail = Deno.env.get("OWNER_EMAIL");
    if (!ownerEmail || user.email?.toLowerCase() !== ownerEmail.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Owner access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { applicationId, source } = await req.json();
    if (!applicationId || !source) {
      return new Response(JSON.stringify({ error: "applicationId and source required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: app, error: fetchErr } = await adminClient
      .from(source)
      .select("*")
      .eq("id", applicationId)
      .single();

    if (fetchErr || !app) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const candidateInfo = `
CANDIDATE APPLICATION:
- Full Name: ${app.full_name || "N/A"}
- Email: ${app.email || "N/A"}
- Phone: ${app.phone_e164 || app.phone || "Not provided"}
- Nationality: ${app.nationality || "Not stated"}
- Preferred Language: ${app.preferred_language || "Not stated"}
- Location: ${app.current_location_city || "?"}, ${app.current_location_country || "?"}
- Source: ${app.source || source}
- CV Uploaded: ${app.cv_url ? "Yes" : "No"}
- Applied: ${app.created_at}`.trim();

    const systemPrompt = `You are a senior HR professional at JBJ Global Real Estate, a luxury real estate brokerage in Dubai, UAE. Analyze a candidate application with PROFESSIONAL, FAIR, and THOROUGH scoring.

SCORING CRITERIA (1–10 total):
■ Experience (0–4 points):
  0 = No experience info available
  1 = Under 1 year or completely unrelated field
  2 = 1–3 years or semi-related (hospitality, retail, customer service)
  3 = 3–6 years in real estate, sales, finance, or closely related
  4 = 7+ years with real estate leadership or senior broker experience

■ Languages (0–3 points):
  0 = No language info
  1 = 1 language (English OR Arabic)
  2 = 2 languages including English
  3 = 3+ languages including English & Arabic (essential for Dubai)

■ Skills (0–3 points):
  0 = No identifiable skills
  1 = Basic transferable skills (communication, MS Office)
  2 = Relevant skills (CRM, negotiation, sales, property management)
  3 = Advanced/certified (RERA license, BRN holder, Salesforce, market analysis tools)

FINAL SCORE = Experience + Language + Skills (max 10)
Levels: 9–10 Elite | 7–8 Advanced | 5–6 Intermediate | 3–4 Developing | 1–2 Beginner

RULES:
- Be FAIR. Score only on available information.
- If data is missing, score conservatively but flag it as "insufficient data", NOT as a negative trait.
- Infer reasonable estimates from context (email domain, nationality → likely languages, location → market familiarity).
- For chat-widget applicants with minimal info, honestly state limitations.
- Identify which ROLE the candidate is best suited for.
- List SPECIFIC missing items the candidate should provide.

Respond ONLY in valid JSON (no markdown, no code blocks):
{
  "experience_years": 0,
  "languages": ["English"],
  "skills": ["Skill1"],
  "ai_ranking": 3,
  "ai_summary": "Professional 2-3 sentence HR summary.",
  "department_category": "sales",
  "best_suited_role": "Junior Sales Associate",
  "flag_reason": null,
  "strengths": ["strength1"],
  "weaknesses": ["weakness1"],
  "missing_items": ["CV document", "Work history"],
  "interview_questions": ["Q1?", "Q2?", "Q3?"],
  "scoring_breakdown": {
    "experience_score": 0,
    "experience_reason": "No experience info provided",
    "language_score": 1,
    "language_reason": "English inferred from application language",
    "skills_score": 0,
    "skills_reason": "No skills data available"
  },
  "overall_recommendation": "Consider",
  "recommendation_reason": "Insufficient data for strong recommendation; request CV and interview."
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: candidateInfo },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let rawContent = aiData.choices?.[0]?.message?.content?.trim() || "";

    // Strip markdown code fences if present
    rawContent = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(JSON.stringify({ error: "Failed to parse AI analysis", raw: rawContent }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist core fields to database
    const updatePayload: Record<string, unknown> = {
      experience_years: analysis.experience_years ?? 0,
      languages: analysis.languages ?? [],
      skills: analysis.skills ?? [],
      ai_ranking: Math.max(1, Math.min(10, analysis.ai_ranking ?? 1)),
      ai_summary: analysis.ai_summary ?? "Analysis completed.",
      flag_reason: analysis.flag_reason ?? null,
    };

    // Only hr_applications has department_category column
    if (source === "hr_applications") {
      updatePayload.department_category = analysis.department_category ?? "general";
    }

    const { error: updateErr } = await adminClient.from(source).update(updatePayload).eq("id", applicationId);
    if (updateErr) {
      console.error("DB update error:", updateErr);
    }

    return new Response(JSON.stringify({ success: true, analysis, updated: updatePayload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cv-ai-analyzer error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
