import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bad image patterns - generic logos/UI elements that aren't real article photos
const BAD_IMAGE_PATTERNS = [
  /adgmo-logotype/i,
  /newsbanner\.jpg/i,
  /twitter\.png/i,
  /photonpay/i,
  /favicon/i,
  /sprite/i,
  /placeholder/i,
  /default[-_]?image/i,
  /no[-_]?image/i,
  /blank\.png/i,
  /pixel\.gif/i,
  /spacer/i,
  /transparent\.png/i,
];

// Known duplicate/bad image URLs to force re-scrape
const KNOWN_BAD_URLS = [
  "wam.ae/en/images/newsbanner.jpg",
  "adgmo-logotype",
  "twitter.png",
  "moet.gov.ae/documents/",
  "thenationalnews.com/resizer",
  "propertyfinder.ae/blog/wp-content/uploads/2025/09/Header-image.png",
  "survey.customerpulse.gov.ae",
];

// No fake/stock image pools - only real source images or null

function isImageBad(url: string): boolean {
  return BAD_IMAGE_PATTERNS.some(p => p.test(url)) || KNOWN_BAD_URLS.some(bad => url.includes(bad)) || url.includes('unsplash.com');
}

function extractOgImage(markdown: string): string | null {
  // Try og:image patterns commonly found in scraped markdown
  const ogPatterns = [
    /og:image[^"]*"(https?:\/\/[^"]+)"/i,
    /twitter:image[^"]*"(https?:\/\/[^"]+)"/i,
    /property="og:image"\s+content="(https?:\/\/[^"]+)"/i,
    /meta\s+name="twitter:image"\s+content="(https?:\/\/[^"]+)"/i,
  ];
  for (const p of ogPatterns) {
    const m = p.exec(markdown);
    if (m && m[1] && !isImageBad(m[1])) return m[1];
  }
  return null;
}

function extractFirstGoodImage(markdown: string): string | null {
  const imgPatterns = [
    /!\[.*?\]\((https?:\/\/[^\s)]+\.(jpg|jpeg|png|webp)[^\s)]*)\)/gi,
    /(?:src|href)=["'](https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)[^\s"']*)/gi,
  ];
  for (const pattern of imgPatterns) {
    let match;
    while ((match = pattern.exec(markdown)) !== null) {
      const url = match[1];
      if (!isImageBad(url) && !(/logo/i.test(url)) && !(/icon/i.test(url)) && url.length > 30) {
        return url;
      }
    }
  }
  return null;
}

// No stock photo fallbacks - return null if no real image found
function pickNullFallback(): null {
  return null;
}

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
  // Expanded sources
  { name: "Provident Estate", url: "https://www.providentestate.com/blog/", type: "media", category: "Market Update" },
  { name: "Gulf Business", url: "https://gulfbusiness.com/category/real-estate/", type: "media", category: "Market Update" },
  { name: "The National", url: "https://www.thenationalnews.com/business/property/", type: "media", category: "Analysis" },
  { name: "Property Finder", url: "https://www.propertyfinder.ae/blog/", type: "media", category: "Market Update" },
  { name: "Bayut", url: "https://www.bayut.com/mybayut/", type: "media", category: "Market Update" },
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
      
      // Get all existing image_urls to avoid duplicates in fallback assignment
      const { data: allArticles } = await supabase
        .from("market_news")
        .select("image_url");
      const usedImageUrls = new Set((allArticles || []).map(a => a.image_url).filter(Boolean));
      
      // Get articles missing content, images, AI analysis, key_stats, or key_takeaways
      const { data: articlesToEnrich, error: fetchError } = await supabase
        .from("market_news")
        .select("id, title, excerpt, category, source_url, image_url, content, ai_analysis, key_stats, key_takeaways")
        .or("content.is.null,image_url.is.null,ai_analysis.is.null,key_stats.is.null,key_takeaways.is.null,key_stats.eq.[],key_takeaways.eq.[]")
        .limit(30);

      if (fetchError) throw fetchError;
      
      // Also find articles with known bad/duplicate images
      const { data: badImageArticles } = await supabase
        .from("market_news")
        .select("id, title, excerpt, category, source_url, image_url, content, ai_analysis")
        .not("image_url", "is", null)
        .limit(100);
      
      const articlesWithBadImages = (badImageArticles || []).filter(a => 
        a.image_url && isImageBad(a.image_url)
      );
      
      // Merge both lists, dedup by ID
      const enrichIds = new Set((articlesToEnrich || []).map(a => a.id));
      const allToEnrich = [...(articlesToEnrich || [])];
      for (const a of articlesWithBadImages) {
        if (!enrichIds.has(a.id)) {
          allToEnrich.push(a);
          enrichIds.add(a.id);
        }
      }

      if (allToEnrich.length === 0) {
        return new Response(JSON.stringify({ success: true, enriched: 0, message: "All articles already enriched" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Found ${allToEnrich.length} articles to enrich (${articlesWithBadImages.length} with bad images)`);
      let enrichedCount = 0;
      const errors: string[] = [];

      for (const article of allToEnrich) {
        try {
          let fullContent = article.content;
          let imageUrl = article.image_url;
          const needsImage = !imageUrl || isImageBad(imageUrl);

          // Scrape if we need content OR a better image
          if ((!fullContent || needsImage) && article.source_url) {
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
                  formats: ["markdown", "links"],
                  onlyMainContent: true,
                  waitFor: 3000,
                  timeout: 30000,
                }),
              });

              if (scrapeResponse.ok) {
                const scrapeData = await scrapeResponse.json();
                const rawMarkdown = scrapeData.data?.markdown || scrapeData.markdown || "";

                if (rawMarkdown.length > 100) {
                  // Extract content if needed
                  if (!fullContent) {
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
                            content: `You extract the FULL article body text from raw scraped markdown. Return the COMPLETE article content preserving ALL paragraphs — do NOT summarize or shorten. Remove navigation, ads, footers, sidebars, social media links, and any non-article text. Preserve the article's full structure with paragraph breaks. Do not add any commentary.`
                          },
                          {
                            role: "user",
                            content: `Extract the full article body from this scraped page about "${article.title}":\n\n${rawMarkdown.substring(0, 50000)}`
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
                  }

                  // Extract image: OG tags first, then inline images
                  if (needsImage) {
                    const ogImage = extractOgImage(rawMarkdown);
                    if (ogImage) {
                      imageUrl = ogImage;
                      console.log(`  Found OG image for "${article.title}": ${ogImage.substring(0, 80)}...`);
                    } else {
                      const inlineImage = extractFirstGoodImage(rawMarkdown);
                      if (inlineImage) {
                        imageUrl = inlineImage;
                        console.log(`  Found inline image for "${article.title}": ${inlineImage.substring(0, 80)}...`);
                      }
                    }
                  }
                }
              } else {
                console.warn(`Scrape failed for ${article.source_url}: ${scrapeResponse.status}`);
              }
            } catch (scrapeErr) {
              console.warn(`Scrape error for "${article.title}":`, scrapeErr);
            }

            await new Promise(r => setTimeout(r, 1500));
          }

          // Step 2: Firecrawl Search if still no image
          if ((!imageUrl || isImageBad(imageUrl)) && FIRECRAWL_API_KEY) {
            try {
              console.log(`  Searching for image: "${article.title}" Dubai real estate`);
              const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
                method: "POST",
                headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ query: `${article.title} Dubai real estate`, limit: 3 }),
              });
              if (searchResp.ok) {
                const searchData = await searchResp.json();
                for (const r of (searchData.data || [])) {
                  const ogImg = r.metadata?.ogImage || r.metadata?.image || r.metadata?.og_image;
                  if (ogImg && !isImageBad(ogImg) && !usedImageUrls.has(ogImg)) {
                    imageUrl = ogImg;
                    usedImageUrls.add(ogImg);
                    console.log(`  Found search image for "${article.title}": ${ogImg.substring(0, 80)}`);
                    break;
                  }
                }
              }
              await new Promise(r => setTimeout(r, 1000));
            } catch (searchErr) {
              console.warn(`  Search error for "${article.title}":`, searchErr);
            }
          }

          // Step 3: AI-generate image as last resort
          if ((!imageUrl || isImageBad(imageUrl)) && LOVABLE_API_KEY) {
            try {
              const categoryPrompts: Record<string, string> = {
                "Market Update": "Modern Dubai skyline with luxury skyscrapers reflecting golden sunset light, aerial real estate photography",
                "Policy": "Professional UAE government building with flag, modern architecture in Abu Dhabi or Dubai",
                "Economic": "Dubai Financial Centre DIFC skyline with modern office towers, business district aerial view",
                "Analysis": "Dubai Marina panoramic aerial view with luxury yachts and towers, real estate market photography",
                "Government": "Dubai government buildings with UAE flag, modern civic architecture golden hour",
                "Infrastructure": "Dubai metro and highway interchange aerial view with surrounding development",
              };
              const prompt = categoryPrompts[article.category] || 
                `Professional editorial photo related to: ${article.title}. Dubai UAE real estate context. Ultra high resolution.`;
              
              console.log(`  Generating AI image for "${article.title}"...`);
              const genResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-image",
                  messages: [{ role: "user", content: prompt }],
                  modalities: ["image", "text"],
                }),
              });

              if (genResp.ok) {
                const genData = await genResp.json();
                const b64Url = genData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
                if (b64Url && b64Url.startsWith("data:image")) {
                  const base64Data = b64Url.split(",")[1];
                  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                  const storagePath = `${article.id}.webp`;
                  
                  const { error: uploadErr } = await supabase.storage
                    .from("news-images")
                    .upload(storagePath, binaryData, { contentType: "image/webp", upsert: true });

                  if (!uploadErr) {
                    const { data: urlData } = supabase.storage.from("news-images").getPublicUrl(storagePath);
                    imageUrl = urlData.publicUrl;
                    console.log(`  AI generated image for "${article.title}"`);
                  }
                }
              }
            } catch (genErr) {
              console.warn(`  AI generation error for "${article.title}":`, genErr);
            }
          }

          // Final check
          if (!imageUrl || isImageBad(imageUrl)) {
            imageUrl = null;
            console.log(`  No image found for "${article.title}" after all attempts`);
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

          // Generate AI analysis + key_stats + key_takeaways if we have content
          let aiAnalysis: string | null = null;
          let keyStats: { label: string; value: string }[] = [];
          let keyTakeaways: string[] = [];
          const contentForAnalysis = fullContent || article.content;
          const needsAnalysis = !article.ai_analysis || 
            !article.key_stats || (Array.isArray(article.key_stats) && article.key_stats.length === 0) ||
            !article.key_takeaways || (Array.isArray(article.key_takeaways) && article.key_takeaways.length === 0);
          if (contentForAnalysis && needsAnalysis) {
            try {
              const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                      content: `You are a Dubai real estate market analyst. Analyze this article and return a JSON object with these fields:
1. "analysis": 3-4 bullet points (array of strings) about market impact, investor opportunity, and outlook.
2. "key_stats": array of objects with "label" and "value" fields — extract 3-4 key numbers/statistics from the article (e.g., {"label": "Transaction Value", "value": "AED 8.8B"}).
3. "key_takeaways": array of 3-5 concise one-sentence takeaway strings summarizing the most important points.

Return ONLY valid JSON, no markdown wrapping. Be factual and positive where appropriate.`
                    },
                    {
                      role: "user",
                      content: `Analyze this article:\n\nTitle: ${article.title}\n\n${contentForAnalysis.substring(0, 5000)}`
                    }
                  ],
                }),
              });

              if (analysisResponse.ok) {
                const analysisData = await analysisResponse.json();
                const rawContent = analysisData.choices?.[0]?.message?.content || "";
                try {
                  // Strip markdown code fences if present
                  const jsonStr = rawContent.replace(/```json\s*|```\s*/g, "").trim();
                  const parsed = JSON.parse(jsonStr);
                  if (Array.isArray(parsed.analysis)) {
                    aiAnalysis = parsed.analysis.map((p: string) => `- ${p}`).join("\n");
                  } else if (typeof parsed.analysis === "string") {
                    aiAnalysis = parsed.analysis;
                  }
                  if (Array.isArray(parsed.key_stats)) {
                    keyStats = parsed.key_stats.slice(0, 4);
                  }
                  if (Array.isArray(parsed.key_takeaways)) {
                    keyTakeaways = parsed.key_takeaways.slice(0, 5);
                  }
                } catch {
                  // Fallback: use raw content as analysis text
                  aiAnalysis = rawContent;
                }
              }
            } catch (analysisErr) {
              console.warn(`AI analysis failed for "${article.title}":`, analysisErr);
            }
          }

          // Update the article in the database
          const updateData: Record<string, unknown> = {};
          if (fullContent && !article.content) updateData.content = fullContent;
          if (imageUrl && (!article.image_url || isImageBad(article.image_url))) updateData.image_url = imageUrl;
          if (aiAnalysis) updateData.ai_analysis = aiAnalysis;
          if (keyStats.length > 0) updateData.key_stats = keyStats;
          if (keyTakeaways.length > 0) updateData.key_takeaways = keyTakeaways;

          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from("market_news")
              .update(updateData)
              .eq("id", article.id);

            if (updateError) {
              errors.push(`${article.title}: DB update failed - ${updateError.message}`);
            } else {
              enrichedCount++;
              console.log(`✓ Enriched: "${article.title}" (content: ${!!fullContent}, image: ${!!imageUrl}, analysis: ${!!aiAnalysis}, stats: ${keyStats.length}, takeaways: ${keyTakeaways.length})`);
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

    // ===================== FIX-IMAGES ACTION =====================
    if (action === "fix-images") {
      console.log("Starting fix-images: targeting articles with bad/duplicate images...");
      
      const { data: allArticles } = await supabase
        .from("market_news")
        .select("id, title, category, source_url, image_url")
        .not("image_url", "is", null);
      
      const usedImageUrls = new Set((allArticles || []).map(a => a.image_url).filter(Boolean));
      
      // Find articles with known bad patterns or duplicates
      const badArticles = (allArticles || []).filter(a => {
        if (!a.image_url) return false;
        if (isImageBad(a.image_url)) return true;
        if (a.image_url.includes("customerpulse.gov.ae")) return true;
        if (a.image_url.includes("survey.customerpulse")) return true;
        if (a.image_url.includes("UAEGoldNew")) return true;
        return false;
      });
      
      // Also find duplicate images (same URL used by 2+ articles)
      const urlCounts = new Map<string, number>();
      for (const a of (allArticles || [])) {
        if (a.image_url) urlCounts.set(a.image_url, (urlCounts.get(a.image_url) || 0) + 1);
      }
      const duplicateArticles = (allArticles || []).filter(a => 
        a.image_url && (urlCounts.get(a.image_url) || 0) > 1 && !badArticles.find(b => b.id === a.id)
      );
      
      const toFix = [...badArticles, ...duplicateArticles];
      console.log(`Found ${toFix.length} articles to fix (${badArticles.length} bad, ${duplicateArticles.length} duplicates)`);
      
      let fixedCount = 0;
      for (const article of toFix) {
        let newImageUrl: string | null = null;
        
        // Try to scrape the source for the real image
        if (article.source_url) {
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
                onlyMainContent: false,
                waitFor: 3000,
                timeout: 30000,
              }),
            });
            
            if (scrapeResponse.ok) {
              const scrapeData = await scrapeResponse.json();
              const md = scrapeData.data?.markdown || scrapeData.markdown || "";
              const ogImg = extractOgImage(md);
              if (ogImg && !isImageBad(ogImg)) {
                newImageUrl = ogImg;
              } else {
                const inlineImg = extractFirstGoodImage(md);
                if (inlineImg) newImageUrl = inlineImg;
              }
            }
          } catch (e) {
            console.warn(`Scrape failed for fix-images: ${article.title}`);
          }
          await new Promise(r => setTimeout(r, 1000));
        }
        
        // If scrape didn't work, try Firecrawl search for the article title
        if (!newImageUrl) {
          try {
            const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: `${article.title} Dubai real estate`,
                limit: 3,
              }),
            });
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              for (const result of (searchData.data || [])) {
                const md = result.markdown || "";
                const img = extractOgImage(md) || extractFirstGoodImage(md);
                if (img && !isImageBad(img) && !usedImageUrls.has(img)) {
                  newImageUrl = img;
                  break;
                }
              }
            }
          } catch (e) {
            console.warn(`Search failed for fix-images: ${article.title}`);
          }
          await new Promise(r => setTimeout(r, 1000));
        }
        
        // No stock fallback — set to null if no real image found
        if (!newImageUrl) {
          newImageUrl = null;
        }
        
        if (newImageUrl && newImageUrl !== article.image_url) {
          usedImageUrls.add(newImageUrl);
          const { error } = await supabase
            .from("market_news")
            .update({ image_url: newImageUrl })
            .eq("id", article.id);
          
          if (!error) {
            fixedCount++;
            console.log(`✓ Fixed image for "${article.title}"`);
          }
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        fixed: fixedCount,
        total: toFix.length,
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
        const usedImagesInBatch = new Set<string>();
        
        for (const article of extractedData.articles || []) {
          let articleImage = article.image_url || null;
          
          // If no image or bad image, try Firecrawl search fallback
          if (!articleImage || isImageBad(articleImage)) {
            try {
              const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  query: `"${article.title}" Dubai real estate`,
                  limit: 3,
                }),
              });
              
              if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                for (const result of (searchData.data || [])) {
                  const md = result.markdown || "";
                  const img = extractOgImage(md) || extractFirstGoodImage(md);
                  if (img && !isImageBad(img) && !usedImagesInBatch.has(img)) {
                    articleImage = img;
                    usedImagesInBatch.add(img);
                    break;
                  }
                }
              }
            } catch (e) {
              console.warn(`Image search failed for "${article.title}"`);
            }
            await new Promise(r => setTimeout(r, 500));
          } else {
            usedImagesInBatch.add(articleImage);
          }
          
          collectedNews.push({
            title: article.title,
            excerpt: article.excerpt,
            category: article.category || source.category,
            source: source.name,
            source_url: article.source_url || source.url,
            image_url: articleImage,
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
