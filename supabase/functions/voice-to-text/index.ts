import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept-language, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const { audio, language } = await req.json();
    
    if (!audio) {
      throw new Error("No audio data provided");
    }

    if (!LOVABLE_API_KEY) {
      throw new Error("No transcription service available");
    }

    const audioDataUrl = `data:audio/webm;base64,${audio}`;
    
    // Step 1: Transcribe in the original spoken language and detect the language
    const transcribeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                text: `Transcribe this audio EXACTLY as spoken, in the original language. Also detect what language is being spoken.

Return your response in this exact JSON format (no markdown, no code blocks):
{"text": "the transcription here", "detected_language": "en", "language_name": "English"}

Use ISO 639-1 two-letter codes for detected_language (en, ar, hi, fr, es, de, ru, zh, ja, ko, tr, fa, ur, etc.)

If the audio is silent or unclear, respond with exactly: {"text": "", "detected_language": "unknown", "language_name": "Unknown"}`
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
        max_tokens: 1500,
      }),
    });

    if (!transcribeResponse.ok) {
      console.error("Gemini transcription error:", transcribeResponse.status);
      return new Response(JSON.stringify({ 
        text: null,
        error: "Voice transcription is temporarily unavailable. Please type your message instead."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcribeData = await transcribeResponse.json();
    let rawContent = transcribeData.choices?.[0]?.message?.content?.trim();
    
    // Clean markdown code blocks if present
    if (rawContent?.startsWith("```")) {
      rawContent = rawContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }
    
    // Parse the JSON response
    let transcription: { text: string; detected_language: string; language_name: string };
    try {
      transcription = JSON.parse(rawContent);
    } catch {
      // Fallback: treat entire response as English text
      transcription = { text: rawContent || "", detected_language: "en", language_name: "English" };
    }

    // Handle no speech detected
    if (!transcription.text || transcription.detected_language === "unknown") {
      return new Response(JSON.stringify({ 
        text: null,
        error: "No speech detected. Please speak clearly and try again."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: If the detected language is NOT English, also translate to English
    let translatedText: string | null = null;
    const isEnglish = transcription.detected_language === "en" || transcription.detected_language === "eng";

    if (!isEnglish) {
      try {
        const translateResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "user",
                content: `Translate the following text from ${transcription.language_name} to English. Return ONLY the English translation, nothing else.\n\nText: ${transcription.text}`
              }
            ],
            max_tokens: 1000,
          }),
        });

        if (translateResponse.ok) {
          const translateData = await translateResponse.json();
          translatedText = translateData.choices?.[0]?.message?.content?.trim() || null;
        }
      } catch (translateErr) {
        console.error("Translation error (non-critical):", translateErr);
      }
    }

    return new Response(JSON.stringify({ 
      text: transcription.text,
      translated_text: translatedText,
      detected_language: transcription.detected_language,
      language_name: transcription.language_name,
      is_english: isEnglish,
      success: true,
      provider: "gemini"
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
