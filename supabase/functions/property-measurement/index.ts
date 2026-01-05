import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://jjglobalcapital.com",
  "https://www.jjglobalcapital.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith(".lovableproject.com") || origin.endsWith(".lovable.app")
  );
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, propertyType, propertyName, unitPreference, roomLabels, roomList } = await req.json();
    
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
    console.log(`Rooms: ${roomList || 'Not specified'}`);

    // Build the content array with images and room context
    const roomContext = roomLabels && roomLabels.length > 0 
      ? `The user has labeled these images by room: ${roomLabels.join(', ')}.`
      : '';

    const content: any[] = [
      {
        type: "text",
        text: `You are an expert AI property measurement system with advanced computer vision capabilities. Analyze these property photos to estimate room dimensions and total property size.

PROPERTY DETAILS:
- Type: ${propertyType || 'Unknown'}
- Name: ${propertyName || 'Unnamed Property'}
- Unit preference: ${unitPreference || 'both'}
- Rooms to measure: ${roomList || 'All visible rooms'}
${roomContext}

ANALYSIS INSTRUCTIONS:
1. Examine each photo carefully to identify the specific room/space it shows
2. Look for visual cues: doors (standard ~7ft/2.1m height), windows, furniture, tiles, fixtures
3. Use perspective and spatial relationships to estimate dimensions
4. ONLY include rooms that you can actually see photos of
5. Do NOT guess rooms that have no photos provided
6. Estimate each room's approximate area in square feet

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
  "totalArea": <number in sq ft - sum of all room areas>,
  "rooms": [
    { "name": "<room name>", "area": <number in sq ft>, "dimensions": "<length x width estimate>" }
  ],
  "confidence": "<high|medium|low>",
  "notes": "<any important observations about the measurement accuracy or rooms you couldn't measure>"
}

CRITICAL RULES:
- Only measure rooms you can see in the provided photos
- Be realistic and conservative with estimates
- If you cannot determine a room's size from the photos, note it in "notes" field
- Sum all room areas to get the totalArea
- For ${propertyType || 'residential'} properties in Dubai/UAE, typical sizes range from:
  - Studio: 400-600 sq ft
  - 1BR: 600-900 sq ft
  - 2BR: 900-1400 sq ft
  - 3BR: 1400-2000 sq ft
  - Villa: 2000-5000+ sq ft`
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

    // Recalculate total from rooms to ensure accuracy
    const calculatedTotal = measurementResult.rooms.reduce((sum: number, room: any) => sum + (room.area || 0), 0);
    if (Math.abs(calculatedTotal - measurementResult.totalArea) > 50) {
      measurementResult.totalArea = calculatedTotal;
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
