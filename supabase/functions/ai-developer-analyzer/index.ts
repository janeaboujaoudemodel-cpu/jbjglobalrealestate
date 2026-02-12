import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, sanitizeForPrompt } from "../_shared/ai-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DeveloperAnalysisRequest {
  developerName: string;
  completedProjects?: number | null;
  foundedYear?: number | null;
  headquarters?: string | null;
  activeProjects?: number | null;
  projectCount?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: DeveloperAnalysisRequest = await req.json();
    const {
      developerName: rawName,
      completedProjects,
      foundedYear,
      headquarters,
      activeProjects,
      projectCount,
    } = body;

    const developerName = sanitizeForPrompt(rawName, 100);
    if (!developerName) {
      return new Response(
        JSON.stringify({ success: false, error: "Developer name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing developer: ${developerName}`);

    const todayDate = new Date().toISOString().split("T")[0];

    // Build developer context for the prompt
    const contextLines: string[] = [];
    if (foundedYear) contextLines.push(`Founded: ${foundedYear}`);
    if (headquarters) contextLines.push(`Headquarters: ${sanitizeForPrompt(headquarters, 100)}`);
    if (completedProjects) contextLines.push(`Total Units Delivered: ${completedProjects.toLocaleString()}+`);
    if (activeProjects) contextLines.push(`Active/Off-Plan Projects: ${activeProjects}`);
    if (projectCount) contextLines.push(`Total Projects in Portfolio: ${projectCount}`);

    const contextBlock = contextLines.length > 0
      ? `\n\nKNOWN FACTS (use these as ground truth, do NOT contradict them):\n${contextLines.join("\n")}`
      : "";

    const systemPrompt = `You are JBJ Developer Intelligence, a premium real estate developer analysis engine for the Dubai & UAE property market.

STRICT RULES:
- NEVER use greetings, personal phrases, or religious expressions
- NEVER use hashtags
- Go straight to the analysis content
- Be specific with numbers, percentages, and data points
- Keep each section VERY SHORT: 2-3 bullet points max, one line each
- Use clean markdown formatting without excessive decoration
- Prioritize the single most impactful data point per section
- Today's date is ${todayDate}
- Focus on DEVELOPER track record, delivery history, build quality, and investor value
- This is a DEVELOPER analysis, NOT an area/location analysis`;

    const userPrompt = `Analyze the real estate developer "${developerName}" operating in Dubai/UAE.${contextBlock}

Use EXACTLY these section headers (numbered, bold):

1. **Company Overview** - 2 sentences max: founding story, market positioning, and signature style
2. **Portfolio Strength** - Top 3 flagship projects with one key detail each (3 bullet points max)
3. **Track Record & Delivery** - On-time delivery rate, build quality reputation, handover track record (2-3 bullet points max)
4. **Price Per Sqft** - Avg price/sqft across their portfolio, YoY trend % (2 bullet points max)
5. **Supply Pipeline** - Upcoming units count, key upcoming projects (2 bullet points max)
6. **Investment Metrics** - Rental yield %, capital appreciation %, resale demand (2-3 bullet points max)
7. **Pros** - 3 key advantages of investing with this developer (one line each)
8. **Cons** - 3 key risks or concerns (one line each)
9. **Investment Rating** - Score out of 10 with one-line justification

CRITICAL: Keep every section SHORT. Max 2-3 bullet points. One line per bullet. Numbers over words. Focus on what makes this developer unique vs competitors.`;

    let fullAnalysis: string;
    try {
      fullAnalysis = await callLovableAI(systemPrompt, userPrompt);
    } catch (aiError) {
      console.error("AI error:", aiError);
      return new Response(
        JSON.stringify({ success: false, error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Developer analysis complete for: ${developerName}`);

    return new Response(
      JSON.stringify({
        success: true,
        developerName,
        fullAnalysis,
        generatedAt: new Date().toISOString(),
        disclaimer: "This analysis is AI-generated for informational purposes only and should not be considered financial advice.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("AI Developer Analyzer error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
