/**
 * AI Lead Qualification Edge Function
 * 
 * USER DATA OWNERSHIP POLICY
 * - All outputs stored under user_id = auth.uid()
 * - Never visible to other users
 * - Never reused across users
 * - Owner has read-only visibility for audit/support
 * 
 * Intelligence Features:
 * - Confidence Score (0-100 conversion probability)
 * - Buyer vs Investor Classification
 * - Objection Probability & Prediction
 * - Follow-up Urgency (hot/warm/cold)
 * - Risk Flags (budget mismatch, timeline issues)
 * - Recommended Next Action
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
  successResponse,
} from "../_shared/ai-utils.ts";

interface LeadInfo {
  name: string;
  email?: string;
  phone?: string;
  budget?: string;
  propertyInterest?: string;
  timeline?: string;
  source?: string;
  notes?: string;
}

interface QualificationRequest {
  leadInfo: LeadInfo;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const clientIp = getClientIp(req);
  const authHeader = req.headers.get("Authorization");
  const { service: supabaseAdmin, user: supabaseUser } = createSupabaseClients(authHeader);

  try {
    // 1. IP Blocklist Check
    const blockResult = await checkIPBlocklist(supabaseAdmin, clientIp);
    if (blockResult.blocked) {
      return errorResponse(corsHeaders, blockResult.reason || "Access denied", 403);
    }

    // 2. Rate Limiting (20 requests per 5 minutes)
    const rateKey = clientIp;
    const rateResult = await checkRateLimit(supabaseAdmin, rateKey, clientIp, {
      functionName: "ai-lead-qualification",
      windowMinutes: 5,
      maxRequests: 20,
    });

    if (!rateResult.allowed) {
      return errorResponse(
        corsHeaders,
        "Rate limit exceeded. Please try again later.",
        429,
        rateResult.retryAfterSeconds
      );
    }

    // 3. Parse and validate input
    const body: QualificationRequest = await req.json();
    const { leadInfo } = body;

    if (!leadInfo?.name) {
      return errorResponse(corsHeaders, "Lead name is required", 400);
    }

    // Sanitize inputs
    const sanitizedLead = {
      name: sanitizeForPrompt(leadInfo.name, 100),
      email: sanitizeForPrompt(leadInfo.email, 100),
      phone: sanitizeForPrompt(leadInfo.phone, 50),
      budget: sanitizeForPrompt(leadInfo.budget, 100),
      propertyInterest: sanitizeForPrompt(leadInfo.propertyInterest, 200),
      timeline: sanitizeForPrompt(leadInfo.timeline, 100),
      source: sanitizeForPrompt(leadInfo.source, 100),
      notes: sanitizeForPrompt(leadInfo.notes, 500),
    };

    console.log(`Qualifying lead: ${sanitizedLead.name.substring(0, 20)}...`);

    // 4. Build AI prompt with intelligence features
    const systemPrompt = `You are JBJ Lead Qualification AI, an expert in Dubai real estate lead assessment.
Your role is to analyze lead information and provide actionable qualification insights.

You MUST return a JSON object with EXACTLY this structure:
{
  "qualificationScore": <number 0-100>,
  "classification": "<buyer|investor|undetermined>",
  "temperature": "<hot|warm|lukewarm|cold>",
  "objectionProbability": <number 0-100>,
  "predictedObjections": ["<objection1>", "<objection2>"],
  "riskFlags": ["<risk1>", "<risk2>"],
  "recommendedAction": "<specific action>",
  "recommendedChannel": "<call|whatsapp|email|in-person>",
  "urgency": "<immediate|within_24h|within_week|flexible>",
  "analysis": "<detailed analysis text>"
}

SCORING CRITERIA:
- Budget clarity: +20 if specific, +10 if range given
- Timeline specificity: +20 if < 3 months, +10 if 3-6 months
- Property interest clarity: +15 if specific area/type mentioned
- Contact completeness: +10 if phone, +5 if email only
- Source quality: +15 for referral, +10 for website, +5 for cold

CLASSIFICATION RULES:
- Investor: mentions ROI, rental yield, multiple units, portfolio
- Buyer: mentions family, schools, personal use, first home
- Undetermined: insufficient signals

OBJECTION PREDICTION:
- Budget < typical area prices = price objection likely
- Long timeline = timing objection
- Vague requirements = trust/fit objection
- Multiple inquiries = competition objection`;

    const userPrompt = `Analyze this lead for qualification:

Name: ${sanitizedLead.name}
Email: ${sanitizedLead.email || 'Not provided'}
Phone: ${sanitizedLead.phone || 'Not provided'}
Budget: ${sanitizedLead.budget || 'Not specified'}
Property Interest: ${sanitizedLead.propertyInterest || 'Not specified'}
Timeline: ${sanitizedLead.timeline || 'Not specified'}
Lead Source: ${sanitizedLead.source || 'Unknown'}
Additional Notes: ${sanitizedLead.notes || 'None'}

Provide your qualification assessment as a JSON object.`;

    // 5. Call AI
    const aiResponse = await callLovableAI({
      model: "google/gemini-2.5-flash",
      systemPrompt,
      userPrompt,
      temperature: 0.3, // Lower temperature for more consistent scoring
    });

    if (!aiResponse.success) {
      await trackAIUsage(supabaseAdmin, {
        functionName: "ai-lead-qualification",
        clientIp,
        model: "google/gemini-2.5-flash",
        success: false,
        errorType: aiResponse.error,
        responseTimeMs: Date.now() - startTime,
      });
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    // 6. Parse AI response
    const content = aiResponse.content || "";
    let qualificationData;

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      qualificationData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback: create structured response from raw content
      qualificationData = {
        qualificationScore: 50,
        classification: "undetermined",
        temperature: "warm",
        objectionProbability: 30,
        predictedObjections: [],
        riskFlags: [],
        recommendedAction: "Conduct discovery call to gather more information",
        recommendedChannel: "call",
        urgency: "within_24h",
        analysis: sanitizeContactInfo(content),
      };
    }

    // 7. Track usage
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-lead-qualification",
      clientIp,
      model: "google/gemini-2.5-flash",
      success: true,
      responseTimeMs: Date.now() - startTime,
    });

    const responseTimeMs = Date.now() - startTime;
    console.log(`Lead qualification complete: score=${qualificationData.qualificationScore} (${responseTimeMs}ms)`);

    // 8. Return structured response
    return new Response(
      JSON.stringify({
        success: true,
        qualificationScore: qualificationData.qualificationScore,
        classification: qualificationData.classification,
        temperature: qualificationData.temperature,
        objectionProbability: qualificationData.objectionProbability,
        predictedObjections: qualificationData.predictedObjections || [],
        riskFlags: qualificationData.riskFlags || [],
        recommendedAction: qualificationData.recommendedAction,
        recommendedChannel: qualificationData.recommendedChannel,
        urgency: qualificationData.urgency,
        analysis: sanitizeContactInfo(qualificationData.analysis || ""),
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("AI Lead Qualification error:", error);
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-lead-qualification",
      clientIp,
      model: "google/gemini-2.5-flash",
      success: false,
      errorType: error instanceof Error ? error.message : "Unknown error",
      responseTimeMs: Date.now() - startTime,
    });
    
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return errorResponse(corsHeaders, errorMessage, 500);
  }
});
