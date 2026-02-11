import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const ELEVENLABS_VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    // Extract user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { script, threadId, voiceId } = await req.json();

    if (!script || !threadId) {
      return new Response(JSON.stringify({ error: "Missing script or threadId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use provided voiceId or fallback to configured one
    const finalVoiceId = voiceId || ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Default to Rachel

    const startTime = Date.now();
    const OWNER_NAME = "Jane Bou Jaoude"; // LOCKED - Owner name

    // Log the voice generation attempt
    const { data: logEntry, error: logError } = await supabase
      .from('owner_comm_voice_logs')
      .insert({
        user_id: user.id,
        thread_id: threadId,
        voice_id: finalVoiceId,
        script,
        status: 'generating',
        characters_used: script.length,
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create voice log:", logError);
    }

    // Generate voice using ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs error:", errorText);
      
      // Update log with error
      if (logEntry) {
        await supabase
          .from('owner_comm_voice_logs')
          .update({
            status: 'failed',
            error_message: errorText,
            generation_time_ms: Date.now() - startTime,
          })
          .eq('id', logEntry.id);
      }

      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    
    // Estimate duration (roughly 150 words per minute)
    const wordCount = script.split(/\s+/).length;
    const estimatedDuration = Math.ceil((wordCount / 150) * 60);

    // Upload to Supabase Storage
    const fileName = `voice-${threadId}-${Date.now()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-messages')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    let audioUrl = "";
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      // Fall back to data URI
      audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
    } else {
      const { data: publicUrl } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);
      audioUrl = publicUrl.publicUrl;
    }

    const generationTime = Date.now() - startTime;

    // Update log with success
    if (logEntry) {
      await supabase
        .from('owner_comm_voice_logs')
        .update({
          status: 'completed',
          audio_url: audioUrl,
          duration_seconds: estimatedDuration,
          generation_time_ms: generationTime,
        })
        .eq('id', logEntry.id);
    }

    return new Response(JSON.stringify({
      audioUrl,
      durationSeconds: estimatedDuration,
      generationTimeMs: generationTime,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Voice generation error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
