/**
 * AI Follow-up Scheduler Edge Function
 * 
 * ACCESS: BROKER-ONLY (requires authentication + broker subscription OR owner)
 * 
 * Intelligence Features:
 * - Optimal Timing Analysis
 * - Channel Recommendation
 * - Message Templates
 * - Priority Scoring
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

interface FollowupRequest {
  leadInfo: string;
  lastInteraction: string;
  interactionType?: string;
  urgency?: string;
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
      functionName: "ai-followup-scheduler",
      windowMinutes: 5,
      maxRequests: 25,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    const body: FollowupRequest = await req.json();
    
    if (!body.leadInfo) {
      return errorResponse(corsHeaders, "Lead information is required", 400);
    }

    const sanitized = {
      leadInfo: sanitizeForPrompt(body.leadInfo, 500),
      lastInteraction: sanitizeForPrompt(body.lastInteraction, 300),
      interactionType: sanitizeForPrompt(body.interactionType, 50) || "inquiry",
      urgency: sanitizeForPrompt(body.urgency, 20) || "normal",
    };

    const systemPrompt = `You are a sales follow-up strategist for JBJ Global Real Estate Dubai.
Provide intelligent follow-up recommendations that:
- Consider optimal timing based on Dubai business hours and culture
- Suggest the best communication channel
- Provide ready-to-use message templates
- Prioritize based on lead quality and urgency`;

    const userPrompt = `Create a follow-up strategy for this lead:

LEAD INFORMATION:
${sanitized.leadInfo}

LAST INTERACTION:
${sanitized.lastInteraction}

INTERACTION TYPE: ${sanitized.interactionType}
URGENCY: ${sanitized.urgency}

Provide strategy in this JSON format:
{
  "priority": "high|medium|low",
  "priorityReason": "Why this priority level",
  "recommendedTiming": {
    "idealDate": "YYYY-MM-DD or relative (e.g., 'Tomorrow')",
    "idealTime": "HH:MM AM/PM",
    "timezone": "GST (Dubai)",
    "reasoning": "Why this timing"
  },
  "recommendedChannel": {
    "primary": "whatsapp|call|email|sms",
    "secondary": "alternative channel",
    "reasoning": "Why this channel"
  },
  "messageTemplates": {
    "whatsapp": "Ready-to-send WhatsApp message",
    "email": {
      "subject": "Email subject line",
      "body": "Email body text"
    },
    "callScript": "Brief call script/talking points"
  },
  "followUpSequence": [
    {
      "day": 1,
      "action": "What to do",
      "channel": "Which channel"
    },
    {
      "day": 3,
      "action": "What to do",
      "channel": "Which channel"
    }
  ],
  "warningSignals": [
    "Signal that lead may be going cold"
  ],
  "conversionTips": [
    "Tip to increase conversion"
  ],
  "estimatedResponseRate": "<percentage>"
}`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt);
    
    let strategy;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        strategy = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON");
      }
    } catch {
      strategy = {
        priority: "medium",
        recommendation: sanitizeContactInfo(aiResponse),
      };
    }

    // Sanitize message templates
    if (strategy.messageTemplates) {
      if (strategy.messageTemplates.whatsapp) {
        strategy.messageTemplates.whatsapp = sanitizeContactInfo(strategy.messageTemplates.whatsapp);
      }
      if (strategy.messageTemplates.email?.body) {
        strategy.messageTemplates.email.body = sanitizeContactInfo(strategy.messageTemplates.email.body);
      }
    }

    const processingTime = Date.now() - startTime;

    const { data: job } = await supabaseAdmin
      .from("ai_job_master")
      .insert({
        user_id: userId,
        tool_name: "ai-followup-scheduler",
        status: "completed",
        input_payload: {
          interactionType: sanitized.interactionType,
          urgency: sanitized.urgency,
        },
        output_payload: {
          priority: strategy.priority,
          recommendedChannel: strategy.recommendedChannel?.primary,
          estimatedResponseRate: strategy.estimatedResponseRate,
        },
        processing_time_ms: processingTime,
        intelligence_features: {
          optimalTiming: true,
          channelRecommendation: true,
          messageTemplates: true,
          priorityScoring: true,
        },
      })
      .select("id")
      .single();

    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-followup-scheduler",
      userId,
      clientIp,
      success: true,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job?.id,
        ...strategy,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Follow-up Scheduler error:", error);
    
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-followup-scheduler",
      userId,
      clientIp,
      success: false,
      errorType: "processing_error",
      processingTimeMs: Date.now() - startTime,
    });

    return errorResponse(corsHeaders, "Failed to generate follow-up strategy", 500);
  }
});
