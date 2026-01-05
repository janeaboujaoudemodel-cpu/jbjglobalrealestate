import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, propertyType, propertyName, unitPreference } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!images || !Array.isArray(images) || images.length < 1) {
      return new Response(
        JSON.stringify({ error: "At least 1 image is required for measurement" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${images.length} images for property measurement`);
    console.log(`Property type: ${propertyType}, Name: ${propertyName || 'Unnamed'}`);

    // Build the content array with images
    const content: any[] = [
      {
        type: "text",
        text: `You are an expert AI property measurement system with advanced computer vision capabilities. Analyze these property photos to estimate room dimensions and total property size.

PROPERTY DETAILS:
- Type: ${propertyType || 'Unknown'}
- Name: ${propertyName || 'Unnamed Property'}
- Unit preference: ${unitPreference || 'both'}

ANALYSIS INSTRUCTIONS:
1. Examine each photo carefully to identify different rooms/spaces
2. Look for visual cues: doors (standard ~7ft/2.1m height), windows, furniture, tiles, fixtures
3. Use perspective and spatial relationships to estimate dimensions
4. Identify room types: living room, bedroom, bathroom, kitchen, balcony, corridor, etc.
5. Estimate each room's approximate area in square feet

IMPORTANT CALIBRATION REFERENCES:
- Standard door height: 6.8-7 feet (2.0-2.1 meters)
- Standard door width: 2.5-3 feet (0.76-0.9 meters)
- Standard ceiling height: 9-10 feet (2.7-3 meters)
- Standard floor tiles: 2x2 feet or 60x60 cm
- Standard bathtub: 5 feet long (1.5 meters)
- Standard kitchen counter height: 3 feet (0.9 meters)

RESPONSE FORMAT:
Respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "totalArea": <number in sq ft>,
  "rooms": [
    { "name": "<room name>", "area": <number in sq ft>, "dimensions": "<length x width estimate>" }
  ],
  "confidence": "<high|medium|low>",
  "notes": "<any important observations about the measurement accuracy>"
}

Be realistic and conservative with estimates. If you cannot determine a room's size, make your best educated guess based on typical ${propertyType || 'residential'} properties in Dubai/UAE.`
      }
    ];

    // Add images to the content
    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      // Check if it's already a data URL or needs formatting
      const imageUrl = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
      
      content.push({
        type: "image_url",
        image_url: {
          url: imageUrl
        }
      });
    }

    console.log("Calling Lovable AI for image analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    const aiResponse = data.choices?.[0]?.message?.content;
    if (!aiResponse) {
      throw new Error("No response from AI model");
    }

    console.log("Raw AI response:", aiResponse);

    // Parse the JSON response
    let measurementResult;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith("```")) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();
      
      measurementResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Response was:", aiResponse);
      throw new Error("Failed to parse measurement results");
    }

    // Validate the response structure
    if (!measurementResult.totalArea || !Array.isArray(measurementResult.rooms)) {
      throw new Error("Invalid measurement result structure");
    }

    console.log("Measurement complete:", measurementResult);

    return new Response(
      JSON.stringify({
        success: true,
        result: {
          totalArea: measurementResult.totalArea,
          rooms: measurementResult.rooms,
          unit: unitPreference || "both",
          confidence: measurementResult.confidence || "medium",
          notes: measurementResult.notes || "",
          propertyType,
          propertyName,
          analyzedImages: images.length,
          timestamp: new Date().toISOString(),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in property-measurement function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
