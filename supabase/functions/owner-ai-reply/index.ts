import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Thread {
  id: string;
  channel_type: string;
  contact_name: string | null;
  contact_identifier: string;
  lead_id: string | null;
  lead?: {
    full_name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

interface Message {
  direction: string;
  content: string;
  sender_name: string | null;
  created_at: string;
}

interface ToneProfile {
  formality_level: number;
  emoji_usage: number;
  message_length: string;
  language_switching: boolean;
  preferred_languages: string[];
  signature: string | null;
  sample_messages: string[] | null;
}

interface LearningExample {
  learning_type: string;
  original_content: string | null;
  corrected_content: string | null;
  context: string | null;
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

    // Extract user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      action,
      thread,
      messages,
      templateId,
      customInstructions,
      replyType,
      language,
      toneProfile,
      learningExamples,
    } = await req.json();

    if (action === "generate_reply") {
      const threadData = thread as Thread;
      const messageHistory = (messages as Message[]).slice(-10); // Last 10 messages
      const tone = toneProfile as ToneProfile | null;
      const learning = (learningExamples || []) as LearningExample[];

      // Build conversation context
      const conversationContext = messageHistory.map(m => 
        `${m.direction === 'inbound' ? threadData.contact_name || 'Contact' : 'Jane'}: ${m.content}`
      ).join('\n');

      // Build tone instructions
      let toneInstructions = "";
      if (tone) {
        const formalityDescriptions = ["very casual", "casual", "balanced", "professional", "very formal"];
        const lengthDescriptions = { short: "brief (1-2 sentences)", medium: "moderate (2-4 sentences)", long: "detailed (4+ sentences)" };
        
        toneInstructions = `
TONE PROFILE:
- Formality: ${formalityDescriptions[tone.formality_level - 1] || "balanced"}
- Emoji usage: ${tone.emoji_usage === 0 ? "never" : tone.emoji_usage <= 2 ? "minimal" : "moderate"}
- Message length: ${lengthDescriptions[tone.message_length as keyof typeof lengthDescriptions] || "moderate"}
- Languages: ${tone.preferred_languages?.join(", ") || "English"}
${tone.signature ? `- Signature: ${tone.signature}` : ""}`;
      }

      // Build learning context
      let learningContext = "";
      if (learning.length > 0) {
        const corrections = learning.filter(l => l.learning_type === 'correction' && l.corrected_content);
        if (corrections.length > 0) {
          learningContext = `
LEARNED PREFERENCES (from previous corrections):
${corrections.slice(0, 5).map(c => `- Instead of: "${c.original_content?.substring(0, 50)}..." → Use: "${c.corrected_content?.substring(0, 50)}..."`).join('\n')}`;
        }
      }

      // Fetch template if provided
      let templateContent = "";
      if (templateId) {
        const { data: template } = await supabase
          .from('owner_comm_templates')
          .select('content, voice_script')
          .eq('id', templateId)
          .single();
        
        if (template) {
          templateContent = `
USE THIS TEMPLATE AS BASE (adapt to context):
${template.content}`;
        }
      }

      // Get lead info if available
      let leadContext = "";
      if (threadData.lead) {
        leadContext = `
LEAD INFORMATION:
- Name: ${threadData.lead.full_name}
- Email: ${threadData.lead.email || 'Not provided'}
- Phone: ${threadData.lead.phone || 'Not provided'}`;
      }

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY not configured");
      }

      // Generate reply using AI
      const systemPrompt = `You are Jane Bou Jaoude, Founder & CEO of JBJ Global Real Estate in Dubai.

IDENTITY:
- You are the OWNER, not an assistant
- You speak with authority but warmth
- You are personally invested in every client relationship
- Your communication style is elegant, professional, yet approachable

COMPANY INFO:
📧 Email: CONTACT@JBJ.AE
📞 Phone: +971 56 591 1000
🌐 Website: WWW.JBJ.AE

CHANNEL: ${threadData.channel_type}
${toneInstructions}
${learningContext}
${leadContext}
${templateContent}
${customInstructions ? `\nADDITIONAL INSTRUCTIONS: ${customInstructions}` : ''}

RULES:
1. ${replyType === 'email' ? 'Format as a proper email with greeting and sign-off' : 'Keep it conversational for messaging'}
2. Be genuine and personal - you remember returning clients
3. Never sound like a bot or use generic phrases
4. Address specific points from their message
5. Include relevant next steps or call to action
6. Language: ${language === 'ar' ? 'Respond in Arabic' : 'Respond in English'}`;

      const userPrompt = `CONVERSATION HISTORY:
${conversationContext}

Generate a ${replyType === 'voice' ? 'voice script' : replyType === 'email' ? 'email reply' : 'message reply'} to the last message. Be natural and helpful.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        throw new Error(`AI API error: ${errorText}`);
      }

      const aiData = await aiResponse.json();
      const generatedContent = aiData.choices[0]?.message?.content || "";

      // Save draft to database
      const { data: draft, error: draftError } = await supabase
        .from('owner_comm_ai_drafts')
        .insert({
          thread_id: threadData.id,
          user_id: user.id,
          draft_type: replyType,
          content: generatedContent,
          voice_script: replyType === 'voice' ? generatedContent : null,
          template_id: templateId || null,
          ai_model_used: 'google/gemini-2.5-flash',
          ai_confidence: 0.85,
          ai_reasoning: `Generated ${replyType} reply based on conversation context and tone profile`,
        })
        .select()
        .single();

      if (draftError) throw draftError;

      return new Response(JSON.stringify({
        draft,
        reasoning: `Generated ${replyType} reply using conversation context and your tone preferences.`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Owner AI Reply error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
