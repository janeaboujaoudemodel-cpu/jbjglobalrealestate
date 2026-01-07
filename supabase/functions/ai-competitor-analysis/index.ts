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
    const { projectName, location, developer, competitors } = await req.json();

    if (!projectName) {
      return errorResponse(corsHeaders, "Project name is required", 400);
    }

    const systemPrompt = `You are an expert real estate competitive intelligence analyst for the Dubai market.
Provide objective, data-driven analysis of project positioning and competition.
Focus on actionable insights for sales and marketing teams.`;

    const userPrompt = `Analyze competitive positioning for this project:

**Subject Project:**
- Project Name: ${sanitizeForPrompt(projectName)}
- Location: ${sanitizeForPrompt(location || "Dubai")}
- Developer: ${sanitizeForPrompt(developer || "Not specified")}

**Known Competitors:** ${sanitizeForPrompt(competitors?.join(", ") || "Identify main competitors")}

Please provide comprehensive analysis:

## 🎯 COMPETITIVE LANDSCAPE
- Direct competitors in the area
- Indirect competitors (similar price/type elsewhere)
- Market positioning map

## 💲 PRICING COMPARISON
- Price per sqft comparison
- Payment plan analysis
- Value proposition ranking

## 🏗️ PRODUCT COMPARISON
- Unit mix comparison
- Amenities comparison
- Quality and finishes assessment
- Unique selling points

## 📍 LOCATION ANALYSIS
- Proximity advantages/disadvantages
- Future development impact
- Accessibility comparison

## 🏆 DEVELOPER COMPARISON
- Track record comparison
- Brand perception
- After-sales reputation
- Handover history

## 📊 SWOT ANALYSIS
**Strengths:**
- Key advantages vs competition

**Weaknesses:**
- Areas where competitors excel

**Opportunities:**
- Market gaps to exploit

**Threats:**
- Competitive risks

## 💡 RECOMMENDATIONS
- Key selling points to emphasize
- Objection handling for competitor mentions
- Target buyer differentiation
- Marketing positioning suggestions

## 📈 COMPETITIVE ADVANTAGE SCORE
Rate this project vs competitors (1-10) with explanation.

Format with clear sections and bullet points.`;

    console.log("Processing competitor analysis:", { projectName });

    const aiResponse = await callLovableAI({
      systemPrompt,
      userPrompt,
      model: "google/gemini-2.5-flash",
    });

    if (!aiResponse.success) {
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    return successResponse(corsHeaders, {
      analysis: aiResponse.content,
      projectName,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Competitor analysis error:", error);
    return errorResponse(corsHeaders, "Failed to generate competitor analysis", 500);
  }
});
