import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getCorsHeaders,
  callLovableAI,
  sanitizeForPrompt,
  errorResponse,
  successResponse,
} from "../_shared/ai-utils.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractText, contractType, userRole } = await req.json();

    if (!contractText) {
      return errorResponse(corsHeaders, "Contract text is required", 400);
    }

    const systemPrompt = `You are an expert real estate contract analyst for the UAE market.
Analyze contracts and highlight key terms, potential risks, and important clauses.
IMPORTANT: You are NOT providing legal advice. Always recommend consulting a qualified lawyer.
Focus on helping users understand their documents, not making legal recommendations.`;

    const userPrompt = `Analyze this real estate contract:

**Contract Type:** ${sanitizeForPrompt(contractType || "Real estate agreement")}
**User's Role:** ${sanitizeForPrompt(userRole || "Buyer")}

**Contract Text:**
${sanitizeForPrompt(contractText, 6000)}

Please provide:

## ⚠️ IMPORTANT DISCLAIMER
This is an AI-generated analysis for educational purposes only.
This is NOT legal advice. Consult a qualified UAE lawyer before signing any contract.

## 📋 CONTRACT OVERVIEW
- Document type identified
- Parties involved
- Subject matter

## 💰 FINANCIAL TERMS
- Purchase price/amount
- Payment schedule
- Deposits required
- Penalties mentioned

## 📅 KEY DATES & DEADLINES
- Important dates to note
- Deadline for actions
- Completion/handover dates

## 🔴 HIGH ATTENTION CLAUSES
[Clauses that need careful review]
- Clause description
- Why it matters
- Questions to ask

## 🟡 STANDARD CLAUSES
[Common clauses identified]
- Brief explanation of each

## 📝 OBLIGATIONS SUMMARY
**Your obligations as ${userRole || "party"}:**
- List of your responsibilities

**Other party's obligations:**
- List of their responsibilities

## ⚖️ RISK FACTORS
- Potential concerns identified
- Unusual terms (if any)
- Missing protections (if any)

## ❓ QUESTIONS TO ASK
- Clarifications needed
- Points to negotiate

## ✅ CHECKLIST BEFORE SIGNING
- [ ] Items to verify
- [ ] Documents to request
- [ ] Actions to take

## 🔍 TERMS GLOSSARY
[Explain any legal/technical terms used]

Remember: This analysis is for informational purposes only. 
Always have a qualified UAE real estate lawyer review any contract before signing.`;

    console.log("Processing contract review:", { contractType });

    const aiResponse = await callLovableAI({
      systemPrompt,
      userPrompt,
      model: "google/gemini-2.5-flash",
    });

    if (!aiResponse.success) {
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    return successResponse(corsHeaders, {
      analysis: aiResponse.content,
      contractType: contractType || "Real estate agreement",
      disclaimer: "This is AI-generated analysis for educational purposes only. Not legal advice. Consult a qualified lawyer.",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Contract reviewer error:", error);
    return errorResponse(corsHeaders, "Failed to analyze contract", 500);
  }
});
