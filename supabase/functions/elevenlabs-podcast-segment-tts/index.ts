import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "x-jbj-characters, x-jbj-cached",
};

// Bump this when changing voices / voice_settings so old cached audio is not reused.
const VOICE_PROFILE_VERSION = "v2_clarity_2026-01-31";

// Voice IDs for the podcast cast
const VOICES = {
  jane: Deno.env.get("ELEVENLABS_VOICE_ID") || "", // Jane's cloned voice
  alex: "JBFqnCBsd6RMkjVDRZzb", // George - British male, analytical
  lina: "EXAVITQu4vr4xnSDxMaL", // Sarah - International female
} as const;

type PodcastSpeaker = keyof typeof VOICES;

type HttpError = {
  status: number;
  message: string;
};

const asText = (v: unknown) => (typeof v === "string" ? v : "");
const asInt = (v: unknown, fallback: number) => {
  const n = typeof v === "number" ? Math.floor(v) : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
};

// Simple hash for cache keys
function hashString(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

async function callElevenLabsTts(params: {
  apiKey: string;
  voiceId: string;
  text: string;
  outputFormat: string;
}) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${params.voiceId}?output_format=${encodeURIComponent(params.outputFormat)}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": params.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: params.text,
        // Multilingual, high quality; we keep settings very stable/clean.
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          // Cleaner + more consistent tone (reduce "up/down" intonation swings)
          stability: 0.8,
          similarity_boost: 0.9,
          style: 0.0,
          use_speaker_boost: true,
          speed: 1.0,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");

    let status = 502;
    let message = errorText || `ElevenLabs request failed (${response.status})`;

    try {
      const parsed = JSON.parse(errorText);
      const apiStatus = parsed?.detail?.status;
      const apiMessage = parsed?.detail?.message;

      if (apiStatus === "quota_exceeded") {
        status = 402;
        message = apiMessage || message;
      } else if (apiStatus === "too_many_concurrent_requests") {
        status = 429;
        message = apiMessage || message;
      } else if (response.status === 401 || response.status === 403) {
        status = 401;
        message = apiMessage || "ElevenLabs authentication failed";
      }
    } catch {
      // ignore parse errors
    }

    throw { status, message } satisfies HttpError;
  }

  return response.arrayBuffer();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      speaker?: PodcastSpeaker;
      text?: string;
      output_format?: string;
      episode_id?: number;
      segment_index?: number;
      language?: string;
      /** If true, ONLY serve cached audio; never generate new audio (protects credits). */
      require_cache?: boolean;
    };

    const speaker = body.speaker;
    const text = asText(body.text).trim();
    const outputFormat = asText(body.output_format) || "mp3_44100_128";
    const episodeId = asInt(body.episode_id, 0);
    const segmentIndex = asInt(body.segment_index, -1);
    const language = asText(body.language) || "en";
    const requireCache = Boolean(body.require_cache);

    if (requireCache && !(episodeId > 0 && segmentIndex >= 0)) {
      throw { status: 400, message: "episode_id and segment_index required for cached playback" } satisfies HttpError;
    }

    if (!speaker || !(speaker in VOICES)) {
      throw { status: 400, message: "Missing or invalid speaker" } satisfies HttpError;
    }

    if (!text) {
      throw { status: 400, message: "Missing text" } satisfies HttpError;
    }

    const voiceId = VOICES[speaker];
    if (!voiceId) {
      throw { status: 500, message: "Jane's voice ID not configured" } satisfies HttpError;
    }

    // Initialize Supabase client with service role for storage access
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Include voice + profile version in the cache key so tuning changes take effect immediately.
    const textHash = hashString(`${VOICE_PROFILE_VERSION}|${voiceId}|${outputFormat}|${text}`);
    const storagePath = `ep${episodeId}/${language}/${segmentIndex}-${speaker}-${textHash}.mp3`;

    // Check if audio already exists in storage
    if (episodeId > 0 && segmentIndex >= 0) {
      // Check cache table first
      const { data: cacheEntry } = await supabase
        .from("podcast_audio_cache")
        .select("storage_path")
        .eq("episode_id", episodeId)
        .eq("segment_index", segmentIndex)
        .eq("language", language)
        .eq("text_hash", textHash)
        .maybeSingle();

      if (cacheEntry?.storage_path) {
        // Fetch from storage
        const { data: audioData, error: downloadError } = await supabase.storage
          .from("podcast-audio")
          .download(cacheEntry.storage_path);

        if (!downloadError && audioData) {
          console.log(`Cache hit: ${cacheEntry.storage_path}`);
          const audioBuffer = await audioData.arrayBuffer();
          return new Response(audioBuffer, {
            headers: {
              ...corsHeaders,
              "Content-Type": "audio/mpeg",
              "x-jbj-characters": "0", // No credits used
              "x-jbj-cached": "true",
            },
          });
        }

        // If cache-only mode is enabled, never fall back to generation.
        if (requireCache) {
          throw { status: 409, message: "Cached audio missing from storage" } satisfies HttpError;
        }
      }

      // Cache-only mode: if not found in cache, do NOT generate.
      if (requireCache) {
        throw { status: 409, message: "Audio not cached yet" } satisfies HttpError;
      }
    }

    // Not cached - generate new audio
    const key1 = Deno.env.get("ELEVENLABS_API_KEY_1") || "";
    const key2 = Deno.env.get("ELEVENLABS_API_KEY") || "";
    const keys = [key1, key2].filter(Boolean);

    if (!keys.length) {
      throw { status: 500, message: "ElevenLabs API key not configured" } satisfies HttpError;
    }

    // Try first key; if auth/quota fails and a second key exists, try once more.
    let lastErr: HttpError | null = null;
    let audioBuffer: ArrayBuffer | null = null;

    for (let i = 0; i < Math.min(keys.length, 2); i++) {
      try {
        audioBuffer = await callElevenLabsTts({
          apiKey: keys[i],
          voiceId,
          text,
          outputFormat,
        });
        break;
      } catch (e) {
        const err = e as HttpError;
        lastErr = err;
        // Only retry on auth/quota issues.
        if (err?.status !== 401 && err?.status !== 402) break;
      }
    }

    if (!audioBuffer) {
      throw lastErr || ({ status: 500, message: "Unknown error" } satisfies HttpError);
    }

    // Store in Supabase Storage for future requests (fire and forget)
    if (episodeId > 0 && segmentIndex >= 0) {
      const uploadPromise = (async () => {
        try {
          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from("podcast-audio")
            .upload(storagePath, audioBuffer!, {
              contentType: "audio/mpeg",
              upsert: true,
            });

          if (uploadError) {
            console.error("Storage upload failed:", uploadError.message);
            return;
          }

          // Record in cache table
          await supabase.from("podcast_audio_cache").upsert({
            episode_id: episodeId,
            segment_index: segmentIndex,
            speaker,
            text_hash: textHash,
            language,
            storage_path: storagePath,
          }, {
            onConflict: "episode_id,segment_index,language,text_hash",
          });

          console.log(`Cached: ${storagePath}`);
        } catch (e) {
          console.error("Cache storage error:", e);
        }
      })();

      // Don't await - respond immediately
      uploadPromise.catch(() => {});
    }

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "x-jbj-characters": String(text.length),
        "x-jbj-cached": "false",
      },
    });
  } catch (err) {
    const status =
      typeof (err as HttpError | undefined)?.status === "number"
        ? (err as HttpError).status
        : 500;
    const message =
      typeof (err as HttpError | undefined)?.message === "string"
        ? (err as HttpError).message
        : err instanceof Error
          ? err.message
          : "Unknown error";

    // 409 is expected (cache miss) - don't log as error
    if (status !== 409) {
      console.error("Podcast segment TTS error:", message);
    } else {
      console.log("Cache miss - will trigger generation:", message);
    }

    return new Response(JSON.stringify({ success: false, error: message }), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
