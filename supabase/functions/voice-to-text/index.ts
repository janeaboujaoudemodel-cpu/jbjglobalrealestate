import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error("No audio data provided");
    }

    // Use Gemini's multimodal capabilities to transcribe audio
    // The audio is sent as a data URL for multimodal processing
    const audioDataUrl = `data:audio/webm;base64,${audio}`;
    
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
            content: [
              {
                type: "text",
                text: "Please transcribe the following audio recording accurately. Return ONLY the transcribed text with no additional commentary, formatting, or explanation. If the audio is unclear or silent, respond with exactly: [NO_SPEECH_DETECTED]"
              },
              {
                type: "image_url",
                image_url: {
                  url: audioDataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      // Fallback: return a message that voice is being processed
      console.error("Transcription API error:", response.status);
      return new Response(JSON.stringify({ 
        text: null,
        error: "Voice transcription is temporarily unavailable. Please type your message instead."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let transcribedText = data.choices?.[0]?.message?.content?.trim();
    
    // Handle no speech detected
    if (transcribedText === "[NO_SPEECH_DETECTED]" || !transcribedText) {
      return new Response(JSON.stringify({ 
        text: null,
        error: "No speech detected. Please speak clearly and try again."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      text: transcribedText,
      success: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Voice to text error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to transcribe audio";
    return new Response(JSON.stringify({ 
      text: null,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
