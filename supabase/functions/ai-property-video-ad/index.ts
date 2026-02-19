import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY not configured");

    const { projectId, language, voiceId, tone, scriptDuration } = await req.json();

    if (!projectId) throw new Error("projectId is required");

    // ── Step 0: Fetch project details from DB ────────────────────────────────
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: project, error: projError } = await supabase
      .from("projects")
      .select(`
        id, name, emirate, location, price_from, price_to,
        bedrooms_min, bedrooms_max, property_type_label,
        developer_name, amenities, payment_plan,
        description, latitude, longitude
      `)
      .eq("id", projectId)
      .single();

    if (projError || !project) throw new Error("Project not found");

    // ── Step A: Generate voiceover script via Lovable AI (Gemini) ────────────
    const languageNames: Record<string, string> = {
      en: "English", ar: "Arabic", hi: "Hindi", ur: "Urdu",
      zh: "Chinese", es: "Spanish", fr: "French", de: "German",
      ru: "Russian", pt: "Portuguese", ja: "Japanese", ko: "Korean",
      it: "Italian", nl: "Dutch", tr: "Turkish", fa: "Persian",
      he: "Hebrew", pl: "Polish", th: "Thai", vi: "Vietnamese",
      id: "Indonesian", ms: "Malay", tl: "Tagalog", bn: "Bengali",
      ta: "Tamil", te: "Telugu", ml: "Malayalam", sw: "Swahili",
    };

    const langName = languageNames[language] || "English";
    const toneDesc = tone === "luxury"
      ? "ultra-premium, sophisticated, and aspirational"
      : tone === "urgent"
      ? "urgent, high-energy, and action-driving with a sense of limited availability"
      : "professional, clear, and trustworthy";

    const formatPrice = (v: number) =>
      v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)} million AED` : `${Math.round(v / 1000)}K AED`;

    const priceText = project.price_from
      ? project.price_to
        ? `from ${formatPrice(project.price_from)} to ${formatPrice(project.price_to)}`
        : `from ${formatPrice(project.price_from)}`
      : null;

    const bedroomsText = project.bedrooms_min !== null
      ? project.bedrooms_max && project.bedrooms_max !== project.bedrooms_min
        ? project.bedrooms_min === 0
          ? `Studio to ${project.bedrooms_max}-bedroom`
          : `${project.bedrooms_min} to ${project.bedrooms_max}-bedroom`
        : project.bedrooms_min === 0 ? "studio" : `${project.bedrooms_min}-bedroom`
      : null;

    const systemPrompt = `You are a world-class real estate voiceover scriptwriter specializing in luxury UAE property marketing. Write ONLY the voiceover script text — no directions, no stage notes, no quotation marks, no asterisks. The script must flow naturally when spoken aloud.`;

    const userPrompt = `Write a ${scriptDuration}-second voiceover script in ${langName} for the following real estate property. The tone must be ${toneDesc}.

Property Details:
- Name: ${project.name}
- Developer: ${project.developer_name || "Premium Developer"}
- Location: ${project.location || project.emirate || "UAE"}
- Emirate: ${project.emirate || "Dubai"}
- Type: ${project.property_type_label || "Residential"}
${bedroomsText ? `- Bedrooms: ${bedroomsText}` : ""}
${priceText ? `- Price: ${priceText}` : ""}
${project.amenities?.length ? `- Key Amenities: ${Array.isArray(project.amenities) ? project.amenities.slice(0, 5).join(", ") : project.amenities}` : ""}
${project.payment_plan ? `- Payment Plan: ${project.payment_plan}` : ""}
${project.description ? `- Project Description: ${project.description.slice(0, 300)}` : ""}

Requirements:
- Write in ${langName} language
- Script should take approximately ${scriptDuration} seconds to read aloud at a natural pace
- Start with an attention-grabbing opening that captures the property's unique value
- Include the property name, location, and key selling points
- End with a clear, compelling call to action
- Write ONLY the spoken words — no scene descriptions or directions`;

    const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      if (geminiResponse.status === 429) throw new Error("AI rate limit reached — please try again in a moment");
      if (geminiResponse.status === 402) throw new Error("AI credits exhausted — please add credits in Settings");
      throw new Error(`AI script generation failed: ${errText}`);
    }

    const geminiData = await geminiResponse.json();
    const script = geminiData.choices?.[0]?.message?.content?.trim() || "";

    if (!script) throw new Error("AI did not generate a script");

    // ── Step B: Generate TTS audio via ElevenLabs ────────────────────────────
    const selectedVoiceId = voiceId || "JBFqnCBsd6RMkjVDRZzb"; // George (default)

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
            stability: 0.5,
            similarity_boost: 0.75,
            style: tone === "luxury" ? 0.6 : tone === "urgent" ? 0.4 : 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      throw new Error(`ElevenLabs TTS failed (${ttsResponse.status}): ${errText}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = base64Encode(new Uint8Array(audioBuffer));

    // Estimate duration: ~15 chars per second is a typical speaking pace
    const audioDurationEstimate = Math.ceil(script.length / 15);

    return new Response(
      JSON.stringify({
        script,
        audioBase64,
        audioDurationEstimate,
        locationImageUrl: null, // Google Maps not configured
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[ai-property-video-ad] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
