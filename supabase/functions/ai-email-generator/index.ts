/**
 * AI Email Generator Edge Function
 * 
 * ACCESS: Public (unauthenticated allowed, history saved for authenticated users)
 * 
 * Generates professional real estate emails using AI.
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

interface EmailGeneratorRequest {
  emailType: string;
  context: {
    recipientName?: string;
    propertyDetails?: string;
    purpose?: string;
    tone?: string;
    language?: string;
    additionalContext?: string;
  };
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
      functionName: "ai-email-generator",
      windowMinutes: 5,
      maxRequests: 20,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    const body: EmailGeneratorRequest = await req.json();
    
    if (!body.emailType) {
      return errorResponse(corsHeaders, "Email type is required", 400);
    }

    const sanitized = {
      emailType: sanitizeForPrompt(body.emailType, 50),
      recipientName: sanitizeForPrompt(body.context?.recipientName, 100) || "Valued Client",
      propertyDetails: sanitizeForPrompt(body.context?.propertyDetails, 500) || "",
      purpose: sanitizeForPrompt(body.context?.purpose, 200) || "",
      tone: sanitizeForPrompt(body.context?.tone, 30) || "professional",
      language: sanitizeForPrompt(body.context?.language, 20) || "English",
      additionalContext: sanitizeForPrompt(body.context?.additionalContext, 500) || "",
    };

    const emailTemplates: Record<string, string> = {
      "follow-up": "Follow-up email after property viewing or inquiry",
      "introduction": "Introduction email to new potential client",
      "offer": "Property offer or proposal email",
      "listing-alert": "New listing notification email",
      "market-update": "Market update or newsletter email",
      "thank-you": "Thank you email after meeting or deal",
      "appointment": "Appointment scheduling or confirmation email",
      "negotiation": "Price negotiation or counter-offer email",
    };

    const templateDesc = emailTemplates[sanitized.emailType] || sanitized.emailType;

    const systemPrompt = `You are an HR professional at JBJ Global Real Estate in Dubai.
Write polished, engaging HR emails. Always sign as "HR Department" (never use personal names or CEO title).
Always mention the specific position name the candidate applied for. Be concise but warm.`;

    const userPrompt = `Generate a ${templateDesc} email with these details:

EMAIL TYPE: ${sanitized.emailType}
RECIPIENT: ${sanitized.recipientName}
TONE: ${sanitized.tone}
LANGUAGE: ${sanitized.language}
${sanitized.propertyDetails ? `PROPERTY DETAILS: ${sanitized.propertyDetails}` : ''}
${sanitized.purpose ? `PURPOSE: ${sanitized.purpose}` : ''}
${sanitized.additionalContext ? `ADDITIONAL CONTEXT: ${sanitized.additionalContext}` : ''}

Provide the email in this JSON format:
{
  "subject": "Compelling email subject line",
  "greeting": "Appropriate greeting",
  "body": "Main email content with proper paragraphs",
  "callToAction": "Clear call to action",
  "closing": "Professional closing",
  "signature": "HR Department\\nJBJ Global Real Estate\\nDubai, UAE\\nContact@JBJ.ae",
  "tips": ["Personalization tip 1", "Follow-up tip"],
  "alternativeSubjects": ["Subject option 2", "Subject option 3"]
}`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt);
    
    let emailContent;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        emailContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON");
      }
    } catch {
      emailContent = {
        subject: `${sanitized.emailType} - JBJ Global Real Estate`,
        body: sanitizeContactInfo(aiResponse),
      };
    }

    const processingTime = Date.now() - startTime;

    let jobId: string | null = null;
    if (userId) {
      const { data: job } = await supabaseAdmin
        .from("ai_job_master")
        .insert({
          user_id: userId,
          tool_name: "ai-email-generator",
          status: "completed",
          input_payload: {
            emailType: sanitized.emailType,
            recipientName: sanitized.recipientName,
            tone: sanitized.tone,
          },
          output_payload: emailContent,
          processing_time_ms: processingTime,
          intelligence_features: {
            emailGeneration: true,
            toneMatching: true,
            callToAction: true,
          },
        })
        .select("id")
        .single();
      
      jobId = job?.id || null;
    }

    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-email-generator",
      userId,
      clientIp,
      success: true,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        ...emailContent,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Email Generator error:", error);
    
    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-email-generator",
      userId,
      clientIp,
      success: false,
      errorType: "processing_error",
      processingTimeMs: Date.now() - startTime,
    });

    return errorResponse(corsHeaders, "Failed to generate email", 500);
  }
});
