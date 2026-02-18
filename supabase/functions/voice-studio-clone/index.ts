import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY not configured");

    const contentType = req.headers.get("content-type") || "";

    // -----------------------------------------------------------------
    // ACTION: clone_voice  — create an instant voice clone
    // ACTION: tts_with_clone — generate TTS with a previously cloned voice
    // ACTION: delete_clone — delete a cloned voice from ElevenLabs
    // -----------------------------------------------------------------

    if (contentType.includes("multipart/form-data")) {
      // Clone voice: multipart with audio files
      const formData = await req.formData();
      const action = formData.get("action") as string;
      const voiceName = (formData.get("voice_name") as string) || `User Voice ${userId.slice(0, 6)}`;
      const description = (formData.get("description") as string) || "User cloned voice";

      if (action === "clone_voice") {
        const audioFiles = formData.getAll("files");
        if (!audioFiles.length) {
          return new Response(
            JSON.stringify({ error: "At least one audio file is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Build multipart for ElevenLabs
        const elFormData = new FormData();
        elFormData.append("name", voiceName);
        elFormData.append("description", description);
        for (const file of audioFiles) {
          elFormData.append("files", file as Blob, "voice_sample.webm");
        }

        const cloneRes = await fetch("https://api.elevenlabs.io/v1/voices/add", {
          method: "POST",
          headers: { "xi-api-key": ELEVENLABS_API_KEY },
          body: elFormData,
        });

        if (!cloneRes.ok) {
          const errText = await cloneRes.text();
          console.error("ElevenLabs clone error:", cloneRes.status, errText);
          throw new Error(`Voice cloning failed: ${cloneRes.status} - ${errText}`);
        }

        const cloneData = await cloneRes.json();
        console.log(`Voice cloned for user ${userId}: ${cloneData.voice_id}`);

        return new Response(
          JSON.stringify({ voice_id: cloneData.voice_id, name: voiceName }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // JSON body actions
      const body = await req.json();
      const { action } = body;

      if (action === "tts_with_clone") {
        const { voice_id, text, language_code = "en", format = "mp3", stability = 0.5, similarity_boost = 0.75, speed = 1.0 } = body;
        if (!voice_id || !text) {
          return new Response(
            JSON.stringify({ error: "voice_id and text are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const sanitizedText = text.slice(0, 5000);
        const outputFormat = format === "wav" ? "pcm_44100" : "mp3_44100_128";

        // Use multilingual model for non-English, turbo for English speed
        const model = language_code === "en" ? "eleven_turbo_v2_5" : "eleven_multilingual_v2";

        const ttsRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}?output_format=${outputFormat}`,
          {
            method: "POST",
            headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({
              text: sanitizedText,
              model_id: model,
              language_code: language_code !== "en" ? language_code : undefined,
              voice_settings: { stability, similarity_boost, speed, style: 0.3, use_speaker_boost: true },
            }),
          }
        );

        if (!ttsRes.ok) {
          const errText = await ttsRes.text();
          throw new Error(`TTS failed: ${ttsRes.status} - ${errText}`);
        }

        const audioBuffer = await ttsRes.arrayBuffer();
        const ct = format === "wav" ? "audio/wav" : "audio/mpeg";
        return new Response(audioBuffer, {
          headers: { ...corsHeaders, "Content-Type": ct, "Content-Length": audioBuffer.byteLength.toString() },
        });
      }

      if (action === "delete_clone") {
        const { voice_id } = body;
        if (!voice_id) {
          return new Response(
            JSON.stringify({ error: "voice_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const delRes = await fetch(`https://api.elevenlabs.io/v1/voices/${voice_id}`, {
          method: "DELETE",
          headers: { "xi-api-key": ELEVENLABS_API_KEY },
        });

        if (!delRes.ok) {
          const errText = await delRes.text();
          throw new Error(`Delete failed: ${delRes.status} - ${errText}`);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "list_voices") {
        const listRes = await fetch("https://api.elevenlabs.io/v1/voices", {
          headers: { "xi-api-key": ELEVENLABS_API_KEY },
        });
        const data = await listRes.json();
        // Return only cloned (instant) voices for this user
        const cloned = (data.voices || []).filter((v: Record<string, unknown>) => v.category === "cloned" || v.category === "professional");
        return new Response(
          JSON.stringify({ voices: cloned }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Voice clone error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
