/**
 * AI Client Matcher Edge Function
 * 
 * ACCESS: Public (unauthenticated allowed, history saved for authenticated users)
 * 
 * Matches client preferences with properties using AI analysis.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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

interface ClientMatcherRequest {
  clientPreferences: {
    budget: { min: number; max: number; currency: string };
    location: string[];
    propertyType: string[];
    bedrooms: { min: number; max: number };
    features: string[];
    investmentGoal?: string;
    timeline?: string;
  };
  availableListings?: {
    id: string;
    title: string;
    price: number;
    location: string;
    type: string;
    bedrooms: number;
    features: string[];
  }[];
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
      functionName: "ai-client-matcher",
      windowMinutes: 5,
      maxRequests: 15,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    const body: ClientMatcherRequest = await req.json();
    
    if (!body.clientPreferences) {
      return errorResponse(corsHeaders, "Client preferences are required", 400);
    }

    const prefs = body.clientPreferences;
    const sanitizedPrefs = {
      budgetMin: prefs.budget?.min || 500000,
      budgetMax: prefs.budget?.max || 5000000,
      currency: sanitizeForPrompt(prefs.budget?.currency, 10) || "AED",
      locations: (prefs.location || []).map(l => sanitizeForPrompt(l, 50)).join(", "),
      propertyTypes: (prefs.propertyType || []).map(t => sanitizeForPrompt(t, 30)).join(", "),
      bedroomsMin: prefs.bedrooms?.min || 1,
      bedroomsMax: prefs.bedrooms?.max || 5,
      features: (prefs.features || []).map(f => sanitizeForPrompt(f, 30)).join(", "),
      investmentGoal: sanitizeForPrompt(prefs.investmentGoal, 100) || "personal use",
      timeline: sanitizeForPrompt(prefs.timeline, 50) || "within 6 months",
    };

    const listingsContext = body.availableListings 
      ? `\n\nAvailable Listings to Match:\n${body.availableListings.slice(0, 10).map(l => 
          `- ${l.title}: ${l.price} ${sanitizedPrefs.currency}, ${l.location}, ${l.bedrooms}BR, ${l.features.join(', ')}`
        ).join('\n')}`
      : '';

    const systemPrompt = `You are a Dubai real estate client matching specialist for JBJ Global Real Estate.
Your task is to analyze client preferences and suggest ideal property matches with detailed reasoning.
Use AED currency and Dubai-specific market knowledge.`;

    const userPrompt = `Match properties for a client with these preferences:

CLIENT PROFILE:
- Budget: ${sanitizedPrefs.budgetMin.toLocaleString()} - ${sanitizedPrefs.budgetMax.toLocaleString()} ${sanitizedPrefs.currency}
- Preferred Locations: ${sanitizedPrefs.locations || "Any Dubai"}
- Property Types: ${sanitizedPrefs.propertyTypes || "Any"}
- Bedrooms: ${sanitizedPrefs.bedroomsMin} - ${sanitizedPrefs.bedroomsMax}
- Must-Have Features: ${sanitizedPrefs.features || "Standard"}
- Investment Goal: ${sanitizedPrefs.investmentGoal}
- Timeline: ${sanitizedPrefs.timeline}
${listingsContext}

Provide matching analysis in this JSON format:
{
  "clientProfile": {
    "summary": "One paragraph describing ideal client profile",
    "buyerType": "investor|end-user|mixed",
    "priorityFactors": ["factor1", "factor2", "factor3"]
  },
  "recommendedAreas": [
    {
      "area": "Area name",
      "matchScore": 95,
      "reason": "Why this area fits",
      "priceRange": "AED X - Y per sqft",
      "highlights": ["highlight1", "highlight2"]
    }
  ],
  "propertyRecommendations": [
    {
      "type": "Property type description",
      "idealSize": "X - Y sqft",
      "targetPrice": "AED X - Y",
      "features": ["recommended feature 1", "feature 2"],
      "investmentPotential": "high|medium|low",
      "rentalYield": "X-Y%"
    }
  ],
  "matchingStrategy": {
    "searchApproach": "How to search for ideal properties",
    "negotiationTips": ["tip1", "tip2"],
    "redFlags": ["what to avoid 1", "what to avoid 2"]
  },
  "nextSteps": [
    "Immediate action 1",
    "Action 2",
    "Action 3"
  ]
}`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt);
    
    let matchAnalysis;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        matchAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON");
      }
    } catch {
      matchAnalysis = {
        clientProfile: {
          summary: sanitizeContactInfo(aiResponse.substring(0, 500)),
        },
        rawAnalysis: sanitizeContactInfo(aiResponse),
      };
    }

    const processingTime = Date.now() - startTime;

    let jobId: string | null = null;
    if (userId) {
      const { data: job } = await supabaseAdmin
        .from("ai_job_master")
        .insert({
          user_id: userId,
          tool_name: "ai-client-matcher",
          status: "completed",
          input_payload: {
            preferences: sanitizedPrefs,
          },
          output_payload: matchAnalysis,
          processing_time_ms: processingTime,
          intelligence_features: {
            clientProfiling: true,
            areaMatching: true,
            investmentAnalysis: true,
          },
        })
        .select("id")
        .single();
      
      jobId = job?.id || null;
    }

    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-client-matcher",
      userId,
      clientIp,
      success: true,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        ...matchAnalysis,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Client Matcher error:", error);
    
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-client-matcher",
      userId,
      clientIp,
      success: false,
      errorType: "processing_error",
      processingTimeMs: Date.now() - startTime,
    });

    return errorResponse(corsHeaders, "Failed to match client preferences", 500);
  }
});
