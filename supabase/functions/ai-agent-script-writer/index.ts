import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", ar: "Arabic", hi: "Hindi", ur: "Urdu", zh: "Chinese",
  es: "Spanish", fr: "French", de: "German", ru: "Russian", pt: "Portuguese",
  ja: "Japanese", ko: "Korean", it: "Italian", nl: "Dutch", tr: "Turkish",
  fa: "Persian", he: "Hebrew", pl: "Polish", th: "Thai", vi: "Vietnamese",
  id: "Indonesian", ms: "Malay", tl: "Tagalog", bn: "Bengali",
  ta: "Tamil", te: "Telugu", ml: "Malayalam", sw: "Swahili",
};

const CHARACTER_STYLES: Record<string, string> = {
  "professional-male": "authoritative, confident, precise, business-like tone",
  "warm-female": "warm, welcoming, friendly, reassuring tone",
  "energetic-presenter": "energetic, enthusiastic, dynamic, exciting tone",
  "luxury-narrator": "sophisticated, elegant, premium, exclusive tone",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  luxury: "Use aspirational, exclusive language. Emphasize prestige, craftsmanship, and elite lifestyle. Words like 'exceptional', 'unparalleled', 'coveted'.",
  professional: "Use clear, factual, trustworthy language. Emphasize value, location, and investment potential. Professional but approachable.",
  energetic: "Use dynamic, exciting language with a sense of urgency. Emphasize opportunity, growth, and excitement. Create FOMO.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const { prompt, language = "en", tone = "professional", character = "professional-male", duration = 60 } = await req.json();

    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ~2.5 words/second for natural speech pacing
    const targetWordCount = Math.round(duration * 2.5);
    const languageName = LANGUAGE_NAMES[language] || "English";
    const characterStyle = CHARACTER_STYLES[character] || CHARACTER_STYLES["professional-male"];
    const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS["professional"];

    const systemPrompt = `You are a professional real estate voiceover scriptwriter. Your job is to write ready-to-speak voiceover scripts for property video advertisements.

STRICT RULES:
1. Write ONLY the spoken words — no stage directions, no camera notes, no [brackets], no asterisks
2. Write EXACTLY in ${languageName} — every word must be in ${languageName}
3. Target approximately ${targetWordCount} words (for ${duration}-second voiceover at 2.5 words/second)
4. Use ${characterStyle}
5. ${toneInstruction}
6. End with a clear call-to-action appropriate for real estate
7. No filler phrases. Every sentence should add value.
8. The script must flow naturally when read aloud — avoid awkward sentence structures`;

    const userPrompt = `Write a ${duration}-second real estate voiceover script in ${languageName} based on this property information:

${prompt}

Remember: Write only the spoken words in ${languageName}. Approximately ${targetWordCount} words. ${tone.charAt(0).toUpperCase() + tone.slice(1)} tone.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const script = data.choices?.[0]?.message?.content?.trim() || "";

    if (!script) {
      throw new Error("No script generated");
    }

    const wordCount = script.split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.round(wordCount / 2.5);

    return new Response(
      JSON.stringify({ script, wordCount, estimatedDuration }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Script writer error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
