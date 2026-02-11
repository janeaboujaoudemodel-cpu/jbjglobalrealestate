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
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY_1");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured");
    }

    const { audioFiles, voiceName, description } = await req.json();

    if (!audioFiles || audioFiles.length === 0) {
      throw new Error("No audio files provided for voice cloning");
    }

    // Create form data for voice cloning - OWNER NAME LOCKED: Jane Bou Jaoude
    const formData = new FormData();
    formData.append("name", voiceName || "Jane Bou Jaoude - JBJ Global");
    formData.append("description", description || "Professional voice of Jane Bou Jaoude - refined British-accented English with natural warmth and authority. Premium real estate industry voice.");
    
    // Add labels for voice organization
    formData.append("labels", JSON.stringify({
      accent: "British",
      gender: "female",
      age: "adult",
      use_case: "podcast",
      language: "English"
    }));

    // Fetch and append each audio file
    for (let i = 0; i < audioFiles.length; i++) {
      const audioUrl = audioFiles[i];
      console.log(`Fetching audio file ${i + 1}: ${audioUrl}`);
      
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio file ${i + 1}: ${audioResponse.status}`);
      }
      
      const audioBlob = await audioResponse.blob();
      formData.append("files", audioBlob, `sample-${i}.webm`);
    }

    console.log("Sending voice cloning request to ElevenLabs...");

    // Call ElevenLabs Add Voice API (Professional Voice Clone)
    const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Voice cloned successfully:", result);

    return new Response(JSON.stringify({
      success: true,
      voiceId: result.voice_id,
      message: "Voice cloned successfully! The 'Jane' voice is now available for text-to-speech."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Voice cloning error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to clone voice";
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
