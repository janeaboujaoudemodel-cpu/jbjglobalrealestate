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
      completionYear: sanitizeForPrompt(body.completionYear, 10),
      currentPrice: sanitizeForPrompt(body.currentPrice, 30),
    };

    console.log(`Price prediction for: ${sanitized.location}, ${sanitized.propertyType}`);

    // 4. Build AI prompt
    const systemPrompt = `You are JBJ Price Predictor AI, an expert in Dubai real estate valuation.
Your role is to provide data-driven price predictions with confidence intervals.

You MUST return a JSON object with EXACTLY this structure:
{
  "estimatedPrice": <number in AED>,
  "pricePerSqFt": <number in AED>,
  "confidenceBand": {
    "low": <number>,
    "mid": <number>,
    "high": <number>
  },
  "marketPosition": "<underpriced|fair|overpriced>",
  "marketPositionReason": "<brief explanation>",
  "appreciationForecast": {
    "oneYear": "<percentage with +/->",
    "threeYear": "<percentage with +/->",
    "trend": "<up|stable|down>"
  },
  "neighborhoodFactor": "<positive|neutral|negative>",
  "neighborhoodExplanation": "<brief explanation>",
  "bestTimeToSell": "<month or season>",
  "bestTimeReason": "<brief explanation>",
  "comparables": [
    {"project": "<name>", "price": <number>, "size": <sqft>, "sold": "<date>"}
  ],
  "prediction": "<detailed prediction analysis>"
}

BASE YOUR ANALYSIS ON:
- Dubai Land Department transaction data patterns
- Developer tier (Emaar premium, DAMAC mid-tier, etc.)
- Location desirability factors
- Market cycle timing
- Seasonal patterns (Q4 typically higher due to Expo/tourism)`;

    const sizeInfo = sanitized.size ? `Size: ${sanitized.size} sq ft` : "Size: Not specified";
    const developerInfo = sanitized.developerName ? `Developer: ${sanitized.developerName}` : "";
    const completionInfo = sanitized.completionYear ? `Completion Year: ${sanitized.completionYear}` : "";
    const currentPriceInfo = sanitized.currentPrice ? `Current Listed Price: AED ${sanitized.currentPrice}` : "";

    const userPrompt = `Predict the fair market value for this property:

Location: ${sanitized.location}, Dubai
Property Type: ${sanitized.propertyType}
Bedrooms: ${sanitized.bedrooms}
${sizeInfo}
${developerInfo}
${completionInfo}
${currentPriceInfo}

Provide your price prediction as a JSON object with confidence intervals and comparable sales.`;

    // 5. Call AI
    const aiResponse = await callLovableAI({
      model: "google/gemini-2.5-flash",
      systemPrompt,
      userPrompt,
      temperature: 0.4,
    });

    const processingTimeMs = Date.now() - startTime;

    if (!aiResponse.success) {
      await trackAIUsage(supabaseAdmin, {
        functionName: "ai-price-predictor",
        userId,
        clientIp,
        model: "google/gemini-2.5-flash",
        success: false,
        errorType: aiResponse.error,
        responseTimeMs: processingTimeMs,
      });
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    // 6. Parse response
    const content = aiResponse.content || "";
    let predictionData;

    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      predictionData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      predictionData = {
        estimatedPrice: 0,
        pricePerSqFt: 0,
        confidenceBand: { low: 0, mid: 0, high: 0 },
        marketPosition: "fair",
        appreciationForecast: { oneYear: "0%", threeYear: "0%", trend: "stable" },
        prediction: sanitizeContactInfo(content),
      };
    }

    // 7. Persist to ai_job_master ONLY IF USER IS AUTHENTICATED
    // NO PII stored - only property/location data
    if (userId) {
      const inputPayload = {
        propertyType: sanitized.propertyType,
        location: sanitized.location,
        bedrooms: sanitized.bedrooms,
        size: sanitized.size,
        // NO name, email, phone stored
      };

      const outputPayload = {
        predictedPrice: predictionData.estimatedPrice,
        confidence: predictionData.confidence,
        marketPosition: predictionData.marketPosition,
        priceRange: predictionData.confidenceBand,
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

    console.log(`Price prediction complete: ${predictionData.estimatedPrice} AED (${processingTimeMs}ms)`);

    return new Response(
      JSON.stringify({
        success: true,
        estimatedPrice: predictionData.estimatedPrice,
        pricePerSqFt: predictionData.pricePerSqFt,
        confidenceBand: predictionData.confidenceBand,
        marketPosition: predictionData.marketPosition,
        marketPositionReason: predictionData.marketPositionReason,
        appreciationForecast: predictionData.appreciationForecast,
        neighborhoodFactor: predictionData.neighborhoodFactor,
        neighborhoodExplanation: predictionData.neighborhoodExplanation,
        bestTimeToSell: predictionData.bestTimeToSell,
        bestTimeReason: predictionData.bestTimeReason,
        comparables: predictionData.comparables || [],
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
