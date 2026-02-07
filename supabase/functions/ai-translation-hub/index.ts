/**
 * AI Translation Hub Edge Function
 * 
 * ACCESS: Public (unauthenticated allowed, but history only saved for authenticated users)
 * 
 * Intelligence Features:
 * - Real Estate Terminology Awareness
 * - Cultural Adaptation
 * - Multi-language Support
 * - Tone Preservation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getCorsHeaders,
  createSupabaseClients,
  checkIPBlocklist,
  checkRateLimit,
  getClientIp,
  callLovableAI,
  sanitizeForPrompt,
  sanitizeContactInfo,
  trackAIUsage,
  errorResponse,
} from "../_shared/ai-utils.ts";

interface TranslationRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  context?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const clientIp = getClientIp(req);
  const authHeader = req.headers.get("Authorization");
  const { service: supabaseAdmin, user: supabaseUser } = createSupabaseClients(authHeader);

  let userId: string | null = null;
  try {
    const { data: { user } } = await supabaseUser.auth.getUser();
    userId = user?.id || null;
  } catch {}

  try {
    const blockResult = await checkIPBlocklist(supabaseAdmin, clientIp);
    if (blockResult.blocked) {
      return errorResponse(corsHeaders, blockResult.reason || "Access denied", 403);
    }

    const rateKey = userId || clientIp;
    const rateResult = await checkRateLimit(supabaseAdmin, rateKey, clientIp, {
      functionName: "ai-translation-hub",
      windowMinutes: 5,
      maxRequests: 30,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    const body: TranslationRequest = await req.json();
    
    if (!body.text || !body.targetLanguage) {
      return errorResponse(corsHeaders, "Text and target language are required", 400);
    }

    const sanitized = {
      text: sanitizeForPrompt(body.text, 5000),
      sourceLanguage: sanitizeForPrompt(body.sourceLanguage, 50) || "auto-detect",
      targetLanguage: sanitizeForPrompt(body.targetLanguage, 50),
      context: sanitizeForPrompt(body.context, 200) || "real estate",
    };

    const systemPrompt = `You are a professional translator specialized in real estate content for JBJ Global Real Estate Dubai.
Translate accurately while preserving:
- Real estate terminology and industry terms
- Cultural nuances appropriate for the target audience
- Professional tone and formatting
- Any numbers, prices, or measurements (convert if needed)`;

    const userPrompt = `Translate the following text:

SOURCE LANGUAGE: ${sanitized.sourceLanguage}
TARGET LANGUAGE: ${sanitized.targetLanguage}
CONTEXT: ${sanitized.context}

TEXT TO TRANSLATE:
${sanitized.text}

Provide response in this JSON format:
{
  "translatedText": "The full translation here",
  "sourceLanguageDetected": "detected source language",
  "targetLanguage": "${sanitized.targetLanguage}",
  "notes": ["Any translation notes or cultural adaptations made"],
  "terminology": [
    {
      "original": "original term",
      "translated": "translated term",
      "explanation": "why this translation was chosen"
    }
  ],
  "confidence": "high|medium|low"
}`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt);
    
    let result;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON");
      }
    } catch {
      result = {
        translatedText: sanitizeContactInfo(aiResponse),
        sourceLanguageDetected: sanitized.sourceLanguage,
        targetLanguage: sanitized.targetLanguage,
        confidence: "medium",
      };
    }

    const processingTime = Date.now() - startTime;

    let jobId: string | null = null;
    if (userId) {
      const { data: job } = await supabaseAdmin
        .from("ai_job_master")
        .insert({
          user_id: userId,
          tool_name: "ai-translation-hub",
          status: "completed",
          input_payload: {
            sourceLanguage: sanitized.sourceLanguage,
            targetLanguage: sanitized.targetLanguage,
            context: sanitized.context,
            textLength: sanitized.text.length,
          },
          output_payload: {
            targetLanguage: result.targetLanguage,
            confidence: result.confidence,
            hasNotes: result.notes?.length > 0,
          },
          processing_time_ms: processingTime,
          intelligence_features: {
            realEstateTerminology: true,
            culturalAdaptation: true,
            tonePreservation: true,
          },
        })
        .select("id")
        .single();
      
      jobId = job?.id || null;
    }

    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-translation-hub",
      userId,
      clientIp,
      success: true,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        ...result,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Translation Hub error:", error);
    
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-translation-hub",
      userId,
      clientIp,
      success: false,
      errorType: "processing_error",
      processingTimeMs: Date.now() - startTime,
    });

    return errorResponse(corsHeaders, "Failed to translate text", 500);
  }
});
