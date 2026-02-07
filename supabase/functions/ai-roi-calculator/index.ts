/**
 * AI ROI Calculator Edge Function
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
 * - Investment Scenario Comparison (buy-to-let vs flip vs hold)
 * - Cash Flow Projections (monthly/annual)
 * - Break-even Analysis
 * - Risk Assessment Score
 * - Market Timing Insights
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

interface ROIRequest {
  propertyPrice: string;
  location: string;
  propertyType?: string;
  downPayment?: string;
  mortgageRate?: string;
  mortgageTerm?: string;
  expectedRent?: string;
  appreciationRate?: string;
  holdingPeriod?: string;
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

    // 2. Rate Limiting
    const rateKey = userId || clientIp;
    const rateResult = await checkRateLimit(supabaseAdmin, rateKey, clientIp, {
      functionName: "ai-roi-calculator",
      windowMinutes: 5,
      maxRequests: 20,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    // 3. Parse and validate
    const body: ROIRequest = await req.json();
    
    if (!body.propertyPrice || !body.location) {
      return errorResponse(corsHeaders, "Property price and location are required", 400);
    }

    const sanitized = {
      propertyPrice: sanitizeForPrompt(body.propertyPrice, 30),
      location: sanitizeForPrompt(body.location, 100),
      propertyType: sanitizeForPrompt(body.propertyType, 50) || "apartment",
      downPayment: sanitizeForPrompt(body.downPayment, 30) || "20%",
      mortgageRate: sanitizeForPrompt(body.mortgageRate, 20) || "4.5%",
      mortgageTerm: sanitizeForPrompt(body.mortgageTerm, 20) || "25 years",
      expectedRent: sanitizeForPrompt(body.expectedRent, 30),
      appreciationRate: sanitizeForPrompt(body.appreciationRate, 20) || "5%",
      holdingPeriod: sanitizeForPrompt(body.holdingPeriod, 20) || "5 years",
    };

    // 4. Build prompt
    const systemPrompt = `You are a Dubai real estate investment analyst AI for JBJ Global Real Estate. 
Provide detailed ROI analysis with specific numbers and actionable insights.
Always use AED currency. Be precise with calculations.
Focus on Dubai market specifics: DLD fees (4%), agent commission (2%), maintenance, service charges.`;

    const userPrompt = `Analyze ROI for this Dubai property investment:

PROPERTY DETAILS:
- Price: ${sanitized.propertyPrice}
- Location: ${sanitized.location}
- Type: ${sanitized.propertyType}

FINANCING:
- Down Payment: ${sanitized.downPayment}
- Mortgage Rate: ${sanitized.mortgageRate}
- Term: ${sanitized.mortgageTerm}

INVESTMENT PARAMETERS:
- Expected Monthly Rent: ${sanitized.expectedRent || "estimate based on market"}
- Annual Appreciation: ${sanitized.appreciationRate}
- Holding Period: ${sanitized.holdingPeriod}

Provide a comprehensive analysis in this JSON format:
{
  "summary": "2-3 sentence investment summary",
  "purchaseCosts": {
    "propertyPrice": <number>,
    "dldFee": <number>,
    "agentFee": <number>,
    "otherCosts": <number>,
    "totalAcquisition": <number>
  },
  "financing": {
    "downPayment": <number>,
    "loanAmount": <number>,
    "monthlyMortgage": <number>,
    "totalInterest": <number>
  },
  "rentalAnalysis": {
    "monthlyRent": <number>,
    "annualRent": <number>,
    "serviceCharges": <number>,
    "maintenanceReserve": <number>,
    "netOperatingIncome": <number>,
    "grossYield": "<percentage>",
    "netYield": "<percentage>"
  },
  "cashFlow": {
    "monthlyCashFlow": <number>,
    "annualCashFlow": <number>,
    "cashOnCashReturn": "<percentage>"
  },
  "projections": {
    "year1Value": <number>,
    "year3Value": <number>,
    "year5Value": <number>,
    "totalEquityBuildup": <number>,
    "totalROI": "<percentage>"
  },
  "scenarios": [
    {
      "name": "Buy-to-Let",
      "description": "Hold and rent strategy",
      "projectedReturn": "<percentage>",
      "riskLevel": "low|medium|high"
    },
    {
      "name": "Flip (3-5 years)",
      "description": "Buy, hold, sell for appreciation",
      "projectedReturn": "<percentage>",
      "riskLevel": "low|medium|high"
    }
  ],
  "riskAssessment": {
    "score": <1-10>,
    "factors": ["factor1", "factor2", "factor3"],
    "mitigation": ["strategy1", "strategy2"]
  },
  "recommendation": "Clear investment recommendation",
  "marketTiming": "Current market timing insight for this area",
  "breakEvenMonths": <number>
}`;

    // 5. Call AI
    const aiResponse = await callLovableAI(systemPrompt, userPrompt);
    
    // 6. Parse response
    let analysis;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON in response");
      }
    } catch {
      // Fallback structure
      analysis = {
        summary: sanitizeContactInfo(aiResponse.substring(0, 500)),
        recommendation: "Please contact JBJ Global Real Estate for a detailed analysis.",
        rawAnalysis: sanitizeContactInfo(aiResponse),
      };
    }

    const processingTime = Date.now() - startTime;

    // 7. Save to ai_job_master (authenticated users only)
    let jobId: string | null = null;
    if (userId) {
      const { data: job } = await supabaseAdmin
        .from("ai_job_master")
        .insert({
          user_id: userId,
          tool_name: "ai-roi-calculator",
          status: "completed",
          input_payload: {
            location: sanitized.location,
            propertyType: sanitized.propertyType,
            propertyPrice: sanitized.propertyPrice,
            holdingPeriod: sanitized.holdingPeriod,
          },
          output_payload: analysis,
          processing_time_ms: processingTime,
          intelligence_features: {
            scenarioComparison: true,
            cashFlowProjections: true,
            riskAssessment: true,
            breakEvenAnalysis: true,
          },
        })
        .select("id")
        .single();
      
      jobId = job?.id || null;
    }

    // 8. Track usage
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-roi-calculator",
      userId,
      clientIp,
      success: true,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        ...analysis,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI ROI Calculator error:", error);
    
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-roi-calculator",
      userId,
      clientIp,
      success: false,
      errorType: "processing_error",
      processingTimeMs: Date.now() - startTime,
    });

    return errorResponse(corsHeaders, "Failed to generate ROI analysis", 500);
  }
});
