import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import {
  getCorsHeaders,
  APPROVED_CONTACT,
  callLovableAI,
  trackAIUsage,
  errorResponse,
  successResponse,
  getClientIp,
} from "../_shared/ai-utils.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const clientIp = getClientIp(req);

  try {
    const { question, moduleId } = await req.json();

    if (!question || typeof question !== "string") {
      return errorResponse(corsHeaders, "Question is required", 400);
    }

    // Authenticate user - require valid session
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse(corsHeaders, "Authentication required", 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate user token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return errorResponse(corsHeaders, "Invalid or expired authentication", 401);
    }

    // Use service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch current module content for focused context
    let currentModuleContext = "";
    let currentModuleTitle = "";
    
    if (moduleId) {
      const { data: module } = await supabase
        .from("hr_modules")
        .select("title, content, key_points, track")
        .eq("id", moduleId)
        .eq("is_active", true)
        .single();

      if (module) {
        currentModuleTitle = module.title;
        const keyPoints = Array.isArray(module.key_points) 
          ? module.key_points.join("\n- ") 
          : "";
        currentModuleContext = `
CURRENT MODULE (Primary Focus): ${module.title}
Track: ${module.track === "company_knowledge" ? "Company Knowledge" : "Real Estate Basics"}

Full Content:
${module.content}

Key Points to Remember:
- ${keyPoints}
`;
      }
    }

    // Smart context: Fetch related modules based on question keywords
    const questionLower = question.toLowerCase();
    const { data: allModules } = await supabase
      .from("hr_modules")
      .select("id, title, content, key_points, track")
      .eq("is_active", true)
      .order("display_order");

    // Build intelligent context with relevance scoring
    let relatedModulesContext = "";
    const relatedModules: Array<{ title: string; content: string; score: number }> = [];

    if (allModules && allModules.length > 0) {
      for (const m of allModules) {
        if (m.id === moduleId) continue; // Skip current module
        
        // Calculate relevance score
        let score = 0;
        const titleLower = m.title.toLowerCase();
        const contentLower = m.content.toLowerCase();
        
        // Check for keyword matches
        const keywords = questionLower.split(/\s+/).filter(w => w.length > 3);
        for (const keyword of keywords) {
          if (titleLower.includes(keyword)) score += 3;
          if (contentLower.includes(keyword)) score += 1;
        }

        if (score > 0) {
          relatedModules.push({
            title: m.title,
            content: m.content.substring(0, 800),
            score,
          });
        }
      }

      // Sort by relevance and take top 3
      relatedModules.sort((a, b) => b.score - a.score);
      const topRelated = relatedModules.slice(0, 3);

      if (topRelated.length > 0) {
        relatedModulesContext = "\n\nRELATED TRAINING CONTENT (for context):\n" +
          topRelated.map(m => `[${m.title}]: ${m.content}...`).join("\n\n");
      }
    }

    // Build comprehensive training overview for general knowledge
    let allModulesOverview = "";
    if (allModules && allModules.length > 0) {
      allModulesOverview = allModules.map(m => {
        const kp = Array.isArray(m.key_points) ? m.key_points.slice(0, 3).join(", ") : "";
        return `• ${m.title}: ${kp}`;
      }).join("\n");
    }

    const systemPrompt = `You are the AI Study Tutor for JJ Global Capital Real Estate's broker training program. Your name is "Training Assistant" and you help trainees understand and master the training material.

PERSONALITY:
- Encouraging and supportive
- Clear and concise explanations
- Use examples when helpful
- Break down complex topics into simple parts

CRITICAL RULES:
1. ONLY answer questions using information from the training modules provided below.
2. If information is NOT in the training content, respond: "That topic isn't covered in the current training modules yet. Please check with the team at ${APPROVED_CONTACT.email} for more information."
3. NEVER invent or fabricate company facts, metrics, awards, or statistics.
4. Keep answers concise (2-4 sentences for simple questions, more for complex topics).
5. When referencing contact information, ONLY use: Phone: ${APPROVED_CONTACT.phone}, Email: ${APPROVED_CONTACT.email}
6. Encourage the trainee to review the module content and take the quiz.
7. If a trainee seems confused, suggest reviewing specific sections of the current module.

AVAILABLE TRAINING MODULES OVERVIEW:
${allModulesOverview}

${currentModuleContext}
${relatedModulesContext}

RESPONSE GUIDELINES:
- Start with a direct answer to the question
- Reference specific module content when possible
- End with encouragement or a suggestion to explore related topics
- If the question is about something in a different module, mention which module covers it`;

    const aiResult = await callLovableAI({
      systemPrompt,
      userPrompt: question,
      maxTokens: 600,
      temperature: 0.3,
    });

    // Track usage
    await trackAIUsage(supabase, {
      functionName: "hr-ai-tutor",
      clientIp,
      model: "google/gemini-2.5-flash",
      success: aiResult.success,
      errorType: aiResult.error,
      responseTimeMs: Date.now() - startTime,
    });

    if (!aiResult.success) {
      if (aiResult.status === 429) {
        return errorResponse(corsHeaders, "Too many requests. Please try again in a moment.", 429);
      }
      if (aiResult.status === 402) {
        return errorResponse(corsHeaders, "AI service temporarily unavailable.", 402);
      }
      return errorResponse(corsHeaders, "Failed to process your question. Please try again.", 500);
    }

    return successResponse(corsHeaders, { 
      answer: aiResult.content,
      currentModule: currentModuleTitle,
      relatedModules: relatedModules.slice(0, 3).map(m => m.title),
    });
  } catch (error) {
    console.error("HR AI Tutor error:", error);
    return errorResponse(corsHeaders, "Failed to process your question. Please try again.", 500);
  }
});
