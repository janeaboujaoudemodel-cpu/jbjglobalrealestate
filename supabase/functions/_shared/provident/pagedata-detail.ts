/**
 * Provident Gatsby Page-Data Detail Extractor
 * 
 * Fetches structured project data directly from Provident's Gatsby page-data.json
 * endpoints. This is MORE RELIABLE than parsing Firecrawl markdown for structured
 * fields like USPs, amenities, payment breakdown, FAQs, and location distances.
 * 
 * Endpoint pattern:
 * https://providentestate.com/page-data/new-projects/{slug}/page-data.json
 */

const PROVIDENT_BASE = "https://providentestate.com";
const SAFE_IMAGE_SIZE = "464x312";

export interface PageDataProjectDetail {
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
  brochureUrl: string | null;
  paymentPlanPdfUrl: string | null;
  floorPlanPdfUrls: string[];
}

function normalizeImageUrl(url: string): string {
  if (!url) return "";
  // Keep safe size variant to avoid 403 errors
  if (url.includes("/x/") && url.includes("cloudfront.net")) {
    return url.replace(/\/x\/\d+x\d+\//, `/x/${SAFE_IMAGE_SIZE}/`);
  }
  return url;
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  // Exclude placeholders, logos, icons, etc.
  const excludePatterns = /(logo|icon|avatar|placeholder|spinner|favicon|navbar|header|footer|menu|widget|sidebar|banner|thumbnail|thumb_|social|share|button|btn_|grid_\d+|general_brochure|brochure|payment[-_]?plan|floor[-_]?plan)/i;
  if (excludePatterns.test(url)) return false;
  // Must be a real image URL
  if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) return false;
  // Exclude data URIs
  if (url.startsWith("data:")) return false;
  return true;
}

function parsePrice(priceStr: string | number | undefined | null): number | null {
  if (typeof priceStr === "number") return priceStr > 50000 ? priceStr : null;
  if (!priceStr || typeof priceStr !== "string") return null;
  const match = priceStr.match(/([\d,.]+)\s*(K|M)?/i);
  if (!match) return null;
  
  let value = parseFloat(match[1].replace(/,/g, ""));
  if (match[2]?.toUpperCase() === "K") value *= 1000;
  if (match[2]?.toUpperCase() === "M") value *= 1000000;
  
  // Convert EUR to AED if needed
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

function extractDeepValue(obj: unknown, ...paths: string[]): unknown {
  for (const path of paths) {
    const keys = path.split(".");
    let current: unknown = obj;
    for (const key of keys) {
      if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[key];
      } else {
        current = undefined;
        break;
      }
    }
    if (current !== undefined && current !== null) return current;
  }
  return null;
}

function collectAllStrings(obj: unknown, filter: RegExp, out: string[]): void {
  if (typeof obj === "string") {
    if (filter.test(obj)) out.push(obj);
    return;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) collectAllStrings(item, filter, out);
    return;
  }
  if (obj && typeof obj === "object") {
    for (const value of Object.values(obj as Record<string, unknown>)) {
      collectAllStrings(value, filter, out);
    }
  }
}

export async function fetchProvidentPageDataDetail(slug: string): Promise<PageDataProjectDetail | null> {
  const url = `${PROVIDENT_BASE}/page-data/new-projects/${slug}/page-data.json`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    
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
      console.warn(`[PageDataDetail] Failed to fetch ${slug}: ${res.status}`);
      return null;
    }
    
    const json = await res.json();
    return parsePageDataDetail(json, slug);
  } catch (e) {
    console.warn(`[PageDataDetail] Error fetching ${slug}:`, e);
    return null;
  }
}

function parsePageDataDetail(pageData: unknown, slug: string): PageDataProjectDetail | null {
  if (!pageData) return null;
  
  // Navigate to the project data - Gatsby structure varies
  const serverData = extractDeepValue(pageData, "result.serverData", "serverData") as Record<string, unknown> | null;
  let data = extractDeepValue(pageData, "result.serverData.data", "result.data", "data") as Record<string, unknown> | null;
  const pageContext = extractDeepValue(pageData, "result.pageContext", "pageContext") as Record<string, unknown> | null;
  
  // Provident API wraps data in {status, message, data: {actual fields}}
  if (data && typeof data === "object" && (data as any).status === true && (data as any).data) {
    // Check for "No record found"
    if ((data as any).message === "No record found") return null;
    // Unwrap the inner data object
    data = (data as any).data;
  }
  
  // Bitrix data often contains the structured fields
  const bitrix = extractDeepValue(data, "bitrix", "project.bitrix") as Record<string, unknown> | null;
  const project = extractDeepValue(data, "project") as Record<string, unknown> | null;
  
  // Extract basic fields
  const name = (extractDeepValue(data, "name", "title", "project.name", "project.title") as string) || 
               (bitrix?.name as string) || null;
  
  const developerName = (extractDeepValue(data, "developer_name", "project.developer_name") as string) ||
                        (bitrix?.developer_name as string) || null;
  
  const description = (extractDeepValue(data, "about", "description", "project.about", "project.description") as string) ||
                      (bitrix?.about as string) || null;
  
  const location = (extractDeepValue(data, "project_location", "location", "project.project_location") as string) ||
                   (bitrix?.project_location as string) || null;
  
  // Price
  const priceStr = extractDeepValue(data, "price", "starting_price", "project.price") as string | number | null;
  const priceFrom = parsePrice(priceStr) || parsePrice(bitrix?.price as string);
  
  // Bedrooms
  const bedroomsStr = (extractDeepValue(data, "bedrooms", "project.bedrooms") as string) || 
                      (bitrix?.bedrooms as string);
  const { min: bedroomsMin, max: bedroomsMax } = parseBedrooms(bedroomsStr);
  
  // Handover
  const handover = (extractDeepValue(data, "handover", "project.handover", "completion") as string) ||
                   (bitrix?.handover as string) || null;
  
  // Payment plan summary
  const paymentPlan = (extractDeepValue(data, "payment_plan", "project.payment_plan") as string) ||
                      (bitrix?.payment_plan as string) || null;
  
  // Property type & status
  const propertyType = (extractDeepValue(data, "property_type", "project.property_type") as string) ||
                       (bitrix?.property_type as string) || null;
  
  const statusLabel = (extractDeepValue(data, "status", "project.status", "launch_status") as string) ||
                      (bitrix?.status as string) || null;
  
  // ========== USPs ==========
  const uspHeadline = (extractDeepValue(data, "usp_headline", "usps.headline", "project.usp_headline") as string) || null;
  const uspBullets: string[] = [];
  
  const uspRaw = extractDeepValue(data, "usps", "usp_bullets", "project.usps", "unique_selling_points");
  if (Array.isArray(uspRaw)) {
    for (const item of uspRaw) {
      if (typeof item === "string" && item.trim()) {
        uspBullets.push(item.trim());
      } else if (item && typeof item === "object" && "text" in item) {
        uspBullets.push(String((item as Record<string, unknown>).text).trim());
      } else if (item && typeof item === "object" && "title" in item) {
        uspBullets.push(String((item as Record<string, unknown>).title).trim());
      }
    }
  }
  
  const uspImageUrl = (extractDeepValue(data, "usp_image", "usps.image", "project.usp_image") as string) || null;
  
  // ========== Location ==========
  const locationHeadline = (extractDeepValue(data, "location_headline", "location.headline") as string) || null;
  const locationDescription = (extractDeepValue(data, "location_description", "location.description") as string) || null;
  const locationImageUrl = (extractDeepValue(data, "location_image", "location.image") as string) || null;
  
  const locationDistances: Array<{ label: string; time: string }> = [];
  const distancesRaw = extractDeepValue(data, "location_distances", "distances", "location.distances");
  if (Array.isArray(distancesRaw)) {
    for (const d of distancesRaw) {
      if (d && typeof d === "object") {
        const label = (d as Record<string, unknown>).label || (d as Record<string, unknown>).name || (d as Record<string, unknown>).place;
        const time = (d as Record<string, unknown>).time || (d as Record<string, unknown>).duration || (d as Record<string, unknown>).distance;
        if (label && time) {
          locationDistances.push({ label: String(label), time: String(time) });
        }
      }
    }
  }
  
  // ========== Amenities ==========
  const amenities: string[] = [];
  const amenitiesRaw = extractDeepValue(data, "amenities", "project.amenities", "amenities_list");
  if (Array.isArray(amenitiesRaw)) {
    for (const item of amenitiesRaw) {
      if (typeof item === "string" && item.trim()) {
        amenities.push(item.trim());
      } else if (item && typeof item === "object" && "name" in item) {
        amenities.push(String((item as Record<string, unknown>).name).trim());
      } else if (item && typeof item === "object" && "title" in item) {
        amenities.push(String((item as Record<string, unknown>).title).trim());
      }
    }
  }
  
  // ========== Floor Plans ==========
  const floorPlanTypes: Array<{ label: string; pdfUrl?: string }> = [];
  const floorPlansRaw = extractDeepValue(data, "floor_plans", "project.floor_plans", "floorplans");
  if (Array.isArray(floorPlansRaw)) {
    for (const fp of floorPlansRaw) {
      if (typeof fp === "string") {
        floorPlanTypes.push({ label: fp });
      } else if (fp && typeof fp === "object") {
        const label = (fp as Record<string, unknown>).type || (fp as Record<string, unknown>).label || (fp as Record<string, unknown>).name;
        const pdfUrl = (fp as Record<string, unknown>).pdf || (fp as Record<string, unknown>).url;
        if (label) {
          floorPlanTypes.push({ 
            label: String(label), 
            pdfUrl: pdfUrl ? String(pdfUrl) : undefined 
          });
        }
      }
    }
  }
  
  // ========== FAQs ==========
  const faqs: Array<{ question: string; answer: string }> = [];
  const faqsRaw = extractDeepValue(data, "faqs", "project.faqs", "useful_information", "faq");
  if (Array.isArray(faqsRaw)) {
    for (const faq of faqsRaw) {
      if (faq && typeof faq === "object") {
        const question = (faq as Record<string, unknown>).question || (faq as Record<string, unknown>).q || (faq as Record<string, unknown>).title;
        const answer = (faq as Record<string, unknown>).answer || (faq as Record<string, unknown>).a || (faq as Record<string, unknown>).content;
        if (question && answer) {
          faqs.push({ question: String(question), answer: String(answer) });
        }
      }
    }
  }
  
  // ========== Payment Breakdown ==========
  const paymentBreakdown: { down_payment?: string; during_construction?: string; on_completion?: string } = {};
  const paymentRaw = extractDeepValue(data, "payment_breakdown", "project.payment_breakdown", "payment_plan_details");
  if (paymentRaw && typeof paymentRaw === "object") {
    const pb = paymentRaw as Record<string, unknown>;
    if (pb.down_payment) paymentBreakdown.down_payment = String(pb.down_payment);
    if (pb.during_construction) paymentBreakdown.during_construction = String(pb.during_construction);
    if (pb.on_completion) paymentBreakdown.on_completion = String(pb.on_completion);
  }
  
  // ========== Images ==========
  const images: Array<{ url: string; alt_text: string; display_order: number }> = [];
  const imageUrls = new Set<string>();
  
  // Collect all image URLs from the page data
  const allImageUrls: string[] = [];
  collectAllStrings(pageData, /\.(jpg|jpeg|png|webp)(\?|$)/i, allImageUrls);
  
  // Filter and normalize
  for (const imgUrl of allImageUrls) {
    if (!isValidImageUrl(imgUrl)) continue;
    const normalized = normalizeImageUrl(imgUrl);
    if (normalized && !imageUrls.has(normalized)) {
      imageUrls.add(normalized);
      images.push({
        url: normalized,
        alt_text: `${name || slug} - Image ${images.length + 1}`,
        display_order: images.length,
      });
    }
  }
  
  // Also check specific image fields
  const specificImageFields = [
    "main_image", "featured_image", "image", "hero_image",
    "project.main_image", "project.featured_image", "project.image",
    "bitrix.main_image", "media_images"
  ];
  for (const field of specificImageFields) {
    const imgVal = extractDeepValue(data, field);
    if (typeof imgVal === "string" && isValidImageUrl(imgVal)) {
      const normalized = normalizeImageUrl(imgVal);
      if (normalized && !imageUrls.has(normalized)) {
        imageUrls.add(normalized);
        images.unshift({ // Add at start for priority
          url: normalized,
          alt_text: `${name || slug} - Main Image`,
          display_order: 0,
        });
      }
    } else if (Array.isArray(imgVal)) {
      for (const img of imgVal) {
        const url = typeof img === "string" ? img : (img as Record<string, unknown>)?.url || (img as Record<string, unknown>)?.src;
        if (typeof url === "string" && isValidImageUrl(url)) {
          const normalized = normalizeImageUrl(url);
          if (normalized && !imageUrls.has(normalized)) {
            imageUrls.add(normalized);
            images.push({
              url: normalized,
              alt_text: `${name || slug} - Image ${images.length + 1}`,
              display_order: images.length,
            });
          }
        }
      }
    }
  }
  
  // Re-assign display_order after sorting
  images.forEach((img, idx) => { img.display_order = idx; });
  
  // ========== PDFs ==========
  const allPdfUrls: string[] = [];
  collectAllStrings(pageData, /\.pdf(\?|$)/i, allPdfUrls);
  
  let brochureUrl: string | null = null;
  let paymentPlanPdfUrl: string | null = null;
  const floorPlanPdfUrls: string[] = [];
  
  for (const pdfUrl of allPdfUrls) {
    const lower = pdfUrl.toLowerCase();
    if (!brochureUrl && lower.includes("brochure")) brochureUrl = pdfUrl;
    else if (!paymentPlanPdfUrl && (lower.includes("payment") || lower.includes("plan"))) paymentPlanPdfUrl = pdfUrl;
    else if (lower.includes("floor")) floorPlanPdfUrls.push(pdfUrl);
  }
  
  // Fallback: first uncategorized PDF as brochure
  if (!brochureUrl && allPdfUrls.length > 0) {
    const remaining = allPdfUrls.filter(u => u !== paymentPlanPdfUrl && !floorPlanPdfUrls.includes(u));
    if (remaining.length > 0) brochureUrl = remaining[0];
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
    uspBullets: uspBullets.slice(0, 10),
    uspImageUrl,
    locationHeadline,
    locationDescription,
    locationDistances: locationDistances.slice(0, 10),
    locationImageUrl,
    amenities: amenities.slice(0, 30),
    floorPlanTypes: floorPlanTypes.slice(0, 10),
    faqs: faqs.slice(0, 10),
    paymentBreakdown,
    images: images.slice(0, 20),
    brochureUrl,
    paymentPlanPdfUrl,
    floorPlanPdfUrls: floorPlanPdfUrls.slice(0, 5),
  };
}
