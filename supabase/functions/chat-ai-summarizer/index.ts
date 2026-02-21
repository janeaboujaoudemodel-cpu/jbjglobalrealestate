import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const { messages, user_name, service_type, rating, rating_feedback } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages to analyze" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcript = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');

    const prompt = `You are an expert customer service analyst for JBJ Global Real Estate, a premium real estate company in Dubai. Analyze this chat transcript and provide a comprehensive assessment.

Chat Transcript:
${transcript}

User Name: ${user_name || "Anonymous"}
Service Type: ${service_type || "Unknown"}
${rating ? `User Rating: ${rating}/5` : "No rating provided"}
${rating_feedback ? `User Feedback: ${rating_feedback}` : ""}

Provide your analysis as valid JSON with these fields:
{
  "summary": "A 2-3 sentence summary of the conversation",
  "resolution_status": "resolved" | "unresolved" | "partial" | "escalation_needed",
  "resolution_explanation": "Brief explanation of resolution status",
  "sentiment": "positive" | "neutral" | "negative",
  "sentiment_score": 0-100,
  "key_topics": ["topic1", "topic2"],
  "user_intent": "What the user was trying to achieve",
  "improvement_suggestions": ["suggestion1", "suggestion2"],
  "priority_level": "low" | "medium" | "high" | "critical",
  "priority_reason": "Why this priority level",
  "suggested_reply": "A professional follow-up message to send to the user via WhatsApp or email",
  "action_items": ["action1", "action2"],
  "is_lead_opportunity": true/false,
  "lead_opportunity_detail": "If lead opportunity, what property/service they're interested in"
}

Return ONLY valid JSON, no markdown or extra text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits needed - please add funds" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    let raw = aiData.choices?.[0]?.message?.content?.trim() || "";
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed;
    try { parsed = JSON.parse(raw); } catch { 
      parsed = { 
        summary: raw.slice(0, 300), 
        resolution_status: "unknown",
        sentiment: "neutral",
        sentiment_score: 50,
        suggested_reply: "Thank you for reaching out. How can we further assist you?",
        priority_level: "medium",
        key_topics: [],
        improvement_suggestions: [],
        action_items: [],
        is_lead_opportunity: false,
      }; 
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("chat-ai-summarizer error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
