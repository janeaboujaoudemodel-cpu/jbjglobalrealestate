import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history = [] } = await req.json();

    if (!message || typeof message !== 'string') {
      throw new Error('Message is required');
    }

    // Build messages array with system prompt and conversation history
    const messages = [
      {
        role: 'system',
        content: `You are a professional, friendly AI assistant for JJ Global Capital, a premier luxury real estate advisory firm specializing in UAE and Dubai properties.

Your role is to:
- Answer questions about real estate investment in Dubai and UAE
- Provide information about JJ Global Capital services (properties, concierge, legal, design & build)
- Help users navigate the website and find relevant information
- Collect lead information when appropriate (name, email, phone, interest)
- Be helpful, professional, and maintain a luxury brand tone

Key services to promote:
1. Off-plan and ready properties in Dubai
2. AI Home Finder - personalized property matching
3. Luxury Concierge services (private jets, yachts, VIP events)
4. Design & Build services
5. Legal advisory for property transactions
6. Mortgage advisory
7. Market reports and property valuations

Always be:
- Concise but thorough (2-3 sentences per response unless more detail is needed)
- Professional and courteous
- Helpful in guiding users to the right services
- Ready to connect users with a human consultant when needed

If users want to schedule a consultation or have complex questions, encourage them to contact the team at invest@jjglobalcapital.com or through the inquiry form.`
      },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    // Call Lovable AI (Google Gemini) - no API key needed
    const response = await fetch('https://api.ai.lovable.dev/api/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_AI_KEY') || ''}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I was unable to process your request. Please try again or contact our team directly.';

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in ai-chat-support function:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        response: 'I apologize for the technical difficulty. Please try again or contact our team at invest@jjglobalcapital.com for immediate assistance.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
