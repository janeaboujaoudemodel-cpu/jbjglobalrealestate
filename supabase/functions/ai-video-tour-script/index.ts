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
    const { 
      propertyName, 
      propertyType, 
      features, 
      location, 
      price,
      targetAudience,
      videoLength 
    } = await req.json();

    if (!propertyName) {
      return errorResponse(corsHeaders, "Property name is required", 400);
    }

    const systemPrompt = `You are an expert luxury real estate video tour scriptwriter.
Create engaging, professional narration scripts for property video tours.
Focus on storytelling that appeals to affluent buyers in the UAE market.
Company: JBJ Global Real Estate | Contact: ${APPROVED_CONTACT.phone}`;

    const userPrompt = `Create a video tour script for this property:

**Property Details:**
- Name: ${sanitizeForPrompt(propertyName)}
- Type: ${sanitizeForPrompt(propertyType || "Luxury property")}
- Location: ${sanitizeForPrompt(location || "Dubai")}
- Price: ${sanitizeForPrompt(price?.toString() || "Price on request")} AED
- Key Features: ${sanitizeForPrompt(features?.join(", ") || "Luxury finishes")}
- Target Audience: ${sanitizeForPrompt(targetAudience || "Affluent investors")}
- Video Length: ${sanitizeForPrompt(videoLength?.toString() || "2-3")} minutes

Please create:

## 🎬 VIDEO TOUR SCRIPT

### OPENING (15-20 seconds)
[Hook to capture attention]
- Opening line
- Property introduction
- Location context

### EXTERIOR & APPROACH (20-30 seconds)
[Building the arrival experience]
- Approach description
- Architectural highlights
- First impressions

### LIVING SPACES (40-60 seconds)
[Main living areas tour]
- Living room narration
- Dining area highlights
- Kitchen features
- Flow and layout commentary

### BEDROOMS & PRIVATE SPACES (30-45 seconds)
[Private quarters tour]
- Master suite description
- Additional bedrooms
- Bathrooms highlights

### VIEWS & OUTDOOR SPACES (20-30 seconds)
[Balconies, terraces, views]
- View description
- Outdoor living potential
- Lifestyle imagery

### AMENITIES & BUILDING (20-30 seconds)
[Building features]
- Key amenities
- Community benefits
- Security and services

### CLOSING (15-20 seconds)
[Call to action]
- Summary of key selling points
- Lifestyle promise
- Contact information: JBJ Global Real Estate at ${APPROVED_CONTACT.phone}

---

## 📝 SHOT SUGGESTIONS
[Brief notes for videographer on key shots to capture]

## 🎵 MUSIC RECOMMENDATIONS
[Suggested mood/tempo for background music]

## ✨ KEY PHRASES TO EMPHASIZE
[Most impactful lines for voiceover emphasis]

Write in a professional, aspirational tone suitable for luxury real estate marketing.`;

    console.log("Generating video tour script:", { propertyName });

    const aiResponse = await callLovableAI({
      systemPrompt,
      userPrompt,
      model: "google/gemini-2.5-flash",
    });

    if (!aiResponse.success) {
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    return successResponse(corsHeaders, {
      script: aiResponse.content,
      propertyName,
      estimatedLength: videoLength || "2-3 minutes",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Video tour script error:", error);
    return errorResponse(corsHeaders, "Failed to generate video tour script", 500);
  }
});
