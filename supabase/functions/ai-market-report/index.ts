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
    const { reportType, areas, propertyTypes, period } = await req.json();

    const systemPrompt = `You are an expert Dubai real estate market analyst.
Generate comprehensive market reports based on current trends and data.
Provide actionable insights for investors and buyers.
Always include appropriate disclaimers about data sources and predictions.`;

    const userPrompt = `Generate a ${sanitizeForPrompt(reportType || "weekly")} Dubai real estate market report:

**Report Parameters:**
- Focus Areas: ${sanitizeForPrompt(areas?.join(", ") || "All Dubai")}
- Property Types: ${sanitizeForPrompt(propertyTypes?.join(", ") || "All types")}
- Reporting Period: ${sanitizeForPrompt(period || "Last 7 days")}

Please provide a comprehensive report including:

## 📊 MARKET OVERVIEW
- Overall market sentiment
- Transaction volume trends
- Price movement summary

## 📈 PRICE TRENDS
- Average price per sqft by area
- Week-over-week changes
- Month-over-month comparison
- Year-over-year performance

## 🏗️ SUPPLY & DEMAND
- New listings analysis
- Inventory levels
- Days on market averages
- Buyer activity indicators

## 🔥 HOT AREAS
- Top performing communities
- Emerging opportunities
- Areas to watch

## 💰 INVESTMENT INSIGHTS
- Best value propositions
- Rental yield trends
- Capital appreciation potential
- Risk assessment

## 🏢 DEVELOPER ACTIVITY
- New project launches
- Handover updates
- Payment plan trends

## 🔮 OUTLOOK
- Short-term forecast (30 days)
- Key events to watch
- Recommended actions

## ⚠️ DISCLAIMER
Include that this is AI-generated analysis for informational purposes only.

Format with clear headers, bullet points, and highlight key statistics.`;

    console.log("Generating market report:", { reportType, areas });

    const aiResponse = await callLovableAI({
      systemPrompt,
      userPrompt,
      model: "google/gemini-2.5-flash",
    });

    if (!aiResponse.success) {
      return errorResponse(corsHeaders, aiResponse.error || "AI processing failed", aiResponse.status || 500);
    }

    return successResponse(corsHeaders, {
      report: aiResponse.content,
      reportType: reportType || "weekly",
      areas: areas || ["All Dubai"],
      generatedAt: new Date().toISOString(),
      disclaimer: "AI-generated analysis for informational purposes only. Not investment advice.",
    });
  } catch (error) {
    console.error("Market report error:", error);
    return errorResponse(corsHeaders, "Failed to generate market report", 500);
  }
});
