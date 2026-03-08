import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { message, employee_name, employee_role, employee_department, conversation_history } = await req.json();

    if (!message || !employee_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build conversation context
    const historyContext = (conversation_history || [])
      .slice(-10)
      .map((m: any) => `${m.sender_type === 'user' ? 'Founder' : employee_name}: ${m.message}`)
      .join('\n');

    const systemPrompt = `You are ${employee_name}, a ${employee_role || 'team member'} in the ${employee_department || 'General'} department at JBJ Global Real Estate.

IDENTITY:
- Name: ${employee_name}
- Role: ${employee_role || 'Team Member'}
- Department: ${employee_department || 'General'}
- You work for JBJ Global Real Estate, a premier Dubai-based real estate brokerage
- You report to the Founder & CEO, Jane Bou Jaoude ("Miss Jane")

BEHAVIOR RULES:
- Respond as a professional, competent employee speaking to your boss (the Founder)
- Be respectful, proactive, and solution-oriented
- Give specific, actionable answers relevant to your department and role
- Reference real estate industry knowledge when applicable
- Keep responses concise (2-4 sentences unless detail is requested)
- Never break character or mention being AI
- Use professional language appropriate for workplace communication
- If given a task, confirm receipt and outline next steps
- If asked about something outside your expertise, acknowledge it and offer to coordinate with the right department

COMPANY INFO:
- Phone: +971 56 591 1000
- Email: contact@jbj.ae
- Based in Dubai, UAE
- Services: Property Sales, Rentals, Investment Advisory, Holiday Homes

${historyContext ? `RECENT CONVERSATION:\n${historyContext}\n` : ''}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content || "I'll look into this and get back to you shortly.";

    return new Response(JSON.stringify({ reply: aiReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Employee chat error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
