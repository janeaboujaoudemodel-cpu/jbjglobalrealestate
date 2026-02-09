/**
 * Sarah Test Extraction - Complete 1:1 Mirror Extraction
 * 
 * Extracts ALL project data from Provident Estate:
 * - All high-resolution images (NO LIMITS)
 * - All PDF documents (brochures, floor plans, payment plans)
 * - All videos (YouTube, Vimeo, MP4)
 * - Complete project metadata
 * 
 * Strategies:
 * 1. Firecrawl with screenshot + full page scrape
 * 2. Gatsby page-data.json API fallback
 * 3. AI extraction for structured data
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractionResult {
  success: boolean;
  project?: {
    name: string;
    developer: string;
    location: string;
    status: string;
    price_from: number | null;
    bedrooms_min: number | null;
    bedrooms_max: number | null;
    handover_date: string | null;
    property_type: string | null;
    status_label: string | null;
    description: string | null;
  };
  images: string[];
  videos: string[];
  documents: {
    brochure: string | null;
    floorPlans: string[];
    paymentPlan: string | null;
  };
  validationErrors: string[];
  apiCallsMade: number;
  totalApiCost: string;
  extraction_method?: string;
  duration_ms?: number;
  message?: string;
  error?: string;

  // When queue=true, we also write the extracted listing into the approval queue.
  queued?: boolean;
  queued_import_id?: string | null;
  queued_message?: string | null;
}

type DeveloperRow = { id: string; name: string | null; slug: string | null };

function normalizeProvidentImageUrl(url: string): string {
  const noQuery = url.split("?")[0];
  // Provident uses /x/{WxH}/... variations; unify before dedupe.
  return noQuery.replace(/\/x\/\d+x\d+\//, "/x/1200x800/");
}

function toSlugPart(val: string): string {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildSlug(projectName: string, developerSlug?: string | null): string {
  const base = toSlugPart(projectName).slice(0, 60);
  const dev = developerSlug ? toSlugPart(developerSlug).slice(0, 18) : "";
  const out = dev ? `${base}-${dev}` : base;
  return out.slice(0, 80) || base || "unknown";
}

function buildDevMap(developers: DeveloperRow[]): Map<string, { id: string; name: string; slug: string }> {
  const map = new Map<string, { id: string; name: string; slug: string }>();
  for (const d of developers) {
    if (!d.name || !d.slug) continue;
    const norm = d.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    map.set(norm, { id: d.id, name: d.name, slug: d.slug });
    for (const w of d.name.toLowerCase().split(/\s+/)) {
      if (w.length > 3) map.set(w, { id: d.id, name: d.name, slug: d.slug });
    }
  }
  return map;
}

function matchDeveloperName(
  developerName: string | null | undefined,
  devMap: Map<string, { id: string; name: string; slug: string }>
): { id: string; name: string; slug: string } | null {
  if (!developerName) return null;
  const norm = developerName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const direct = devMap.get(norm);
  if (direct) return direct;
  for (const w of developerName.toLowerCase().split(/\s+/)) {
    if (w.length > 3 && devMap.has(w)) return devMap.get(w) || null;
  }
  return null;
}

function buildImagesPayload(urls: string[], projectName: string, max = 12) {
  const seen = new Set<string>();
  const out: Array<{ url: string; alt_text: string; display_order: number }> = [];
  for (const raw of urls) {
    if (!raw) continue;
    const lower = raw.toLowerCase();
    if (!lower.includes("cloudfront.net")) continue;
    if (lower.includes("logo") || lower.includes("icon") || lower.includes("favicon")) continue;
    const normalized = normalizeProvidentImageUrl(raw);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push({
      url: normalized,
      alt_text: `${projectName} - Image ${out.length + 1}`,
      display_order: out.length,
    });
    if (out.length >= max) break;
  }
  return out;
}

function buildDocumentsPayload(docs: ExtractionResult["documents"]) {
  const out: Array<{ url: string; type: string; name?: string }> = [];

  if (docs?.brochure) {
    out.push({ url: docs.brochure, type: "brochure", name: "Brochure" });
  }
  if (docs?.paymentPlan) {
    out.push({ url: docs.paymentPlan, type: "payment_plan", name: "Payment Plan" });
  }
  (docs?.floorPlans || []).forEach((url, idx) => {
    if (!url) return;
    out.push({ url, type: "floor_plan", name: `Floor Plan ${idx + 1}` });
  });

  // Deduplicate by URL (strip query)
  const seen = new Set<string>();
  return out.filter((d) => {
    const key = d.url.split("?")[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function queueToApprovalQueue(params: {
  supabaseUrl: string;
  serviceKey: string;
  projectUrl: string;
  force: boolean;
  result: ExtractionResult;
}): Promise<{ queued: boolean; queued_import_id: string | null; queued_message: string | null }> {
  const { supabaseUrl, serviceKey, projectUrl, force, result } = params;
  const supabase = createClient(supabaseUrl, serviceKey);

  const project = result.project;
  if (!project?.name || project.name === "Unknown") {
    return {
      queued: false,
      queued_import_id: null,
      queued_message: "Cannot queue: missing project name",
    };
  }

  const { data: devRows } = await supabase.from("uae_developers").select("id, name, slug");
  const devMap = buildDevMap((devRows || []) as DeveloperRow[]);
  const dev = matchDeveloperName(project.developer, devMap);

  const slug = buildSlug(project.name, dev?.slug);
  const imagesPayload = buildImagesPayload(result.images || [], project.name, 12);
  const documentsPayload = buildDocumentsPayload(result.documents);

  const insertPayload: Record<string, any> = {
    name: project.name,
    slug,
    developer_name: project.developer || null,
    location: project.location || null,
    emirate: "Dubai",
    description: project.description?.substring(0, 1500) || null,
    price_from: project.price_from ?? null,
    bedrooms_min: project.bedrooms_min ?? null,
    bedrooms_max: project.bedrooms_max ?? null,
    handover_date: project.handover_date ?? null,
    property_type_label: project.property_type ?? null,
    status_label: project.status_label ?? null,
    images: imagesPayload,
    documents: documentsPayload,
    is_new_project: true,
    status: "pending",
    source_url: projectUrl,
  };

  if (dev?.id) insertPayload.developer_id = dev.id;

  const { data: existing } = await supabase
    .from("pending_project_imports")
    .select("id, status")
    .eq("slug", slug)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    if (!force && existing.status !== "pending") {
      return {
        queued: false,
        queued_import_id: existing.id,
        queued_message: `Already queued (status=${existing.status}). Use force to re-queue.`,
      };
    }

    const { error } = await supabase
      .from("pending_project_imports")
      .update({
        ...insertPayload,
        status: "pending",
        reviewed_at: null,
        reviewed_by: null,
        review_notes: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      return { queued: false, queued_import_id: null, queued_message: error.message };
    }

    return {
      queued: true,
      queued_import_id: existing.id,
      queued_message: "Updated existing queued item",
    };
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("pending_project_imports")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertErr) {
    return { queued: false, queued_import_id: null, queued_message: insertErr.message };
  }

  return {
    queued: true,
    queued_import_id: inserted?.id || null,
    queued_message: "Queued for approval",
  };
}

// Extract project slug from various URL formats
function extractProjectSlug(url: string): string | null {
  const match = url.match(/new-projects\/([^\/\?#]+)/);
  return match ? match[1].replace(/\/$/, "") : null;
}

// Try fetching Gatsby page-data.json with multiple fallback paths
async function fetchGatsbyPageData(projectSlug: string): Promise<any | null> {
  const paths = [
    `https://providentestate.com/page-data/new-projects/${projectSlug}/page-data.json`,
    `https://providentestate.com/page-data/off-plan/${projectSlug}/page-data.json`,
    `https://providentestate.com/page-data/properties/${projectSlug}/page-data.json`,
  ];
  
  for (const pageDataUrl of paths) {
    try {
      console.log("[Sarah] Trying Gatsby API:", pageDataUrl);
      
      const res = await fetch(pageDataUrl, {
        headers: { 
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      
      if (!res.ok) {
        console.log("[Sarah] Gatsby API returned:", res.status);
        continue;
      }
      
      const data = await res.json();
      
      // Check if it has actual data (not "No record found")
      if (data?.result?.serverData?.data?.status === true && 
          data?.result?.serverData?.data?.message === "No record found") {
        console.log("[Sarah] Gatsby API returned 'No record found'");
        continue;
      }
      
      // Check for valid project data
      if (data?.result?.data?.wpProject || data?.result?.data?.project || data?.result?.pageContext?.project) {
        console.log("[Sarah] Gatsby API success, data size:", JSON.stringify(data).length);
        return data;
      }
    } catch (err) {
      console.error("[Sarah] Gatsby API error:", err);
    }
  }
  
  return null;
}

// Direct HTML fetch as fallback (simpler, less likely to be blocked)
async function fetchDirectHtml(url: string): Promise<{ html: string; links: string[] } | null> {
  try {
    console.log("[Sarah] Trying direct fetch:", url);
    
    const res = await fetch(url, {
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      }
    });
    
    if (!res.ok) {
      console.log("[Sarah] Direct fetch returned:", res.status);
      return null;
    }
    
    const html = await res.text();
    
    // Extract links from HTML
    const links: string[] = [];
    const linkPattern = /href=["']([^"']+)["']/gi;
    let match;
    while ((match = linkPattern.exec(html)) !== null) {
      links.push(match[1]);
    }
    
    console.log("[Sarah] Direct fetch success:", html.length, "chars,", links.length, "links");
    return { html, links };
  } catch (err) {
    console.error("[Sarah] Direct fetch error:", err);
    return null;
  }
}

// Extract data from Gatsby page-data structure
function parseGatsbyData(pageData: any): Partial<ExtractionResult["project"]> & { images: string[], documents: any } {
  const project = pageData?.result?.data?.wpProject || 
                  pageData?.result?.data?.project ||
                  pageData?.result?.pageContext?.project ||
                  {};
  
  const acf = project.projectAcf || project.acf || {};
  const images: string[] = [];
  const documents = { brochure: null as string | null, floorPlans: [] as string[], paymentPlan: null as string | null };
  
  // Extract images from gallery
  const gallery = acf.gallery || acf.projectGallery || [];
  if (Array.isArray(gallery)) {
    gallery.forEach((img: any) => {
      const url = img?.sourceUrl || img?.url || img?.mediaItemUrl;
      if (url && typeof url === "string") images.push(url);
    });
  }
  
  // Extract featured image
  const featuredImage = project.featuredImage?.node?.sourceUrl || acf.featuredImage?.sourceUrl;
  if (featuredImage) images.unshift(featuredImage);
  
  // Extract PDFs
  const brochure = acf.brochure?.mediaItemUrl || acf.brochure?.url || acf.brochureUrl;
  if (brochure) documents.brochure = brochure;
  
  const paymentPlan = acf.paymentPlan?.mediaItemUrl || acf.paymentPlanUrl;
  if (paymentPlan) documents.paymentPlan = paymentPlan;
  
  // Floor plans
  const floorPlans = acf.floorPlans || [];
  if (Array.isArray(floorPlans)) {
    floorPlans.forEach((fp: any) => {
      const url = fp?.mediaItemUrl || fp?.url;
      if (url) documents.floorPlans.push(url);
    });
  }
  
  return {
    name: project.title || acf.projectName || "Unknown",
    developer: acf.developer?.title || acf.developerName || "Unknown",
    location: acf.location || acf.area || "Dubai",
    status: acf.status || "Under Construction",
    price_from: parsePrice(acf.priceFrom || acf.startingPrice),
    bedrooms_min: parseBedrooms(acf.bedrooms)?.[0] || null,
    bedrooms_max: parseBedrooms(acf.bedrooms)?.[1] || null,
    handover_date: acf.handover || acf.handoverDate || null,
    property_type: acf.propertyType || null,
    status_label: acf.statusLabel || null,
    description: project.content || acf.description || null,
    images,
    documents
  };
}

function parsePrice(val: any): number | null {
  if (!val) return null;
  if (typeof val === "number") return val;
  const str = String(val).replace(/,/g, "");
  // Handle "AED X.XM" or "X.XM" format
  const mMatch = str.match(/([\d.]+)\s*[mM]/i);
  if (mMatch) return Math.round(parseFloat(mMatch[1]) * 1000000);
  // Handle "AED X,XXX,XXX" format
  const match = str.match(/(\d[\d,]*)/);
  return match ? parseInt(match[1].replace(/,/g, "")) : null;
}

function parseBedrooms(val: any): [number, number] | null {
  if (!val) return null;
  const str = String(val);
  const match = str.match(/(\d+)(?:\s*[-–]\s*(\d+))?/);
  if (!match) return null;
  const min = parseInt(match[1]);
  const max = match[2] ? parseInt(match[2]) : min;
  return [min, max];
}

// Extract all image URLs from HTML content
function extractImagesFromHtml(html: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();
  
  // Pattern 1: CloudFront URLs (Provident's CDN)
  const cloudfrontPattern = /https?:\/\/[a-z0-9\-]+\.cloudfront\.net\/[^\s"'<>\)]+\.(?:jpg|jpeg|png|webp)/gi;
  (html.match(cloudfrontPattern) || []).forEach(url => {
    const normalized = normalizeProvidentImageUrl(url);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      images.push(normalized);
    }
  });
  
  // Pattern 2: WordPress uploads
  const wpPattern = /https?:\/\/[^\s"'<>\)]+wp-content\/uploads[^\s"'<>\)]+\.(?:jpg|jpeg|png|webp)/gi;
  (html.match(wpPattern) || []).forEach(url => {
    const normalized = normalizeProvidentImageUrl(url);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      images.push(normalized);
    }
  });
  
  // Pattern 3: Any image URL with provident in the path
  const providentPattern = /https?:\/\/[^\s"'<>\)]*provident[^\s"'<>\)]*\.(?:jpg|jpeg|png|webp)/gi;
  (html.match(providentPattern) || []).forEach(url => {
    const normalized = normalizeProvidentImageUrl(url);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      images.push(normalized);
    }
  });
  
  // Pattern 4: img src tags
  const imgSrcPattern = /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi;
  let match;
  while ((match = imgSrcPattern.exec(html)) !== null) {
    const url = match[1];
    if (url && !url.startsWith('data:') && /\.(jpg|jpeg|png|webp)/i.test(url)) {
      const normalized = normalizeProvidentImageUrl(url);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        images.push(normalized);
      }
    }
  }
  
  // Pattern 5: background-image in CSS
  const bgPattern = /background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/gi;
  while ((match = bgPattern.exec(html)) !== null) {
    const url = match[1];
    if (url && !url.startsWith('data:') && /\.(jpg|jpeg|png|webp)/i.test(url)) {
      const normalized = normalizeProvidentImageUrl(url);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        images.push(normalized);
      }
    }
  }
  
  // Filter out logos, icons, avatars
  return images.filter(url => {
    const lower = url.toLowerCase();
    return !lower.includes('logo') && 
           !lower.includes('icon') && 
           !lower.includes('avatar') &&
           !lower.includes('placeholder') &&
           !lower.includes('spinner') &&
           !lower.includes('loading') &&
           !lower.includes('favicon');
  });
}

// Extract all video URLs
function extractVideosFromHtml(html: string): string[] {
  const videos: string[] = [];
  const seen = new Set<string>();
  
  // Direct video files
  const videoPattern = /https?:\/\/[^\s"'<>\)]+\.(?:mp4|webm|mov)/gi;
  (html.match(videoPattern) || []).forEach(url => {
    if (!seen.has(url)) {
      seen.add(url);
      videos.push(url);
    }
  });
  
  // YouTube embeds
  const youtubePattern = /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/gi;
  let match;
  while ((match = youtubePattern.exec(html)) !== null) {
    const ytUrl = `https://www.youtube.com/watch?v=${match[1]}`;
    if (!seen.has(ytUrl)) {
      seen.add(ytUrl);
      videos.push(ytUrl);
    }
  }
  
  // Vimeo embeds
  const vimeoPattern = /https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/gi;
  while ((match = vimeoPattern.exec(html)) !== null) {
    const vUrl = `https://vimeo.com/${match[1]}`;
    if (!seen.has(vUrl)) {
      seen.add(vUrl);
      videos.push(vUrl);
    }
  }
  
  return videos;
}

// Extract all PDF documents
function extractPdfsFromHtml(html: string, links: string[]): { brochure: string | null; floorPlans: string[]; paymentPlan: string | null } {
  const allPdfs: string[] = [];
  const seen = new Set<string>();
  
  // From HTML
  const pdfPattern = /https?:\/\/[^\s"'<>\)]+\.pdf(?:\?[^\s"'<>\)]*)?/gi;
  (html.match(pdfPattern) || []).forEach(url => {
    const clean = url.split('?')[0];
    if (!seen.has(clean)) {
      seen.add(clean);
      allPdfs.push(url);
    }
  });
  
  // From links array
  links.forEach((link: string) => {
    if (/\.pdf(\?|$)/i.test(link)) {
      const clean = link.split('?')[0];
      if (!seen.has(clean)) {
        seen.add(clean);
        allPdfs.push(link);
      }
    }
  });
  
  // Categorize PDFs
  let brochure: string | null = null;
  let paymentPlan: string | null = null;
  const floorPlans: string[] = [];
  
  allPdfs.forEach(pdf => {
    const lower = pdf.toLowerCase();
    if (lower.includes('brochure')) {
      brochure = brochure || pdf;
    } else if (lower.includes('payment')) {
      paymentPlan = paymentPlan || pdf;
    } else if (lower.includes('floor') || lower.includes('plan')) {
      floorPlans.push(pdf);
    }
  });
  
  // If no brochure found, use first uncategorized PDF
  if (!brochure && allPdfs.length > 0) {
    const remaining = allPdfs.filter(p => p !== paymentPlan && !floorPlans.includes(p));
    if (remaining.length > 0) brochure = remaining[0];
  }
  
  return { brochure, floorPlans, paymentPlan };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  let apiCallsMade = 0;

  // Check API keys
  if (!firecrawlKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "FIRECRAWL_API_KEY not configured",
      images: [],
      videos: [],
      documents: { brochure: null, floorPlans: [], paymentPlan: null },
      validationErrors: ["Missing Firecrawl API key - Please connect Firecrawl in Settings → Connectors"],
      apiCallsMade: 0,
      totalApiCost: "$0"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { testUrl, queue = false, force = true } = await req.json().catch(() => ({}));
    const projectUrl = testUrl || "https://providentestate.com/new-projects/damac-sun-city/";

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const respond = async (result: ExtractionResult) => {
      if (queue) {
        if (!supabaseUrl || !serviceKey) {
          return new Response(
            JSON.stringify({
              ...result,
              queued: false,
              queued_import_id: null,
              queued_message: "Backend not configured for queue writes",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const queued = await queueToApprovalQueue({
          supabaseUrl,
          serviceKey,
          projectUrl,
          force: !!force,
          result,
        });

        return new Response(
          JSON.stringify({ ...result, ...queued }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    };
    
    console.log("[Sarah] Starting COMPLETE extraction test:", projectUrl);

    // Validate URL
    if (!projectUrl.includes("providentestate.com")) {
      return new Response(JSON.stringify({
        success: false,
        error: "URL must be a Provident Estate page",
        images: [],
        videos: [],
        documents: { brochure: null, floorPlans: [], paymentPlan: null },
        validationErrors: ["Invalid URL - only providentestate.com supported"],
        apiCallsMade: 0,
        totalApiCost: "$0"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectSlug = extractProjectSlug(projectUrl);
    console.log("[Sarah] Project slug:", projectSlug);

    // STRATEGY 1: Try Gatsby page-data.json first (fastest & most reliable)
    if (projectSlug) {
      const gatsbyData = await fetchGatsbyPageData(projectSlug);
      
      if (gatsbyData?.result?.data?.wpProject || gatsbyData?.result?.data?.project) {
        console.log("[Sarah] Using Gatsby API data");
        const parsed = parseGatsbyData(gatsbyData);
        
        const projectInfo = {
          name: parsed.name || "Unknown",
          developer: parsed.developer || "Unknown",
          location: parsed.location || "Dubai",
          status: parsed.status || "Under Construction",
          price_from: parsed.price_from ?? null,
          bedrooms_min: parsed.bedrooms_min ?? null,
          bedrooms_max: parsed.bedrooms_max ?? null,
          handover_date: parsed.handover_date ?? null,
          property_type: parsed.property_type ?? null,
          status_label: parsed.status_label ?? null,
          description: parsed.description ?? null
        };

        const result: ExtractionResult = {
          success: true,
          project: projectInfo,
          images: parsed.images || [],
          videos: [],
          documents: parsed.documents || { brochure: null, floorPlans: [], paymentPlan: null },
          validationErrors: [],
          apiCallsMade: 1,
          totalApiCost: "$0.001",
          extraction_method: "gatsby-api",
          duration_ms: Date.now() - startTime
        };

        // Validate we got enough data
        if (!projectInfo.name || projectInfo.name === "Unknown") {
          result.validationErrors.push("Could not extract project name");
          result.success = false;
        }

        console.log("[Sarah] Gatsby extraction complete:", projectInfo.name, "| Images:", result.images.length);

        return await respond(result);
      }
    }

    // STRATEGY 2: Try direct HTML fetch (simpler, less likely to be blocked)
    console.log("[Sarah] Gatsby API unavailable, trying direct HTML fetch...");
    
    const directResult = await fetchDirectHtml(projectUrl);
    let html = "";
    let links: string[] = [];
    let markdown = "";
    let firecrawlFailed = false;
    
    if (directResult) {
      html = directResult.html;
      links = directResult.links;
      console.log("[Sarah] Using direct HTML fetch result");
    } else {
      // STRATEGY 3: Firecrawl as last resort
      console.log("[Sarah] Direct fetch failed, trying Firecrawl...");
      
      const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({ 
          url: projectUrl, 
          formats: ["markdown", "links", "rawHtml"],
          waitFor: 10000,  // 10s wait for dynamic content
          timeout: 60000,  // 60s timeout
          onlyMainContent: false,
          mobile: true,  // Try mobile version (sometimes less blocked)
        }),
      });
      apiCallsMade++;

      if (!scrapeRes.ok) {
        const errText = await scrapeRes.text();
        console.error("[Sarah] Firecrawl error:", scrapeRes.status, errText);
        firecrawlFailed = true;
        
        let errorDetail = "The website is blocking automated access";
        try {
          const errJson = JSON.parse(errText);
          if (errJson.code === "SCRAPE_ALL_ENGINES_FAILED") {
            errorDetail = "Provident Estate is blocking automated access. Try: (1) Use a different project URL, (2) Wait a few minutes and retry, (3) The project page may have moved or been removed.";
          } else {
            errorDetail = errJson.error || errJson.message || errText.substring(0, 200);
          }
        } catch {
          errorDetail = errText.substring(0, 200);
        }

        return new Response(JSON.stringify({
          success: false,
          error: "All extraction methods failed",
          images: [],
          videos: [],
          documents: { brochure: null, floorPlans: [], paymentPlan: null },
          validationErrors: [errorDetail, "Try alternative URLs like: https://providentestate.com/new-projects/sobha-seahaven/ or https://providentestate.com/new-projects/emaar-the-oasis/"],
          apiCallsMade,
          totalApiCost: `$${(apiCallsMade * 0.002).toFixed(4)}`,
          extraction_method: "all-failed",
          duration_ms: Date.now() - startTime
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const scrapeData = await scrapeRes.json();
      markdown = scrapeData.data?.markdown || "";
      links = scrapeData.data?.links || [];
      html = scrapeData.data?.rawHtml || "";
      console.log("[Sarah] Firecrawl success:", markdown.length, "chars markdown,", links.length, "links");
    }

    // Extract ALL media from combined content
    const combinedContent = markdown + "\n" + html + "\n" + links.join("\n");
    const images = extractImagesFromHtml(combinedContent);
    const videos = extractVideosFromHtml(combinedContent);
    const documents = extractPdfsFromHtml(combinedContent, links);

    console.log("[Sarah] Extracted:", images.length, "images,", videos.length, "videos,", 
                (documents.brochure ? 1 : 0) + documents.floorPlans.length + (documents.paymentPlan ? 1 : 0), "documents");

    // Use AI to extract structured data
    let projectData = {
      name: projectSlug?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Unknown",
      developer: "Unknown",
      location: "Dubai",
      status: "Under Construction",
      price_from: null as number | null,
      bedrooms_min: null as number | null,
      bedrooms_max: null as number | null,
      handover_date: null as string | null,
      property_type: null as string | null,
      status_label: null as string | null,
      description: null as string | null
    };

    if (markdown.length > 200 && lovableKey) {
      console.log("[Sarah] Using AI to extract structured data...");
      
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lovableKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { 
                role: "system", 
                content: `You are a real estate data extractor for Dubai/UAE properties. Extract accurate project details. Return ONLY valid JSON.` 
              },
              { 
                role: "user", 
                content: `Extract complete project details from this Provident Estate page:

${markdown.substring(0, 25000)}

Return JSON with these fields (use null for missing):
{
  "name": "Full project name",
  "developer": "Developer company name",
  "location": "Area/community in Dubai",
  "price_from": 1500000,
  "bedrooms": "1-4 BR or Studio, 1, 2 BR",
  "handover": "Q2 2026 or Ready",
  "property_type": "Apartment/Villa/Townhouse/Sky Villa",
  "status_label": "Future Launch/New Phase/New Launch/Coming Soon or null",
  "description": "2-3 paragraph project description"
}` 
              }
            ],
            temperature: 0.1,
            max_tokens: 3000,
          }),
        });
        apiCallsMade++;

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          
          // Extract JSON from response
          let jsonStr = content;
          const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1];
          }
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            projectData = {
              name: parsed.name || projectData.name,
              developer: parsed.developer || projectData.developer,
              location: parsed.location || projectData.location,
              status: parsed.status || projectData.status,
              price_from: parsePrice(parsed.price_from),
              bedrooms_min: parseBedrooms(parsed.bedrooms)?.[0] || null,
              bedrooms_max: parseBedrooms(parsed.bedrooms)?.[1] || null,
              handover_date: parsed.handover || null,
              property_type: parsed.property_type || null,
              status_label: parsed.status_label || null,
              description: parsed.description || null
            };
            console.log("[Sarah] AI extracted:", projectData.name, "by", projectData.developer);
          }
        } else {
          console.error("[Sarah] AI response error:", aiRes.status);
        }
      } catch (aiErr) {
        console.error("[Sarah] AI extraction failed:", aiErr);
      }
    }

    // Build result
    const result: ExtractionResult = {
      success: true,
      project: projectData,
      images: images,
      videos: videos,
      documents: documents,
      validationErrors: [],
      apiCallsMade,
      totalApiCost: `$${(apiCallsMade * 0.002).toFixed(4)}`,
      extraction_method: "firecrawl-full",
      duration_ms: Date.now() - startTime
    };

    // Validate results
    if (images.length === 0) {
      result.validationErrors.push("No images found - try a different project URL");
    }
    if (images.length < 5) {
      result.validationErrors.push(`Only ${images.length} images found - expected 10+`);
    }
    if (projectData.name === "Unknown") {
      result.validationErrors.push("Could not extract project name");
    }
    if (projectData.developer === "Unknown") {
      result.validationErrors.push("Could not extract developer name");
    }

    result.success = result.validationErrors.filter(e => e.includes("No images") || e.includes("project name")).length === 0;

    console.log("[Sarah] Complete:", projectData.name, "| Images:", result.images.length, "| Success:", result.success);

    return await respond(result);

  } catch (error) {
    console.error("[Sarah] Fatal error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      images: [],
      videos: [],
      documents: { brochure: null, floorPlans: [], paymentPlan: null },
      validationErrors: ["Unexpected error: " + (error instanceof Error ? error.message : "Unknown")],
      apiCallsMade,
      totalApiCost: `$${(apiCallsMade * 0.002).toFixed(4)}`,
      duration_ms: Date.now() - startTime
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
