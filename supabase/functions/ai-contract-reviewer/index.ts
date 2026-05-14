/**
 * AI Contract Reviewer Edge Function
 * 
 * ACCESS: BROKER-ONLY (requires authentication + broker subscription OR owner)
 * 
 * Intelligence Features:
 * - Key Clause Identification
 * - Risk Assessment
 * - Comparison to Standard Terms
 * - Negotiation Points
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

interface ContractRequest {
  contractText: string;
  contractType?: string;
  clientRole?: string;
  specificConcerns?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // WAF Layer
  const waf = await enforceWAF(req, corsHeaders, "ai", "ai-contract-reviewer");
  if (waf.blocked) return waf.response!;

  const startTime = Date.now();
  const clientIp = getClientIp(req);
  const authHeader = req.headers.get("Authorization");
  const { service: supabaseAdmin, user: supabaseUser } = createSupabaseClients(authHeader);

  // BROKER-ONLY
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
      functionName: "ai-contract-reviewer",
      windowMinutes: 5,
      maxRequests: 10,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    const body: ContractRequest = await req.json();
    
    if (!body.contractText) {
      return errorResponse(corsHeaders, "Contract text is required", 400);
    }

    const sanitized = {
      contractText: sanitizeForPrompt(body.contractText, 10000),
      contractType: sanitizeForPrompt(body.contractType, 100) || "purchase agreement",
      clientRole: sanitizeForPrompt(body.clientRole, 50) || "buyer",
      specificConcerns: sanitizeForPrompt(body.specificConcerns, 500),
    };

    const systemPrompt = `You are a real estate contract analyst for JBJ Global Real Estate Dubai.
Review contracts with focus on:
- UAE real estate law compliance
- RERA regulations
- Client protection
- Common pitfalls in Dubai property contracts

IMPORTANT DISCLAIMER: Always note that this is AI-assisted analysis and recommend consultation with a licensed legal professional for binding decisions.`;

    const userPrompt = `Review this ${sanitized.contractType}:

CLIENT ROLE: ${sanitized.clientRole}
SPECIFIC CONCERNS: ${sanitized.specificConcerns || "General review"}

CONTRACT TEXT:
${sanitized.contractText}

Provide review in this JSON format:
{
  "contractType": "${sanitized.contractType}",
  "overallAssessment": {
    "rating": "favorable|neutral|concerning",
    "summary": "2-3 sentence overall assessment"
  },
  "keyClauses": [
    {
      "clause": "Clause name/section",
      "summary": "What it says",
      "assessment": "favorable|neutral|concerning",
      "explanation": "Why this matters for the client"
    }
  ],
  "riskAreas": [
    {
      "risk": "Risk description",
      "severity": "high|medium|low",
      "location": "Where in contract",
      "recommendation": "What to do about it"
    }
  ],
  "missingClauses": [
    {
      "clause": "What's missing",
      "importance": "critical|important|optional",
      "recommendation": "Suggested language or action"
    }
  ],
  "negotiationPoints": [
    {
      "point": "What to negotiate",
      "currentTerm": "What it says now",
      "suggestedTerm": "What to ask for",
      "leverage": "How to argue for this"
    }
  ],
  "financialTerms": {
    "paymentSchedule": "Summary of payment terms",
    "penalties": "Summary of penalties",
    "refundPolicy": "Summary of refund conditions"
  },
  "timeline": {
    "completionDate": "If mentioned",
    "keyDeadlines": ["deadline1", "deadline2"]
  },
  "recommendations": [
    "Specific recommendation for the client"
  ],
  "legalDisclaimer": "This AI analysis is for informational purposes only. Please consult with a licensed legal professional in the UAE before signing any binding agreements."
}`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt, { model: "google/gemini-2.5-pro" });
    
    let review;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        review = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON");
      }
    } catch {
      review = {
        overallAssessment: {
          rating: "neutral",
          summary: sanitizeContactInfo(aiResponse.substring(0, 500)),
        },
        legalDisclaimer: "This AI analysis is for informational purposes only. Please consult with a licensed legal professional.",
      };
    }

    // Ensure disclaimer is always present
    review.legalDisclaimer = review.legalDisclaimer || "This AI analysis is for informational purposes only. Please consult with a licensed legal professional in the UAE before signing any binding agreements.";

    const processingTime = Date.now() - startTime;

    const { data: job } = await supabaseAdmin
      .from("ai_job_master")
      .insert({
        user_id: userId,
        tool_name: "ai-contract-reviewer",
        status: "completed",
        input_payload: {
          contractType: sanitized.contractType,
          clientRole: sanitized.clientRole,
          textLength: sanitized.contractText.length,
        },
        output_payload: {
          overallRating: review.overallAssessment?.rating,
          riskCount: review.riskAreas?.length || 0,
          negotiationPoints: review.negotiationPoints?.length || 0,
        },
        processing_time_ms: processingTime,
        intelligence_features: {
          keyClauseIdentification: true,
          riskAssessment: true,
          negotiationPoints: true,
          complianceCheck: true,
        },
      })
      .select("id")
      .single();

    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-contract-reviewer",
      userId,
      clientIp,
      success: true,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job?.id,
        ...review,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Contract Reviewer error:", error);
    
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-contract-reviewer",
      userId,
      clientIp,
      success: false,
      errorType: "processing_error",
      processingTimeMs: Date.now() - startTime,
    });

    return errorResponse(corsHeaders, "Failed to review contract", 500);
  }
});
