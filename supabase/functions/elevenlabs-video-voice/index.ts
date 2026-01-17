import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid language and style enums - expanded for client compatibility
const VALID_LANGUAGES = ["en-GB", "en-US", "ar", "hi", "ru", "zh", "fr", "de", "it", "es"] as const;
const VALID_STYLES = ["professional", "warm", "energetic", "calm", "neutral"] as const;

// Input validation schema
const RequestSchema = z.object({
  text: z.string().min(1, "Text is required").max(5000, "Text must be under 5000 characters"),
  language: z.enum(VALID_LANGUAGES).optional().default("en-GB"),
  style: z.enum(VALID_STYLES).optional().default("professional"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("Invalid authentication:", claimsError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user requesting voice generation:", userId);

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = RequestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: validationResult.error.errors[0].message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, language, style } = validationResult.data;

    // Map language to voice ID (expanded multilingual support)
    const voiceMap: Record<string, string> = {
      "en-GB": "JBFqnCBsd6RMkjVDRZzb",  // George - British
      "en-US": "EXAVITQu4vr4xnSDxMaL",  // Sarah - American
      "ar": "SAz9YHcvj6GT2YYXdXww",     // River - can do Arabic
      "hi": "TX3LPaxmHKxFdv7VOQHJ",     // Liam - Hindi accent
      "ru": "bIHbv24MWmeRgasZH58o",     // Will - Russian accent
      "zh": "Xb7hH8MSUJpSbSDYk0k2",     // Alice - Chinese accent
      "fr": "FGY2WhTYpPnrIDTdsKH5",     // Laura - French
      "de": "N2lVS1w4EtoT3dr4eOWO",     // Callum - German
      "it": "onwK4e9ZLuTAKqWW03F9",     // Daniel - Italian
      "es": "XrExE9yKIg1WjnnlVkGX",     // Matilda - Spanish
    };

    const voiceId = voiceMap[language] || voiceMap["en-GB"];

    console.log("Generating voice for user:", userId, "text length:", text.length, "language:", language);

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
            stability: style === "calm" ? 0.8 : style === "professional" ? 0.65 : 0.5,
            similarity_boost: 0.75,
            style: style === "energetic" ? 0.8 : style === "warm" ? 0.6 : 0.4,
            use_speaker_boost: true,
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
    console.log("Successfully generated voice for user:", userId);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error: unknown) {
    console.error("Voice generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
