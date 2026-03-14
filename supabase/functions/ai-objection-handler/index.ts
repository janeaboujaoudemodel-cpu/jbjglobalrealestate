/**
 * AI Objection Handler Edge Function
 * 
 * ACCESS: BROKER-ONLY (requires authentication + broker subscription OR owner)
 * 
 * Intelligence Features:
 * - Objection Classification
 * - Tailored Response Scripts
 * - Confidence Scoring
 * - Follow-up Suggestions
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
  verifyBrokerAccess,
} from "../_shared/ai-utils.ts";
import { enforceWAF } from "../_shared/waf-middleware.ts";

interface ObjectionRequest {
  objection: string;
  context?: string;
  propertyType?: string;
  clientType?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // WAF Layer
  const waf = await enforceWAF(req, corsHeaders, "ai", "ai-objection-handler");
  if (waf.blocked) return waf.response!;

  const startTime = Date.now();
  const clientIp = getClientIp(req);
  const authHeader = req.headers.get("Authorization");
  const { service: supabaseAdmin, user: supabaseUser } = createSupabaseClients(authHeader);

  // BROKER-ONLY: Verify access
  const accessResult = await verifyBrokerAccess(supabaseUser, supabaseAdmin);
  
  if (!accessResult.authenticated) {
    return new Response(
      JSON.stringify({ error: "Authentication required", code: "UNAUTHENTICATED" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!accessResult.hasBrokerAccess) {
    return new Response(
      JSON.stringify({ error: "Broker subscription required", code: "BROKER_REQUIRED" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = accessResult.userId!;

  try {
    const blockResult = await checkIPBlocklist(supabaseAdmin, clientIp);
    if (blockResult.blocked) {
      return errorResponse(corsHeaders, blockResult.reason || "Access denied", 403);
    }

    const rateResult = await checkRateLimit(supabaseAdmin, userId, clientIp, {
      functionName: "ai-objection-handler",
      windowMinutes: 5,
      maxRequests: 30,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    const body: ObjectionRequest = await req.json();
    
    if (!body.objection) {
      return errorResponse(corsHeaders, "Objection text is required", 400);
    }

    const sanitized = {
      objection: sanitizeForPrompt(body.objection, 500),
      context: sanitizeForPrompt(body.context, 300),
      propertyType: sanitizeForPrompt(body.propertyType, 50) || "residential",
      clientType: sanitizeForPrompt(body.clientType, 50) || "buyer",
    };

    const systemPrompt = `You are an expert real estate sales coach for JBJ Global Real Estate Dubai.
Provide professional, empathetic responses to client objections that:
- Acknowledge the client's concern
- Provide factual, market-based responses
- Guide toward a positive outcome
- Maintain professionalism and trust`;

    const userPrompt = `Handle this client objection:

OBJECTION: "${sanitized.objection}"

CONTEXT:
- Property Type: ${sanitized.propertyType}
- Client Type: ${sanitized.clientType}
- Additional Context: ${sanitized.context || "None provided"}

Provide response in this JSON format:
{
  "objectionType": "price|location|timing|trust|competition|other",
  "severity": "low|medium|high",
  "initialResponse": "Empathetic acknowledgment (1-2 sentences)",
  "mainResponse": "Detailed response script (3-5 sentences)",
  "alternativeResponses": [
    "Alternative response option 1",
    "Alternative response option 2"
  ],
  "supportingPoints": [
    "Key point to emphasize 1",
    "Key point to emphasize 2",
    "Key point to emphasize 3"
  ],
  "questionsToAsk": [
    "Clarifying question to understand better"
  ],
  "followUpActions": [
    "Suggested follow-up action"
  ],
  "doNot": [
    "Thing to avoid saying/doing"
  ],
  "confidence": {
    "score": 85,
    "reasoning": "Why this response should work"
  }
}`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt);
    
    let response;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        response = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON");
      }
    } catch {
      response = {
        mainResponse: sanitizeContactInfo(aiResponse),
        objectionType: "other",
        severity: "medium",
      };
    }

    const processingTime = Date.now() - startTime;

    const { data: job } = await supabaseAdmin
      .from("ai_job_master")
      .insert({
        user_id: userId,
        tool_name: "ai-objection-handler",
        status: "completed",
        input_payload: {
          objectionType: response.objectionType,
          propertyType: sanitized.propertyType,
          clientType: sanitized.clientType,
        },
        output_payload: {
          objectionType: response.objectionType,
          severity: response.severity,
          confidence: response.confidence?.score,
        },
        processing_time_ms: processingTime,
        intelligence_features: {
          objectionClassification: true,
          tailoredResponse: true,
          confidenceScoring: true,
          followUpSuggestions: true,
        },
      })
      .select("id")
      .single();

    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-objection-handler",
      userId,
      clientIp,
      success: true,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job?.id,
        ...response,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Objection Handler error:", error);
    
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-objection-handler",
      userId,
      clientIp,
      success: false,
      errorType: "processing_error",
      processingTimeMs: Date.now() - startTime,
    });

    return errorResponse(corsHeaders, "Failed to generate response", 500);
  }
});
