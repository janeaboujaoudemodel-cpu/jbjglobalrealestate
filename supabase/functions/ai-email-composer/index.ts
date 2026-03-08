/**
 * AI Email Composer Edge Function
 * 
 * ACCESS: Owner-only (authenticated)
 * 
 * Generates personalized emails for CRM leads using AI.
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

interface EmailComposerRequest {
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

    const body: EmailComposerRequest = await req.json();
    
    if (!body.lead?.name) {
      return errorResponse(corsHeaders, "Lead information is required", 400);
    }

    const lead = {
      name: sanitizeForPrompt(body.lead.name, 100) || "Valued Client",
      language: sanitizeForPrompt(body.lead.language, 20) || "English",
      nationality: sanitizeForPrompt(body.lead.nationality, 50) || "",
    };
    const prompt = sanitizeForPrompt(body.prompt, 500) || "Write a professional email";
    const template = sanitizeForPrompt(body.template, 50) || "";

    const templateContexts: Record<string, string> = {
      "intro": "This is an introduction email to a potential real estate client.",
      "followup": "This is a follow-up email after a previous conversation or inquiry.",
      "property": "This email recommends specific properties based on client preferences.",
      "meeting": "This email requests a meeting or call to discuss investment opportunities.",
      "thankyou": "This is a thank you email after a successful meeting or transaction.",
      "offer": "This email presents a special offer or exclusive investment opportunity.",
    };

    const templateContext = templateContexts[template] || "";

    const systemPrompt = `You are a professional real estate consultant at JBJ Global Real Estate in Dubai. Write compelling, personalized emails that build relationships and drive engagement. Your tone should be warm yet professional, confident but not pushy. Always maintain the luxury positioning of the brand.`;

    const userPrompt = `Write a professional email for a client with the following details:

CLIENT NAME: ${lead.name}
${lead.nationality ? `NATIONALITY: ${lead.nationality}` : ''}
PREFERRED LANGUAGE: ${lead.language}
${templateContext ? `CONTEXT: ${templateContext}` : ''}

INSTRUCTIONS: ${prompt}

Generate a compelling email with:
1. An engaging subject line that would have high open rates
2. A personalized greeting using the client's first name
3. Professional body content that addresses their needs
4. A clear call-to-action
5. Professional closing

Format your response as JSON:
{
  "subject": "Email subject line here",
  "body": "Full email body with proper paragraphs here"
}

Keep the email concise (under 200 words) but impactful. If the preferred language is not English, write the entire email in that language.`;

    const aiResponse = await callLovableAI(systemPrompt, userPrompt);
    
    let emailContent;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        emailContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      // Fallback parsing
      const subjectMatch = aiResponse.match(/Subject:\s*(.+?)(?:\n|$)/i);
      emailContent = {
        subject: subjectMatch ? subjectMatch[1].trim() : `Hello ${lead.name.split(" ")[0]} - Property Investment Opportunity`,
        body: aiResponse.replace(/Subject:\s*.+?\n/i, '').trim(),
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...emailContent,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Email Composer error:", error);
    return errorResponse(corsHeaders, "Failed to generate email", 500);
  }
});
