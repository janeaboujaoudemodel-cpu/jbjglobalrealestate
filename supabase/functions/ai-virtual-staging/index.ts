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
    const { roomType, style, currentDescription, propertyType } = await req.json();

    if (!roomType || !style) {
      return errorResponse(corsHeaders, "Room type and style are required", 400);
    }

    const systemPrompt = `You are an expert virtual staging AI consultant for luxury real estate in Dubai and the UAE.
Your role is to provide detailed virtual staging recommendations and descriptions.
Always be professional, specific, and focused on high-end aesthetics.
Provide actionable staging suggestions that enhance property appeal.`;

    const userPrompt = `Create a comprehensive virtual staging plan for this property:

Room Type: ${sanitizeForPrompt(roomType)}
Desired Style: ${sanitizeForPrompt(style)}
Property Type: ${sanitizeForPrompt(propertyType || "Luxury Apartment")}
Current State: ${sanitizeForPrompt(currentDescription || "Empty/Unfurnished")}

Please provide:
1. **Furniture Layout** - Key pieces and placement recommendations
2. **Color Palette** - Primary and accent colors for the space
3. **Lighting Design** - Natural and artificial lighting suggestions
4. **Décor Elements** - Art, accessories, and finishing touches
5. **Luxury Touches** - High-end details that appeal to UAE buyers
6. **Photography Tips** - Best angles and staging for photos
7. **Estimated Impact** - How this staging affects perceived value

Format your response in clear sections with markdown.`;

    console.log("Processing virtual staging request:", { roomType, style });

    const aiResponse = await callLovableAI({
      systemPrompt,
      userPrompt,
      model: "google/gemini-2.5-flash",
    });

    if (!aiResponse.success) {
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    return successResponse(corsHeaders, {
      staging: aiResponse.content,
      roomType,
      style,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Virtual staging error:", error);
    return errorResponse(corsHeaders, "Failed to generate staging recommendations", 500);
  }
});
