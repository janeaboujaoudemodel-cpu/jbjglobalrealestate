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
    const { transcript, meetingType, participants, propertyDiscussed } = await req.json();

    if (!transcript) {
      return errorResponse(corsHeaders, "Meeting transcript is required", 400);
    }

    const systemPrompt = `You are an expert real estate meeting analyst.
Summarize client meetings with actionable insights and follow-up items.
Focus on extracting key buyer signals, objections, and next steps.
Be thorough but concise in your summaries.`;

    const userPrompt = `Summarize this real estate client meeting:

**Meeting Details:**
- Type: ${sanitizeForPrompt(meetingType || "Client consultation")}
- Participants: ${sanitizeForPrompt(participants || "Agent and client")}
- Property Discussed: ${sanitizeForPrompt(propertyDiscussed || "General inquiry")}

**Transcript/Notes:**
${sanitizeForPrompt(transcript, 4000)}

Please provide:

## 📋 MEETING SUMMARY
- Brief overview (2-3 sentences)
- Meeting outcome assessment

## 👤 CLIENT PROFILE
- Key preferences mentioned
- Budget indications
- Timeline signals
- Decision-making factors

## ❤️ POSITIVE SIGNALS
- Features/properties they liked
- Positive feedback given
- Buying intent indicators

## ⚠️ CONCERNS RAISED
- Objections or hesitations
- Questions asked
- Comparison mentions

## 🎯 KEY DISCUSSION POINTS
1. Main topic discussed
2. Secondary topics
3. Off-topic but relevant items

## ✅ ACTION ITEMS
**For Agent:**
- [ ] Immediate actions needed
- [ ] Follow-up tasks

**For Client:**
- [ ] Items they need to do/decide

## 📅 NEXT STEPS
- Recommended follow-up timing
- Suggested next meeting topic
- Materials to prepare/send

## 💡 STRATEGIC INSIGHTS
- How to move this lead forward
- Potential upsell opportunities
- Risk of losing this lead

## 📊 LEAD TEMPERATURE
Rate: 🔥 HOT / 🟡 WARM / 🔵 COOL
Explanation: Why this rating

Format with clear sections for easy scanning.`;

    console.log("Processing meeting summary:", { meetingType });

    const aiResponse = await callLovableAI({
      systemPrompt,
      userPrompt,
      model: "google/gemini-2.5-flash",
    });

    if (!aiResponse.success) {
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    return successResponse(corsHeaders, {
      summary: aiResponse.content,
      meetingType: meetingType || "Client consultation",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Meeting summarizer error:", error);
    return errorResponse(corsHeaders, "Failed to summarize meeting", 500);
  }
});
