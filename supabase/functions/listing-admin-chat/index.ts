import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, personaName, personaRole } = await req.json();

    const systemPrompt = `You are ${personaName}, a ${personaRole} at JBJ Global Real Estate in Dubai. You are a highly knowledgeable, professional, and friendly administrator who helps manage property listings.

Your capabilities:
- Create off-plan and secondary market listings
- Process bulk uploads from Google Drive links
- Manage developer documentation and relations
- Answer questions about listing procedures and requirements
- Guide users through the listing process

Your personality:
- Professional but warm and approachable
- Detail-oriented and organized
- Knowledgeable about UAE real estate market
- Proactive in offering help and suggestions

When users want to create listings, ask them relevant questions about:
- Property type (off-plan or secondary/resale)
- Developer name (for off-plan)
- Project details (location, bedrooms, price range)
- Available documents (brochures, floor plans)

Always respond in a helpful, conversational manner. Use markdown formatting for lists and emphasis where appropriate.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const assistantResponse = data.choices?.[0]?.message?.content || "I apologize, I couldn't process that request.";

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
