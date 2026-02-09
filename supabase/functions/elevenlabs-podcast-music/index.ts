import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type MusicType = "intro" | "outro" | "background";

const MUSIC_PROMPTS: Record<MusicType, string> = {
  intro:
    "A 10-second premium podcast intro jingle: elegant piano with subtle strings, modern and sophisticated, building energy, luxury real estate brand feel, no vocals",
  outro:
    "A 10-second podcast outro: warm piano resolution, gentle fade, premium and polished feel, matches luxury real estate brand, no vocals",
  background:
    "A 60-second soft ambient background music loop for a professional real estate podcast: low-key piano, subtle pad textures, unobtrusive, easy to talk over, luxury and calm, no vocals",
};

const MUSIC_DURATIONS: Record<MusicType, number> = {
  intro: 10,
  outro: 10,
  background: 60,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type } = (await req.json().catch(() => ({}))) as {
      type?: MusicType;
    };

    if (!type || !MUSIC_PROMPTS[type]) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const storagePath = `podcast-music/${type}.mp3`;

    // Check if already cached in storage
    const { data: existingFile } = await supabase.storage
      .from("podcast-audio")
      .download(storagePath);

    if (existingFile) {
      console.log(`Music cache hit: ${storagePath}`);
      const buffer = await existingFile.arrayBuffer();
      return new Response(buffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "audio/mpeg",
          "x-jbj-cached": "true",
        },
      });
    }

    // Generate new music via ElevenLabs Music API
    const apiKey =
      Deno.env.get("ELEVENLABS_API_KEY_1") || Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "ElevenLabs API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Generating ${type} music...`);

    const musicRes = await fetch("https://api.elevenlabs.io/v1/music", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: MUSIC_PROMPTS[type],
        duration_seconds: MUSIC_DURATIONS[type],
      }),
    });

    if (!musicRes.ok) {
      const errText = await musicRes.text().catch(() => "");
      console.error("ElevenLabs Music API error:", errText);
      return new Response(
        JSON.stringify({ success: false, error: `Music generation failed: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const audioBuffer = await musicRes.arrayBuffer();

    // Cache to storage (fire and forget)
    supabase.storage
      .from("podcast-audio")
      .upload(storagePath, audioBuffer, { contentType: "audio/mpeg", upsert: true })
      .then(() => console.log(`Cached music: ${storagePath}`))
      .catch((e) => console.error("Failed to cache music:", e));

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "x-jbj-cached": "false",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Podcast music error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
