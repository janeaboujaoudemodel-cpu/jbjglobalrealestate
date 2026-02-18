import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Language names for prompting
const LANGUAGE_NAMES: Record<string, string> = {
  ar: "Arabic (Modern Standard Arabic - العربية)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  ru: "Russian (Русский)",
  zh: "Chinese Simplified (中文)",
  hi: "Hindi (हिन्दी)",
  fa: "Persian (فارسی)",
  tr: "Turkish (Türkçe)",
  de: "German (Deutsch)",
  it: "Italian (Italiano)",
  nl: "Dutch (Nederlands)",
  pt: "Portuguese (Português)",
  ja: "Japanese (日本語)",
  ko: "Korean (한국어)",
  ur: "Urdu (اردو)",
  he: "Hebrew (עברית)",
  pl: "Polish (Polski)",
  th: "Thai (ภาษาไทย)",
  vi: "Vietnamese (Tiếng Việt)",
  id: "Indonesian (Bahasa Indonesia)",
  ms: "Malay (Bahasa Melayu)",
  tl: "Tagalog (Filipino)",
  bn: "Bengali (বাংলা)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  ml: "Malayalam (മലയാളം)",
  sw: "Swahili (Kiswahili)",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, targetLang }: { texts: string[]; targetLang: string } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(
        JSON.stringify({ error: "texts array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!targetLang || targetLang === "en") {
      // No translation needed for English
      return new Response(
        JSON.stringify({ translations: texts }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const languageName = LANGUAGE_NAMES[targetLang];
    if (!languageName) {
      return new Response(
        JSON.stringify({ error: `Unsupported language: ${targetLang}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache first
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up cached translations
    const { data: cached } = await supabase
      .from("translation_cache")
      .select("source_text, translated_text")
      .eq("target_lang", targetLang)
      .in("source_text", texts);

    const cachedMap = new Map<string, string>();
    if (cached) {
      for (const row of cached) {
        cachedMap.set(row.source_text, row.translated_text);
      }
    }

    // Find texts that need translation
    const textsToTranslate: string[] = [];
    const indexMap: number[] = []; // Maps position in textsToTranslate to position in original texts
    
    for (let i = 0; i < texts.length; i++) {
      if (!cachedMap.has(texts[i])) {
        textsToTranslate.push(texts[i]);
        indexMap.push(i);
      }
    }

    let newTranslations: string[] = [];

    if (textsToTranslate.length > 0) {
      // Use Lovable AI endpoint for translation
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          max_tokens: 4000,
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: `You are a professional translator for a luxury real estate website. Translate the following English UI text to ${languageName}.

RULES:
1. Maintain the same tone - professional, elegant, luxury
2. Keep brand names unchanged: "JBJ Global Real Estate", "Jane Bou Jaoude"
3. Keep technical terms, URLs, and email addresses unchanged
4. Use formal register appropriate for business contexts
5. For Arabic/Persian: Use Modern Standard Arabic (not dialect)
6. Return ONLY a JSON array of translated strings in the exact same order
7. Do NOT add any explanation or markdown

INPUT FORMAT: JSON array of strings
OUTPUT FORMAT: JSON array of translated strings (same length, same order)`
            },
            {
              role: "user",
              content: JSON.stringify(textsToTranslate)
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Translation API error:", errorText);
        // Fallback: return original texts
        return new Response(
          JSON.stringify({ translations: texts }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiResult = await response.json();
      const content = aiResult.choices?.[0]?.message?.content || "[]";
      
      try {
        // Parse the JSON array from AI response
        const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
        newTranslations = Array.isArray(parsed) ? parsed : [];
      } catch (parseError) {
        console.error("Failed to parse AI response:", content);
        // Fallback: return original texts for failed translations
        newTranslations = textsToTranslate;
      }

      // Ensure we have the right number of translations
      while (newTranslations.length < textsToTranslate.length) {
        newTranslations.push(textsToTranslate[newTranslations.length]);
      }

      // Cache new translations
      const cacheRows = textsToTranslate.map((text, i) => ({
        source_text: text,
        target_lang: targetLang,
        translated_text: newTranslations[i] || text,
      }));

      if (cacheRows.length > 0) {
        await supabase
          .from("translation_cache")
          .upsert(cacheRows, { onConflict: "source_text,target_lang" })
          .then(() => console.log(`Cached ${cacheRows.length} translations`));
      }
    }

    // Build final result array
    const result: string[] = [];
    let newIndex = 0;
    
    for (let i = 0; i < texts.length; i++) {
      if (cachedMap.has(texts[i])) {
        result.push(cachedMap.get(texts[i])!);
      } else {
        result.push(newTranslations[newIndex] || texts[i]);
        newIndex++;
      }
    }

    return new Response(
      JSON.stringify({ translations: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Auto-translate error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
