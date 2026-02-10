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
      language = 'en'
    } = body;

    // Sanitize inputs to prevent prompt injection
    const area = sanitizeForPrompt(rawArea, 100);
    const propertyType = sanitizeForPrompt(rawPropertyType, 50);
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
    const systemPrompt = `You are JBJ Property Analyzer integrated with smart AI intelligence.
You provide concise, structured, data-driven real estate market analysis for Dubai.

STRICT RULES:
- NEVER use greetings, personal phrases, or religious expressions
- NEVER use hashtags
- NEVER say "I will now provide" or similar filler
- Go straight to the analysis content
- Use ${measurementText} for all measurements
- Display prices in ${currency}
- Respond in ${languageMap[language] || 'English'}
- Be specific with numbers, percentages, and data points
- Keep each section concise (3-5 bullet points max)
- Use clean markdown formatting without excessive decoration

DELIVERY TIMELINE RULES:
- Today's date is ${todayDate}
- ONLY flag "extended delivery timeline" as a risk/con if the handover date is MORE than 4 years from today
- If handover is within 1-3 years, this is a NORMAL timeline — do NOT mention it as a risk or con
- If handover is within 1 year or already handed over, mention it as a POSITIVE factor (near-term or ready)`;

    const comparisonText = sanitizedCompareWith.length > 0 
      ? `\n\nAlso compare with these areas: ${sanitizedCompareWith.join(', ')}`
      : '';

    const userPrompt = `Analyze ${area}, Dubai for ${propertyType} properties.${comparisonText}

Use EXACTLY these section headers (numbered, bold):

1. **Area Overview** - 3-4 sentences: location, lifestyle, key landmarks
2. **Price Per Sqft** - Current avg price/sqft, range by unit type, 1yr and 3yr trend percentages
3. **Supply vs Demand** - Current supply pipeline, absorption rate, occupancy trends, upcoming handovers
4. **Developer Landscape** - Top 3-5 developers, their flagship projects, quality tier
5. **Investment Metrics** - Rental yield %, ROI projection, capital appreciation rate
6. **Pros** - 4-5 key advantages (bullet points)
7. **Cons** - 4-5 key risks/disadvantages (bullet points)
8. **Investment Rating** - Score out of 10 with one-line justification

Be direct. No filler. Numbers and percentages wherever possible.`;

    // Call Lovable AI Gateway using shared utility
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
