import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getCorsHeaders,
  callLovableAI,
  sanitizeForPrompt,
  errorResponse,
  successResponse,
} from "../_shared/ai-utils.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLanguage, sourceLanguage, context } = await req.json();

    if (!text || !targetLanguage) {
      return errorResponse(corsHeaders, "Text and target language are required", 400);
    }

    const languageMap: Record<string, string> = {
      ar: "Arabic",
      en: "English",
      ru: "Russian",
      zh: "Chinese (Mandarin)",
      hi: "Hindi",
      fa: "Farsi (Persian)",
      fr: "French",
      de: "German",
      es: "Spanish",
      it: "Italian",
      tr: "Turkish",
    };

    const targetLang = languageMap[targetLanguage] || targetLanguage;
    const sourceLang = sourceLanguage ? languageMap[sourceLanguage] || sourceLanguage : "auto-detect";

    const systemPrompt = `You are an expert multilingual translator specializing in real estate and luxury property communications.
Translate accurately while maintaining professional tone and cultural sensitivity.
For Arabic, use formal Modern Standard Arabic suitable for UAE business communications.
Preserve real estate terminology appropriately for each language.`;

    const userPrompt = `Translate the following text:

**Source Language:** ${sourceLang}
**Target Language:** ${targetLang}
**Context:** ${sanitizeForPrompt(context || "Real estate communication")}

**Text to Translate:**
${sanitizeForPrompt(text, 3000)}

Please provide:

1. **Translation:**
   [Provide accurate translation here]

2. **Cultural Notes** (if relevant):
   - Any cultural adaptations made
   - Terms that may need explanation

3. **Key Terms Glossary:**
   - Important real estate terms used
   - Their translations with explanations

4. **Formality Level:**
   - Confirm the register used (formal/informal)
   - Appropriateness for business use

If the source language was auto-detected, specify what language was detected.`;

    console.log("Processing translation:", { targetLanguage, textLength: text.length });

    const aiResponse = await callLovableAI({
      systemPrompt,
      userPrompt,
      model: "google/gemini-2.5-flash",
    });

    if (!aiResponse.success) {
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    return successResponse(corsHeaders, {
      translation: aiResponse.content,
      targetLanguage: targetLang,
      sourceLanguage: sourceLang,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Translation error:", error);
    return errorResponse(corsHeaders, "Failed to translate text", 500);
  }
});
