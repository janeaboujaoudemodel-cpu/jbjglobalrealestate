/**
 * Shared Provident Markdown Extraction Module
 * 
 * Deterministic regex-based parser for extracting structured project data
 * from Firecrawl-scraped Provident listing pages (markdown format).
 * 
 * Used by both:
 * - full-project-extract (import queue)
 * - enrich-project-test (published project enrichment)
 */

const BANNED_TERMS_REGEX = /\b(Provident|Provident Estate|providentestate)\b/gi;

function sanitizeText(text: string | null): string | null {
  if (!text) return null;
  return text.replace(BANNED_TERMS_REGEX, "").replace(/\s{2,}/g, " ").trim() || null;
}

function stripMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
}

export interface MarkdownExtractedData {
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

export function extractFromMarkdown(markdown: string, html: string, links: string[]): MarkdownExtractedData {
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
    if (priceFrom < 50_000) priceFrom = null;
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
  
  // USP Image
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
