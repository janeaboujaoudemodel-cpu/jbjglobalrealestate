/**
 * AI Social Media Edge Function
 * 
 * ACCESS: Public (unauthenticated allowed, history saved for authenticated users)
 * 
 * Generates engaging social media content for real estate.
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

interface SocialMediaRequest {
  platform: string;
  contentType: string;
  propertyDetails?: {
    title?: string;
    location?: string;
    price?: string;
    bedrooms?: number;
    features?: string[];
    highlights?: string;
  };
  tone?: string;
  language?: string;
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
      functionName: "ai-social-media",
      windowMinutes: 5,
      maxRequests: 20,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    const body: SocialMediaRequest = await req.json();
    
    if (!body.platform || !body.contentType) {
      return errorResponse(corsHeaders, "Platform and content type are required", 400);
    }

    const sanitized = {
      platform: sanitizeForPrompt(body.platform, 30),
      contentType: sanitizeForPrompt(body.contentType, 50),
      propertyTitle: sanitizeForPrompt(body.propertyDetails?.title, 200) || "",
      location: sanitizeForPrompt(body.propertyDetails?.location, 100) || "Dubai",
      price: sanitizeForPrompt(body.propertyDetails?.price, 50) || "",
      bedrooms: body.propertyDetails?.bedrooms || 0,
      features: (body.propertyDetails?.features || []).map(f => sanitizeForPrompt(f, 50)).join(", "),
      highlights: sanitizeForPrompt(body.propertyDetails?.highlights, 500) || "",
      tone: sanitizeForPrompt(body.tone, 30) || "professional and engaging",
      language: sanitizeForPrompt(body.language, 20) || "English",
    };

    const platformLimits: Record<string, { chars: number; hashtags: number }> = {
      instagram: { chars: 2200, hashtags: 30 },
      facebook: { chars: 63206, hashtags: 10 },
      twitter: { chars: 280, hashtags: 3 },
      linkedin: { chars: 3000, hashtags: 5 },
      tiktok: { chars: 150, hashtags: 10 },
    };

    const limits = platformLimits[sanitized.platform.toLowerCase()] || { chars: 500, hashtags: 10 };

    const systemPrompt = `You are a social media content specialist for JBJ Global Real Estate in Dubai.
Create engaging, platform-optimized content that drives engagement and leads.
Use emojis appropriately, include relevant hashtags, and write compelling copy.`;

    const userPrompt = `Create a ${sanitized.contentType} post for ${sanitized.platform} with these details:

PLATFORM: ${sanitized.platform} (max ${limits.chars} chars, ${limits.hashtags} hashtags)
CONTENT TYPE: ${sanitized.contentType}
TONE: ${sanitized.tone}
LANGUAGE: ${sanitized.language}

${sanitized.propertyTitle ? `PROPERTY: ${sanitized.propertyTitle}` : ''}
${sanitized.location ? `LOCATION: ${sanitized.location}` : ''}
${sanitized.price ? `PRICE: ${sanitized.price}` : ''}
${sanitized.bedrooms ? `BEDROOMS: ${sanitized.bedrooms}` : ''}
${sanitized.features ? `FEATURES: ${sanitized.features}` : ''}
${sanitized.highlights ? `HIGHLIGHTS: ${sanitized.highlights}` : ''}

Provide content in this JSON format:
{
  "mainPost": "Full post content with emojis",
  "caption": "Shorter alternative caption",
  "hashtags": ["hashtag1", "hashtag2", "..."],
  "callToAction": "Strong CTA",
  "hook": "Attention-grabbing first line",
  "imagePrompt": "Description for ideal accompanying image",
  "bestTimeToPost": "Recommended posting time for Dubai audience",
  "storyContent": {
    "slide1": "Story slide 1 text",
    "slide2": "Story slide 2 text",
    "slide3": "Story slide 3 text with CTA"
  },
  "alternativeVersions": [
    "Version 2 of post",
    "Version 3 of post"
  ],
  "engagementTips": ["Tip 1", "Tip 2"]
}`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt);
    
    let socialContent;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        socialContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON");
      }
    } catch {
      socialContent = {
        mainPost: sanitizeContactInfo(aiResponse),
        hashtags: ["#DubaiRealEstate", "#JBJGlobal", "#LuxuryLiving"],
      };
    }

    const processingTime = Date.now() - startTime;

    let jobId: string | null = null;
    if (userId) {
      const { data: job } = await supabaseAdmin
        .from("ai_job_master")
        .insert({
          user_id: userId,
          tool_name: "ai-social-media",
          status: "completed",
          input_payload: {
            platform: sanitized.platform,
            contentType: sanitized.contentType,
            propertyTitle: sanitized.propertyTitle,
          },
          output_payload: socialContent,
          processing_time_ms: processingTime,
          intelligence_features: {
            platformOptimization: true,
            hashtagGeneration: true,
            storyContent: true,
          },
        })
        .select("id")
        .single();
      
      jobId = job?.id || null;
    }

    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-social-media",
      userId,
      clientIp,
      success: true,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        platform: sanitized.platform,
        ...socialContent,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Social Media error:", error);
    
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-social-media",
      userId,
      clientIp,
      success: false,
      errorType: "processing_error",
      processingTimeMs: Date.now() - startTime,
    });

    return errorResponse(corsHeaders, "Failed to generate social content", 500);
  }
});
