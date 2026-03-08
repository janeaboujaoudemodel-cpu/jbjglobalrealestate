/**
 * AI WhatsApp Composer Edge Function
 * 
 * ACCESS: Owner-only (authenticated)
 * 
 * Generates personalized WhatsApp messages for CRM leads using AI.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  getCorsHeaders,
  createSupabaseClients,
  callLovableAI,
  sanitizeForPrompt,
  errorResponse,
} from "../_shared/ai-utils.ts";

interface Lead {
  name: string;
  language?: string;
  nationality?: string;
}

interface WhatsAppComposerRequest {
  lead: Lead;
  prompt: string;
  template?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  const { user: supabaseUser } = createSupabaseClients(authHeader);

  try {
    // Verify authentication
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return errorResponse(corsHeaders, "Authentication required", 401);
    }

    const body: WhatsAppComposerRequest = await req.json();
    
    if (!body.lead?.name) {
      return errorResponse(corsHeaders, "Lead information is required", 400);
    }

    const lead = {
      name: sanitizeForPrompt(body.lead.name, 100) || "Client",
      language: sanitizeForPrompt(body.lead.language, 20) || "English",
      nationality: sanitizeForPrompt(body.lead.nationality, 50) || "",
    };
    const prompt = sanitizeForPrompt(body.prompt, 500) || "Write a professional WhatsApp message";
    const template = sanitizeForPrompt(body.template, 50) || "";

    const templateContexts: Record<string, string> = {
      "greeting": "Initial greeting to establish contact with a potential client.",
      "followup": "Follow-up message after a previous conversation.",
      "property_alert": "Alert about new property listings matching client preferences.",
      "viewing": "Invitation to view a property or schedule a visit.",
      "document": "Request for documents or information from the client.",
      "reminder": "Reminder about an upcoming appointment or meeting.",
    };

    const templateContext = templateContexts[template] || "";

    const systemPrompt = `You are a friendly real estate consultant at JBJ Global Real Estate in Dubai. Write WhatsApp messages that are warm, conversational, and professional. Use appropriate emojis sparingly to add personality. Keep messages concise as they're for mobile viewing.`;

    const userPrompt = `Write a WhatsApp message for a client with the following details:

CLIENT NAME: ${lead.name}
${lead.nationality ? `NATIONALITY: ${lead.nationality}` : ''}
PREFERRED LANGUAGE: ${lead.language}
${templateContext ? `CONTEXT: ${templateContext}` : ''}

INSTRUCTIONS: ${prompt}

Guidelines:
- Keep the message under 160 words
- Use the client's first name
- Be conversational but professional
- Use 1-3 relevant emojis maximum
- Include a clear next step or question
- Format with line breaks for readability on mobile

If the preferred language is not English, write the entire message in that language.

Respond with ONLY the message text, no additional formatting or JSON.`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt);
    
    // Clean up the response
    let message = aiResponse.trim();
    // Remove any JSON formatting if present
    if (message.startsWith('{') || message.startsWith('\"')) {
      try {
        const parsed = JSON.parse(message);
        message = parsed.message || parsed.text || parsed.content || message;
      } catch {
        // Keep original if not valid JSON
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI WhatsApp Composer error:", error);
    return errorResponse(corsHeaders, "Failed to generate message", 500);
  }
});
