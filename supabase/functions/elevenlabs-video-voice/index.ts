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
    const { text, language, style } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    if (!text) {
      throw new Error("Text is required");
    }

    // Map language/style to voice ID
    const voiceMap: Record<string, string> = {
      "en-GB": "pNInz6obpgDQGcFmaJgB", // Adam - British
      "en-US": "21m00Tcm4TlvDq8ikWAM", // Rachel - American
      "ar": "TxGEqnHWrfWFTfGW9XjX", // Josh - can do Arabic accent
      default: "pNInz6obpgDQGcFmaJgB",
    };

    const voiceId = voiceMap[language] || voiceMap.default;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: style === "calm" ? 0.8 : 0.5,
            similarity_boost: 0.75,
            style: style === "energetic" ? 0.8 : 0.4,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("ElevenLabs error:", error);
      throw new Error("Failed to generate voice");
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Voice generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
