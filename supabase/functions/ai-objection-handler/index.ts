import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getCorsHeaders,
  callLovableAI,
  sanitizeForPrompt,
  APPROVED_CONTACT,
  errorResponse,
  successResponse,
} from "../_shared/ai-utils.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { objection, context, propertyType, leadProfile } = await req.json();

    if (!objection) {
      return errorResponse(corsHeaders, "Objection text is required", 400);
    }

    const systemPrompt = `You are an expert real estate sales specialist for JBJ Global Real Estate, a luxury Dubai brokerage.
Provide professional, empathetic responses to buyer objections.
Focus on understanding concerns and providing value-based solutions.
Never be pushy or dismissive. Build trust through knowledge and patience.
Company contact: ${APPROVED_CONTACT.phone} | ${APPROVED_CONTACT.email}`;

    const userPrompt = `Help me respond to this buyer objection:

**Objection:** "${sanitizeForPrompt(objection)}"

**Context:**
- Property Type: ${sanitizeForPrompt(propertyType || "Luxury property")}
- Lead Profile: ${sanitizeForPrompt(leadProfile || "Potential buyer")}
- Conversation Context: ${sanitizeForPrompt(context || "Initial inquiry")}

Please provide:

1. **Objection Analysis:**
   - Type of objection (price, timing, trust, value, competition)
   - Underlying concern
   - Emotional state assessment

2. **Recommended Response:**
   - Opening acknowledgment (show empathy)
   - Main response (address the core concern)
   - Supporting evidence or examples
   - Transition question (move conversation forward)

3. **Alternative Responses:**
   - Soft approach (for hesitant leads)
   - Direct approach (for decisive leads)

4. **Key Points to Emphasize:**
   - Value propositions
   - Differentiators
   - Risk mitigation

5. **Questions to Ask:**
   - Clarifying questions
   - Discovery questions

6. **What to Avoid:**
   - Common mistakes
   - Phrases to not use

7. **Follow-up Strategy:**
   - If they remain hesitant
   - Timeline for next contact

Format responses in a way that can be easily adapted for WhatsApp, email, or phone conversations.`;

    console.log("Processing objection handling:", { objectionPreview: objection.substring(0, 50) });

    const aiResponse = await callLovableAI({
      systemPrompt,
      userPrompt,
      model: "google/gemini-2.5-flash",
    });

    if (!aiResponse.success) {
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    return successResponse(corsHeaders, {
      response: aiResponse.content,
      objectionType: "analyzed",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Objection handler error:", error);
    return errorResponse(corsHeaders, "Failed to generate objection response", 500);
  }
});
