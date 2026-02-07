import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const body: AnalysisRequest = await req.json();
    const { 
      area, 
      propertyType, 
      analysisType = 'full', 
      compareWith = [], 
      measurementUnit = 'sqft',
      currency = 'AED',
      language = 'en'
    } = body;

    if (!area) {
      return new Response(
        JSON.stringify({ success: false, error: "Area is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing property market: ${area}, ${propertyType}, ${analysisType}`);

    // Build the analysis prompt
    const systemPrompt = `You are JBJ Property Analyzer, an expert AI assistant for Dubai real estate market analysis.
Your task is to provide comprehensive, data-driven analysis for the Dubai property market.

IMPORTANT GUIDELINES:
- Use ${measurementUnit === 'both' ? 'both sq ft and m²' : measurementUnit === 'sqm' ? 'square meters (m²)' : 'square feet (sq ft)'} for all measurements
- Display prices in ${currency}
- Respond in ${language === 'ar' ? 'Arabic' : language === 'ru' ? 'Russian' : language === 'zh' ? 'Chinese' : language === 'hi' ? 'Hindi' : 'English'}
- Be specific with data and avoid vague statements
- Reference Dubai Land Department, RERA, and DXB Interact as data sources
- Provide actionable insights for investors and buyers`;

    const comparisonText = compareWith.length > 0 
      ? `\n\nAlso compare with these areas: ${compareWith.join(', ')}`
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

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const fullAnalysis = aiData.choices?.[0]?.message?.content || "";

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
      comparison: compareWith.length > 0 ? extractSection(fullAnalysis, "Comparison") : null,
    };

    const result = {
      success: true,
      area,
      propertyType,
      fullAnalysis,
      sections,
      sources: ["Dubai Land Department", "DXB Interact", "RERA", "Property Finder"],
      generatedAt: new Date().toISOString(),
      disclaimer: "This analysis is for informational purposes only and should not be considered financial advice. Always conduct your own due diligence before making investment decisions.",
    };

    console.log("Analysis complete for:", area);

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

// Helper function to extract sections from markdown
function extractSection(text: string, sectionName: string): string {
  const patterns = [
    new RegExp(`\\*\\*${sectionName}[:\\s]*\\*\\*([\\s\\S]*?)(?=\\*\\*[A-Z]|$)`, 'i'),
    new RegExp(`##\\s*${sectionName}[:\\s]*([\\s\\S]*?)(?=##|$)`, 'i'),
    new RegExp(`${sectionName}[:\\s]*\\n([\\s\\S]*?)(?=\\n\\d+\\.|\\*\\*|$)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return "";
}
