import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AUTHORIZED NEWS SOURCES - Official government & journalism sources
const AUTHORIZED_NEWS_SOURCES = [
  {
    name: "Dubai Land Department",
    url: "https://www.dubailand.gov.ae/en/news",
    type: "government",
    category: "Policy",
  },
  {
    name: "RERA",
    url: "https://www.rera.gov.ae/en/news",
    type: "government",
    category: "Policy",
  },
  {
    name: "UAE Ministry of Economy",
    url: "https://www.moec.gov.ae/en/media-center",
    type: "government",
    category: "Economic",
  },
  {
    name: "Dubai Media Office",
    url: "https://mediaoffice.ae/en/news",
    type: "government",
    category: "Government",
  },
  {
    name: "Emirates News Agency (WAM)",
    url: "https://wam.ae/en/search?q=real+estate",
    type: "government",
    category: "Market Update",
  },
  {
    name: "Abu Dhabi Media Office",
    url: "https://mediaoffice.abudhabi/en",
    type: "government",
    category: "Government",
  },
  {
    name: "Dubai Chamber of Commerce",
    url: "https://www.dubaichamber.com/news",
    type: "business",
    category: "Economic",
  },
  {
    name: "Arabian Business",
    url: "https://www.arabianbusiness.com/industries/real-estate",
    type: "media",
    category: "Market Update",
  },
  {
    name: "Gulf News Property",
    url: "https://gulfnews.com/living-in-uae/property",
    type: "media",
    category: "Market Update",
  },
  {
    name: "Zawya",
    url: "https://www.zawya.com/en/business/real-estate",
    type: "media",
    category: "Analysis",
  },
  {
    name: "Khaleej Times",
    url: "https://www.khaleejtimes.com/business/real-estate",
    type: "media",
    category: "Market Update",
  },
];

interface NewsArticle {
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  source: string;
  source_url: string;
  image_url?: string;
  published_date: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, sources } = await req.json().catch(() => ({ action: "collect" }));

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Firecrawl connector not configured" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "AI capabilities not configured" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const sourcesToProcess = sources?.length 
      ? AUTHORIZED_NEWS_SOURCES.filter(s => sources.includes(s.name))
      : AUTHORIZED_NEWS_SOURCES;

    console.log(`Processing ${sourcesToProcess.length} authorized news sources...`);

    const collectedNews: NewsArticle[] = [];
    const errors: string[] = [];

    for (const source of sourcesToProcess) {
      console.log(`Scraping ${source.name}...`);
      
      try {
        // Use Perplexity for news search (more reliable for government sites)
        const PERPLEXITY_KEY = Deno.env.get("PERPLEXITY_API_KEY");
        
        let newsContent = "";
        
        if (PERPLEXITY_KEY) {
          try {
            const searchResponse = await fetch("https://api.perplexity.ai/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${PERPLEXITY_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "sonar",
                messages: [
                  {
                    role: "system",
                    content: "You are a news aggregator. Return only factual news headlines and summaries from the specified source. Format as JSON array."
                  },
                  {
                    role: "user",
                    content: `Find the 5 most recent Dubai/UAE real estate news articles from ${source.name} (${source.url}). Include title, summary, date, and link for each.`
                  }
                ],
                search_recency_filter: "week",
                search_domain_filter: [new URL(source.url).hostname],
              }),
            });

            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              newsContent = searchData.choices?.[0]?.message?.content || "";
            }
          } catch (perplexityError) {
            console.warn(`Perplexity failed for ${source.name}:`, perplexityError);
          }
        }
        
        // Fallback to Firecrawl
        if (!newsContent) {
          try {
            const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: source.url,
                formats: ["markdown"],
                onlyMainContent: true,
                waitFor: 3000,
                timeout: 30000,
              }),
            });

            if (scrapeResponse.ok) {
              const scrapeData = await scrapeResponse.json();
              newsContent = scrapeData.data?.markdown || scrapeData.markdown || "";
            } else {
              const errData = await scrapeResponse.json().catch(() => ({}));
              console.warn(`Firecrawl failed for ${source.name}: ${errData.error || scrapeResponse.status}`);
            }
          } catch (firecrawlError) {
            console.warn(`Firecrawl error for ${source.name}:`, firecrawlError);
          }
        }

        if (!newsContent) {
          errors.push(`${source.name}: No content extracted`);
          continue;
        }

        // Use AI to extract structured news articles
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `You are a news extraction AI for Dubai/UAE real estate. Extract news articles from the provided content.

RULES:
- Extract ONLY factual news articles present in the content
- Do not invent or hallucinate any information
- Focus on real estate, property, economy, and policy news
- Use ISO date format (YYYY-MM-DD) for dates
- Category must be one of: Market Update, Analysis, Policy, Economic, Developer News, Government, Monthly Report, Market Outlook`
              },
              {
                role: "user",
                content: `Extract news articles from this ${source.name} content:\n\n${newsContent.substring(0, 25000)}`
              }
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "extract_news",
                  description: "Extract news articles from content",
                  parameters: {
                    type: "object",
                    properties: {
                      articles: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            excerpt: { type: "string", description: "1-2 sentence summary" },
                            category: { type: "string" },
                            published_date: { type: "string", description: "ISO date format" },
                            source_url: { type: "string" },
                            image_url: { type: "string" }
                          },
                          required: ["title", "excerpt", "category", "published_date"]
                        }
                      }
                    },
                    required: ["articles"]
                  }
                }
              }
            ],
            tool_choice: { type: "function", function: { name: "extract_news" } }
          }),
        });

        if (!aiResponse.ok) {
          errors.push(`${source.name}: AI extraction failed`);
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

        if (!toolCall) {
          errors.push(`${source.name}: No articles extracted`);
          continue;
        }

        const extractedData = JSON.parse(toolCall.function.arguments);
        
        for (const article of extractedData.articles || []) {
          collectedNews.push({
            title: article.title,
            excerpt: article.excerpt,
            category: article.category || source.category,
            source: source.name,
            source_url: article.source_url || source.url,
            image_url: article.image_url,
            published_date: article.published_date || new Date().toISOString().split('T')[0],
          });
        }

        console.log(`Extracted ${extractedData.articles?.length || 0} articles from ${source.name}`);

      } catch (sourceError) {
        console.error(`Error processing ${source.name}:`, sourceError);
        errors.push(`${source.name}: ${sourceError instanceof Error ? sourceError.message : "Unknown error"}`);
      }
    }

    // Insert collected news into database (upsert to avoid duplicates)
    let insertedCount = 0;
    for (const article of collectedNews) {
      // Check if article already exists by title
      const { data: existing } = await supabase
        .from("market_news")
        .select("id")
        .eq("title", article.title)
        .single();

      if (!existing) {
        const { error: insertError } = await supabase
          .from("market_news")
          .insert({
            title: article.title,
            excerpt: article.excerpt,
            category: article.category,
            source: article.source,
            source_url: article.source_url,
            image_url: article.image_url,
            published_date: article.published_date,
            ai_generated: true,
            is_verified: false,
            is_featured: false,
          });

        if (!insertError) {
          insertedCount++;
        }
      }
    }

    console.log(`News collection complete: ${insertedCount} new articles inserted`);

    return new Response(JSON.stringify({
      success: true,
      collected: collectedNews.length,
      inserted: insertedCount,
      sources_processed: sourcesToProcess.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("News collector error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Collection failed",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
