import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalysisRequest {
  area: string;
  propertyType?: string;
  analysisType?: 'full' | 'quick' | 'comparison';
  compareWith?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, propertyType = 'apartment', analysisType = 'full', compareWith = [] } = await req.json() as AnalysisRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!area) {
      throw new Error("Area is required for analysis");
    }

    const systemPrompt = `You are an expert UAE real estate market analyst with deep knowledge of Dubai Land Department data, DXB Interact, Property Finder, Property Monitor, Bayut, and official government statistics. 

Your analysis MUST be:
1. Data-driven and accurate
2. Based on real market patterns
3. Include specific price ranges per square foot
4. List competitor developers in the area
5. Provide ROI projections based on historical data
6. Include rent vs sale comparisons
7. Give timing recommendations (when to buy/sell)
8. Reference official sources

IMPORTANT: Always cite sources for your data claims. Use realistic Dubai market figures.`;

    const userPrompt = `Provide a comprehensive ${analysisType} analysis for "${area}" in Dubai focusing on ${propertyType} properties.

Include the following sections in your analysis:

## 1. AREA OVERVIEW
- Location description and connectivity
- Key landmarks and infrastructure
- Demographics and lifestyle

## 2. PRICE ANALYSIS
- Current average price per square foot (in AED)
- Price trend (last 12 months)
- Comparison with Dubai average
- Price range by property size

## 3. DEVELOPER LANDSCAPE
List ALL developers active in ${area}:
- Developer name
- Notable projects
- Price per sqft for each developer
- Why some are cheaper/expensive
- Developer reputation score (1-5)

## 4. TRANSACTION DATA
Based on Dubai Land Department records:
- Number of transactions (last 6 months)
- Average transaction value
- Most active property types
- Cash vs mortgage ratio

## 5. INVESTMENT METRICS
- Expected ROI (capital appreciation)
- Rental yield percentage
- Average rental price per sqft
- Occupancy rates
- Best unit types for investment

## 6. MARKET TIMING
- When is the best time to buy?
- When should investors sell?
- Upcoming factors affecting prices
- Off-plan vs ready comparison

## 7. RISK FACTORS
- Market oversupply concerns
- Infrastructure dependencies
- Competition from nearby areas

## 8. RECOMMENDATION
- Overall investment rating (1-10)
- Best buyer profile for this area
- Alternative areas to consider

${compareWith.length > 0 ? `
## 9. COMPARISON WITH OTHER AREAS
Compare ${area} with: ${compareWith.join(', ')}
- Price differences
- ROI differences
- Lifestyle differences
- Which is better for investment vs end-use
` : ''}

Format your response as a detailed, professional market report. Include specific numbers and percentages wherever possible.

Sources to reference: Dubai Land Department, DXB Interact, Property Finder, Property Monitor, Bayut, RERA`;

    console.log("Analyzing area:", area);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "";

    // Parse the analysis into structured sections
    const sections = {
      areaOverview: extractSection(analysis, "AREA OVERVIEW", "PRICE ANALYSIS"),
      priceAnalysis: extractSection(analysis, "PRICE ANALYSIS", "DEVELOPER LANDSCAPE"),
      developerLandscape: extractSection(analysis, "DEVELOPER LANDSCAPE", "TRANSACTION DATA"),
      transactionData: extractSection(analysis, "TRANSACTION DATA", "INVESTMENT METRICS"),
      investmentMetrics: extractSection(analysis, "INVESTMENT METRICS", "MARKET TIMING"),
      marketTiming: extractSection(analysis, "MARKET TIMING", "RISK FACTORS"),
      riskFactors: extractSection(analysis, "RISK FACTORS", "RECOMMENDATION"),
      recommendation: extractSection(analysis, "RECOMMENDATION", "COMPARISON"),
      comparison: compareWith.length > 0 ? extractSection(analysis, "COMPARISON", null) : null,
    };

    return new Response(
      JSON.stringify({
        success: true,
        area,
        propertyType,
        analysisType,
        fullAnalysis: analysis,
        sections,
        sources: [
          "Dubai Land Department",
          "DXB Interact",
          "Property Finder",
          "Property Monitor",
          "Bayut",
          "RERA"
        ],
        generatedAt: new Date().toISOString(),
        disclaimer: "This analysis is for informational purposes only and does not constitute investment advice. Data is based on publicly available market information and AI-generated insights. Always verify with official sources and consult licensed professionals before making investment decisions."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Property analysis error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to analyze property market"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractSection(text: string, startMarker: string, endMarker: string | null): string {
  const startRegex = new RegExp(`##\\s*\\d*\\.?\\s*${startMarker}`, 'i');
  const startMatch = text.match(startRegex);
  
  if (!startMatch) return "";
  
  const startIndex = startMatch.index! + startMatch[0].length;
  
  if (endMarker) {
    const endRegex = new RegExp(`##\\s*\\d*\\.?\\s*${endMarker}`, 'i');
    const endMatch = text.slice(startIndex).match(endRegex);
    
    if (endMatch) {
      return text.slice(startIndex, startIndex + endMatch.index!).trim();
    }
  }
  
  return text.slice(startIndex).trim();
}
