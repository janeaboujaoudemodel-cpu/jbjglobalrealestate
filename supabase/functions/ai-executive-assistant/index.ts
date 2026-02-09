import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Communication {
  id: string;
  channel: string;
  sender_name: string | null;
  sender_identifier: string;
  subject: string | null;
  content: string;
  category: string;
}

interface LearnedResponse {
  trigger_keywords: string[];
  trigger_category: string | null;
  response_template: string;
  is_auto_respond: boolean;
  priority: number;
}

interface IgnoreRule {
  id: string;
  rule_type: string;
  rule_value: string;
  action: string;
  target_category: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, communication, userId } = await req.json();

    if (action === "process_communication") {
      // Get user's learned responses and ignore rules
      const [responsesResult, rulesResult] = await Promise.all([
        supabase
          .from("assistant_learned_responses")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("priority", { ascending: false }),
        supabase
          .from("assistant_ignore_rules")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
      ]);

      const learnedResponses: LearnedResponse[] = responsesResult.data || [];
      const ignoreRules: IgnoreRule[] = rulesResult.data || [];

      const comm: Communication = communication;
      const contentLower = (comm.content + " " + (comm.subject || "")).toLowerCase();
      const senderLower = comm.sender_identifier.toLowerCase();

      // Step 1: Check ignore rules first
      for (const rule of ignoreRules) {
        let matches = false;
        
        switch (rule.rule_type) {
          case "keyword":
            matches = rule.rule_value.split(",").some(kw => 
              contentLower.includes(kw.trim().toLowerCase())
            );
            break;
          case "sender":
            matches = senderLower.includes(rule.rule_value.toLowerCase());
            break;
          case "domain":
            matches = senderLower.endsWith(rule.rule_value.toLowerCase());
            break;
          case "subject_pattern":
            matches = (comm.subject || "").toLowerCase().includes(rule.rule_value.toLowerCase());
            break;
        }

        if (matches) {
          // Update match count
          await supabase.rpc("increment_ignore_rule_count", { rule_id: rule.id });
          
          let newCategory = comm.category;
          let newStatus = "ignored";
          
          if (rule.action === "move_to_category" && rule.target_category) {
            newCategory = rule.target_category;
            newStatus = "pending";
          } else if (rule.action === "archive") {
            newStatus = "ignored";
          }

          return new Response(JSON.stringify({
            action: rule.action,
            category: newCategory,
            ai_status: newStatus,
            ai_reasoning: `Matched ignore rule: ${rule.rule_type} = "${rule.rule_value}"`,
            ai_confidence_score: 1.0,
            matched_rule: rule
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Step 2: Check learned responses
      for (const response of learnedResponses) {
        const hasKeywordMatch = response.trigger_keywords.some(kw => 
          contentLower.includes(kw.toLowerCase())
        );
        
        const categoryMatch = !response.trigger_category || 
          response.trigger_category === comm.category;

        if (hasKeywordMatch && categoryMatch) {
          // Update use count
          await supabase
            .from("assistant_learned_responses")
            .update({ 
              use_count: (response as any).use_count + 1,
              last_used_at: new Date().toISOString()
            })
            .eq("id", (response as any).id);

          if (response.is_auto_respond) {
            return new Response(JSON.stringify({
              action: "auto_respond",
              ai_response: response.response_template,
              ai_status: "auto_responded",
              ai_reasoning: `Used learned response matching keywords: ${response.trigger_keywords.join(", ")}`,
              ai_confidence_score: 0.95,
              category: "routine"
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          } else {
            return new Response(JSON.stringify({
              action: "suggest_response",
              ai_response: response.response_template,
              ai_status: "pending",
              ai_reasoning: `Suggested response based on keywords: ${response.trigger_keywords.join(", ")}. Awaiting your approval.`,
              ai_confidence_score: 0.8,
              category: "routine"
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }

      // Step 3: Use AI to analyze if no rules match
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (LOVABLE_API_KEY) {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You are an executive assistant AI that categorizes incoming communications.
                
Your job is to:
1. Categorize the message as: important, routine, recruitment, or spam
2. Determine if you can suggest a response or need human input
3. NEVER make up information. If unsure, flag for human review.

Respond in JSON format:
{
  "category": "important|routine|recruitment|spam",
  "needs_human_review": true/false,
  "reasoning": "why you made this decision",
  "suggested_response": "response text if you're confident, otherwise null",
  "confidence": 0.0-1.0
}

If confidence < 0.7 or needs_human_review is true, the human will handle it.`
              },
              {
                role: "user",
                content: `Channel: ${comm.channel}
Sender: ${comm.sender_name || comm.sender_identifier}
Subject: ${comm.subject || "N/A"}
Content: ${comm.content.substring(0, 1000)}

Analyze this communication.`
              }
            ],
            response_format: { type: "json_object" }
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const analysis = JSON.parse(aiData.choices[0].message.content);

          let aiStatus = "pending";
          if (analysis.needs_human_review || analysis.confidence < 0.7) {
            aiStatus = "flagged_for_review";
          } else if (analysis.suggested_response && analysis.confidence >= 0.85) {
            aiStatus = "auto_responded";
          }

          return new Response(JSON.stringify({
            action: aiStatus === "flagged_for_review" ? "flag_for_review" : "ai_analyzed",
            ai_response: analysis.suggested_response,
            ai_status: aiStatus,
            ai_reasoning: analysis.reasoning,
            ai_confidence_score: analysis.confidence,
            category: analysis.category
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Fallback: Flag for human review if AI unavailable
      return new Response(JSON.stringify({
        action: "flag_for_review",
        ai_status: "flagged_for_review",
        ai_reasoning: "No matching rules found and AI analysis unavailable. Please review manually.",
        ai_confidence_score: 0,
        category: "flagged"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Executive Assistant error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
