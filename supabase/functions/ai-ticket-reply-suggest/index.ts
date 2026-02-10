import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TicketContext {
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  customerName: string;
  previousMessages?: { sender_type: string; message: string }[];
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

    const { ticket }: { ticket: TicketContext } = await req.json();

    if (!ticket || !ticket.subject || !ticket.description) {
      return new Response(
        JSON.stringify({ error: "Missing ticket details" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build conversation context
    const conversationHistory = ticket.previousMessages?.length 
      ? ticket.previousMessages.map(m => 
          `${m.sender_type === 'staff' ? 'Staff' : 'Customer'}: ${m.message}`
        ).join('\n')
      : 'No previous messages';

    const systemPrompt = `You are a professional customer support assistant for JBJ Global Real Estate, a premium real estate company in Dubai UAE.

Your task is to generate 3 different professional response options for a support ticket. Each response should be:
- Professional, warm, and empathetic
- Action-oriented with clear next steps
- Appropriate for the ticket's priority level
- Personalized using the customer's name

Response format must be valid JSON with this structure:
{
  "suggestions": [
    {
      "type": "quick_resolution",
      "title": "Quick Resolution",
      "message": "Your response here..."
    },
    {
      "type": "needs_info",
      "title": "Request More Information",
      "message": "Your response here..."
    },
    {
      "type": "acknowledgment",
      "title": "Acknowledge & Investigate",
      "message": "Your response here..."
    }
  ]
}

Guidelines:
- For "quick_resolution": Provide a direct solution or helpful guidance
- For "needs_info": Politely request specific details needed to resolve the issue
- For "acknowledgment": Acknowledge the issue, explain investigation steps, set expectations

Always:
- Address the customer by name
- Reference the ticket number
- Include a professional sign-off with "JBJ Support Team"
- For Critical/High priority: Express urgency and prioritization
- Keep messages concise but thorough (150-250 words each)`;

    const userPrompt = `Generate 3 response suggestions for this support ticket:

Ticket Number: ${ticket.ticketNumber}
Customer Name: ${ticket.customerName}
Subject: ${ticket.subject}
Category: ${ticket.category}
Priority: ${ticket.priority}

Issue Description:
${ticket.description}

Previous Conversation:
${conversationHistory}

Generate the JSON response with 3 suggestions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the AI response
    let suggestions;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      suggestions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback suggestions
      suggestions = {
        suggestions: [
          {
            type: "quick_resolution",
            title: "Quick Resolution",
            message: `Dear ${ticket.customerName},\n\nThank you for contacting JBJ Global Real Estate support regarding your ${ticket.category} inquiry (Ticket: ${ticket.ticketNumber}).\n\nWe understand the importance of resolving this promptly. Based on your description, we recommend the following steps...\n\nIf you need further assistance, please don't hesitate to reach out.\n\nBest regards,\nJBJ Support Team`
          },
          {
            type: "needs_info",
            title: "Request More Information",
            message: `Dear ${ticket.customerName},\n\nThank you for reaching out to JBJ Global Real Estate support (Ticket: ${ticket.ticketNumber}).\n\nTo better assist you with your ${ticket.category} issue, could you please provide:\n\n1. [Specific detail needed]\n2. [Another detail]\n3. Any screenshots or additional context\n\nThis information will help us resolve your issue more efficiently.\n\nBest regards,\nJBJ Support Team`
          },
          {
            type: "acknowledgment",
            title: "Acknowledge & Investigate",
            message: `Dear ${ticket.customerName},\n\nThank you for bringing this to our attention (Ticket: ${ticket.ticketNumber}).\n\nWe have received your ${ticket.priority} priority request regarding ${ticket.category} and our team is actively investigating the matter.\n\nWe will provide you with an update within 24-48 hours. If the situation changes or you have additional information, please reply to this ticket.\n\nBest regards,\nJBJ Support Team`
          }
        ]
      };
    }

    return new Response(
      JSON.stringify(suggestions),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate suggestions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
