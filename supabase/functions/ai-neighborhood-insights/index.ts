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
    const { neighborhood, priorities, lifestyle } = await req.json();

    if (!neighborhood) {
      return errorResponse(corsHeaders, "Neighborhood is required", 400);
    }

    const systemPrompt = `You are an expert Dubai neighborhood analyst AI.
Provide comprehensive area insights for property buyers and investors.
Focus on accurate, helpful information about Dubai communities.
Include practical details that matter to residents and investors.`;

    const userPrompt = `Provide comprehensive insights for this Dubai neighborhood:

**Neighborhood:** ${sanitizeForPrompt(neighborhood)}
**User Priorities:** ${sanitizeForPrompt(priorities || "General information")}
**Lifestyle:** ${sanitizeForPrompt(lifestyle || "Not specified")}

Please provide detailed analysis including:

1. **Livability Score** (1-10) with breakdown:
   - Safety & Security
   - Cleanliness & Maintenance
   - Community Feel
   - Noise Levels

2. **Amenities & Facilities:**
   - Schools (nearby options with ratings)
   - Healthcare (hospitals, clinics)
   - Shopping (malls, supermarkets)
   - Dining & Entertainment
   - Fitness & Recreation

3. **Transportation & Connectivity:**
   - Metro/Tram access
   - Major roads and highways
   - Commute times to key areas (Downtown, Marina, Airport)
   - Parking availability

4. **Demographics & Community:**
   - Typical resident profile
   - Expat communities
   - Family-friendliness
   - Pet-friendliness

5. **Investment Perspective:**
   - Rental demand level
   - Capital appreciation trend
   - New developments nearby
   - Future infrastructure projects

6. **Pros & Cons Summary**

7. **Best Suited For:** (e.g., families, young professionals, investors)

Format with clear headers and bullet points.`;

    console.log("Processing neighborhood insights:", { neighborhood });

    const aiResponse = await callLovableAI({
      systemPrompt,
      userPrompt,
      model: "google/gemini-2.5-flash",
    });

    if (!aiResponse.success) {
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    return successResponse(corsHeaders, {
      insights: aiResponse.content,
      neighborhood,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Neighborhood insights error:", error);
    return errorResponse(corsHeaders, "Failed to generate neighborhood insights", 500);
  }
});
