/**
 * AI Competitor Analysis Edge Function
 * 
 * USER DATA OWNERSHIP POLICY
 * - All outputs stored under user_id = auth.uid()
 * - Never visible to other users
 * - Owner has read-only visibility for audit/support
 * 
 * ACCESS: Public (unauthenticated allowed, but history only saved for authenticated users)
 * 
 * Intelligence Features:
 * - Competitor Property Comparison
 * - Pricing Strategy Analysis
 * - Market Positioning Matrix
 * - SWOT Analysis
 * - Competitive Advantages
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

interface CompetitorRequest {
  projectName: string;
  projectDetails?: string;
  competitorProjects?: string;
  location: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // WAF Layer
  const waf = await enforceWAF(req, corsHeaders, "ai", "ai-competitor-analysis");
  if (waf.blocked) return waf.response!;

  const startTime = Date.now();
  const clientIp = getClientIp(req);
  const authHeader = req.headers.get("Authorization");
  const { service: supabaseAdmin, user: supabaseUser } = createSupabaseClients(authHeader);

  let userId: string | null = null;
  try {
    const { data: { user } } = await supabaseUser.auth.getUser();
    userId = user?.id || null;
  } catch {
    // Anonymous allowed
  }

  try {
    // 1. IP Blocklist
    const blockResult = await checkIPBlocklist(supabaseAdmin, clientIp);
    if (blockResult.blocked) {
      return errorResponse(corsHeaders, blockResult.reason || "Access denied", 403);
    }

    // 2. Rate Limiting
    const rateKey = userId || clientIp;
    const rateResult = await checkRateLimit(supabaseAdmin, rateKey, clientIp, {
      functionName: "ai-competitor-analysis",
      windowMinutes: 5,
      maxRequests: 15,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    // 3. Parse and validate
    const body: CompetitorRequest = await req.json();
    
    if (!body.projectName) {
      return errorResponse(corsHeaders, "Project name is required", 400);
    }

    const sanitized = {
      projectName: sanitizeForPrompt(body.projectName, 100),
      projectDetails: sanitizeForPrompt(body.projectDetails, 500),
      competitorProjects: sanitizeForPrompt(body.competitorProjects, 500),
      location: sanitizeForPrompt(body.location, 100) || "Dubai",
    };

    // 4. Build prompt
    const systemPrompt = `You are a Dubai real estate competitive intelligence analyst for JBJ Global Real Estate.
Provide detailed competitor analysis with actionable insights for positioning and pricing strategy.
Use current Dubai market knowledge. Be specific with recommendations.`;

    const userPrompt = `Analyze competitors for this Dubai property project:

YOUR PROJECT:
- Name: ${sanitized.projectName}
- Location: ${sanitized.location}
- Details: ${sanitized.projectDetails || "General residential/commercial project"}

KNOWN COMPETITORS:
${sanitized.competitorProjects || "Identify likely competitors in the area"}

Provide comprehensive analysis in this JSON format:
{
  "summary": "Executive summary of competitive landscape",
  "competitors": [
    {
      "name": "Competitor project name",
      "developer": "Developer name",
      "priceRange": "AED X - Y per sqft",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "marketShare": "estimated %",
      "targetBuyer": "investor/end-user/mixed"
    }
  ],
  "pricingAnalysis": {
    "marketAverage": "AED X per sqft",
    "premiumRange": "AED X - Y",
    "budgetRange": "AED X - Y",
    "recommendedPositioning": "premium|mid-market|value",
    "pricingStrategy": "Specific pricing recommendation"
  },
  "positioningMatrix": {
    "yourPosition": { "price": "high|mid|low", "quality": "high|mid|low" },
    "competitorPositions": [
      { "name": "competitor", "price": "high|mid|low", "quality": "high|mid|low" }
    ],
    "gap": "Identified market gap opportunity"
  },
  "swot": {
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"],
    "opportunities": ["opportunity1", "opportunity2"],
    "threats": ["threat1", "threat2"]
  },
  "competitiveAdvantages": [
    {
      "advantage": "Description",
      "howToLeverage": "Action to take"
    }
  ],
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2",
    "Specific recommendation 3"
  ],
  "marketTrends": "Key trends affecting competition"
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
        throw new Error("No JSON");
      }
    } catch {
      analysis = {
        summary: sanitizeContactInfo(aiResponse.substring(0, 500)),
        rawAnalysis: sanitizeContactInfo(aiResponse),
      };
    }

    const processingTime = Date.now() - startTime;

    // 7. Save job (authenticated only)
    let jobId: string | null = null;
    if (userId) {
      const { data: job } = await supabaseAdmin
        .from("ai_job_master")
        .insert({
          user_id: userId,
          tool_name: "ai-competitor-analysis",
          status: "completed",
          input_payload: {
            projectName: sanitized.projectName,
            location: sanitized.location,
          },
          output_payload: analysis,
          processing_time_ms: processingTime,
          intelligence_features: {
            competitorComparison: true,
            pricingStrategy: true,
            swotAnalysis: true,
            positioningMatrix: true,
          },
        })
        .select("id")
        .single();
      
      jobId = job?.id || null;
    }

    // 8. Track
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-competitor-analysis",
      userId,
      clientIp,
      success: true,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        analysis: analysis.summary || analysis.rawAnalysis,
        ...analysis,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Competitor Analysis error:", error);
    
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-competitor-analysis",
      userId,
      clientIp,
      success: false,
      errorType: "processing_error",
      processingTimeMs: Date.now() - startTime,
    });

    return errorResponse(corsHeaders, "Failed to generate competitor analysis", 500);
  }
});
