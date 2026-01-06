import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APPROVED_CONTACT = {
  phone: "+971 56 591 1000",
  email: "contact@jjglobalcapital.com",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, moduleId } = await req.json();

    if (!question || typeof question !== "string") {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch module content for context
    let moduleContext = "";
    
    if (moduleId) {
      const { data: module } = await supabase
        .from("hr_modules")
        .select("title, content, key_points, track")
        .eq("id", moduleId)
        .eq("is_active", true)
        .single();

      if (module) {
        const keyPoints = Array.isArray(module.key_points) 
          ? module.key_points.join("\n- ") 
          : "";
        moduleContext = `
Current Module: ${module.title}
Track: ${module.track === "company_knowledge" ? "Company Knowledge" : "Real Estate Basics"}

Content:
${module.content}

Key Points:
- ${keyPoints}
`;
      }
    }

    // Also fetch all active modules for broader context
    const { data: allModules } = await supabase
      .from("hr_modules")
      .select("title, content, key_points, track")
      .eq("is_active", true)
      .order("display_order");

    let allModulesContext = "";
    if (allModules && allModules.length > 0) {
      allModulesContext = allModules.map(m => {
        const kp = Array.isArray(m.key_points) ? m.key_points.join(", ") : "";
        return `[${m.track}] ${m.title}: ${m.content.substring(0, 500)}... Key points: ${kp}`;
      }).join("\n\n");
    }

    const systemPrompt = `You are an AI Study Tutor for JJ Global Capital Real Estate's broker training program. Your role is to help trainees understand the training material.

CRITICAL RULES:
1. ONLY answer questions using information from the training modules provided below.
2. If the information is not in the training content, respond: "I don't have that information in the training materials yet. Please check the official module content or contact the team at ${APPROVED_CONTACT.email}"
3. NEVER invent or fabricate company facts, metrics, awards, or statistics.
4. Keep answers concise and educational.
5. When referencing contact information, ONLY use: Phone: ${APPROVED_CONTACT.phone}, Email: ${APPROVED_CONTACT.email}
6. Encourage the trainee to review the module content and take the quiz.

TRAINING CONTENT:
${moduleContext}

ALL AVAILABLE TRAINING MODULES:
${allModulesContext}

If asked about topics not covered in the training (certificates, tier packages, CRM, video calls, etc.), say: "That topic is not covered in the current training modules. It may be added in future updates."`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("HR AI Tutor error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process your question. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
