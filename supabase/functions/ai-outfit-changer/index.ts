import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OutfitRequest {
  prompt: string;
  imageBase64?: string;
  sessionId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      userId = user?.id || null;
    }

    const { prompt, imageBase64, sessionId } = await req.json() as OutfitRequest;

    if (!prompt) {
      return new Response(
        JSON.stringify({ success: false, error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create request record if user is authenticated
    let requestId: string | null = null;
    if (userId) {
      const { data: requestRecord } = await supabase
        .from("ai_outfit_requests")
        .insert({
          user_id: userId,
          session_id: sessionId,
          prompt,
          status: "processing",
        })
        .select("id")
        .single();
      
      requestId = requestRecord?.id;
    }

    // Enhanced outfit prompt
    const enhancedPrompt = `Transform the person's clothing to: ${prompt}. 
Keep the person's face, body pose, and background exactly the same. 
Only change their outfit/clothing to match the description. 
Professional fashion photography quality, natural lighting, realistic fabric textures.`;

    // Build messages for AI
    const messages: any[] = [
      {
        role: "user",
        content: imageBase64 
          ? [
              { type: "text", text: enhancedPrompt },
              { 
                type: "image_url", 
                image_url: { 
                  url: imageBase64.startsWith("data:") 
                    ? imageBase64 
                    : `data:image/jpeg;base64,${imageBase64}` 
                } 
              }
            ]
          : enhancedPrompt
      }
    ];

    // Call AI Gateway for image generation/editing
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages,
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", errorText);
      
      // Update request status
      if (requestId) {
        await supabase
          .from("ai_outfit_requests")
          .update({ 
            status: "failed", 
            error_message: errorText 
          })
          .eq("id", requestId);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to generate outfit",
          details: errorText 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const generatedImage = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = aiData.choices?.[0]?.message?.content;

    // Update request with result
    if (requestId) {
      await supabase
        .from("ai_outfit_requests")
        .update({ 
          status: "completed",
          generated_image_url: generatedImage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", requestId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: generatedImage,
        message: textContent || "Outfit generated successfully",
        requestId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("AI Outfit Changer error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || "An error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});