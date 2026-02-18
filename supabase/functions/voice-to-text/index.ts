import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept-language",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    // Get preferred language from header or default to English
    const preferredLang = req.headers.get("accept-language")?.split(",")[0]?.split("-")[0] || "en";

    const { audio, language } = await req.json();
    const targetLang = language || preferredLang;
    
    if (!audio) {
      throw new Error("No audio data provided");
    }

    // Decode base64 audio to binary
    const audioBytes = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioBytes], { type: "audio/webm" });

    // Full ISO 639-3 mapping for all 28 supported languages
    const LANG_TO_ISO639_3: Record<string, string> = {
      en: "eng", ar: "ara", hi: "hin", ur: "urd", zh: "zho",
      es: "spa", fr: "fra", de: "deu", ru: "rus", pt: "por",
      ja: "jpn", ko: "kor", it: "ita", nl: "nld", tr: "tur",
      fa: "fas", he: "heb", pl: "pol", th: "tha", vi: "vie",
      id: "ind", ms: "msa", tl: "tgl", bn: "ben", ta: "tam",
      te: "tel", ml: "mal", sw: "swa",
    };

    // Try ElevenLabs Scribe first (if API key available)
    if (ELEVENLABS_API_KEY) {
      try {
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");
        formData.append("model_id", "scribe_v2");
        // Set language code for better accuracy (ISO 639-3) — all 28 languages
        const langCode = LANG_TO_ISO639_3[targetLang] || "eng";
        formData.append("language_code", langCode);

        const elevenLabsResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: formData,
        });

        if (elevenLabsResponse.ok) {
          const result = await elevenLabsResponse.json();
          const transcribedText = result.text?.trim();
          
          if (transcribedText && transcribedText.length > 0) {
            return new Response(JSON.stringify({ 
              text: transcribedText,
              success: true,
              provider: "elevenlabs"
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        console.log("ElevenLabs STT failed or empty, falling back to Gemini");
      } catch (elevenLabsError) {
        console.error("ElevenLabs STT error:", elevenLabsError);
      }
    }

    // Fallback to Gemini multimodal with explicit language instruction
    if (!LOVABLE_API_KEY) {
      throw new Error("No transcription service available");
    }

    const audioDataUrl = `data:audio/webm;base64,${audio}`;
    const langInstruction = targetLang === "ar" 
      ? "Transcribe this audio in Arabic. Return ONLY the Arabic transcription."
      : "Transcribe this audio in English. Return ONLY the English transcription.";
    
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
                text: `${langInstruction} If the audio is silent or unclear, respond with exactly: [NO_SPEECH_DETECTED]. Do not add any commentary.`
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
      console.error("Gemini transcription error:", response.status);
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
