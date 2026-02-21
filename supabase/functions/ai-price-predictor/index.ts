/**
 * AI Price Predictor Edge Function
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
 * - Confidence Band (Low/Mid/High prediction range)
 * - Comparable Properties (similar transactions)
 * - Market Position (Underpriced/Fair/Overpriced)
 * - Appreciation Forecast (1-3 year trend)
 * - Neighborhood Factor (area-specific adjustment)
 * - Best Time to Sell (seasonal recommendation)
 * - Appreciation from purchase/Opia price
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

interface PredictionRequest {
  location: string;
  propertyType: string;
  bedrooms: string;
  size?: string;
  developerName?: string;
  completionYear?: string;
  currentPrice?: string;
  projectName?: string;
  paymentPlan?: string;
  amenities?: string[] | string;
  keyFeatures?: string[] | string;
  furnishing?: string;
  bathrooms?: string;
  emirate?: string;
  listingCategory?: string;
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
      functionName: "ai-price-predictor",
      windowMinutes: 5,
      maxRequests: 20,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    // 3. Parse and validate
    const body: PredictionRequest = await req.json();
    
    if (!body.location) {
      return errorResponse(corsHeaders, "Location is required", 400);
    }

    const sanitized = {
      location: sanitizeForPrompt(body.location, 100),
      propertyType: sanitizeForPrompt(body.propertyType, 50) || "apartment",
      bedrooms: sanitizeForPrompt(body.bedrooms, 20) || "2",
      size: sanitizeForPrompt(body.size, 20),
      developerName: sanitizeForPrompt(body.developerName, 100),
      completionYear: sanitizeForPrompt(body.completionYear, 50),
      currentPrice: sanitizeForPrompt(body.currentPrice, 30),
      projectName: sanitizeForPrompt(body.projectName, 150),
      paymentPlan: sanitizeForPrompt(body.paymentPlan, 500),
      amenities: Array.isArray(body.amenities) ? body.amenities.map(a => sanitizeForPrompt(a, 50)).join(", ") : sanitizeForPrompt(body.amenities, 500),
      keyFeatures: Array.isArray(body.keyFeatures) ? body.keyFeatures.map(f => sanitizeForPrompt(f, 50)).join(", ") : sanitizeForPrompt(body.keyFeatures, 500),
      furnishing: sanitizeForPrompt(body.furnishing, 30),
      bathrooms: sanitizeForPrompt(body.bathrooms, 10),
      emirate: sanitizeForPrompt(body.emirate, 30),
      listingCategory: sanitizeForPrompt(body.listingCategory, 50),
    };

    console.log(`Price prediction for: ${sanitized.projectName || sanitized.location}, ${sanitized.propertyType}, by ${sanitized.developerName || 'unknown'}`);

    // 4. Build AI prompt with ALL available data
    const systemPrompt = `You are JBJ Price Predictor AI, a senior Dubai real estate valuation analyst with deep knowledge of every project, developer, and sub-community in the UAE market.

Your role is to provide PRECISE, PROJECT-SPECIFIC price predictions -- NOT generic area averages.

CRITICAL RULES:
1. Identify the EXACT project and developer. Use project-specific transaction data, not area-wide averages.
2. If a purchase/Opia price is provided, calculate the exact appreciation from that price to today's market value.
3. Factor in construction progress: off-plan projects under construction have different valuations than completed ones.
4. Consider the developer's tier and track record (Emaar, Meraas = premium; DAMAC, Sobha = mid-premium; smaller developers = standard).
5. Amenities and furnishing directly impact the price premium -- quantify this.
6. Payment plan attractiveness affects resale value -- assess this vs market standard (typically 60/40 or 70/30).
7. Provide 3 REAL comparable transactions from the same project or adjacent projects, not fabricated data.

You MUST return a JSON object with EXACTLY this structure:
{
  "estimatedPrice": <number in AED - the fair market value TODAY>,
  "pricePerSqFt": <number in AED>,
  "confidenceBand": {
    "low": <number - conservative estimate>,
    "mid": <number - most likely value>,
    "high": <number - optimistic estimate>
  },
  "marketPosition": "<underpriced|fair|overpriced>",
  "marketPositionReason": "<1-2 sentence explanation>",
  "appreciationFromPurchase": {
    "purchasePrice": <number or null if not provided>,
    "currentEstimate": <number>,
    "appreciationPercent": "<percentage like +32%>",
    "annualizedReturn": "<percentage like +8.5% p.a.>",
    "explanation": "<brief explanation of appreciation drivers>"
  },
  "appreciationForecast": {
    "oneYear": "<percentage with +/->",
    "threeYear": "<percentage with +/->",
    "trend": "<up|stable|down>"
  },
  "neighborhoodFactor": "<positive|neutral|negative>",
  "neighborhoodExplanation": "<brief explanation>",
  "bestTimeToSell": "<month or season>",
  "bestTimeReason": "<brief explanation>",
  "constructionProgress": "<percentage or 'Completed'>",
  "developerTier": "<Premium|Mid-Premium|Standard>",
  "comparables": [
    {"project": "<exact project name>", "price": <number>, "size": <sqft>, "sold": "<approx date>", "pricePerSqft": <number>}
  ],
  "paymentPlanAssessment": "<attractive|standard|below-average>",
  "amenitiesPremium": "<percentage premium these amenities add>",
  "prediction": "<detailed 3-4 paragraph analysis covering: 1) Project & developer assessment, 2) Current market position with comparable evidence, 3) Appreciation analysis from purchase price, 4) Forward outlook and recommendation>"
}

BASE YOUR ANALYSIS ON:
- Dubai Land Department transaction data patterns (2023-2025)
- Developer tier and project reputation
- Exact location and sub-community desirability
- Construction completion timeline and handover status
- Payment plan structure vs market standard
- Amenities package and furnishing status
- Current market cycle (Q1 2025: post-Expo sustained growth phase)
- Seasonal patterns (Q4 typically higher due to tourism/events season)`;

    // Build comprehensive user prompt with ALL available data
    const details: string[] = [];
    details.push(`Location: ${sanitized.location}${sanitized.emirate ? `, ${sanitized.emirate}` : ', Dubai'}`);
    details.push(`Property Type: ${sanitized.propertyType}`);
    details.push(`Bedrooms: ${sanitized.bedrooms}`);
    if (sanitized.bathrooms) details.push(`Bathrooms: ${sanitized.bathrooms}`);
    if (sanitized.size) details.push(`Size: ${sanitized.size} sq ft`);
    if (sanitized.projectName) details.push(`Project Name: ${sanitized.projectName}`);
    if (sanitized.developerName) details.push(`Developer: ${sanitized.developerName}`);
    if (sanitized.completionYear) details.push(`Handover / Completion: ${sanitized.completionYear}`);
    if (sanitized.currentPrice) details.push(`Current/Purchase (Opia) Price: AED ${sanitized.currentPrice}`);
    if (sanitized.furnishing) details.push(`Furnishing: ${sanitized.furnishing}`);
    if (sanitized.listingCategory) details.push(`Listing Category: ${sanitized.listingCategory}`);
    if (sanitized.paymentPlan) details.push(`Payment Plan: ${sanitized.paymentPlan}`);
    if (sanitized.amenities) details.push(`Amenities: ${sanitized.amenities}`);
    if (sanitized.keyFeatures) details.push(`Key Features: ${sanitized.keyFeatures}`);

    const userPrompt = `Predict the fair market value for this property with a deep, project-specific analysis:

${details.join('\n')}

IMPORTANT: 
- This is NOT a generic area estimate. Identify the exact project and provide project-specific valuation.
- If a purchase/Opia price is provided, calculate the exact appreciation percentage and annualized return.
- Factor in ALL provided details (amenities, payment plan, furnishing) for the most accurate prediction.
- Return your response as a JSON object.`;

    // 5. Call AI
    let aiContent: string;
    const processingTimeMs = Date.now() - startTime;
    
    try {
      aiContent = await callLovableAI(systemPrompt, userPrompt);
    } catch (aiError) {
      await trackAIUsage(supabaseAdmin, {
        functionName: "ai-price-predictor",
        userId,
        clientIp,
        model: "google/gemini-2.5-flash",
        success: false,
        errorType: aiError instanceof Error ? aiError.message : "AI error",
        responseTimeMs: processingTimeMs,
      });
      return errorResponse(corsHeaders, "AI processing failed", 500);
    }

    // 6. Parse response
    let predictionData;

    try {
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      predictionData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      predictionData = {
        estimatedPrice: 0,
        pricePerSqFt: 0,
        confidenceBand: { low: 0, mid: 0, high: 0 },
        marketPosition: "fair",
        appreciationForecast: { oneYear: "0%", threeYear: "0%", trend: "stable" },
        prediction: sanitizeContactInfo(aiContent),
      };
    }

    // 7. Persist to ai_job_master ONLY IF USER IS AUTHENTICATED
    if (userId) {
      const inputPayload = {
        propertyType: sanitized.propertyType,
        location: sanitized.location,
        bedrooms: sanitized.bedrooms,
        size: sanitized.size,
        projectName: sanitized.projectName,
        developerName: sanitized.developerName,
        listingCategory: sanitized.listingCategory,
      };

      const outputPayload = {
        predictedPrice: predictionData.estimatedPrice,
        confidence: predictionData.confidence,
        marketPosition: predictionData.marketPosition,
        priceRange: predictionData.confidenceBand,
        appreciationFromPurchase: predictionData.appreciationFromPurchase,
      };

      await supabaseAdmin.from('ai_job_master').insert({
        user_id: userId,
        tool_name: 'ai-price-predictor',
        status: 'completed',
        input_payload: inputPayload,
        output_payload: outputPayload,
        intelligence_features: {
          confidenceBands: true,
          comparableProperties: true,
          marketPositioning: true,
          appreciationForecast: true,
          seasonalTiming: true,
          appreciationFromPurchase: true,
          projectSpecific: true,
        },
        processing_time_ms: processingTimeMs,
        completed_at: new Date().toISOString(),
      });
    }

    // 8. Track usage
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-price-predictor",
      userId,
      clientIp,
      model: "google/gemini-2.5-flash",
      success: true,
      responseTimeMs: processingTimeMs,
    });

    console.log(`Price prediction complete: ${predictionData.estimatedPrice} AED for ${sanitized.projectName || sanitized.location} (${processingTimeMs}ms)`);

    return new Response(
      JSON.stringify({
        success: true,
        estimatedPrice: predictionData.estimatedPrice,
        pricePerSqFt: predictionData.pricePerSqFt,
        confidenceBand: predictionData.confidenceBand,
        marketPosition: predictionData.marketPosition,
        marketPositionReason: predictionData.marketPositionReason,
        appreciationFromPurchase: predictionData.appreciationFromPurchase || null,
        appreciationForecast: predictionData.appreciationForecast,
        neighborhoodFactor: predictionData.neighborhoodFactor,
        neighborhoodExplanation: predictionData.neighborhoodExplanation,
        bestTimeToSell: predictionData.bestTimeToSell,
        bestTimeReason: predictionData.bestTimeReason,
        constructionProgress: predictionData.constructionProgress,
        developerTier: predictionData.developerTier,
        comparables: predictionData.comparables || [],
        paymentPlanAssessment: predictionData.paymentPlanAssessment,
        amenitiesPremium: predictionData.amenitiesPremium,
        trend: predictionData.appreciationForecast?.trend || "stable",
        prediction: sanitizeContactInfo(predictionData.prediction || ""),
        generatedAt: new Date().toISOString(),
        disclaimer: "This is an AI-generated estimate. For legal or mortgage matters, consult licensed professionals.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("AI Price Predictor error:", error);
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-price-predictor",
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
