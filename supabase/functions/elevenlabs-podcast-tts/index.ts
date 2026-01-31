import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice IDs for the podcast cast
const VOICES = {
  jane: Deno.env.get("ELEVENLABS_VOICE_ID") || "", // Jane's cloned voice
  alex: "JBFqnCBsd6RMkjVDRZzb", // George - British male, analytical
  lina: "EXAVITQu4vr4xnSDxMaL", // Sarah - International female
};

interface PodcastSegment {
  speaker: "jane" | "alex" | "lina";
  text: string;
}

type HttpError = {
  status: number;
  message: string;
};

const clampInt = (value: unknown, min: number, max: number, fallback: number) => {
  const n = typeof value === "number" ? Math.floor(value) : fallback;
  return Math.max(min, Math.min(max, n));
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { segments, language = "en", testMode = false, testMaxChars } = await req.json() as { 
      segments: PodcastSegment[];
      language?: string;
      testMode?: boolean;
      testMaxChars?: number;
    };

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY_1") || Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured");
    }

    if (!VOICES.jane) {
      throw new Error("Jane's voice ID not configured");
    }

    const effectiveTestMaxChars = clampInt(testMaxChars, 1, 200, 4);
    const testTextCandidate = (segments?.[0]?.text ?? "Hi.").trim();
    const testText = (testTextCandidate.length ? testTextCandidate : "Hi.").slice(0, effectiveTestMaxChars);

    const segmentsToProcess = testMode
      ? [{ speaker: "jane" as const, text: testText }]
      : segments;

    // Limit to 15 segments max to avoid memory issues
    const limitedSegments = segmentsToProcess.slice(0, 15);

    console.log(`Generating podcast audio for ${limitedSegments.length} segments in ${language}${testMode ? ' (TEST MODE)' : ''}`);

    // Use streaming to avoid memory accumulation
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (let i = 0; i < limitedSegments.length; i++) {
            const segment = limitedSegments[i];
            const voiceId = VOICES[segment.speaker];
            
            if (!voiceId) {
              console.error(`No voice ID for speaker: ${segment.speaker}`);
              continue;
            }

            console.log(`Generating segment ${i + 1}/${limitedSegments.length} for ${segment.speaker}`);

            const requestBody: Record<string, unknown> = {
              text: segment.text,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.6,
                similarity_boost: 0.8,
                style: 0.3,
                use_speaker_boost: true,
                speed: 1.0,
              },
            };

            if (!testMode) {
              if (i > 0) {
                requestBody.previous_text = limitedSegments[i - 1].text.slice(-200);
              }
              if (i < limitedSegments.length - 1) {
                requestBody.next_text = limitedSegments[i + 1].text.slice(0, 200);
              }
            }

            const response = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`,
              {
                method: "POST",
                headers: {
                  "xi-api-key": ELEVENLABS_API_KEY,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`ElevenLabs API error for segment ${i}:`, errorText);
              
              let status = 502;
              let message = `Failed to generate audio for segment ${i}: ${errorText}`;

              try {
                const parsed = JSON.parse(errorText);
                const apiStatus = parsed?.detail?.status;
                const apiMessage = parsed?.detail?.message;

                if (apiStatus === "quota_exceeded") {
                  status = 402;
                  message = apiMessage || message;
                } else if (response.status === 401 || response.status === 403) {
                  status = 401;
                  message = apiMessage || "ElevenLabs authentication failed";
                }
              } catch {
                // Keep defaults
              }

              throw { status, message } satisfies HttpError;
            }

            // Stream each chunk directly instead of accumulating
            const reader = response.body?.getReader();
            if (reader) {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
              }
            }

            // Small delay between segments
            if (i < limitedSegments.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (err) {
    const status =
      typeof (err as HttpError | undefined)?.status === "number"
        ? (err as HttpError).status
        : 500;
    const errorMessage =
      typeof (err as HttpError | undefined)?.message === "string"
        ? (err as HttpError).message
        : err instanceof Error
          ? err.message
          : "Unknown error";
    console.error("Podcast TTS error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
