import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ElevenLabs premium voices matching character archetypes
const CHARACTER_VOICES: Record<string, { voiceId: string; name: string; description: string }> = {
  // Professional male voices
  "alex": { voiceId: "nPczCjzI2devNBz1zQrb", name: "Alex", description: "Confident & authoritative" },
  "george": { voiceId: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Warm & experienced" },
  "brian": { voiceId: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Deep & trustworthy" },
  // Female voices
  "sarah": { voiceId: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Professional & friendly" },
  "laura": { voiceId: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Luxury & sophisticated" },
  "alice": { voiceId: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", description: "Energetic & modern" },
  // Neutral / premium
  "river": { voiceId: "SAz9YHcvj6GT2YYXdXww", name: "River", description: "Elegant & premium" },
  "matilda": { voiceId: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Warm & inviting" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const {
      prompt,
      character = "sarah",
      voiceId: customVoiceId,
      language = "en",
      tone = "professional",
      duration = 45,
    } = await req.json();

    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Generate the script via AI
    const charInfo = CHARACTER_VOICES[character] || CHARACTER_VOICES["sarah"];
    const toneMap: Record<string, string> = {
      professional: "clear, confident, and trustworthy",
      luxury: "sophisticated, aspirational, and premium",
      energetic: "dynamic, exciting, and enthusiastic",
      friendly: "warm, welcoming, and approachable",
    };
    const toneStyle = toneMap[tone] || toneMap["professional"];
    const targetWords = Math.round(duration * 2.5);

    const scriptResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are ${charInfo.name}, a ${charInfo.description} real estate agent. 
Write a ${duration}-second property narration script (approximately ${targetWords} words) to be spoken aloud.
Tone: ${toneStyle}.
Rules:
- Write ONLY the spoken words — no stage directions, no [brackets], no asterisks
- The script must sound natural when spoken
- End with a clear call-to-action
- No filler phrases
- Write in the language matching code: ${language}`,
          },
          {
            role: "user",
            content: `Write a ${duration}-second property narration for: ${prompt}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!scriptResponse.ok) {
      if (scriptResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (scriptResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${scriptResponse.status}`);
    }

    const scriptData = await scriptResponse.json();
    const script = scriptData.choices?.[0]?.message?.content?.trim() || "";
    if (!script) throw new Error("No script generated");

    // Step 2: Convert script to speech via ElevenLabs
    const selectedVoiceId = customVoiceId || charInfo.voiceId;
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
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
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
            speed: 0.95,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error("ElevenLabs TTS error:", ttsResponse.status, errText);
      throw new Error(`TTS generation failed: ${ttsResponse.status}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = base64Encode(audioBuffer);

    // Estimate real duration from word count
    const wordCount = script.split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.round(wordCount / 2.5);

    return new Response(
      JSON.stringify({
        script,
        audioBase64,
        audioMimeType: "audio/mpeg",
        duration: estimatedDuration,
        wordCount,
        character: charInfo.name,
        voiceId: selectedVoiceId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Talking Agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
