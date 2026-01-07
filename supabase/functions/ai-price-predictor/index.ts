import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getCorsHeaders,
  callLovableAI,
  sanitizeForPrompt,
  errorResponse,
  successResponse,
} from "../_shared/ai-utils.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      location, 
      propertyType, 
      bedrooms, 
      size, 
      currentPrice, 
      developer, 
      completionYear 
    } = await req.json();

    if (!location || !propertyType) {
      return errorResponse(corsHeaders, "Location and property type are required", 400);
    }

    const systemPrompt = `You are an expert Dubai real estate market analyst AI.
Provide data-driven price predictions and market insights.
Base analysis on current UAE market trends, area developments, and historical data.
Always include disclaimers that this is for informational purposes only.
Never provide specific financial or investment advice.`;

    const userPrompt = `Analyze this Dubai property and provide price predictions:

**Property Details:**
- Location/Area: ${sanitizeForPrompt(location)}
- Property Type: ${sanitizeForPrompt(propertyType)}
- Bedrooms: ${sanitizeForPrompt(bedrooms?.toString() || "N/A")}
- Size: ${sanitizeForPrompt(size?.toString() || "N/A")} sq.ft
- Current Price: ${sanitizeForPrompt(currentPrice?.toString() || "N/A")} AED
- Developer: ${sanitizeForPrompt(developer || "N/A")}
- Completion Year: ${sanitizeForPrompt(completionYear?.toString() || "N/A")}

Please provide:
1. **Current Market Position** - How this property compares to similar listings
2. **12-Month Forecast** - Expected price trajectory with confidence level
3. **3-Year Outlook** - Medium-term value projection
4. **Key Value Drivers** - Factors positively affecting price
5. **Risk Factors** - Potential challenges or concerns
6. **Area Development Impact** - Infrastructure and development effects
7. **Comparable Analysis** - Brief comparison with similar properties
8. **Investment Score** - Rate 1-10 with explanation

⚠️ IMPORTANT: Include a disclaimer that these are AI-generated estimates for informational purposes only and should not be considered financial advice.`;

    console.log("Processing price prediction:", { location, propertyType });

    const aiResponse = await callLovableAI({
      systemPrompt,
      userPrompt,
      model: "google/gemini-2.5-flash",
    });

    if (!aiResponse.success) {
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    return successResponse(corsHeaders, {
      prediction: aiResponse.content,
      propertyDetails: { location, propertyType, bedrooms, size },
      generatedAt: new Date().toISOString(),
      disclaimer: "This is an AI-generated estimate for informational purposes only. Not financial or investment advice.",
    });
  } catch (error) {
    console.error("Price prediction error:", error);
    return errorResponse(corsHeaders, "Failed to generate price prediction", 500);
  }
});
