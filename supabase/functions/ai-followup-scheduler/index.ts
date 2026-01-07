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
      leadInfo, 
      lastContact, 
      leadScore, 
      previousFollowups,
      timezone 
    } = await req.json();

    if (!leadInfo) {
      return errorResponse(corsHeaders, "Lead information is required", 400);
    }

    const systemPrompt = `You are an expert sales follow-up strategist for luxury real estate.
Optimize follow-up timing and messaging for maximum conversion.
Consider cultural factors, time zones, and buyer psychology.
Provide specific, actionable scheduling recommendations.`;

    const userPrompt = `Plan optimal follow-up schedule for this lead:

**Lead Details:**
- Name: ${sanitizeForPrompt(leadInfo.name || "Lead")}
- Lead Score: ${sanitizeForPrompt(leadScore?.toString() || "N/A")}
- Timezone: ${sanitizeForPrompt(timezone || "GST (UAE)")}
- Last Contact: ${sanitizeForPrompt(lastContact || "Not contacted yet")}
- Previous Follow-ups: ${sanitizeForPrompt(JSON.stringify(previousFollowups || []))}
- Preferred Channel: ${sanitizeForPrompt(leadInfo.preferredChannel || "Not specified")}
- Budget: ${sanitizeForPrompt(leadInfo.budget || "Not specified")}
- Interest Level: ${sanitizeForPrompt(leadInfo.interestLevel || "Medium")}

Please provide:

1. **Optimal Next Contact:**
   - Best day and time (specific)
   - Reasoning behind timing

2. **Contact Sequence (7-day plan):**
   - Day 1: Action & channel
   - Day 3: Action & channel
   - Day 5: Action & channel
   - Day 7: Action & channel

3. **Channel Strategy:**
   - Primary channel recommendation
   - Secondary backup channel
   - When to escalate (call vs message)

4. **Message Templates:**
   - Opening message suggestion
   - Follow-up message if no response
   - Re-engagement message

5. **Timing Optimization:**
   - Best days of week for this lead type
   - Optimal time windows
   - Times to avoid

6. **Urgency Triggers:**
   - When to increase frequency
   - Signs to decrease contact

Return as JSON:
{
  "nextContact": { "datetime": string, "channel": string, "reason": string },
  "sequence": [{ "day": number, "action": string, "channel": string, "time": string }],
  "templates": { "opening": string, "followUp": string, "reEngage": string },
  "bestTimes": { "days": [], "hours": [] },
  "urgencyRules": []
}`;

    console.log("Processing follow-up scheduling");

    const aiResponse = await callLovableAI({
      systemPrompt,
      userPrompt,
      model: "google/gemini-2.5-flash",
    });

    if (!aiResponse.success) {
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    let schedule;
    try {
      const jsonMatch = aiResponse.content?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        schedule = JSON.parse(jsonMatch[0]);
      } else {
        schedule = { analysis: aiResponse.content };
      }
    } catch {
      schedule = { analysis: aiResponse.content };
    }

    return successResponse(corsHeaders, {
      schedule,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Follow-up scheduler error:", error);
    return errorResponse(corsHeaders, "Failed to generate follow-up schedule", 500);
  }
});
