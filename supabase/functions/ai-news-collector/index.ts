import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Category-based fallback images (high-quality Dubai Unsplash photos)
const CATEGORY_IMAGES: Record<string, string> = {
  "Policy": "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1200&q=80",
  "Economic": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
  "Market Update": "https://images.unsplash.com/photo-1622015663319-e97e697503ee?w=1200&q=80",
  "Government": "https://images.unsplash.com/photo-1597659840241-37e2b9c2f55f?w=1200&q=80",
  "Analysis": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
  "Developer News": "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1200&q=80",
  "Monthly Report": "https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=1200&q=80",
  "Market Outlook": "https://images.unsplash.com/photo-1546412414-e1885259563a?w=1200&q=80",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80";

// AUTHORIZED NEWS SOURCES
const AUTHORIZED_NEWS_SOURCES = [
  { name: "Dubai Land Department", url: "https://www.dubailand.gov.ae/en/news", type: "government", category: "Policy" },
  { name: "RERA", url: "https://www.rera.gov.ae/en/news", type: "government", category: "Policy" },
  { name: "UAE Ministry of Economy", url: "https://www.moec.gov.ae/en/media-center", type: "government", category: "Economic" },
  { name: "Dubai Media Office", url: "https://mediaoffice.ae/en/news", type: "government", category: "Government" },
  { name: "Emirates News Agency (WAM)", url: "https://wam.ae/en/search?q=real+estate", type: "government", category: "Market Update" },
  { name: "Abu Dhabi Media Office", url: "https://mediaoffice.abudhabi/en", type: "government", category: "Government" },
  { name: "Dubai Chamber of Commerce", url: "https://www.dubaichamber.com/news", type: "business", category: "Economic" },
  { name: "Arabian Business", url: "https://www.arabianbusiness.com/industries/real-estate", type: "media", category: "Market Update" },
  { name: "Gulf News Property", url: "https://gulfnews.com/living-in-uae/property", type: "media", category: "Market Update" },
  { name: "Zawya", url: "https://www.zawya.com/en/business/real-estate", type: "media", category: "Analysis" },
  { name: "Khaleej Times", url: "https://www.khaleejtimes.com/business/real-estate", type: "media", category: "Market Update" },
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
      return new Response(JSON.stringify({ success: false, error: "Firecrawl connector not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "AI capabilities not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ===================== ENRICH ACTION =====================
    if (action === "enrich") {
      console.log("Starting article enrichment...");
      
      // Get articles missing content or images
      const { data: articlesToEnrich, error: fetchError } = await supabase
        .from("market_news")
        .select("id, title, excerpt, category, source_url, image_url, content")
        .or("content.is.null,image_url.is.null")
        .limit(30);

      if (fetchError) throw fetchError;
      
      if (!articlesToEnrich || articlesToEnrich.length === 0) {
        return new Response(JSON.stringify({ success: true, enriched: 0, message: "All articles already enriched" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Found ${articlesToEnrich.length} articles to enrich`);
      let enrichedCount = 0;
      const errors: string[] = [];

      for (const article of articlesToEnrich) {
        try {
          let fullContent = article.content;
          let imageUrl = article.image_url;

          // Only scrape if we need content
          if (!fullContent && article.source_url) {
            console.log(`Scraping ${article.source_url} for "${article.title}"...`);
            
            try {
              const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  url: article.source_url,
                  formats: ["markdown"],
                  onlyMainContent: true,
                  waitFor: 3000,
                  timeout: 30000,
                }),
              });

              if (scrapeResponse.ok) {
                const scrapeData = await scrapeResponse.json();
                const rawMarkdown = scrapeData.data?.markdown || scrapeData.markdown || "";

                if (rawMarkdown.length > 100) {
                  // Use AI to clean and extract the article body
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
                          content: `You extract the full article body text from raw scraped markdown. Return ONLY the article content as clean readable paragraphs. Remove navigation, ads, footers, sidebars, social media links, and any non-article text. Preserve the article's structure with paragraph breaks. Do not add any commentary.`
                        },
                        {
                          role: "user",
                          content: `Extract the full article body from this scraped page about "${article.title}":\n\n${rawMarkdown.substring(0, 30000)}`
                        }
                      ],
                    }),
                  });

                  if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    const extractedContent = aiData.choices?.[0]?.message?.content;
                    if (extractedContent && extractedContent.length > 50) {
                      fullContent = extractedContent;
                    }
                  }

                  // Try to find an image from the scraped data
                  if (!imageUrl) {
                    const imgMatch = rawMarkdown.match(/!\[.*?\]\((https?:\/\/[^\s)]+\.(jpg|jpeg|png|webp)[^\s)]*)\)/i);
                    if (imgMatch) {
                      imageUrl = imgMatch[1];
                    }
                  }
                }
              } else {
                console.warn(`Scrape failed for ${article.source_url}: ${scrapeResponse.status}`);
              }
            } catch (scrapeErr) {
              console.warn(`Scrape error for "${article.title}":`, scrapeErr);
            }

            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 1500));
          }

          // Assign category fallback image if still no image
          if (!imageUrl) {
            imageUrl = CATEGORY_IMAGES[article.category] || DEFAULT_IMAGE;
          }

          // If we still don't have content, generate a brief article from the excerpt
          if (!fullContent) {
            try {
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
                      content: `You are a professional real estate journalist writing for a Dubai property news platform. Write a detailed, factual news article based on the headline and summary provided. Write 4-6 paragraphs. Be professional, factual, and informative. Do NOT add disclaimers or mention that you are AI.`
                    },
                    {
                      role: "user",
                      content: `Write a full news article based on this:\n\nHeadline: ${article.title}\nSummary: ${article.excerpt}\nSource: ${article.category}\n\nWrite 4-6 detailed paragraphs.`
                    }
                  ],
                }),
              });

              if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                fullContent = aiData.choices?.[0]?.message?.content || null;
              }
            } catch (aiErr) {
              console.warn(`AI content generation failed for "${article.title}":`, aiErr);
            }
          }

          // Update the article in the database
          const updateData: Record<string, unknown> = {};
          if (fullContent && !article.content) updateData.content = fullContent;
          if (imageUrl && !article.image_url) updateData.image_url = imageUrl;

          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from("market_news")
              .update(updateData)
              .eq("id", article.id);

            if (updateError) {
              errors.push(`${article.title}: DB update failed - ${updateError.message}`);
            } else {
              enrichedCount++;
              console.log(`✓ Enriched: "${article.title}" (content: ${!!fullContent}, image: ${!!imageUrl})`);
            }
          }
        } catch (articleErr) {
          errors.push(`${article.title}: ${articleErr instanceof Error ? articleErr.message : "Unknown error"}`);
        }
      }

      console.log(`Enrichment complete: ${enrichedCount}/${articlesToEnrich.length} articles enriched`);

      return new Response(JSON.stringify({
        success: true,
        enriched: enrichedCount,
        total: articlesToEnrich.length,
        errors: errors.length > 0 ? errors : undefined,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===================== COLLECT ACTION (existing) =====================
    const sourcesToProcess = sources?.length 
      ? AUTHORIZED_NEWS_SOURCES.filter(s => sources.includes(s.name))
      : AUTHORIZED_NEWS_SOURCES;

    console.log(`Processing ${sourcesToProcess.length} authorized news sources...`);

    const collectedNews: NewsArticle[] = [];
    const errors: string[] = [];

    for (const source of sourcesToProcess) {
      console.log(`Scraping ${source.name}...`);
      
      try {
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
                  { role: "system", content: "You are a news aggregator. Return only factual news headlines and summaries from the specified source. Format as JSON array." },
                  { role: "user", content: `Find the 5 most recent Dubai/UAE real estate news articles from ${source.name} (${source.url}). Include title, summary, date, and link for each.` }
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
            }
          } catch (firecrawlError) {
            console.warn(`Firecrawl error for ${source.name}:`, firecrawlError);
          }
        }

        if (!newsContent) {
          errors.push(`${source.name}: No content extracted`);
          continue;
        }

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

    let insertedCount = 0;
    for (const article of collectedNews) {
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

        if (!insertError) insertedCount++;
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
