 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 const PROVIDENT_BASE_URL = "https://providentestate.com";
 const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";
 
 function slugify(name: string): string {
   return name.toLowerCase().replace(/[&]/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
 }
 
 function normalizeUrl(url: string): string {
   const trimmed = url?.trim() ?? "";
   if (!trimmed) return "";
   if (trimmed.startsWith("//")) return `https:${trimmed}`;
   if (trimmed.startsWith("/")) return `${PROVIDENT_BASE_URL}${trimmed}`;
   return trimmed;
 }
 
 function decodeHtmlEntities(input: string): string {
   return input.replace(/&amp;nbsp;/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
     .replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     console.log("🔄 Starting v24: MAP all developer pages, then scrape each");
 
     if (!firecrawlApiKey) throw new Error("FIRECRAWL_API_KEY not configured");
 
     // Step 1: MAP entire site for developer URLs
     console.log("🗺️ Mapping providentestate.com for developer pages...");
     const mapRes = await fetch(`${FIRECRAWL_API_URL}/map`, {
       method: "POST",
       headers: { "Authorization": `Bearer ${firecrawlApiKey}`, "Content-Type": "application/json" },
       body: JSON.stringify({ url: PROVIDENT_BASE_URL, search: "developed-by", limit: 5000 }),
     });
 
     if (!mapRes.ok) throw new Error(`Map failed: ${mapRes.status}`);
     const mapData = await mapRes.json();
     const devUrls = [...new Set((mapData.data?.links || []).filter((u: string) => 
       u.includes("/developed-by-") && !u.includes("?") && !u.includes("#")
     ))];
     
     console.log(`📊 Found ${devUrls.length} developer URLs`);
     if (devUrls.length === 0) throw new Error("No developer URLs found");
 
     // Step 2: Scrape each page
     const developers = new Map();
     for (let i = 0; i < devUrls.length; i++) {
       const url = devUrls[i];
       console.log(`[${i + 1}/${devUrls.length}] ${url}`);
       
       const scrapeRes = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
         method: "POST",
         headers: { "Authorization": `Bearer ${firecrawlApiKey}`, "Content-Type": "application/json" },
         body: JSON.stringify({ url, formats: ["html"], onlyMainContent: false, waitFor: 2000 }),
       });
 
       if (!scrapeRes.ok) { console.error(`Failed: ${url}`); continue; }
       const html = (await scrapeRes.json()).data?.html || "";
       
       const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
       const name = nameMatch ? decodeHtmlEntities(nameMatch[1]).trim() : "";
       if (!name || name.length < 3) continue;
       
       const slug = slugify(name);
       const logoMatch = html.match(/<img[^>]*(?:class="[^"]*logo|src="[^"]*logo)[^>]*src="([^"]+)"/i);
       const featureMatch = html.match(/<img[^>]*(?:class="[^"]*(?:banner|hero)|src="[^"]*banner)[^>]*src="([^"]+)"/i);
       const descMatch = html.match(/<p[^>]*>([\s\S]{20,500}?)<\/p>/i);
       
       developers.set(slug, {
         name, slug,
         description: descMatch ? decodeHtmlEntities(descMatch[1]).replace(/<[^>]+>/g, "").trim().substring(0, 500) : "",
         feature_image_url: featureMatch ? normalizeUrl(featureMatch[1]) : "",
         logo_url: logoMatch ? normalizeUrl(logoMatch[1]) : "",
         provident_link: url,
         display_order: i + 1,
       });
       
       await new Promise(r => setTimeout(r, 500));
     }
 
     const allDevs = Array.from(developers.values());
     console.log(`✅ Extracted ${allDevs.length} developers`);
 
     // Save to DB
     await supabase.from("pending_developer_imports").delete().eq("source", "provident_estate");
     const { error } = await supabase.from("pending_developer_imports").upsert(
       allDevs.map(d => ({ ...d, source: "provident_estate", status: "pending", extracted_at: new Date().toISOString() })),
       { onConflict: "slug" }
     );
     if (error) throw error;
 
     await supabase.from("extraction_job_logs").insert({
       source_id: null, job_type: "developer_extraction", status: "completed",
       started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
       records_found: allDevs.length, records_matched: allDevs.filter(d => d.feature_image_url && d.logo_url).length,
       records_pending: allDevs.length, metadata: { source: "provident_estate", version: "v24-map-strategy" },
     });
 
     return new Response(JSON.stringify({ success: true, message: `Extracted ${allDevs.length} developers`, count: allDevs.length }), 
       { headers: { ...corsHeaders, "Content-Type": "application/json" } });
   } catch (error: unknown) {
     console.error("❌", error);
     return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
   }
 });