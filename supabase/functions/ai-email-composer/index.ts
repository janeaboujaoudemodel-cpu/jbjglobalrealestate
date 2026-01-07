import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has active CRM membership
    const { data: crmProfile } = await supabase
      .from('crm_users_profile')
      .select('is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!crmProfile) {
      return new Response(
        JSON.stringify({ error: 'Active CRM membership required' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lead, prompt, template } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const firstName = lead.name?.split(" ")[0] || "Valued Client";
    const language = lead.language || 'en';
    
    // Build system prompt
    const systemPrompt = `You are a professional real estate consultant at JBJ Global Real Estate, a premium Dubai real estate brokerage.
Write professional, warm, and personalized emails for clients.
Always maintain a professional yet friendly tone.
Include a clear call-to-action.
Keep emails concise but engaging.
The client's name is ${lead.name}.
${lead.nationality ? `The client is from ${lead.nationality}.` : ''}
${language !== 'en' ? `The client prefers communication in ${language}, but write in English unless specifically asked otherwise.` : ''}
Sign emails as "JBJ Global Real Estate Team".`;

    const userPrompt = `${prompt}
    
Template type: ${template || 'general'}
Client name: ${lead.name}

Generate a professional email with:
1. An engaging subject line
2. A personalized body

Return as JSON: { "subject": "...", "body": "..." }`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI gateway error:", error);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    let result = { subject: "", body: "" };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback: extract subject and body manually
      const subjectMatch = content.match(/subject["\s:]+([^\n"]+)/i);
      const bodyMatch = content.match(/body["\s:]+["']?([\s\S]+?)["']?\s*\}/i);
      result = {
        subject: subjectMatch?.[1]?.trim() || `Hello ${firstName}`,
        body: bodyMatch?.[1]?.trim() || content
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Email composer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
