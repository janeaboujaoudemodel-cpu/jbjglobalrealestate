import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, sanitizeContactInfo, sanitizeForPrompt } from "../_shared/ai-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalysisRequest {
  area: string;
  propertyType: string;
  analysisType?: 'full' | 'comparison';
  compareWith?: string[];
  measurementUnit?: 'sqft' | 'sqm' | 'both';
  currency?: 'AED' | 'USD' | 'EUR' | 'GBP';
  language?: 'en' | 'ar' | 'ru' | 'zh' | 'hi';
  emirate?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body: AnalysisRequest = await req.json();
    const { 
      area: rawArea, 
      propertyType: rawPropertyType, 
      analysisType = 'full', 
      compareWith = [], 
      measurementUnit = 'sqft',
      currency = 'AED',
      language = 'en',
      emirate: rawEmirate,
    } = body;

    // Sanitize inputs to prevent prompt injection
    const area = sanitizeForPrompt(rawArea, 100);
    const propertyType = sanitizeForPrompt(rawPropertyType, 50);
    const emirate = rawEmirate ? sanitizeForPrompt(rawEmirate, 50) : null;
    const sanitizedCompareWith = compareWith.map(a => sanitizeForPrompt(a, 100)).filter(Boolean);

    if (!area) {
      return new Response(
        JSON.stringify({ success: false, error: "Area is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing property market: ${area}, ${propertyType}, ${analysisType}`);

    // Build the analysis prompt
    const measurementText = measurementUnit === 'both' 
      ? 'both sq ft and m²' 
      : measurementUnit === 'sqm' 
        ? 'square meters (m²)' 
        : 'square feet (sq ft)';

    const languageMap: Record<string, string> = {
      'ar': 'Arabic',
      'ru': 'Russian', 
      'zh': 'Chinese',
      'hi': 'Hindi',
      'en': 'English'
    };

    const todayDate = new Date().toISOString().split('T')[0];
    const emirateContext = emirate || "UAE";
    const systemPrompt = `You are JBJ Property Analyzer integrated with smart AI intelligence.
You provide concise, structured, data-driven real estate market analysis for the UAE.

STRICT RULES:
- NEVER use greetings, personal phrases, or religious expressions
- NEVER use hashtags
- NEVER say "I will now provide" or similar filler
- Go straight to the analysis content
- Use ${measurementText} for all measurements
- Display prices in ${currency}
- Respond in ${languageMap[language] || 'English'}
- Be specific with numbers, percentages, and data points
- Keep each section VERY SHORT: 2-3 bullet points max, one line each
- Use clean markdown formatting without excessive decoration
- Prioritize the single most impactful data point per section
- The project/area is in ${emirateContext}. NEVER mention Dubai unless the project is actually in Dubai.
- If you do not have confirmed real data for a section, write "Data not available for this area" instead of guessing or fabricating information.
- NEVER fabricate market statistics, prices, yields, or developer information. Only report facts you are confident about.
- When rating premium projects from tier-1 developers (Emaar, DAMAC, Sobha, Meraas, Aldar, Nakheel, Omniyat, RAK Properties, etc.) in established or high-growth areas, reflect their premium status accurately. Premium locations with strong developer track records, post-handover payment plans, and high rental yields typically warrant ratings of 8.5-9.8 out of 10.
- NEVER list false, fabricated, or speculative cons or pros for ANY project. Only state cons that are verifiable market facts. Do not fabricate developer track record claims, unverified market assumptions, or speculative risks. If you are unsure about a con, omit it rather than guess.
- For Cons, ONLY list risks that are VERIFIABLE market facts with specific data points. Do NOT list generic risks like "market may decline", "prices could fluctuate", or "potential oversupply". If you cannot name a specific, factual risk with evidence, return an EMPTY Cons section.
- NEVER give a rating of 5 or below unless the project has serious structural risks. Most UAE off-plan projects from reputable developers should score 7.5 minimum. Projects with flexible post-handover payment plans, prime locations, and tier-1 developers should score 8.5-9.8.
- Do NOT default to conservative/middling ratings. Evaluate each project fairly based on location desirability, developer reputation, payment plan flexibility, and capital appreciation potential.
- UAE MARKET BENCHMARKS 2025-2026: Northern Emirates (RAK, UAQ, Ajman) have seen significant rental yield increases, especially for holiday homes and Airbnb — RAK and UAQ holiday home yields can reach 10-15% gross. Dubai prime areas typically see 6-8% net yields. Abu Dhabi yields average 6-7%. Capital appreciation in UAE off-plan has averaged 15-30% in prime areas during 2024-2026. Reflect these current bullish market conditions accurately in Investment Metrics.`;

    const comparisonText = sanitizedCompareWith.length > 0 
      ? `\n\nAlso compare with these areas: ${sanitizedCompareWith.join(', ')}`
      : '';

    const userPrompt = `Analyze ${area}, ${emirateContext} for ${propertyType} properties.${comparisonText}

Use EXACTLY these section headers (numbered, bold):

1. **Area Overview** - 2 sentences max: location positioning and lifestyle in a nutshell
2. **Price Per Sqft** - Avg price/sqft, YoY trend % (2 bullet points max)
3. **Supply vs Demand** - Pipeline units count, absorption rate (2 bullet points max)
4. **Developer Landscape** - Top 3 developers with one flagship each (3 bullet points max)
5. **Investment Metrics** - Rental yield % and capital appreciation % (2 bullet points max)
6. **Pros** - 3 key advantages (one line each)
7. **Cons** - 3 key risks (one line each)
8. **Investment Rating** - Score out of 10 with one-line justification

CRITICAL: Keep every section SHORT. Max 2-3 bullet points. One line per bullet. No paragraphs. Numbers over words.`;

    // Call Lovable AI Gateway using shared utility — flash model for speed
    let fullAnalysis: string;
    try {
      fullAnalysis = await callLovableAI({
        systemPrompt,
        userPrompt,
        model: "google/gemini-2.5-flash",
        maxTokens: 800,
        temperature: 0.4,
      });
    } catch (aiError) {
      console.error("AI error:", aiError);
      return new Response(
        JSON.stringify({ success: false, error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse sections from the analysis
    const sections = {
      areaOverview: extractSection(fullAnalysis, "Area Overview"),
      priceAnalysis: extractSection(fullAnalysis, "Price Analysis"),
      developerLandscape: extractSection(fullAnalysis, "Developer Landscape"),
      transactionData: extractSection(fullAnalysis, "Transaction Data"),
      investmentMetrics: extractSection(fullAnalysis, "Investment Metrics"),
      marketTiming: extractSection(fullAnalysis, "Market Timing"),
      riskFactors: extractSection(fullAnalysis, "Risk Factors"),
      recommendation: extractSection(fullAnalysis, "Recommendation"),
      comparison: sanitizedCompareWith.length > 0 ? extractSection(fullAnalysis, "Comparison") : null,
    };

    const responseTimeMs = Date.now() - startTime;
    console.log(`Analysis complete for: ${area} (${responseTimeMs}ms)`);

    const result = {
      success: true,
      area,
      propertyType,
      fullAnalysis,
      sections,
      sources: ["Dubai Land Department", "DXB Interact", "RERA", "Property Finder"],
      generatedAt: new Date().toISOString(),
      disclaimer: "This analysis is AI-generated for informational purposes only and should not be considered financial advice. Data is based on publicly available market knowledge. Always conduct your own due diligence before making investment decisions.",
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("AI Property Analyzer error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to extract sections from markdown (best-effort parsing)
function extractSection(text: string, sectionName: string): string {
  const patterns = [
    // Match **Section Name:** or **Section Name**
    new RegExp(`\\*\\*${sectionName}[:\\s]*\\*\\*([\\s\\S]*?)(?=\\*\\*\\d+\\.|\\*\\*[A-Z]|$)`, 'i'),
    // Match ## Section Name
    new RegExp(`##\\s*${sectionName}[:\\s]*([\\s\\S]*?)(?=##|$)`, 'i'),
    // Match numbered sections like "1. Section Name:"
    new RegExp(`\\d+\\.\\s*\\*\\*${sectionName}[:\\s]*\\*\\*([\\s\\S]*?)(?=\\d+\\.|\\*\\*|$)`, 'i'),
    // Fallback: just section name followed by content
    new RegExp(`${sectionName}[:\\s]*\\n([\\s\\S]*?)(?=\\n\\d+\\.|\\*\\*|##|$)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Return empty string - UI handles "Not available" display
  return "";
}
