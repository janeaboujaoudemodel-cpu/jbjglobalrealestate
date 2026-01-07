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
    const { 
      purchasePrice, 
      location, 
      propertyType, 
      size, 
      bedrooms,
      holdingPeriod,
      financingDetails 
    } = await req.json();

    if (!purchasePrice || !location) {
      return errorResponse(corsHeaders, "Purchase price and location are required", 400);
    }

    const systemPrompt = `You are an expert real estate investment analyst for Dubai properties.
Provide detailed ROI projections and investment analysis.
Always include disclaimers that this is for informational purposes only.
Never provide specific financial, tax, or legal advice.`;

    const userPrompt = `Calculate investment ROI for this Dubai property:

**Property Details:**
- Purchase Price: ${sanitizeForPrompt(purchasePrice.toString())} AED
- Location: ${sanitizeForPrompt(location)}
- Property Type: ${sanitizeForPrompt(propertyType || "Apartment")}
- Size: ${sanitizeForPrompt(size?.toString() || "N/A")} sq.ft
- Bedrooms: ${sanitizeForPrompt(bedrooms?.toString() || "N/A")}
- Holding Period: ${sanitizeForPrompt(holdingPeriod?.toString() || "5")} years

**Financing:**
${financingDetails ? sanitizeForPrompt(JSON.stringify(financingDetails)) : "Cash purchase assumed"}

Please provide comprehensive investment analysis:

## 💰 RENTAL INCOME PROJECTION
- Estimated monthly rent
- Annual rental income
- Occupancy rate assumption (typical for area)
- Net rental income (after expenses)

## 📊 GROSS RENTAL YIELD
- Annual yield calculation
- Comparison to area average
- Yield quality rating

## 💵 NET YIELD ANALYSIS
**Annual Expenses to Consider:**
- Service charges (estimated)
- Maintenance allowance
- Management fees (if applicable)
- Insurance

**Net Yield:** Calculate after all expenses

## 📈 CAPITAL APPRECIATION
- Historical area appreciation
- Projected annual appreciation
- Total value at end of holding period
- Capital gain estimation

## 🏦 TOTAL RETURN ON INVESTMENT
- Cumulative rental income
- Capital appreciation
- Total ROI (holding period)
- Annualized ROI

## 💳 CASH FLOW ANALYSIS
- Monthly cash flow projection
- Break-even analysis
- Cash-on-cash return (if financed)

## 📉 RISK ASSESSMENT
- Market risk factors
- Vacancy risk
- Currency considerations
- Mitigation strategies

## ⚖️ INVESTMENT RATING
Score: X/10
- Explanation of rating
- Best suited for: (short-term, long-term, rental focus, etc.)

## ⚠️ DISCLAIMER
This is an AI-generated estimate for informational purposes only. 
Not financial, investment, tax, or legal advice.
Consult qualified professionals before making investment decisions.

Format numbers clearly with AED currency where applicable.`;

    console.log("Processing ROI calculation:", { purchasePrice, location });

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
      inputs: { purchasePrice, location, propertyType, holdingPeriod },
      generatedAt: new Date().toISOString(),
      disclaimer: "AI-generated estimates for informational purposes only. Not investment advice.",
    });
  } catch (error) {
    console.error("ROI calculator error:", error);
    return errorResponse(corsHeaders, "Failed to calculate ROI", 500);
  }
});
