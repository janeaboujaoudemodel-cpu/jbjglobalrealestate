/**
 * AI Document Generator Edge Function — Per-Type Smart Prompts
 * 
 * ACCESS: Public (unauthenticated allowed, history saved for authenticated users)
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

interface DocumentRequest {
  documentType: string;
  tone?: string;
  typeFields?: Record<string, string>;
  // Legacy compat
  propertyDetails?: string;
  partyDetails?: string;
  customRequirements?: string;
}

// ─── Per-Type Prompt Configs ─────────────────────────────────────────────────

interface TypePromptConfig {
  systemRole: string;
  outputInstructions: string;
  outputShape: string; // describes the JSON keys to return
}

const TYPE_PROMPTS: Record<string, TypePromptConfig> = {
  "listing": {
    systemRole: `You are an expert Dubai real estate copywriter specialising in property portal listings for Bayut, PropertyFinder, and Dubizzle. 
You write compelling, SEO-optimised listings that attract serious buyers and investors. 
Your listings follow UAE RERA standards, avoid over-promises, and always sound premium yet grounded in facts.`,
    outputInstructions: `Write a 300–400 word property listing with these sections:
1. HEADLINE: A punchy 10–15 word headline that leads with the strongest selling point
2. OVERVIEW: 2–3 sentences introducing the property, lifestyle, and key appeal
3. PROPERTY HIGHLIGHTS: 6–10 bullet points covering bedrooms, bathrooms, size, view, finishes, amenities
4. ABOUT THE COMMUNITY: 2–3 sentences on location advantages and nearby landmarks
5. INVESTMENT APPEAL: 1–2 sentences on ROI / rental yield if provided
6. CALL TO ACTION: 1–2 sentences ending with JBJ Global contact prompt`,
    outputShape: `{
  "document": "Full listing text (sections merged, ready to paste into portal)",
  "headline": "Just the headline alone for easy copying",
  "keyFeatures": ["Feature 1", "Feature 2", ...up to 10],
  "callToAction": "The CTA sentence alone"
}`,
  },

  "email-follow-up": {
    systemRole: `You are a top-performing Dubai real estate agent at JBJ Global Real Estate. 
You write warm, professional, personalised follow-up emails that feel human — not templated. 
Your emails make clients feel valued, recap the viewing clearly, and always include a clear next step.`,
    outputInstructions: `Write a follow-up email with this structure:
1. Subject line (compelling, personal, references the property/meeting)
2. Greeting (personalised to client name)
3. Opening: thank them for their time at the viewing/meeting
4. Recap: 2–3 sentences recapping what they saw and their key requirements
5. Highlight: 2–3 specific property highlights that match their needs
6. Next steps: clear, specific CTA (site visit, EOI form, availability call)
7. Professional sign-off with JBJ Global branding`,
    outputShape: `{
  "document": "Full email body (excluding subject line)",
  "subject": "The email subject line",
  "nextSteps": ["Step 1", "Step 2", "Step 3"]
}`,
  },

  "email-introduction": {
    systemRole: `You are a senior consultant at JBJ Global Real Estate in Dubai. 
You write compelling first-contact introduction emails that build instant credibility and make prospective clients feel understood and welcomed. 
You tailor the message to the client's profile, budget, and interests.`,
    outputInstructions: `Write an introduction email with this structure:
1. Subject line (personalised, creates curiosity or value)
2. Warm greeting using client name
3. Introduction of yourself and JBJ Global Real Estate (2 sentences max — confident, not salesy)
4. Acknowledgement of how they found you and what they're looking for
5. 2–3 sentences showing you understand their needs and can help
6. Brief mention of a relevant property or market insight for their budget/area
7. Clear CTA: schedule a call, WhatsApp, or visit our office
8. Professional sign-off`,
    outputShape: `{
  "document": "Full email body (excluding subject line)",
  "subject": "The email subject line",
  "nextSteps": ["Proposed action 1", "Proposed action 2"]
}`,
  },

  "sms": {
    systemRole: `You write high-converting, concise real estate SMS and WhatsApp messages for Dubai properties. 
Every word must earn its place. You never use filler phrases. 
Your messages create urgency or value immediately and always end with a single clear action.`,
    outputInstructions: `Write TWO versions:
VERSION 1 — SMS: Strictly under 160 characters. Include: client name (if given), core property/offer detail, ONE call to action. No emojis.
VERSION 2 — WhatsApp: Under 320 characters. Can use 1–2 emojis. More detail on property, stronger value proposition, same CTA.
Both versions must feel personal, not broadcast.`,
    outputShape: `{
  "document": "Brief explanation of the messaging approach used",
  "smsVersion": "The SMS text — MUST be under 160 characters",
  "whatsappVersion": "The WhatsApp text — MUST be under 320 characters"
}`,
  },

  "social-media": {
    systemRole: `You are a real estate social media content creator specialising in Dubai luxury property for JBJ Global Real Estate. 
You understand each platform's algorithm, tone, and audience. 
Instagram posts feel aspirational. LinkedIn posts feel insightful. TikTok feels authentic and fast.`,
    outputInstructions: `Write a social media post optimised for the specified platform:
1. HOOK: First line designed to stop the scroll (max 15 words, punchy)
2. BODY: The main post content — 3–6 sentences. Adapt style to platform.
3. CTA: One clear action at the end
4. HASHTAGS: 15–20 relevant hashtags in 3 groups: (general Dubai RE / location-specific / niche/luxury)
Platform guidelines:
- Instagram: aspirational, lifestyle-led, emojis OK
- LinkedIn: professional insights, market data, business tone
- TikTok: punchy, conversational, hook in first 3 words
- Twitter/X: under 280 chars for main text, witty/bold
- Facebook: community-oriented, slightly longer is OK`,
    outputShape: `{
  "document": "Full post body (hook + body + CTA merged, ready to post)",
  "hook": "Just the opening hook line",
  "hashtags": ["#hashtag1", "#hashtag2", ...15-20 tags],
  "platform": "The platform this was written for"
}`,
  },

  "newsletter": {
    systemRole: `You are a real estate content strategist writing newsletters for JBJ Global Real Estate's client database in Dubai. 
Your newsletters are informative, scannable, and always include a reason for the reader to act. 
You write for both investors and lifestyle buyers — adapting based on the target segment.`,
    outputInstructions: `Write a professional email newsletter with these sections:
1. SUBJECT LINE: Compelling, 6–10 words
2. HEADLINE: Bold section header inside the email
3. MARKET PULSE: 2–3 sentences on current Dubai market context
4. FEATURED PROPERTIES: Brief spotlight on 2–3 properties (name, key detail, CTA)
5. MARKET INSIGHT: 1 statistic or trend, explained simply
6. SPECIAL OFFER / EVENT: If provided, 2–3 sentences
7. CLOSING: Warm sign-off with JBJ Global contact info`,
    outputShape: `{
  "document": "Full newsletter content with section headers",
  "subject": "The email subject line for the newsletter",
  "keyFeatures": ["Highlight 1", "Highlight 2", "Highlight 3"]
}`,
  },

  "brochure": {
    systemRole: `You are a luxury real estate copywriter specialising in premium property brochures for Dubai developments. 
Your copy evokes emotion, aspiration, and exclusivity. You sell a lifestyle, not just a property. 
Every section feels premium and polished.`,
    outputInstructions: `Write property brochure copy with these sections:
1. HEADLINE: Evocative, aspirational — 8–12 words
2. TAGLINE: A powerful one-liner that captures the essence
3. OVERVIEW: 3–4 sentences that paint a picture of the lifestyle
4. KEY FEATURES: 6–8 bullet points with premium language
5. THE COMMUNITY: 2–3 sentences on location and surroundings
6. INVESTMENT OPPORTUNITY: Brief mention of value/ROI if applicable
7. CLOSING STATEMENT: 1 premium sentence that seals the emotion`,
    outputShape: `{
  "document": "Full brochure copy with section headers",
  "headline": "The brochure headline",
  "keyFeatures": ["Feature 1", "Feature 2", ...]
}`,
  },

  "client-report": {
    systemRole: `You are a professional real estate consultant at JBJ Global Real Estate preparing a formal property search report for a client. 
Your reports are structured, objective, and actionable. 
You summarise the search clearly and make a clear recommendation.`,
    outputInstructions: `Write a formal client property report with these sections:
1. REPORT HEADER: Client name, date, prepared by agent
2. EXECUTIVE SUMMARY: 2–3 sentences on the client's brief and search outcome
3. CLIENT REQUIREMENTS: Bullet list of their stated needs
4. PROPERTIES REVIEWED: For each property — name, price, key details, pros and cons
5. RECOMMENDATION: Agent's recommended property with clear rationale
6. NEXT STEPS: Numbered list of agreed actions
7. DISCLAIMER: Standard property advice disclaimer`,
    outputShape: `{
  "document": "Full report content with section headers",
  "nextSteps": ["Step 1", "Step 2", "Step 3"]
}`,
  },
};

// ─── Fallback for unknown types ───────────────────────────────────────────────

const FALLBACK_PROMPT: TypePromptConfig = {
  systemRole: "You are a professional real estate document generator for JBJ Global Real Estate Dubai. Generate professional, clear, and legally appropriate documents.",
  outputInstructions: "Write a professional real estate document based on the provided details. Structure it with clear sections, professional language, and a call to action.",
  outputShape: `{
  "document": "Full document content",
  "keyFeatures": ["Point 1", "Point 2"]
}`,
};

// ─── Serve ────────────────────────────────────────────────────────────────────

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
      functionName: "ai-document-generator",
      windowMinutes: 5,
      maxRequests: 10,
    });

    if (!rateResult.allowed) {
      return errorResponse(corsHeaders, "Rate limit exceeded", 429, rateResult.retryAfterSeconds);
    }

    const body: DocumentRequest = await req.json();

    if (!body.documentType) {
      return errorResponse(corsHeaders, "Document type is required", 400);
    }

    const docType = sanitizeForPrompt(body.documentType, 50).toLowerCase();
    const tone = sanitizeForPrompt(body.tone || "professional", 30);

    // Build field context from typeFields (new) or legacy fields
    const typeFields = body.typeFields || {};
    let fieldContext = Object.entries(typeFields)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `${k}: ${sanitizeForPrompt(v, 500)}`)
      .join("\n");

    // Legacy fallback
    if (!fieldContext && (body.propertyDetails || body.partyDetails)) {
      fieldContext = [
        body.propertyDetails ? `Property Details: ${sanitizeForPrompt(body.propertyDetails, 1000)}` : "",
        body.partyDetails ? `Party Details: ${sanitizeForPrompt(body.partyDetails, 500)}` : "",
        body.customRequirements ? `Custom Requirements: ${sanitizeForPrompt(body.customRequirements, 500)}` : "",
      ].filter(Boolean).join("\n");
    }

    if (!fieldContext) {
      return errorResponse(corsHeaders, "Please provide document details", 400);
    }

    const promptConfig = TYPE_PROMPTS[docType] || FALLBACK_PROMPT;

    const systemPrompt = `${promptConfig.systemRole}

IMPORTANT RULES:
- Always maintain a ${tone} tone throughout
- Reference JBJ Global Real Estate where appropriate
- Contact: ${APPROVED_CONTACT.phone} | ${APPROVED_CONTACT.email}
- Include only the contact details provided above — never invent contact information
- Always recommend consulting legal professionals for binding documents
- Return ONLY valid JSON matching the output shape — no markdown code fences, no extra text`;

    const userPrompt = `Document Type: ${docType}
Tone: ${tone}

DETAILS PROVIDED:
${fieldContext}

INSTRUCTIONS:
${promptConfig.outputInstructions}

Return a JSON object matching this exact shape:
${promptConfig.outputShape}

Ensure all text fields are complete, professional, and ready to use as-is.`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt);

    let document: Record<string, unknown> = {};
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        document = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON in response");
      }
    } catch {
      // Fallback: treat raw response as document body
      document = {
        document: sanitizeContactInfo(aiResponse),
      };
    }

    // Sanitize all string fields in the document
    const sanitizeValue = (val: unknown): unknown => {
      if (typeof val === "string") return sanitizeContactInfo(val);
      if (Array.isArray(val)) return val.map(sanitizeValue);
      return val;
    };
    const sanitizedDoc: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(document)) {
      sanitizedDoc[k] = sanitizeValue(v);
    }

    const processingTime = Date.now() - startTime;

    // Save job for authenticated users
    let jobId: string | null = null;
    if (userId) {
      const { data: job } = await supabaseAdmin
        .from("ai_job_master")
        .insert({
          user_id: userId,
          tool_name: "ai-document-generator",
          status: "completed",
          input_payload: { documentType: docType, tone },
          output_payload: {
            documentTitle: sanitizedDoc.headline || sanitizedDoc.subject || docType,
            hasDocument: !!sanitizedDoc.document,
          },
          processing_time_ms: processingTime,
          intelligence_features: {
            perTypePrompts: true,
            structuredOutput: true,
            toneAware: true,
          },
        })
        .select("id")
        .single();
      jobId = job?.id || null;
    }

    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-document-generator",
      userId,
      clientIp,
      success: true,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        ...sanitizedDoc,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Document Generator error:", error);

    await trackAIUsage(supabaseAdmin, {
      functionName: "ai-document-generator",
      userId,
      clientIp,
      success: false,
      errorType: "processing_error",
      processingTimeMs: Date.now() - startTime,
    });

    return errorResponse(corsHeaders, "Failed to generate document", 500);
  }
});
