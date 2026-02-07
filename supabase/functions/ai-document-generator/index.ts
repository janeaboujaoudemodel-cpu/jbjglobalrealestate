/**
 * AI Document Generator Edge Function
 * 
 * ACCESS: Public (unauthenticated allowed, but history only saved for authenticated users)
 * 
 * Intelligence Features:
 * - Template-based Generation
 * - Legal Compliance Awareness
 * - Professional Formatting
 * - Multi-document Types
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
  propertyDetails?: string;
  partyDetails?: string;
  customRequirements?: string;
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

    const sanitized = {
      documentType: sanitizeForPrompt(body.documentType, 100),
      propertyDetails: sanitizeForPrompt(body.propertyDetails, 1000),
      partyDetails: sanitizeForPrompt(body.partyDetails, 500),
      customRequirements: sanitizeForPrompt(body.customRequirements, 500),
    };

    const documentTypes: Record<string, string> = {
      "mou": "Memorandum of Understanding for property sale",
      "offer-letter": "Property offer letter/letter of intent",
      "property-listing": "Professional property listing description",
      "client-report": "Client property search report",
      "investment-summary": "Investment opportunity summary",
      "rental-agreement": "Residential rental agreement outline",
    };

    const docDescription = documentTypes[sanitized.documentType.toLowerCase()] || sanitized.documentType;

    const systemPrompt = `You are a professional real estate document generator for JBJ Global Real Estate Dubai.
Generate professional documents that:
- Follow UAE real estate standards and practices
- Use clear, professional language
- Include appropriate legal disclaimers
- Reference JBJ Global Real Estate contact: ${APPROVED_CONTACT.phone}, ${APPROVED_CONTACT.email}

IMPORTANT: Always include a disclaimer that documents should be reviewed by legal professionals.`;

    const userPrompt = `Generate a ${docDescription}:

DOCUMENT TYPE: ${sanitized.documentType}

PROPERTY DETAILS:
${sanitized.propertyDetails || "To be filled in"}

PARTY DETAILS:
${sanitized.partyDetails || "To be filled in"}

CUSTOM REQUIREMENTS:
${sanitized.customRequirements || "Standard format"}

Provide document in this JSON format:
{
  "documentTitle": "Official document title",
  "documentType": "${sanitized.documentType}",
  "generatedDate": "${new Date().toISOString().split('T')[0]}",
  "sections": [
    {
      "sectionTitle": "Section name",
      "content": "Section content with proper formatting"
    }
  ],
  "placeholders": [
    {
      "field": "[FIELD_NAME]",
      "description": "What to fill in here"
    }
  ],
  "legalDisclaimers": [
    "Disclaimer text"
  ],
  "signatoryBlocks": [
    {
      "party": "Party name/role",
      "lines": ["Name: _______________", "Signature: _______________", "Date: _______________"]
    }
  ],
  "notes": "Any additional notes for the user",
  "recommendedNextSteps": [
    "Next step 1",
    "Next step 2"
  ]
}`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt);
    
    let document;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        document = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON");
      }
    } catch {
      document = {
        documentTitle: `${sanitized.documentType} Document`,
        rawContent: sanitizeContactInfo(aiResponse),
      };
    }

    // Sanitize all text content
    if (document.sections) {
      document.sections = document.sections.map((s: any) => ({
        ...s,
        content: sanitizeContactInfo(s.content),
      }));
    }

    const processingTime = Date.now() - startTime;

    let jobId: string | null = null;
    if (userId) {
      const { data: job } = await supabaseAdmin
        .from("ai_job_master")
        .insert({
          user_id: userId,
          tool_name: "ai-document-generator",
          status: "completed",
          input_payload: {
            documentType: sanitized.documentType,
          },
          output_payload: {
            documentTitle: document.documentTitle,
            sectionCount: document.sections?.length || 0,
          },
          processing_time_ms: processingTime,
          intelligence_features: {
            templateBased: true,
            legalCompliance: true,
            professionalFormatting: true,
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
        ...document,
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
