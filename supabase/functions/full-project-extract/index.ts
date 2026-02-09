import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * FULL PROJECT EXTRACT - Comprehensive extraction mirroring Provident source exactly
 * Extracts: Hero, Description, Gallery, USPs, Amenities, Floor Plans, Location, Payment, Brochure, FAQs
 * NO AI - Pure deterministic regex/DOM parsing for reliability
 */

const BANNED_TERMS_REGEX = /\b(Provident|Provident Estate|providentestate)\b/gi;
const MIN_REASONABLE_PRICE_AED = 50_000;

function sanitizeText(text: string | null): string | null {
  if (!text) return null;
  return text.replace(BANNED_TERMS_REGEX, "").replace(/\s{2,}/g, " ").trim() || null;
}

function stripMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 502 || res.status === 503 || res.status === 429) {
        const wait = attempt * 3000 + Math.random() * 2000;
        console.warn(`[Retry ${attempt}/${maxRetries}] Got ${res.status}, waiting ${Math.round(wait)}ms...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
  throw lastError || new Error("Max retries exceeded");
}

interface ExtractedData {
  name: string | null;
  developerName: string | null;
  description: string | null;
  location: string | null;
  priceFrom: number | null;
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  handover: string | null;
  paymentPlan: string | null;
  propertyType: string | null;
  statusLabel: string | null;
  uspHeadline: string | null;
  uspBullets: string[];
  uspImageUrl: string | null;
  locationHeadline: string | null;
  locationDescription: string | null;
  locationDistances: Array<{ label: string; time: string }>;
  locationImageUrl: string | null;
  amenities: string[];
  floorPlanTypes: Array<{ label: string; pdfUrl?: string }>;
  faqs: Array<{ question: string; answer: string }>;
  paymentBreakdown: { down_payment?: string; during_construction?: string; on_completion?: string };
  images: Array<{ url: string; alt_text: string; display_order: number }>;
  documents: Array<{ url: string; type: string; name: string }>;
}

function extractFromMarkdown(markdown: string, html: string, links: string[]): ExtractedData {
  const cleanMd = stripMarkdownLinks(markdown);
  
  // --- NAME & DEVELOPER ---
  const titleMatch = cleanMd.match(/^#\s+(.+?)(?:\s+by\s+|$)/m);
  let name = titleMatch?.[1]?.trim() || null;
  if (name) name = sanitizeText(name);
  
  const devLinkMatch = markdown.match(/\[by\s+([^\]]+)\]/i) || markdown.match(/by\s+\[([^\]]+)\]/i);
  let developerName = devLinkMatch?.[1]?.trim() || null;
  if (!developerName) {
    const devMatch = cleanMd.match(/by\s+([A-Z][A-Za-z\s&]+?)(?:\s*\n|$)/i);
    developerName = devMatch?.[1]?.trim() || null;
  }
  
  // --- DESCRIPTION ---
  const aboutMatch = markdown.match(/About the project\s*\n+([^\n#]+(?:\n[^\n#]+)*)/i);
  let description: string | null = null;
  if (aboutMatch?.[1]) {
    description = sanitizeText(stripMarkdownLinks(aboutMatch[1]).replace(/\n+/g, " ").trim());
  }
  
  // --- PRICE ---
  let priceFrom: number | null = null;
  const aedMatch = cleanMd.match(/(?:Starting Price|from|starting\s+from)\s*AED\s*([\d,.]+)\s*(K|M)?/i) 
    || cleanMd.match(/AED\s*([\d,.]+)\s*(K|M)?/i);
  if (aedMatch) {
    let val = parseFloat(aedMatch[1].replace(/,/g, ""));
    if (aedMatch[2]?.toUpperCase() === "K") val *= 1000;
    if (aedMatch[2]?.toUpperCase() === "M") val *= 1000000;
    priceFrom = Math.round(val);
    if (priceFrom < MIN_REASONABLE_PRICE_AED) priceFrom = null;
  }
  
  // --- HANDOVER ---
  const handoverMatch = cleanMd.match(/(?:Handover|Completion)[:\s]*(Q[1-4]?\s*\d{4}|\d{4}|Ready)/i);
  const handover = handoverMatch?.[1]?.trim() || null;
  
  // --- PAYMENT PLAN SUMMARY ---
  const ppMatch = cleanMd.match(/Payment Plan\s*\n*(\d{2}\/\d{2})/i);
  const paymentPlan = ppMatch?.[1] || null;
  
  // --- BEDROOMS ---
  const bedMatch = cleanMd.match(/((?:Studio|[\d,&\s\-]+)\s*(?:BR|Bedrooms?|to\s*\d+\s*BR))/i);
  let bedroomsMin: number | null = null;
  let bedroomsMax: number | null = null;
  if (bedMatch) {
    const nums = bedMatch[1].match(/\d+/g);
    if (nums) {
      bedroomsMin = parseInt(nums[0]);
      bedroomsMax = parseInt(nums[nums.length - 1] || nums[0]);
    }
  }
  
  // --- LOCATION ---
  const locMatch = cleanMd.match(/(?:in|at)\s+([A-Z][A-Za-z\s,\-]+?)(?:\s*\||$|\n)/i);
  const location = locMatch?.[1]?.trim() || null;
  
  // --- PROPERTY TYPE ---
  const typeMatch = cleanMd.match(/(Apartment|Villa|Townhouse|Penthouse|Sky[- ]?Villa|Studio|Mansion|Duplex)/i);
  const propertyType = typeMatch?.[1] || null;
  
  // --- STATUS LABEL ---
  const statusMatch = cleanMd.match(/(Future Launch|New Phase|New Launch|Coming Soon|Sold Out)/i);
  const statusLabel = statusMatch?.[1] || null;
  
  // --- UNIQUE SELLING POINTS ---
  const uspSection = markdown.match(/Unique Selling Points\s*\n+###?\s*([^\n]+)\s*\n+((?:[-•*]\s*[^\n]+\n*)+)/i);
  const uspHeadline = uspSection?.[1]?.trim() || null;
  const uspBullets: string[] = [];
  if (uspSection?.[2]) {
    const bullets = uspSection[2].match(/[-•*]\s*([^\n]+)/g);
    if (bullets) {
      for (const b of bullets) {
        const clean = sanitizeText(b.replace(/^[-•*]\s*/, ""));
        if (clean) uspBullets.push(clean);
      }
    }
  }
  
  // USP Image - look for image near "Unique Selling Points"
  let uspImageUrl: string | null = null;
  const uspImgMatch = markdown.match(/Unique Selling Points[\s\S]*?!\[[^\]]*\]\(([^)]+cloudfront[^)]+)\)/i);
  if (uspImgMatch) uspImageUrl = uspImgMatch[1];
  
  // --- LOCATION SECTION ---
  const locSection = markdown.match(/Location\s*\n+###?\s*([^\n]+)\s*\n+([\s\S]*?)(?=##|\n\n##|$)/i);
  const locationHeadline = locSection?.[1]?.trim() || null;
  let locationDescription: string | null = null;
  const locationDistances: Array<{ label: string; time: string }> = [];
  
  if (locSection?.[2]) {
    const lines = locSection[2].split("\n");
    const descLines: string[] = [];
    for (const line of lines) {
      const distMatch = line.match(/[-•*]\s*(\d+\s*Minutes?)\s*[–-]\s*(.+)/i);
      if (distMatch) {
        locationDistances.push({ time: distMatch[1].trim(), label: distMatch[2].trim() });
      } else if (line.trim() && !line.startsWith("Get more")) {
        descLines.push(stripMarkdownLinks(line.trim()));
      }
    }
    if (descLines.length > 0) {
      locationDescription = sanitizeText(descLines.join(" "));
    }
  }
  
  // Location Image
  let locationImageUrl: string | null = null;
  const locImgMatch = markdown.match(/Location[\s\S]*?!\[[^\]]*\]\(([^)]+cloudfront[^)]+)\)/i);
  if (locImgMatch) locationImageUrl = locImgMatch[1];
  
  // --- AMENITIES ---
  const amenities: string[] = [];
  const amenSection = markdown.match(/## Amenities\s*\n+([\s\S]*?)(?=##|$)/i);
  if (amenSection?.[1]) {
    const items = amenSection[1].split("\n").filter(l => l.trim() && !l.startsWith("#"));
    for (const item of items) {
      const clean = sanitizeText(item.trim());
      if (clean && clean.length > 2 && clean.length < 100) amenities.push(clean);
    }
  }
  
  // --- FLOOR PLAN TYPES ---
  const floorPlanTypes: Array<{ label: string; pdfUrl?: string }> = [];
  const fpSection = markdown.match(/## Floorplans\s*\n+([\s\S]*?)(?=##|Download Floorplans|!\[|$)/i);
  if (fpSection?.[1]) {
    const types = fpSection[1].split("\n").filter(l => l.trim() && !l.startsWith("#"));
    for (const t of types) {
      const clean = t.trim();
      if (clean.length > 2 && /bedroom|studio|penthouse|villa/i.test(clean)) {
        floorPlanTypes.push({ label: clean });
      }
    }
  }
  
  // --- PAYMENT BREAKDOWN ---
  const paymentBreakdown: { down_payment?: string; during_construction?: string; on_completion?: string } = {};
  const paySection = markdown.match(/## Payment Plans\s*\n+([\s\S]*?)(?=##|$)/i);
  if (paySection?.[1]) {
    const dpMatch = paySection[1].match(/(\d+%?)\s*\n*Down Payment/i);
    const dcMatch = paySection[1].match(/(\d+%?)\s*\n*During Construction/i);
    const ocMatch = paySection[1].match(/(\d+%?)\s*\n*On Completion/i);
    if (dpMatch) paymentBreakdown.down_payment = dpMatch[1];
    if (dcMatch) paymentBreakdown.during_construction = dcMatch[1];
    if (ocMatch) paymentBreakdown.on_completion = ocMatch[1];
  }
  
  // --- FAQs ---
  const faqs: Array<{ question: string; answer: string }> = [];
  const faqSection = markdown.match(/Useful Information[\s\S]*?(?=buy\s*\n|sell\s*\n|Off plan\s*\n|rent\s*\n|services\s*\n|$)/i);
  if (faqSection) {
    const qaPairs = faqSection[0].matchAll(/## (What|Where|Who|How|Is|Why)[^\n]+\?\s*\n+([^\n#]+)/gi);
    for (const match of qaPairs) {
      const q = match[0].match(/## ([^\n]+\?)/)?.[1]?.trim();
      const a = match[2]?.trim();
      if (q && a) faqs.push({ question: sanitizeText(q) || q, answer: sanitizeText(a) || a });
    }
  }
  
  // --- IMAGES ---
  const imageSet = new Set<string>();
  const imgRx = /!\[[^\]]*\]\(([^)]+cloudfront\.net[^)]+)\)/gi;
  for (const m of markdown.matchAll(imgRx)) {
    if (m[1]) imageSet.add(m[1]);
  }
  for (const l of links) {
    if (l.includes("cloudfront.net") && /\.(jpg|jpeg|png|webp)/i.test(l)) imageSet.add(l);
  }
  
  const excludePatterns = /(logo|icon|avatar|placeholder|spinner|favicon|brochure|payment[-_]?plan|floor[-_]?plan|master[-_]?plan)/i;
  const images = Array.from(imageSet)
    .filter(u => !excludePatterns.test(u))
    .map((u, i) => ({
      url: u.replace(/\/x\/\d+x\d+\//, "/x/1200x800/"),
      alt_text: `${name || "Project"} - Image ${i + 1}`,
      display_order: i,
    }))
    .slice(0, 20);
  
  // --- DOCUMENTS (PDFs) ---
  const documents: Array<{ url: string; type: string; name: string }> = [];
  const pdfRx = /https?:\/\/[^\s"'<>\)]+\.pdf(?:\?[^\s"'<>\)]*)?/gi;
  const pdfLinks = [...new Set([...(markdown.match(pdfRx) || []), ...links.filter(l => l.toLowerCase().includes(".pdf"))])];
  
  let brochureUrl: string | null = null;
  let paymentPlanUrl: string | null = null;
  const floorPlanUrls: string[] = [];
  
  for (const p of pdfLinks) {
    const lower = p.toLowerCase();
    if (!brochureUrl && lower.includes("brochure")) {
      brochureUrl = p;
      documents.push({ url: p, type: "brochure", name: `${name || "Project"} Brochure.pdf` });
    } else if (!paymentPlanUrl && lower.includes("payment")) {
      paymentPlanUrl = p;
      documents.push({ url: p, type: "payment_plan", name: `${name || "Project"} Payment Plan.pdf` });
    } else if (lower.includes("floor")) {
      floorPlanUrls.push(p);
      documents.push({ url: p, type: "floor_plan", name: `${name || "Project"} Floor Plan.pdf` });
    }
  }
  
  // If no brochure found, use first uncategorized PDF
  if (!brochureUrl && pdfLinks.length > 0) {
    const remaining = pdfLinks.filter(p => p !== paymentPlanUrl && !floorPlanUrls.includes(p));
    if (remaining.length > 0) {
      brochureUrl = remaining[0];
      documents.push({ url: remaining[0], type: "brochure", name: `${name || "Project"} Brochure.pdf` });
    }
  }
  
  return {
    name,
    developerName,
    description,
    location,
    priceFrom,
    bedroomsMin,
    bedroomsMax,
    handover,
    paymentPlan,
    propertyType,
    statusLabel,
    uspHeadline,
    uspBullets,
    uspImageUrl,
    locationHeadline,
    locationDescription,
    locationDistances,
    locationImageUrl,
    amenities,
    floorPlanTypes,
    faqs,
    paymentBreakdown,
    images,
    documents,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

  if (!firecrawlKey) {
    return new Response(JSON.stringify({ error: "Missing FIRECRAWL_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { importId, sourceUrl, dryRun = false } = await req.json();

    if (!importId && !sourceUrl) {
      return new Response(JSON.stringify({ error: "importId or sourceUrl required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If importId provided, fetch the source_url
    let url = sourceUrl;
    let pendingImport: any = null;
    
    if (importId) {
      const { data, error } = await supabase
        .from("pending_project_imports")
        .select("*")
        .eq("id", importId)
        .single();
      
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Import not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      pendingImport = data;
      url = data.source_url;
    }

    if (!url) {
      return new Response(JSON.stringify({ error: "No source_url available" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[FullExtract] Scraping ${url}...`);

    // Scrape with Firecrawl
    const scrapeRes = await fetchWithRetry("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${firecrawlKey}` },
      body: JSON.stringify({
        url,
        formats: ["markdown", "links", "rawHtml"],
        waitFor: 8000,
        timeout: 60000,
        onlyMainContent: false,
      }),
    });

    if (!scrapeRes.ok) {
      const errText = await scrapeRes.text();
      console.error(`[FullExtract] Scrape failed: ${errText.substring(0, 200)}`);
      return new Response(JSON.stringify({ error: `Scrape failed: ${scrapeRes.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeRes.json();
    const markdown = scrapeData.data?.markdown || "";
    const links = scrapeData.data?.links || [];
    const html = scrapeData.data?.rawHtml || "";

    const extracted = extractFromMarkdown(markdown, html, links);

    console.log(`[FullExtract] Extracted: ${extracted.name}, ${extracted.images.length} imgs, ${extracted.documents.length} docs, ${extracted.amenities.length} amenities, ${extracted.faqs.length} FAQs`);

    if (dryRun) {
      return new Response(JSON.stringify({ success: true, dryRun: true, extracted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get developer ID
    let developerId: string | null = null;
    if (extracted.developerName) {
      const { data: devs } = await supabase
        .from("developers")
        .select("id, name")
        .ilike("name", `%${extracted.developerName}%`)
        .limit(1);
      if (devs && devs.length > 0) {
        developerId = devs[0].id;
      }
    }

    // Check completeness
    const hasMinimal = Boolean(extracted.description && extracted.developerName && extracted.images.length >= 1);
    const hasDocs = extracted.documents.length > 0;
    const stillIncomplete = !hasMinimal || !hasDocs;

    // Update the pending import
    if (importId) {
      const { error: updateErr } = await supabase
        .from("pending_project_imports")
        .update({
          name: extracted.name || pendingImport?.name,
          developer_name: extracted.developerName,
          developer_id: developerId,
          description: extracted.description,
          location: extracted.location,
          price_from: extracted.priceFrom,
          bedrooms_min: extracted.bedroomsMin,
          bedrooms_max: extracted.bedroomsMax,
          handover_date: extracted.handover,
          payment_plan: extracted.paymentPlan,
          property_type_label: extracted.propertyType,
          status_label: extracted.statusLabel,
          images: extracted.images,
          documents: extracted.documents,
          amenities_list: extracted.amenities,
          usp_headline: extracted.uspHeadline,
          usp_bullets: extracted.uspBullets,
          usp_image_url: extracted.uspImageUrl,
          location_headline: extracted.locationHeadline,
          location_description: extracted.locationDescription,
          location_distances: extracted.locationDistances,
          location_image_url: extracted.locationImageUrl,
          floor_plan_types: extracted.floorPlanTypes,
          faqs: extracted.faqs,
          payment_breakdown: extracted.paymentBreakdown,
          review_notes: stillIncomplete ? "INCOMPLETE" : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", importId);

      if (updateErr) {
        console.error(`[FullExtract] Update failed:`, updateErr);
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      extracted: {
        name: extracted.name,
        images: extracted.images.length,
        documents: extracted.documents.length,
        amenities: extracted.amenities.length,
        faqs: extracted.faqs.length,
        hasUSP: Boolean(extracted.uspHeadline),
        hasLocationDetails: Boolean(extracted.locationHeadline),
        stillIncomplete,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[FullExtract] Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
