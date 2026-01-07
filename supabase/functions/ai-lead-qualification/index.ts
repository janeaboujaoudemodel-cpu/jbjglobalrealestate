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
      leadData, 
      activities, 
      interactions,
      propertyInterests 
    } = await req.json();

    if (!leadData) {
      return errorResponse(corsHeaders, "Lead data is required", 400);
    }

    const systemPrompt = `You are an expert real estate lead qualification AI for a luxury Dubai brokerage.
Analyze leads and provide actionable qualification scores and recommendations.
Focus on identifying high-intent buyers and prioritizing sales efforts.
Be direct and practical in your recommendations.`;

    const userPrompt = `Qualify this lead and provide scoring:

**Lead Information:**
- Name: ${sanitizeForPrompt(leadData.name || "Not provided")}
- Source: ${sanitizeForPrompt(leadData.source || "Website")}
- Budget Range: ${sanitizeForPrompt(leadData.budget || "Not specified")}
- Location Interest: ${sanitizeForPrompt(leadData.location || "Dubai")}
- Property Type: ${sanitizeForPrompt(leadData.propertyType || "Not specified")}
- Timeline: ${sanitizeForPrompt(leadData.timeline || "Not specified")}
- Current Location: ${sanitizeForPrompt(leadData.currentLocation || "Not specified")}

**Engagement History:**
- Activities: ${sanitizeForPrompt(JSON.stringify(activities || []))}
- Interactions: ${sanitizeForPrompt(JSON.stringify(interactions || []))}
- Property Views: ${sanitizeForPrompt(JSON.stringify(propertyInterests || []))}

Please provide:

1. **Lead Score** (0-100) with confidence level

2. **Qualification Tier:**
   - 🔥 HOT (80-100): Ready to buy, immediate action
   - 🟡 WARM (50-79): Interested, needs nurturing
   - 🔵 COLD (20-49): Early stage, long-term follow-up
   - ⚪ UNQUALIFIED (<20): Low priority

3. **Buying Intent Signals:**
   - Positive indicators detected
   - Concern signals

4. **Recommended Actions:**
   - Immediate next step
   - Best contact method
   - Key talking points

5. **Property Matching:**
   - Suggested property types
   - Price range recommendation

6. **Follow-up Strategy:**
   - Timing recommendation
   - Communication frequency
   - Content to share

Return as structured JSON with these fields:
{
  "score": number,
  "tier": string,
  "confidence": string,
  "intentSignals": { "positive": [], "concerns": [] },
  "actions": [],
  "propertyMatch": {},
  "followUp": {},
  "summary": string
}`;

    console.log("Processing lead qualification");

    const aiResponse = await callLovableAI({
      systemPrompt,
      userPrompt,
      model: "google/gemini-2.5-flash",
    });

    if (!aiResponse.success) {
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    // Try to parse JSON response
    let qualification;
    try {
      const jsonMatch = aiResponse.content?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        qualification = JSON.parse(jsonMatch[0]);
      } else {
        qualification = { analysis: aiResponse.content };
      }
    } catch {
      qualification = { analysis: aiResponse.content };
    }

    return successResponse(corsHeaders, {
      qualification,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Lead qualification error:", error);
    return errorResponse(corsHeaders, "Failed to qualify lead", 500);
  }
});
