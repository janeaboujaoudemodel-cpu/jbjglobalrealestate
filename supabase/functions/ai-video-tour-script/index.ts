/**
 * AI Video Tour Script Generator Edge Function
 * 
 * ACCESS: Public (unauthenticated allowed, but history only saved for authenticated users)
 * 
 * Intelligence Features:
 * - Professional Script Structure
 * - Scene-by-Scene Breakdown
 * - Timing Suggestions
 * - Call-to-Action Integration
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
  APPROVED_CONTACT,
} from "../_shared/ai-utils.ts";

interface VideoScriptRequest {
  propertyName: string;
  propertyType: string;
  location: string;
  features?: string;
  targetAudience?: string;
  duration?: string;
  tone?: string;
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
      functionName: "ai-video-tour-script",
      windowMinutes: 5,
      maxRequests: 15,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    const body: VideoScriptRequest = await req.json();
    
    if (!body.propertyName || !body.location) {
      return errorResponse(corsHeaders, "Property name and location are required", 400);
    }

    const sanitized = {
      propertyName: sanitizeForPrompt(body.propertyName, 100),
      propertyType: sanitizeForPrompt(body.propertyType, 50) || "apartment",
      location: sanitizeForPrompt(body.location, 100),
      features: sanitizeForPrompt(body.features, 500),
      targetAudience: sanitizeForPrompt(body.targetAudience, 100) || "investors and end-users",
      duration: sanitizeForPrompt(body.duration, 20) || "2 minutes",
      tone: sanitizeForPrompt(body.tone, 50) || "professional and inviting",
    };

    const systemPrompt = `You are a professional real estate video scriptwriter for JBJ Global Real Estate Dubai.
Create engaging, professional video tour scripts that:
- Highlight key selling points effectively
- Flow naturally from scene to scene
- Include specific timing cues
- End with clear call-to-action using JBJ contact: ${APPROVED_CONTACT.phone}`;

    const userPrompt = `Create a video tour script for:

PROPERTY:
- Name: ${sanitized.propertyName}
- Type: ${sanitized.propertyType}
- Location: ${sanitized.location}
- Key Features: ${sanitized.features || "Modern finishes, great views, prime location"}

REQUIREMENTS:
- Target Audience: ${sanitized.targetAudience}
- Target Duration: ${sanitized.duration}
- Tone: ${sanitized.tone}

Provide script in this JSON format:
{
  "title": "Video title for the tour",
  "totalDuration": "${sanitized.duration}",
  "opening": {
    "duration": "X seconds",
    "visualCue": "What to show",
    "narration": "Opening script text",
    "music": "Background music suggestion"
  },
  "scenes": [
    {
      "sceneNumber": 1,
      "name": "Scene name (e.g., Exterior/Lobby)",
      "duration": "X seconds",
      "visualCue": "What to show/shoot",
      "narration": "Script for this scene",
      "keyPoints": ["highlight1", "highlight2"],
      "transitions": "How to transition to next scene"
    }
  ],
  "closing": {
    "duration": "X seconds",
    "visualCue": "What to show",
    "narration": "Closing script with CTA",
    "callToAction": "Specific CTA text"
  },
  "productionNotes": [
    "Note for videographer/editor"
  ],
  "suggestedShots": [
    "Drone shot of exterior",
    "Wide angle of living room",
    "etc."
  ],
  "hashtags": ["#DubaiRealEstate", "#LuxuryProperty", "etc."]
}`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt);
    
    let script;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        script = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON");
      }
    } catch {
      script = {
        title: `Video Tour: ${sanitized.propertyName}`,
        rawScript: sanitizeContactInfo(aiResponse),
      };
    }

    // Ensure contact info is sanitized
    if (script.closing?.narration) {
      script.closing.narration = sanitizeContactInfo(script.closing.narration);
    }
    if (script.closing?.callToAction) {
      script.closing.callToAction = sanitizeContactInfo(script.closing.callToAction);
    }

    const processingTime = Date.now() - startTime;

    let jobId: string | null = null;
    if (userId) {
      const { data: job } = await supabaseAdmin
        .from("ai_job_master")
        .insert({
          user_id: userId,
          tool_name: "ai-video-tour-script",
          status: "completed",
          input_payload: {
            propertyName: sanitized.propertyName,
            propertyType: sanitized.propertyType,
            location: sanitized.location,
            duration: sanitized.duration,
          },
          output_payload: {
            title: script.title,
            sceneCount: script.scenes?.length || 0,
            totalDuration: script.totalDuration,
          },
          processing_time_ms: processingTime,
          intelligence_features: {
            sceneBreakdown: true,
            timingCues: true,
            productionNotes: true,
            ctaIntegration: true,
          },
        })
        .select("id")
        .single();
      
      jobId = job?.id || null;
    }

    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-video-tour-script",
      userId,
      clientIp,
      success: true,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        ...script,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Video Tour Script error:", error);
    
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-video-tour-script",
      userId,
      clientIp,
      success: false,
      errorType: "processing_error",
      processingTimeMs: Date.now() - startTime,
    });

    return errorResponse(corsHeaders, "Failed to generate video script", 500);
  }
});
