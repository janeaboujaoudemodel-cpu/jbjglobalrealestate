/**
 * AI Market Report Edge Function
 * 
 * ACCESS: Public (unauthenticated allowed, but history only saved for authenticated users)
 * 
 * Intelligence Features:
 * - Market Trend Analysis
 * - Price Movement Tracking
 * - Supply/Demand Indicators
 * - Investment Hotspots
 * - Forecast Projections
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

interface MarketReportRequest {
  area: string;
  propertyType?: string;
  reportType?: string;
  timeframe?: string;
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
      functionName: "ai-market-report",
      windowMinutes: 5,
      maxRequests: 10,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    const body: MarketReportRequest = await req.json();
    
    if (!body.area) {
      return errorResponse(corsHeaders, "Area is required", 400);
    }

    const sanitized = {
      area: sanitizeForPrompt(body.area, 100),
      propertyType: sanitizeForPrompt(body.propertyType, 50) || "all",
      reportType: sanitizeForPrompt(body.reportType, 50) || "comprehensive",
      timeframe: sanitizeForPrompt(body.timeframe, 30) || "current quarter",
    };

    const systemPrompt = `You are a Dubai real estate market analyst for JBJ Global Real Estate.
Generate detailed market reports with current data, trends, and forecasts.
Use AED currency and Dubai-specific market knowledge.`;

    const userPrompt = `Generate a ${sanitized.reportType} market report for:

PARAMETERS:
- Area: ${sanitized.area}
- Property Type: ${sanitized.propertyType}
- Timeframe: ${sanitized.timeframe}

Provide report in this JSON format:
{
  "title": "Market Report: [Area] - [Date]",
  "executiveSummary": "3-4 sentence overview",
  "marketOverview": {
    "currentState": "bullish|bearish|stable",
    "sentiment": "positive|neutral|cautious",
    "description": "Paragraph describing current market"
  },
  "priceAnalysis": {
    "averagePrice": "AED X per sqft",
    "yearOverYearChange": "+X% or -X%",
    "quarterOverQuarterChange": "+X% or -X%",
    "priceRange": { "min": "AED X", "max": "AED Y" },
    "trend": "increasing|stable|decreasing"
  },
  "supplyDemand": {
    "supplyLevel": "high|medium|low",
    "demandLevel": "high|medium|low",
    "inventoryMonths": <number>,
    "newLaunches": <number>,
    "absorption": "<percentage>"
  },
  "keyTrends": [
    {
      "trend": "Trend name",
      "impact": "How it affects the market",
      "outlook": "positive|neutral|negative"
    }
  ],
  "investmentHotspots": [
    {
      "area": "Sub-area name",
      "reason": "Why it's a hotspot",
      "expectedGrowth": "<percentage>"
    }
  ],
  "forecast": {
    "shortTerm": "3-month outlook",
    "mediumTerm": "6-12 month outlook",
    "confidence": "high|medium|low"
  },
  "recommendations": [
    "Recommendation for buyers",
    "Recommendation for sellers",
    "Recommendation for investors"
  ],
  "dataAsOf": "${new Date().toISOString().split('T')[0]}"
}`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt);
    
    let report;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        report = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON");
      }
    } catch {
      report = {
        title: `Market Report: ${sanitized.area}`,
        executiveSummary: sanitizeContactInfo(aiResponse.substring(0, 500)),
        rawReport: sanitizeContactInfo(aiResponse),
      };
    }

    const processingTime = Date.now() - startTime;

    let jobId: string | null = null;
    if (userId) {
      const { data: job } = await supabaseAdmin
        .from("ai_job_master")
        .insert({
          user_id: userId,
          tool_name: "ai-market-report",
          status: "completed",
          input_payload: {
            area: sanitized.area,
            propertyType: sanitized.propertyType,
            reportType: sanitized.reportType,
          },
          output_payload: report,
          processing_time_ms: processingTime,
          intelligence_features: {
            trendAnalysis: true,
            priceMovement: true,
            supplyDemand: true,
            investmentHotspots: true,
            forecast: true,
          },
        })
        .select("id")
        .single();
      
      jobId = job?.id || null;
    }

    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-market-report",
      userId,
      clientIp,
      success: true,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        ...report,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Market Report error:", error);
    
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-market-report",
      userId,
      clientIp,
      success: false,
      errorType: "processing_error",
      processingTimeMs: Date.now() - startTime,
    });

    return errorResponse(corsHeaders, "Failed to generate market report", 500);
  }
});
