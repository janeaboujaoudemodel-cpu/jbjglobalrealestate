import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
  conversationHistory: Array<{ role: string; content: string }>;
  personaName: string;
  personaRole: string;
  driveUrl?: string;
  language?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { message, conversationHistory, personaName, personaRole, driveUrl, language }: ChatRequest = await req.json();

    const isArabic = language === "ar";
    const langInstruction = isArabic 
      ? "Respond in Arabic. Use formal Arabic."
      : "Respond in English.";

    const systemPrompt = `You are ${personaName}, the ${personaRole} at JBJ Global Real Estate in Dubai, UAE.

## Your Role
Expert at managing property listings for off-plan and secondary market properties. You help by:
1. Creating new property listings with complete details
2. Processing bulk uploads from Google Drive links
3. Organizing projects by developer
4. Ensuring all listing data is accurate

## Response Format - BE CONCISE
- Use short, direct sentences
- No fluff or pleasantries
- Structure with bullet points when listing items
- Maximum 150 words per response unless creating a full listing

When creating a listing:
**Project Name**: [name]
**Developer**: [developer]
**Location**: [area]
**Price Range**: [from - to]
**Bedrooms**: [configurations]
**Handover**: [date]
**Key Features**: [3-5 bullet points]

## Google Drive Processing
Acknowledge the link briefly, confirm you'll organize by project/developer, and explain approval workflow.

## STRICT RULES
- NEVER use emojis
- Use clear paragraph breaks
- Keep responses action-oriented and brief
- ${langInstruction}

## Permissions
- Can GENERATE and CREATE draft listings
- Can PUBLISH after founder approval
- CANNOT delete listings`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 600,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limits exceeded, please try again later.",
          response: "I'm currently handling many requests. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Payment required",
          response: "AI services are temporarily unavailable. Please contact support." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let assistantResponse = data.choices?.[0]?.message?.content || "I couldn't process that request.";
    
    // Remove any emojis from response
    assistantResponse = assistantResponse.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]/gu, '');

    // Detect if the response suggests creating a listing
    const suggestsListing = assistantResponse.toLowerCase().includes("project name:") || 
                           assistantResponse.toLowerCase().includes("shall i create") ||
                           assistantResponse.toLowerCase().includes("ready to create");

    // Detect if processing a Google Drive link
    const processingDrive = message.toLowerCase().includes("drive.google.com") || 
                           message.toLowerCase().includes("bulk upload");

    return new Response(JSON.stringify({
      response: assistantResponse,
      action: suggestsListing ? "suggest_listing" : processingDrive ? "processing_drive" : null,
      listingType: "off-plan",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Listing admin chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      error: errorMessage,
      response: "I apologize, there was an error processing your request. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
