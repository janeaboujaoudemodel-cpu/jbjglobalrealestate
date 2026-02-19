import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { clips, action, templateId } = await req.json();

    // Build the appropriate prompt based on action
    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'analyze') {
      systemPrompt = `You are a professional real estate video editor AI. Analyze a list of video clips and identify highlight moments, suggest the best assembly order, and provide actionable editing recommendations. Always respond with a JSON object.`;
      
      userPrompt = `Analyze these video clips for a real estate property video:
${clips}

Respond with JSON in this exact format:
{
  "analysis": "2-3 sentence summary of the clips and their potential",
  "highlights": [
    {"clipIndex": 0, "reason": "why this is a highlight", "score": 0.9, "suggestedDuration": 8}
  ],
  "recommendedOrder": [0, 2, 1],
  "totalRecommendedDuration": 30,
  "editingTips": ["tip1", "tip2", "tip3"]
}`;

    } else if (action === 'assemble') {
      systemPrompt = `You are a professional real estate video editor AI. Given a list of clips and a target template style, produce an optimized edit plan with precise timing. Always respond with valid JSON.`;

      const templateDescriptions: Record<string, string> = {
        'property-tour': 'A 30-60 second walkthrough video. Start with exterior establishing shot, move through key rooms highlighting luxury features, end with lifestyle/neighborhood shot. Pacing: 5-8s per clip. Mood: warm, inviting.',
        'social-reel': 'A 15-second fast-cut reel for Instagram/TikTok. Use only the best 4-5 clips at 2-4s each. Start with the most visually striking shot. High energy, quick cuts.',
        'youtube-intro': 'A 45-60 second YouTube intro. Hook viewer in first 3s with best shot, introduce property with context, showcase 3-4 key features with slight pause between each, CTA at end.',
        'luxury-ad': 'A 30-second cinematic luxury property advertisement. Slow, deliberate cuts. 6-8s per clip. Only show the most premium features. Dramatic, sophisticated mood.',
      };

      userPrompt = `Create an edit plan for this template: "${templateId}"

Template style: ${templateDescriptions[templateId] || 'Standard property video'}

Available clips:
${clips}

Respond with JSON in this exact format:
{
  "templateName": "${templateId}",
  "totalDuration": 30,
  "editPlan": [
    {"clipIndex": 0, "startTime": 0, "duration": 6, "reason": "Strong exterior establishing shot"},
    {"clipIndex": 2, "startTime": 6, "duration": 5, "reason": "Premium kitchen highlight"}
  ],
  "transitions": "fade",
  "musicSuggestion": "Upscale piano with subtle strings",
  "summary": "Brief description of the assembled edit"
}`;

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt + ' IMPORTANT: Your entire response must be valid JSON only, with no markdown formatting, no code blocks, no explanation text outside the JSON object.' },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await response.text();
      console.error('Lovable AI error:', response.status, errText);
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: 'No response from AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let parsed;
    try {
      // Strip markdown code blocks if present
      const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Try extracting JSON object from the content
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = { analysis: content };
        }
      } else {
        parsed = { analysis: content };
      }
    }

    return new Response(JSON.stringify({ success: true, ...parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI video editor error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
