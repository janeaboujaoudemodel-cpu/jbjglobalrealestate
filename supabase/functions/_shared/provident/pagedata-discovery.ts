/**
 * Gatsby Page-Data Discovery for Provident Estate
 * 
 * This module fetches Provident's Gatsby page-data.json endpoints to reliably
 * discover ALL ~1,336 project listings WITHOUT requiring Firecrawl.
 * 
 * Gatsby exposes JSON endpoints at:
 * - Page 1: https://providentestate.com/page-data/new-projects/page-data.json
 * - Page N: https://providentestate.com/page-data/new-projects/page/{N}/page-data.json
 */

const PROVIDENT_BASE = "https://providentestate.com";
const CANONICAL_TOTAL_PAGES = 89;

// Known working image size (464x312 works, 1200x800 often 403s)
const SAFE_IMAGE_SIZE = "464x312";

export interface DiscoveredProject {
  slug: string;
  name: string;
  url: string;
  developer_name: string | null;
  location: string | null;
  price_from: number | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  handover: string | null;
  images: Array<{ url: string; alt_text: string; display_order: number }>;
}

export interface PageDataDiscoveryResult {
  success: boolean;
  pages_processed: number;
  total_discovered: number;
  projects: DiscoveredProject[];
  errors: string[];
}

function normalizeImageUrl(url: string): string {
  if (!url) return "";
  // Keep the original size variant or use safe fallback
  // DO NOT upscale to 1200x800 - that causes 403 errors
  if (url.includes("/x/") && url.includes("cloudfront.net")) {
    // Replace any size with safe size
    return url.replace(/\/x\/\d+x\d+\//, `/x/${SAFE_IMAGE_SIZE}/`);
  }
  return url;
}

function parsePrice(priceStr: string | undefined | null): number | null {
  if (!priceStr) return null;
  const match = priceStr.match(/([\d,.]+)\s*(K|M)?/i);
  if (!match) return null;
  
  let value = parseFloat(match[1].replace(/,/g, ""));
  if (match[2]?.toUpperCase() === "K") value *= 1000;
  if (match[2]?.toUpperCase() === "M") value *= 1000000;
  
  // Convert EUR to AED if needed (1 EUR ≈ 4 AED)
  if (priceStr.toUpperCase().includes("EUR")) {
    value *= 4;
  } else if (priceStr.toUpperCase().includes("USD")) {
    value *= 3.67;
  }
  
  return value > 50000 ? Math.round(value) : null;
}

function parseBedrooms(bedroomsStr: string | undefined | null): { min: number | null; max: number | null } {
  if (!bedroomsStr) return { min: null, max: null };
  const nums = bedroomsStr.match(/\d+/g);
  if (!nums || nums.length === 0) return { min: null, max: null };
  return {
    min: parseInt(nums[0]),
    max: parseInt(nums[nums.length - 1])
  };
}

async function fetchPageData(pageNum: number): Promise<any | null> {
  const url = pageNum === 1
    ? `${PROVIDENT_BASE}/page-data/new-projects/page-data.json`
    : `${PROVIDENT_BASE}/page-data/new-projects/page/${pageNum}/page-data.json`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!res.ok) {
      console.warn(`[PageData] Page ${pageNum} returned ${res.status}`);
      return null;
    }
    
    return await res.json();
  } catch (e) {
    console.warn(`[PageData] Failed to fetch page ${pageNum}:`, e);
    return null;
  }
}

function extractProjectsFromPageData(pageData: any): DiscoveredProject[] {
  const projects: DiscoveredProject[] = [];
  
  if (!pageData) return projects;
  
  // Gatsby page-data structure: result.serverData.data.hits[]
  const hits = pageData?.result?.serverData?.data?.hits ||
               pageData?.result?.data?.hits ||
               pageData?.serverData?.data?.hits ||
               pageData?.data?.hits ||
               [];
  
  for (const hit of hits) {
    try {
      const slug = (hit.slug || hit.objectID || "").toLowerCase().trim();
      if (!slug || slug === "page") continue;
      
      // Get name (prefer title, fallback to name from bitrix or slug)
      const name = hit.title || hit.bitrix?.name || hit.name ||
        slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      
      // Developer from bitrix data
      const developerName = hit.bitrix?.developer_name || hit.developer_name || null;
      
      // Location
      const location = hit.project_location || hit.bitrix?.project_location || hit.location || null;
      
      // Price
      const priceStr = hit.price || hit.bitrix?.price || null;
      const priceFrom = parsePrice(priceStr);
      
      // Bedrooms
      const bedroomsStr = hit.bedrooms || hit.bitrix?.bedrooms || null;
      const { min: bedroomsMin, max: bedroomsMax } = parseBedrooms(bedroomsStr);
      
      // Handover
      const handover = hit.handover || hit.bitrix?.handover || null;
      
      // Images - extract from various possible locations
      const images: Array<{ url: string; alt_text: string; display_order: number }> = [];
      const imageUrls = new Set<string>();
      
      // Check common image fields
      const imageSources = [
        hit.image,
        hit.main_image,
        hit.featured_image,
        hit.bitrix?.image,
        hit.bitrix?.main_image,
        ...(hit.images || []),
        ...(hit.gallery || []),
        ...(hit.bitrix?.images || []),
      ];
      
      for (const imgSrc of imageSources) {
        if (!imgSrc) continue;
        
        let imgUrl = typeof imgSrc === "string" ? imgSrc : (imgSrc.url || imgSrc.src || "");
        if (!imgUrl) continue;
        
        // Normalize and dedupe
        imgUrl = normalizeImageUrl(imgUrl);
        if (imgUrl && !imageUrls.has(imgUrl)) {
          imageUrls.add(imgUrl);
          images.push({
            url: imgUrl,
            alt_text: `${name} - Image ${images.length + 1}`,
            display_order: images.length,
          });
        }
      }
      
      projects.push({
        slug,
        name,
        url: `${PROVIDENT_BASE}/new-projects/${slug}`,
        developer_name: developerName,
        location,
        price_from: priceFrom,
        bedrooms_min: bedroomsMin,
        bedrooms_max: bedroomsMax,
        handover,
        images: images.slice(0, 5), // Keep first 5 for placeholder
      });
    } catch (e) {
      console.warn(`[PageData] Failed to parse hit:`, e);
    }
  }
  
  return projects;
}

export async function discoverAllProjectsViaPageData(opts?: {
  startPage?: number;
  endPage?: number;
  concurrency?: number;
}): Promise<PageDataDiscoveryResult> {
  const startPage = Math.max(1, opts?.startPage ?? 1);
  const endPage = Math.min(CANONICAL_TOTAL_PAGES, opts?.endPage ?? CANONICAL_TOTAL_PAGES);
  const concurrency = Math.max(1, Math.min(6, opts?.concurrency ?? 3));
  
  const errors: string[] = [];
  const allProjects: DiscoveredProject[] = [];
  const seenSlugs = new Set<string>();
  
  // Process pages in batches for controlled concurrency
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  let pagesProcessed = 0;
  
  for (let i = 0; i < pages.length; i += concurrency) {
    const batch = pages.slice(i, i + concurrency);
    
    const results = await Promise.all(
      batch.map(async (pageNum) => {
        const pageData = await fetchPageData(pageNum);
        if (!pageData) {
          errors.push(`Page ${pageNum} fetch failed`);
          return [];
        }
        pagesProcessed++;
        return extractProjectsFromPageData(pageData);
      })
    );
    
    for (const projects of results) {
      for (const project of projects) {
        if (!seenSlugs.has(project.slug)) {
          seenSlugs.add(project.slug);
          allProjects.push(project);
        }
      }
    }
  }
  
  console.log(`[PageData] Discovered ${allProjects.length} unique projects from ${pagesProcessed} pages`);
  
  return {
    success: true,
    pages_processed: pagesProcessed,
    total_discovered: allProjects.length,
    projects: allProjects,
    errors,
  };
}

/**
 * Get total pages from first page-data response
 */
export async function detectTotalPagesFromPageData(): Promise<number> {
  try {
    const pageData = await fetchPageData(1);
    if (!pageData) return CANONICAL_TOTAL_PAGES;
    
    // Try to find pagination info
    const totalPages = pageData?.result?.serverData?.pageContext?.numPages ||
                       pageData?.result?.pageContext?.numPages ||
                       pageData?.pageContext?.numPages ||
                       CANONICAL_TOTAL_PAGES;
    
    return Math.max(1, Math.min(200, Number(totalPages) || CANONICAL_TOTAL_PAGES));
  } catch {
    return CANONICAL_TOTAL_PAGES;
  }
}
