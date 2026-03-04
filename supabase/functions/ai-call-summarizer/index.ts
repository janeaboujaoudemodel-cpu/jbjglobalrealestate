import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    }

    const { clientName, callNotes, hasAudio } = await req.json();

    // Build prompt for call summarization
    const prompt = `You are an expert real estate call analyst. Summarize the following phone call with a client.

Client Name: ${clientName || 'Unknown'}
Call Notes: ${callNotes || 'No notes provided'}
${hasAudio ? 'Note: Audio was provided (transcription would be processed separately)' : ''}

Provide a structured analysis in JSON format with the following fields:
1. summary: A concise 2-3 sentence summary of the call
2. actionItems: Array of specific action items that need to be completed
3. clientNeeds: Array of identified client needs and requirements
4. nextSteps: Array of recommended next steps in order of priority
5. sentiment: Overall sentiment (positive, neutral, negative, mixed)
6. keyTopics: Array of main topics discussed

Focus on real estate context: property preferences, budget, timeline, location preferences, concerns, etc.

Return ONLY valid JSON, no markdown formatting.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    let summary;
    try {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      summary = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      // Fallback structure if parsing fails
      summary = {
        summary: content,
        actionItems: [],
        clientNeeds: [],
        nextSteps: [],
        sentiment: 'neutral',
        keyTopics: [],
      };
    }

    const processingTime = Date.now() - startTime;

    // Log to ai_job_master for history persistence
    if (userId) {
      await supabaseAdmin.from('ai_job_master').insert({
        user_id: userId,
        tool_name: 'ai-call-summarizer',
        status: 'completed',
        input_payload: { 
          clientName: clientName || 'Unknown',
          hasAudio: !!hasAudio,
          notesLength: callNotes?.length || 0,
        },
        output_payload: summary,
        processing_time_ms: processingTime,
        intelligence_features: {
          summaryGeneration: true,
          actionItemsExtraction: true,
          sentimentAnalysis: true,
          clientNeedsDetection: true,
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Call summarizer error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
