/**
 * AI Neighborhood Insights Edge Function
 * 
 * USER DATA OWNERSHIP POLICY
 * - All outputs stored under user_id = auth.uid()
 * - Never visible to other users
 * - Never reused across users
 * - Owner has read-only visibility for audit/support
 * 
 * ACCESS: Public (unauthenticated allowed, but history only saved for authenticated users)
 * 
 * Intelligence Features:
 * - Livability Score (composite 0-100)
 * - Category Breakdown (Transport, Schools, Healthcare, Safety, Lifestyle)
 * - Demographic Fit (families/professionals/investors)
 * - Hidden Gems (underrated amenities)
 * - Future Development (upcoming infrastructure)
 * - Comparison Mode (side-by-side analysis)
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
import { enforceWAF } from "../_shared/waf-middleware.ts";

interface InsightsRequest {
  location: string;
  interests?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // WAF Layer
  const waf = await enforceWAF(req, corsHeaders, "ai", "ai-neighborhood-insights");
  if (waf.blocked) return waf.response!;

  const startTime = Date.now();
  const clientIp = getClientIp(req);
  const authHeader = req.headers.get("Authorization");
  const { service: supabaseAdmin, user: supabaseUser } = createSupabaseClients(authHeader);

  // Get user if authenticated (optional for public tools)
  let userId: string | null = null;
  try {
    const { data: { user } } = await supabaseUser.auth.getUser();
    userId = user?.id || null;
  } catch {
    // Anonymous user - allowed for public tools
  }

  try {
    // 1. IP Blocklist Check
    const blockResult = await checkIPBlocklist(supabaseAdmin, clientIp);
    if (blockResult.blocked) {
      return errorResponse(corsHeaders, blockResult.reason || "Access denied", 403);
    }

    // 2. Rate Limiting (use IP for anonymous, user ID for authenticated)
    const rateKey = userId || clientIp;
    const rateResult = await checkRateLimit(supabaseAdmin, rateKey, clientIp, {
      functionName: "ai-neighborhood-insights",
      windowMinutes: 5,
      maxRequests: 20,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    // 3. Parse and validate
    const body: InsightsRequest = await req.json();
    
    if (!body.location) {
      return errorResponse(corsHeaders, "Location is required", 400);
    }

    const location = sanitizeForPrompt(body.location, 100);
    const interests = sanitizeForPrompt(body.interests, 300);

    console.log(`Neighborhood insights for: ${location}`);

    // 4. Build AI prompt
    const systemPrompt = `You are JBJ Neighborhood Insights AI, an expert in Dubai community analysis.
Your role is to provide comprehensive neighborhood assessments for home buyers and investors.

You MUST return a JSON object with EXACTLY this structure:
{
  "score": <number 0-10>,
  "livabilityScore": <number 0-100>,
  "categoryScores": {
    "transport": <number 0-10>,
    "schools": <number 0-10>,
    "healthcare": <number 0-10>,
    "shopping": <number 0-10>,
    "dining": <number 0-10>,
    "recreation": <number 0-10>,
    "safety": <number 0-10>
  },
  "highlights": {
    "schools": "<key highlight>",
    "healthcare": "<key highlight>",
    "shopping": "<key highlight>",
    "transport": "<key highlight>"
  },
  "demographicFit": {
    "bestFor": ["<demographic1>", "<demographic2>"],
    "notIdealFor": ["<demographic>"],
    "reason": "<explanation>"
  },
  "hiddenGems": [
    {"name": "<place>", "type": "<category>", "why": "<reason>"}
  ],
  "futureDevelopment": [
    {"project": "<name>", "timeline": "<year>", "impact": "<description>"}
  ],
  "investmentPotential": {
    "rating": "<high|medium|low>",
    "reason": "<explanation>",
    "rentalYield": "<percentage range>"
  },
  "insights": "<comprehensive neighborhood analysis text>"
}

SCORING CRITERIA:
- Transport: Metro proximity, bus routes, taxi availability, parking
- Schools: KHDA ratings, curriculum variety, proximity
- Healthcare: Hospital distance, clinic availability, specialties
- Shopping: Malls, supermarkets, daily needs
- Dining: Restaurant variety, cafes, delivery options
- Recreation: Parks, gyms, beaches, entertainment
- Safety: Crime rates, security, community feel`;

    const interestsClause = interests 
      ? `\n\nPay special attention to: ${interests}` 
      : "";

    const userPrompt = `Provide comprehensive neighborhood insights for: ${location}, Dubai${interestsClause}

Include all category scores, demographic analysis, hidden gems, and future development projects.`;

    // 5. Call AI
    let aiContent: string;
    const processingTimeMs = Date.now() - startTime;
    
    try {
      aiContent = await callLovableAI(systemPrompt, userPrompt);
    } catch (aiError) {
      await trackAIUsage(supabaseAdmin, {
        functionName: "ai-neighborhood-insights",
        userId,
        clientIp,
        model: "google/gemini-3-flash-preview",
        success: false,
        errorType: aiError instanceof Error ? aiError.message : "AI error",
        responseTimeMs: processingTimeMs,
      });
      return errorResponse(corsHeaders, "AI processing failed", 500);
    }

    // 6. Parse response
    let insightsData;

    try {
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      insightsData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      insightsData = {
        score: 7,
        livabilityScore: 70,
        categoryScores: {
          transport: 7,
          schools: 7,
          healthcare: 7,
          shopping: 7,
          dining: 7,
          recreation: 7,
          safety: 8,
        },
        highlights: {
          schools: "Various options available",
          healthcare: "Clinics and hospitals nearby",
          shopping: "Multiple shopping centers",
          transport: "Good connectivity",
        },
        insights: sanitizeContactInfo(aiContent),
      };
    }

    // 7. Persist to ai_job_master ONLY IF USER IS AUTHENTICATED
    if (userId) {
      const inputPayload = {
        location,
        interests,
      };

      const outputPayload = {
        livabilityScore: insightsData.livabilityScore,
        investmentRating: insightsData.investmentPotential?.rating,
        demographicFit: insightsData.demographicFit?.bestFor,
      };

      await supabaseAdmin.from('ai_job_master').insert({
        user_id: userId,
        tool_name: 'ai-neighborhood-insights',
        status: 'completed',
        input_payload: inputPayload,
        output_payload: outputPayload,
        intelligence_features: {
          livabilityScore: true,
          categoryBreakdown: true,
          demographicFit: true,
          hiddenGems: true,
          futureDevelopment: true,
          investmentPotential: true,
        },
        processing_time_ms: processingTimeMs,
        completed_at: new Date().toISOString(),
      });
    }

    // 8. Track usage
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-neighborhood-insights",
      userId,
      clientIp,
      model: "google/gemini-2.5-flash",
      success: true,
      responseTimeMs: processingTimeMs,
    });

    console.log(`Neighborhood insights complete: score=${insightsData.score}/10 (${processingTimeMs}ms)`);

    return new Response(
      JSON.stringify({
        success: true,
        location,
        score: insightsData.score,
        livabilityScore: insightsData.livabilityScore,
        categoryScores: insightsData.categoryScores,
        highlights: insightsData.highlights,
        demographicFit: insightsData.demographicFit,
        hiddenGems: insightsData.hiddenGems || [],
        futureDevelopment: insightsData.futureDevelopment || [],
        investmentPotential: insightsData.investmentPotential,
        insights: sanitizeContactInfo(insightsData.insights || ""),
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("AI Neighborhood Insights error:", error);
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-neighborhood-insights",
      userId,
      clientIp,
      model: "google/gemini-2.5-flash",
      success: false,
      errorType: error instanceof Error ? error.message : "Unknown error",
      responseTimeMs: Date.now() - startTime,
    });
    
    return errorResponse(corsHeaders, error instanceof Error ? error.message : "An error occurred", 500);
  }
});
