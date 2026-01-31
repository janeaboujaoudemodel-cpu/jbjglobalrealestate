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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { segments, language = "en", testMode = false } = await req.json() as { 
      segments: PodcastSegment[];
      language?: string;
      testMode?: boolean;
    };

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured");
    }

    if (!VOICES.jane) {
      throw new Error("Jane's voice ID not configured");
    }

    // In test mode, only process first segment with shorter text
    const segmentsToProcess = testMode ? [{
      speaker: "jane" as const,
      text: "Welcome to The JBJ Perspective. I'm Jane, and today we're exploring why Dubai became the capital of global investors."
    }] : segments;

    console.log(`Generating podcast audio for ${segmentsToProcess.length} segments in ${language}${testMode ? ' (TEST MODE)' : ''}`);

    // Generate audio for each segment
    const audioChunks: ArrayBuffer[] = [];
    
    for (let i = 0; i < segmentsToProcess.length; i++) {
      const segment = segmentsToProcess[i];
      const voiceId = VOICES[segment.speaker];
      
      if (!voiceId) {
        console.error(`No voice ID for speaker: ${segment.speaker}`);
        continue;
      }

      console.log(`Generating segment ${i + 1}/${segmentsToProcess.length} for ${segment.speaker}`);

      // Build request with stitching context
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

      // Add context for stitching (only in full mode)
      if (!testMode) {
        if (i > 0) {
          requestBody.previous_text = segmentsToProcess[i - 1].text.slice(-200);
        }
        if (i < segmentsToProcess.length - 1) {
          requestBody.next_text = segmentsToProcess[i + 1].text.slice(0, 200);
        }
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
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
        throw new Error(`Failed to generate audio for segment ${i}: ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      audioChunks.push(audioBuffer);
      
      // Small delay to avoid rate limiting
      if (i < segmentsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Combine all audio chunks
    const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    const combinedAudio = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of audioChunks) {
      combinedAudio.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    // Return as base64 encoded audio - convert Uint8Array to ArrayBuffer
    const audioBase64 = base64Encode(combinedAudio.buffer);

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioContent: audioBase64,
        duration: Math.round(totalLength / 16000), // Rough estimate
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Podcast TTS error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
