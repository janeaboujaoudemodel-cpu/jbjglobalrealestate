/**
 * Provident Gatsby Page-Data Detail Extractor v2
 * 
 * Enhanced to extract bedrooms, handover, and size from real Provident keys:
 * - min_bedrooms, max_bedrooms, display_bedrooms
 * - completion_year, completion_date, handover_date, handover
 * - min_area, max_area, min_size, max_size
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
  sizeMin: number | null;
  sizeMax: number | null;
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
  if (url.includes("/x/") && url.includes("cloudfront.net")) {
    return url.replace(/\/x\/\d+x\d+\//, `/x/${SAFE_IMAGE_SIZE}/`);
  }
  return url;
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  const excludePatterns = /(logo|icon|avatar|placeholder|spinner|favicon|navbar|header|footer|menu|widget|sidebar|banner|thumbnail|thumb_|social|share|button|btn_|grid_\d+|general_brochure|brochure|payment[-_]?plan|floor[-_]?plan)/i;
  if (excludePatterns.test(url)) return false;
  if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) return false;
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
  
  if (priceStr.toUpperCase().includes("EUR")) value *= 4;
  else if (priceStr.toUpperCase().includes("USD")) value *= 3.67;
  
  return value > 50000 ? Math.round(value) : null;
}

/**
 * Enhanced bedrooms parser — handles numeric fields, strings, and display formats
 */
function parseBedrooms(data: Record<string, unknown>): { min: number | null; max: number | null } {
  // Try numeric fields first (Provident API often uses these)
  const numericKeys = [
    ["min_bedrooms", "max_bedrooms"],
    ["bedroom_min", "bedroom_max"],
    ["bedrooms_min", "bedrooms_max"],
  ];
  
  for (const [minKey, maxKey] of numericKeys) {
    const minVal = data[minKey];
    const maxVal = data[maxKey];
    if (typeof minVal === "number" && minVal > 0) {
      return { min: minVal, max: typeof maxVal === "number" && maxVal > 0 ? maxVal : minVal };
    }
  }

  // Try display_bedrooms or bedrooms string (e.g., "1-4", "Studio, 1, 2, 3")
  const strKeys = ["display_bedrooms", "bedrooms", "bedroom_types"];
  for (const key of strKeys) {
    const val = data[key];
    if (typeof val === "string" && val.trim()) {
      const nums = val.match(/\d+/g);
      if (nums && nums.length > 0) {
        return {
          min: parseInt(nums[0]),
          max: parseInt(nums[nums.length - 1]),
        };
      }
      // "Studio" only
      if (/studio/i.test(val)) {
        return { min: 0, max: 0 };
      }
    }
  }

  return { min: null, max: null };
}

/**
 * Enhanced handover parser — tries completion_year, completion_date, handover_date, handover
 */
function parseHandover(data: Record<string, unknown>): string | null {
  // Try structured date fields
  const dateKeys = ["completion_date", "handover_date", "expected_completion", "completion"];
  for (const key of dateKeys) {
    const val = data[key];
    if (typeof val === "string" && val.trim() && val.length >= 4) {
      return val.trim();
    }
  }

  // Try year-based fields
  const yearKeys = ["completion_year", "handover_year"];
  for (const key of yearKeys) {
    const val = data[key];
    if (typeof val === "number" && val > 2020 && val < 2040) {
      return `Q4 ${val}`;
    }
    if (typeof val === "string") {
      const yr = parseInt(val);
      if (yr > 2020 && yr < 2040) return `Q4 ${yr}`;
    }
  }

  // Try generic handover string
  const handover = data["handover"];
  if (typeof handover === "string" && handover.trim()) {
    return handover.trim();
  }

  return null;
}

/**
 * Enhanced size parser — tries min_area/max_area, min_size/max_size
 */
function parseSize(data: Record<string, unknown>): { min: number | null; max: number | null } {
  const numericPairs = [
    ["min_area", "max_area"],
    ["min_size", "max_size"],
    ["size_min", "size_max"],
    ["area_min", "area_max"],
  ];

  for (const [minKey, maxKey] of numericPairs) {
    const minVal = data[minKey];
    const maxVal = data[maxKey];
    const minNum = typeof minVal === "number" ? minVal : typeof minVal === "string" ? parseFloat(minVal) : NaN;
    const maxNum = typeof maxVal === "number" ? maxVal : typeof maxVal === "string" ? parseFloat(maxVal) : NaN;
    
    if (!isNaN(minNum) && minNum > 0) {
      return { min: Math.round(minNum), max: !isNaN(maxNum) && maxNum > 0 ? Math.round(maxNum) : Math.round(minNum) };
    }
  }

  // Try display_size string (e.g., "500 - 2,000 sqft")
  const sizeStr = data["display_size"] || data["size"] || data["area"];
  if (typeof sizeStr === "string") {
    const nums = sizeStr.match(/[\d,]+/g);
    if (nums && nums.length >= 1) {
      const parsed = nums.map(n => parseInt(n.replace(/,/g, ""))).filter(n => n > 50);
      if (parsed.length >= 2) return { min: parsed[0], max: parsed[parsed.length - 1] };
      if (parsed.length === 1) return { min: parsed[0], max: parsed[0] };
    }
  }

  return { min: null, max: null };
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
  
  const serverData = extractDeepValue(pageData, "result.serverData", "serverData") as Record<string, unknown> | null;
  let data = extractDeepValue(pageData, "result.serverData.data", "result.data", "data") as Record<string, unknown> | null;
  const pageContext = extractDeepValue(pageData, "result.pageContext", "pageContext") as Record<string, unknown> | null;
  
  if (data && typeof data === "object" && (data as any).status === true && (data as any).data) {
    if ((data as any).message === "No record found") return null;
    data = (data as any).data;
  }
  
  const bitrix = extractDeepValue(data, "bitrix", "project.bitrix") as Record<string, unknown> | null;
  const project = extractDeepValue(data, "project") as Record<string, unknown> | null;
  
  // Build a flat lookup combining all data sources for field extraction
  const flatData: Record<string, unknown> = {
    ...(bitrix || {}),
    ...(project || {}),
    ...(data || {}),
  };
  
  const name = (extractDeepValue(data, "name", "title", "project.name", "project.title") as string) || 
               (bitrix?.name as string) || null;
  
  const developerName = (extractDeepValue(data, "developer_name", "project.developer_name") as string) ||
                        (bitrix?.developer_name as string) || null;
  
  const description = (extractDeepValue(data, "about", "description", "project.about", "project.description") as string) ||
                      (bitrix?.about as string) || null;
  
  const location = (extractDeepValue(data, "project_location", "location", "project.project_location", "display_address") as string) ||
                   (bitrix?.project_location as string) || null;
  
  // Price
  const priceStr = extractDeepValue(data, "price", "starting_price", "project.price") as string | number | null;
  const priceFrom = parsePrice(priceStr) || parsePrice(bitrix?.price as string);
  
  // Bedrooms — enhanced extraction
  const { min: bedroomsMin, max: bedroomsMax } = parseBedrooms(flatData);
  
  // Handover — enhanced extraction
  const handover = parseHandover(flatData);
  
  // Size — NEW extraction
  const { min: sizeMin, max: sizeMax } = parseSize(flatData);
  
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
  
  // ========== Images (with filename-based dedup) ==========
  const images: Array<{ url: string; alt_text: string; display_order: number }> = [];
  const imageUrls = new Set<string>();
  const imageFilenames = new Set<string>();
  
  function getImageFilename(url: string): string {
    try {
      const pathname = new URL(url, "https://placeholder.com").pathname;
      const parts = pathname.split("/");
      return parts[parts.length - 1]?.toLowerCase() || "";
    } catch {
      return url.toLowerCase();
    }
  }
  
  const allImageUrls: string[] = [];
  collectAllStrings(pageData, /\.(jpg|jpeg|png|webp)(\?|$)/i, allImageUrls);
  
  for (const imgUrl of allImageUrls) {
    if (!isValidImageUrl(imgUrl)) continue;
    if (imgUrl.length < 10) continue;
    const normalized = normalizeImageUrl(imgUrl);
    if (!normalized) continue;
    const filename = getImageFilename(normalized);
    if (filename && filename.length > 4 && imageFilenames.has(filename)) continue;
    if (imageUrls.has(normalized)) continue;
    imageUrls.add(normalized);
    if (filename && filename.length > 4) imageFilenames.add(filename);
    images.push({
      url: normalized,
      alt_text: `${name || slug} - Image ${images.length + 1}`,
      display_order: images.length,
    });
  }
  
  const specificImageFields = [
    "main_image", "featured_image", "image", "hero_image",
    "project.main_image", "project.featured_image", "project.image",
    "bitrix.main_image", "media_images"
  ];
  for (const field of specificImageFields) {
    const imgVal = extractDeepValue(data, field);
    if (typeof imgVal === "string" && isValidImageUrl(imgVal) && imgVal.length >= 10) {
      const normalized = normalizeImageUrl(imgVal);
      const filename = getImageFilename(normalized);
      if (normalized && !imageUrls.has(normalized) && !(filename && filename.length > 4 && imageFilenames.has(filename))) {
        imageUrls.add(normalized);
        if (filename && filename.length > 4) imageFilenames.add(filename);
        images.unshift({
          url: normalized,
          alt_text: `${name || slug} - Main Image`,
          display_order: 0,
        });
      }
    } else if (Array.isArray(imgVal)) {
      for (const img of imgVal) {
        const url = typeof img === "string" ? img : (img as Record<string, unknown>)?.url || (img as Record<string, unknown>)?.src;
        if (typeof url === "string" && isValidImageUrl(url) && url.length >= 10) {
          const normalized = normalizeImageUrl(url);
          const filename = getImageFilename(normalized);
          if (normalized && !imageUrls.has(normalized) && !(filename && filename.length > 4 && imageFilenames.has(filename))) {
            imageUrls.add(normalized);
            if (filename && filename.length > 4) imageFilenames.add(filename);
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
    sizeMin,
    sizeMax,
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
