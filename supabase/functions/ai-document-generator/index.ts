import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getCorsHeaders,
  callLovableAI,
  sanitizeForPrompt,
  APPROVED_CONTACT,
  errorResponse,
  successResponse,
} from "../_shared/ai-utils.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      documentType, 
      clientInfo, 
      propertyInfo, 
      customFields 
    } = await req.json();

    if (!documentType) {
      return errorResponse(corsHeaders, "Document type is required", 400);
    }

    const systemPrompt = `You are an expert real estate document generator for JJ Global Capital.
Create professional documents for real estate transactions in the UAE.
Use formal, professional language suitable for business communications.
Company: JJ Global Capital | Contact: ${APPROVED_CONTACT.phone} | ${APPROVED_CONTACT.email}
IMPORTANT: Generated documents are templates and should be reviewed by professionals before use.`;

    const userPrompt = `Generate a ${sanitizeForPrompt(documentType)} document:

**Document Type:** ${sanitizeForPrompt(documentType)}

**Client Information:**
${clientInfo ? sanitizeForPrompt(JSON.stringify(clientInfo)) : "To be filled"}

**Property Information:**
${propertyInfo ? sanitizeForPrompt(JSON.stringify(propertyInfo)) : "To be filled"}

**Additional Fields:**
${customFields ? sanitizeForPrompt(JSON.stringify(customFields)) : "Standard template"}

Based on the document type, please generate:

${documentType.toLowerCase().includes("proposal") ? `
## PROPERTY PROPOSAL

### Cover Page
- JJ Global Capital header
- Client name
- Date
- Reference number

### Executive Summary
- Property highlights
- Investment thesis
- Key benefits

### Property Details
- Full specifications
- Location analysis
- Developer information

### Financial Overview
- Pricing details
- Payment plan options
- Potential returns

### Why This Property
- Unique selling points
- Market comparison
- Future outlook

### About JJ Global Capital
- Company introduction
- Our services
- Why choose us

### Next Steps
- How to proceed
- Contact information

### Disclaimer
Standard investment disclaimer
` : documentType.toLowerCase().includes("offer") ? `
## EXPRESSION OF INTEREST / OFFER LETTER

Date: [Current Date]
Reference: JJG/EOI/[Year]/[Number]

Dear [Developer/Seller],

RE: Expression of Interest - [Property Name]

We, on behalf of our client, express formal interest in the following property...

[Include all standard EOI components]

Yours faithfully,
JJ Global Capital
${APPROVED_CONTACT.phone}
${APPROVED_CONTACT.email}
` : documentType.toLowerCase().includes("requirement") ? `
## CLIENT REQUIREMENT BRIEF

### Client Profile
- Name and contact
- Budget range
- Timeline

### Property Requirements
- Type preferences
- Size requirements
- Location preferences
- Must-have features
- Nice-to-have features

### Investment Criteria
- Purpose (residence/investment)
- Return expectations
- Risk tolerance

### Search Parameters
- Communities shortlisted
- Developers preferred
- Deal-breakers

### Notes
- Special considerations
- Timeline constraints
` : `
## [Document Type] TEMPLATE

### Header
JJ Global Capital
Professional Real Estate Services

### Document Content
[Generate appropriate content based on document type]

### Footer
Contact: ${APPROVED_CONTACT.phone} | ${APPROVED_CONTACT.email}
Website: ${APPROVED_CONTACT.website}
`}

Use [PLACEHOLDER] for any fields that need to be filled in.
Format professionally with clear sections.`;

    console.log("Generating document:", { documentType });

    const aiResponse = await callLovableAI({
      systemPrompt,
      userPrompt,
      model: "google/gemini-2.5-flash",
    });

    if (!aiResponse.success) {
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    return successResponse(corsHeaders, {
      document: aiResponse.content,
      documentType,
      disclaimer: "This is an AI-generated template. Review and customize before use.",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Document generator error:", error);
    return errorResponse(corsHeaders, "Failed to generate document", 500);
  }
});
