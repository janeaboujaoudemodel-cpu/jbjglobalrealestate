import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead, activities, score } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare activity summary
    const activitySummary = {
      totalActivities: activities?.length || 0,
      calls: activities?.filter((a: any) => a.activity_type === 'call').length || 0,
      whatsapp: activities?.filter((a: any) => a.activity_type === 'whatsapp_click').length || 0,
      emails: activities?.filter((a: any) => a.activity_type === 'email_click').length || 0,
      notes: activities?.filter((a: any) => a.activity_type === 'note').length || 0,
    };

    const systemPrompt = `You are an AI sales analyst for JJ Global Capital, a premium Dubai real estate brokerage.
Analyze leads and provide actionable insights to help close deals.
Be concise, specific, and focus on next steps.
Maximum 3 sentences.`;

    const userPrompt = `Analyze this lead and provide insights:

Lead: ${lead.full_name}
Nationality: ${lead.nationality || 'Unknown'}
Location: ${lead.current_location_country || 'Unknown'}
Source: ${lead.source || 'Unknown'}
Days since signup: ${Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24))}

Engagement:
- Total activities: ${activitySummary.totalActivities}
- Calls: ${activitySummary.calls}
- WhatsApp: ${activitySummary.whatsapp}
- Emails: ${activitySummary.emails}

Lead Score: ${score?.overall || 0}/100
Engagement Score: ${score?.engagement || 0}%
Profile Completeness: ${score?.profile || 0}%

Provide 2-3 sentences of actionable analysis.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI gateway error:", error);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Lead analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
