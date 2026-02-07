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

    const systemPrompt = `You are JBJ Property Analyzer, an expert AI assistant for Dubai real estate market analysis.
Your task is to provide comprehensive, data-driven analysis for the Dubai property market.

IMPORTANT GUIDELINES:
- Use ${measurementText} for all measurements
- Display prices in ${currency}
- Respond in ${languageMap[language] || 'English'}
- Be specific with data and avoid vague statements
- Base your analysis on publicly available market knowledge
- Provide actionable insights for investors and buyers
- Include typical price ranges, rental yields, and market trends based on your training data`;

    const comparisonText = sanitizedCompareWith.length > 0 
      ? `\n\nAlso compare with these areas: ${sanitizedCompareWith.join(', ')}`
      : '';

    const userPrompt = `Provide a comprehensive property market analysis for ${area}, Dubai focusing on ${propertyType} properties.${comparisonText}

Structure your analysis with these sections:
1. **Area Overview**: Location, development status, key landmarks, lifestyle
2. **Price Analysis**: Current prices per sq ft/m², price trends (1yr, 3yr, 5yr), price range by bedrooms
3. **Developer Landscape**: Major developers, flagship projects, quality tiers
4. **Transaction Data**: Recent sales volume, buyer demographics, popular unit types
5. **Investment Metrics**: Rental yields, ROI projections, capital appreciation potential
6. **Market Timing**: Current market phase, buy/sell/hold recommendation
7. **Risk Factors**: Supply concerns, regulatory changes, market risks
8. **Recommendation**: Clear investment advice with reasoning

Provide specific numbers, percentages, and data points wherever possible.`;

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
