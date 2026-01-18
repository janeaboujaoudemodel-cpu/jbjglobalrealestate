import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsRequest {
  action: 'collect' | 'generate' | 'list';
  category?: string;
  limit?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action = 'list', category, limit = 10 } = await req.json() as NewsRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Database configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === 'list') {
      // Fetch existing news from database
      let query = supabase
        .from('market_news')
        .select('*')
        .order('published_date', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('category', category);
      }

      const { data: news, error } = await query;
      
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, news }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'collect' || action === 'generate') {
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }

      const systemPrompt = `You are a professional UAE real estate news analyst working for JBJ Global Real Estate. Your job is to create accurate, timely market news based on real events and trends.

You monitor these official sources:
- Dubai Media Office
- Abu Dhabi Media Office
- UAE Ministry of Economy
- Dubai Land Department
- RERA
- Sheikh Mohammed bin Rashid official communications
- Dubai Tourism
- UAE Government portal

Create news that is:
1. Factual and verifiable
2. Relevant to real estate investors
3. Professional in tone
4. Properly sourced

IMPORTANT: Generate realistic news items that reflect actual market conditions and government announcements in the UAE.`;

      const userPrompt = `Generate 5 realistic UAE real estate news articles for today (${new Date().toISOString().split('T')[0]}).

For each article provide:
1. title: Compelling headline (max 100 chars)
2. excerpt: Summary paragraph (max 200 chars)
3. content: Full article (300-500 words)
4. category: One of [Market Update, Policy, Economic, Infrastructure, Development, Investment, Tourism, Government]
5. source: Official source name
6. tags: Array of relevant tags

Focus on:
- Real estate market updates
- New government policies affecting property
- Economic indicators
- Infrastructure developments (metro, roads, bridges)
- Major project announcements
- Visa and residency updates
- Tourism statistics affecting rentals
- Developer news

Return as JSON array:
[
  {
    "title": "...",
    "excerpt": "...",
    "content": "...",
    "category": "...",
    "source": "...",
    "tags": ["...", "..."]
  }
]`;

      console.log("Collecting/generating news...");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";

      // Parse the JSON response
      let newsItems = [];
      try {
        // Extract JSON from the response (might be wrapped in markdown)
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          newsItems = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Failed to parse news JSON:", parseError);
        throw new Error("Failed to parse generated news");
      }

      // Insert news into database
      const insertData = newsItems.map((item: any) => ({
        title: item.title,
        excerpt: item.excerpt,
        content: item.content,
        category: item.category,
        source: item.source,
        tags: item.tags || [],
        published_date: new Date().toISOString().split('T')[0],
        ai_generated: true,
        is_verified: false,
      }));

      const { data: insertedNews, error: insertError } = await supabase
        .from('market_news')
        .insert(insertData)
        .select();

      if (insertError) {
        console.error("Failed to insert news:", insertError);
        // Return the generated news even if insert fails
        return new Response(
          JSON.stringify({ 
            success: true, 
            news: insertData,
            stored: false,
            message: "News generated but not stored (permission issue)"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          news: insertedNews,
          stored: true,
          count: insertedNews.length
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");

  } catch (error) {
    console.error("News collector error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to process news request"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
