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
You are an expert at managing property listings for off-plan and secondary market properties. You help the listing admin team by:
1. Creating new property listings with complete details
2. Processing bulk uploads from Google Drive links
3. Organizing projects by developer
4. Ensuring all listing data is accurate and complete

## Your Capabilities
- Create off-plan project listings with all required fields
- Process Google Drive links to extract project information
- Auto-detect developer names from file names and content
- Group related documents (brochures, floor plans, renders, fact sheets) by project
- Validate listing data for completeness
- Suggest improvements for listing optimization

## Response Format
When helping create a listing, structure your response with clear sections:
- **Project Name**: The official name
- **Developer**: Who is building it
- **Location**: Area/community in UAE
- **Price Range**: Starting price and max price
- **Bedrooms**: Available configurations
- **Handover**: Expected completion date
- **Key Features**: Notable amenities and features

## Google Drive Processing
When a user provides a Google Drive link:
1. Acknowledge you're processing the link
2. Explain you'll organize files by project/developer
3. List the types of documents you can process
4. Confirm each project will be sent for approval before going live

## Important Guidelines
- Always be professional and efficient
- Ask clarifying questions when information is incomplete
- Suggest best practices for listing optimization
- Confirm all details before finalizing a listing
- Remind users that listings need approval before going live
- NEVER use emojis in your responses
- Use clear paragraph breaks and spacing for readability
- Keep responses concise and action-oriented
- ${langInstruction}

## Permissions
- You can GENERATE and CREATE draft listings
- You can PUBLISH listings after founder approval
- You CANNOT delete any listings - only the founder can delete`;

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
        max_tokens: 1000,
        temperature: 0.7,
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
