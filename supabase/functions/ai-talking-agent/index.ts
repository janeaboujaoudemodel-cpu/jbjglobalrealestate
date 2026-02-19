import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Character archetypes (voice is handled browser-side via SpeechSynthesis)
const CHARACTER_INFO: Record<string, { name: string; description: string }> = {
  "alex":    { name: "Alex",    description: "Confident & authoritative" },
  "george":  { name: "George",  description: "Warm & experienced" },
  "brian":   { name: "Brian",   description: "Deep & trustworthy" },
  "sarah":   { name: "Sarah",   description: "Professional & friendly" },
  "laura":   { name: "Laura",   description: "Luxury & sophisticated" },
  "alice":   { name: "Alice",   description: "Energetic & modern" },
  "river":   { name: "River",   description: "Elegant & premium" },
  "matilda": { name: "Matilda", description: "Warm & inviting" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const {
      prompt,
      character = "sarah",
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

    const charInfo = CHARACTER_INFO[character] || CHARACTER_INFO["sarah"];
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

    const wordCount = script.split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.round(wordCount / 2.5);

    return new Response(
      JSON.stringify({
        script,
        duration: estimatedDuration,
        wordCount,
        character: charInfo.name,
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
