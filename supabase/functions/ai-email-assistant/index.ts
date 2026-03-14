import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  getCorsHeaders,
  callLovableAI,
  sanitizeForPrompt,
} from "../_shared/ai-utils.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, subject, body, emailId, instructions, draft, senderName, senderTitle } = await req.json();

    // ── ACTION: SUMMARIZE ──
    if (action === "summarize") {
      if (!subject && !body) {
        return new Response(JSON.stringify({ error: "Missing email content" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check cache first
      if (emailId) {
        const { data: cached } = await serviceClient
          .from("email_analysis_cache")
          .select("*")
          .eq("email_id", emailId)
          .maybeSingle();

        if (cached) {
          return new Response(JSON.stringify({
            summary_en: cached.summary_en,
            summary_ar: cached.summary_ar,
            suggested_reply: cached.suggested_reply,
            priority: cached.priority,
            action_items: cached.action_items,
            needs_reply: cached.needs_reply,
            cached: true,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const systemPrompt = `You are Amanda Clarke, Executive Assistant to Jane Bou Jaoude, Founder & CEO of JBJ Global Real Estate.

Analyze the email and return a JSON object with these exact keys:
- summary_en: A concise 2-3 sentence summary in English
- summary_ar: The same summary translated to Arabic
- suggested_reply: A professional reply draft (2-4 sentences) in the style of an executive assistant
- priority: One of "urgent", "high", "normal", "low"
- action_items: An array of strings listing specific actions needed (max 5)
- needs_reply: boolean indicating if this email requires a response

Keep summaries actionable and decision-focused. The suggested reply should be warm, professional, and decisive.
Return ONLY valid JSON, no markdown fences.`;

      const userPrompt = `Subject: ${sanitizeForPrompt(subject, 200)}

Body:
${sanitizeForPrompt(body, 2000)}`;

      const result = await callLovableAI(systemPrompt, userPrompt);

      let parsed;
      try {
        const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = {
          summary_en: result.substring(0, 300),
          summary_ar: "",
          suggested_reply: "",
          priority: "normal",
          action_items: [],
          needs_reply: false,
        };
      }

      // Cache the result
      if (emailId) {
        await serviceClient.from("email_analysis_cache").upsert({
          email_id: emailId,
          summary_en: parsed.summary_en,
          summary_ar: parsed.summary_ar,
          suggested_reply: parsed.suggested_reply,
          priority: parsed.priority,
          action_items: parsed.action_items || [],
          needs_reply: parsed.needs_reply || false,
        }, { onConflict: "email_id" });
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: DRAFT_REPLY ──
    if (action === "draft_reply") {
      const persona = senderName
        ? `You are ${sanitizeForPrompt(senderName)}, ${sanitizeForPrompt(senderTitle)} at JBJ Global Real Estate.`
        : `You are Amanda Clarke, Executive Assistant to Jane Bou Jaoude at JBJ Global Real Estate.`;

      const systemPrompt = `${persona}
Write a professional reply to the email below.
${instructions ? `Additional instructions: ${sanitizeForPrompt(instructions, 500)}` : ""}
Keep it warm, professional, and concise (3-6 sentences). Do not include a subject line. Do not include a signature block — that will be added automatically.`;

      const userPrompt = `Original Email Subject: ${sanitizeForPrompt(subject, 200)}

Original Email Body:
${sanitizeForPrompt(body, 2000)}`;

      const replyDraft = await callLovableAI(systemPrompt, userPrompt);

      return new Response(JSON.stringify({ draft: replyDraft }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: REFINE_REPLY ──
    if (action === "refine_reply") {
      const systemPrompt = `You are a professional email editor for JBJ Global Real Estate. Refine the draft based on the user's instructions. Return only the refined email body — no subject, no signature block.`;

      const userPrompt = `Current draft:
${sanitizeForPrompt(draft, 2000)}

Instructions: ${sanitizeForPrompt(instructions, 500)}`;

      const refined = await callLovableAI(systemPrompt, userPrompt);

      return new Response(JSON.stringify({ draft: refined }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-email-assistant error:", err);
    const status = err.message?.includes("Rate limit") ? 429 : 500;
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
