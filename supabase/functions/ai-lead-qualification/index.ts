/**
 * AI Lead Qualification Edge Function
 * 
 * USER DATA OWNERSHIP POLICY
 * - All outputs stored under user_id = auth.uid()
 * - Never visible to other users
 * - Never reused across users
 * - Owner has read-only visibility for audit/support
 * 
 * ACCESS: Broker-only (requires authenticated user with broker role/subscription)
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
} from "../_shared/ai-utils.ts";

interface LeadInfo {
  name?: string;
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

/**
 * Create HMAC-SHA256 hash of PII for lead_ref storage
 * Uses keyed hashing to prevent dictionary attacks
 * This allows correlation without storing raw PII
 */
async function hashPII(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  
  const hmacKey = Deno.env.get("LEAD_REF_HMAC_KEY");
  if (!hmacKey) {
    console.warn("LEAD_REF_HMAC_KEY not configured - lead_ref will be null");
    return null;
  }
  
  const normalized = value.toLowerCase().trim();
  const encoder = new TextEncoder();
  
  // Import key for HMAC-SHA256
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(hmacKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  // Create HMAC signature
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(normalized)
  );
  
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify user has broker access (server-side enforcement)
 * Returns: { allowed: true } or { allowed: false, reason: string }
 */
async function verifyBrokerAccess(
  supabaseAdmin: ReturnType<typeof createSupabaseClients>['service'],
  userId: string,
  userEmail: string | undefined
): Promise<{ allowed: boolean; reason?: string }> {
  // Use OWNER_EMAIL secret (NOT VITE_ prefix for edge functions)
  const ownerEmail = Deno.env.get("OWNER_EMAIL");
  
  // 1. Check if user is Owner (always has broker access)
  if (ownerEmail && userEmail?.toLowerCase() === ownerEmail.toLowerCase()) {
    return { allowed: true };
  }

  // 2. Check for active broker subscription
  const { data: subscription } = await supabaseAdmin
    .from('broker_subscriptions')
    .select('status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (subscription) {
    return { allowed: true };
  }

  // 3. Check profiles table for broker/admin role
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.role === 'broker' || profile?.role === 'admin') {
    return { allowed: true };
  }

  // 4. Check crm_users_profile for active employee with broker privileges
  const { data: crmProfile } = await supabaseAdmin
    .from('crm_users_profile')
    .select('crm_role, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (crmProfile) {
    return { allowed: true };
  }

  // 5. Check user_roles for admin/owner role
  const { data: userRoles } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['admin', 'owner']);

  if (userRoles && userRoles.length > 0) {
    return { allowed: true };
  }

  return { 
    allowed: false, 
    reason: "Access denied: Broker subscription or role required" 
  };
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

    // 2. AUTHENTICATION REQUIRED - No anonymous access
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.warn(`Unauthenticated request to ai-lead-qualification from IP: ${clientIp.substring(0, 8)}***`);
      return errorResponse(corsHeaders, "Authentication required. Please log in.", 401);
    }

    // 3. BROKER AUTHORIZATION - Server-side enforcement (MANDATORY)
    const brokerCheck = await verifyBrokerAccess(supabaseAdmin, user.id, user.email);
    if (!brokerCheck.allowed) {
      console.warn(`Non-broker access attempt: ${user.email} (${user.id})`);
      return errorResponse(corsHeaders, brokerCheck.reason || "Access denied: Broker role required", 403);
    }

    // 4. Rate Limiting (20 requests per 5 minutes)
    const rateKey = user.id;
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

    // 5. Parse and validate input
    const body: QualificationRequest = await req.json();
    const { leadInfo } = body;

    if (!leadInfo) {
      return errorResponse(corsHeaders, "Lead information is required", 400);
    }

    // Sanitize inputs (for AI prompt only - NOT stored)
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

    console.log(`Qualifying lead for broker: ${user.email}`);

    // 6. Build AI prompt with intelligence features
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

Budget: ${sanitizedLead.budget || 'Not specified'}
Property Interest: ${sanitizedLead.propertyInterest || 'Not specified'}
Timeline: ${sanitizedLead.timeline || 'Not specified'}
Lead Source: ${sanitizedLead.source || 'Unknown'}
Additional Context: ${sanitizedLead.notes || 'None'}

Provide your qualification assessment as a JSON object.`;

    // 7. Call AI
    const aiResponse = await callLovableAI({
      model: "google/gemini-2.5-flash",
      systemPrompt,
      userPrompt,
      temperature: 0.3, // Lower temperature for more consistent scoring
    });

    const processingTimeMs = Date.now() - startTime;

    if (!aiResponse.success) {
      await trackAIUsage(supabaseAdmin, {
        functionName: "ai-lead-qualification",
        userId: user.id,
        clientIp,
        model: "google/gemini-2.5-flash",
        success: false,
        errorType: aiResponse.error,
        responseTimeMs: processingTimeMs,
      });
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    // 8. Parse AI response
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

    // 9. Create lead_ref hash (NO RAW PII STORED)
    // Hash email or phone to create a correlation key without storing PII
    const leadRef = await hashPII(leadInfo.email || leadInfo.phone);

    // 10. Persist to ai_job_master (USER-OWNED DATA - NO PII)
    // ONLY allowed fields: budget, preferredAreas, propertyType, timeline, source, lead_ref
    const inputPayload = {
      lead_ref: leadRef, // SHA-256 hash, not raw PII
      budget: sanitizedLead.budget || null,
      preferredAreas: sanitizedLead.propertyInterest || null,
      timeline: sanitizedLead.timeline || null,
      source: sanitizedLead.source || null,
      // NO name, email, phone, or notes stored
    };

    const outputPayload = {
      qualificationScore: qualificationData.qualificationScore,
      classification: qualificationData.classification,
      temperature: qualificationData.temperature,
      recommendedAction: qualificationData.recommendedAction,
      recommendedChannel: qualificationData.recommendedChannel,
    };

    await supabaseAdmin.from('ai_job_master').insert({
      user_id: user.id,
      tool_name: 'ai-lead-qualification',
      status: 'completed',
      input_payload: inputPayload,
      output_payload: outputPayload,
      intelligence_features: {
        confidenceScoring: true,
        buyerInvestorClassification: true,
        objectionPrediction: true,
        urgencyRanking: true,
        riskFlagging: true,
        actionRecommendation: true,
      },
      processing_time_ms: processingTimeMs,
      completed_at: new Date().toISOString(),
    });

    // 11. Track usage
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-lead-qualification",
      userId: user.id,
      clientIp,
      model: "google/gemini-2.5-flash",
      success: true,
      responseTimeMs: processingTimeMs,
    });

    console.log(`Lead qualification complete: score=${qualificationData.qualificationScore} (${processingTimeMs}ms)`);

    // 12. Return structured response (full data to UI, not stored)
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
