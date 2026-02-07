/**
 * AI Meeting Summarizer Edge Function
 * 
 * ACCESS: BROKER-ONLY (requires authentication + broker subscription OR owner)
 * 
 * Intelligence Features:
 * - Key Points Extraction
 * - Action Items Detection
 * - Decision Tracking
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

interface MeetingRequest {
  meetingNotes: string;
  meetingType?: string;
  participants?: string;
  propertyContext?: string;
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
      functionName: "ai-meeting-summarizer",
      windowMinutes: 5,
      maxRequests: 20,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    const body: MeetingRequest = await req.json();
    
    if (!body.meetingNotes) {
      return errorResponse(corsHeaders, "Meeting notes are required", 400);
    }

    const sanitized = {
      meetingNotes: sanitizeForPrompt(body.meetingNotes, 5000),
      meetingType: sanitizeForPrompt(body.meetingType, 50) || "client meeting",
      participants: sanitizeForPrompt(body.participants, 200),
      propertyContext: sanitizeForPrompt(body.propertyContext, 300),
    };

    const systemPrompt = `You are a professional meeting summarizer for JBJ Global Real Estate Dubai.
Create comprehensive meeting summaries that:
- Extract key discussion points clearly
- Identify all action items with owners
- Note important decisions made
- Suggest appropriate follow-up actions`;

    const userPrompt = `Summarize this meeting:

MEETING TYPE: ${sanitized.meetingType}
PARTICIPANTS: ${sanitized.participants || "Not specified"}
PROPERTY CONTEXT: ${sanitized.propertyContext || "General"}

MEETING NOTES:
${sanitized.meetingNotes}

Provide summary in this JSON format:
{
  "title": "Brief meeting title",
  "date": "${new Date().toISOString().split('T')[0]}",
  "duration": "Estimated duration if mentioned",
  "executiveSummary": "2-3 sentence overview of the meeting",
  "keyPoints": [
    {
      "topic": "Discussion topic",
      "details": "Key details discussed",
      "outcome": "What was decided or concluded"
    }
  ],
  "actionItems": [
    {
      "task": "Specific task to complete",
      "owner": "Who is responsible",
      "deadline": "When it's due",
      "priority": "high|medium|low"
    }
  ],
  "decisions": [
    {
      "decision": "What was decided",
      "rationale": "Why it was decided",
      "impact": "What this affects"
    }
  ],
  "openQuestions": [
    "Question that needs follow-up"
  ],
  "clientSentiment": "positive|neutral|concerned|negative",
  "sentimentNotes": "Why this sentiment assessment",
  "nextSteps": [
    "Recommended next step"
  ],
  "followUpMeeting": {
    "recommended": true,
    "suggestedDate": "When to follow up",
    "agenda": ["Topic to discuss"]
  }
}`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt);
    
    let summary;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summary = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON");
      }
    } catch {
      summary = {
        executiveSummary: sanitizeContactInfo(aiResponse),
        keyPoints: [],
        actionItems: [],
      };
    }

    const processingTime = Date.now() - startTime;

    const { data: job } = await supabaseAdmin
      .from("ai_job_master")
      .insert({
        user_id: userId,
        tool_name: "ai-meeting-summarizer",
        status: "completed",
        input_payload: {
          meetingType: sanitized.meetingType,
          notesLength: sanitized.meetingNotes.length,
        },
        output_payload: {
          keyPointsCount: summary.keyPoints?.length || 0,
          actionItemsCount: summary.actionItems?.length || 0,
          clientSentiment: summary.clientSentiment,
        },
        processing_time_ms: processingTime,
        intelligence_features: {
          keyPointsExtraction: true,
          actionItemsDetection: true,
          decisionTracking: true,
          sentimentAnalysis: true,
        },
      })
      .select("id")
      .single();

    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-meeting-summarizer",
      userId,
      clientIp,
      success: true,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job?.id,
        ...summary,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Meeting Summarizer error:", error);
    
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-meeting-summarizer",
      userId,
      clientIp,
      success: false,
      errorType: "processing_error",
      processingTimeMs: Date.now() - startTime,
    });

    return errorResponse(corsHeaders, "Failed to summarize meeting", 500);
  }
});
