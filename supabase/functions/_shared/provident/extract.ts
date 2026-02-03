/**
 * Deterministic extraction from Firecrawl scrape output.
 * IMPORTANT: Do NOT rewrite/paraphrase. We only reformat enough to fit fields.
 */

const MIN_REASONABLE_PRICE_AED = 50_000;

const PLACEHOLDER_FILENAMES = [
  "grid_01_50def6e330",
  "signature_property_47dbd09aff",
  "property_management_b164aaddda",
  "apartment_navbar",
  "spons_mob_",
  "340x270",
  "16x16",
];

const EXCLUDE_IMAGE_PATTERNS = /(logo|icon|avatar|placeholder|spinner|favicon|brochure|payment[-_]?plan|floor[-_]?plan|master[-_]?plan|pdf|document|navbar|header|footer|menu|widget|sidebar|banner|thumbnail|thumb_|_thumb|social|share|button|btn_|grid_\d+|general_brochure)/i;

export type ExtractedProjectData = {
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
};

function isPlaceholder(url: string): boolean {
  const lower = url.toLowerCase();
  return PLACEHOLDER_FILENAMES.some((p) => lower.includes(p));
}

function stripMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

// CRITICAL FIX: Do NOT upscale to 1200x800 - that size returns 403 on Provident's CDN.
// Use 464x312 which is a known working size, or preserve original if not resizable.
function normalizeCloudfrontImage(url: string): string {
  // Only normalize if it's already a cloudfront URL with a size path
  if (!url.includes("cloudfront.net") || !url.includes("/x/")) {
    return url;
  }
  // Replace any existing size with safe 464x312 (known to work)
  return url.replace(/\/x\/\d+x\d+\//, "/x/464x312/");
}

function extractSection(markdown: string, heading: string): string | null {
  // Extract content after a heading label, up to next ## heading.
  // We accept both "## Heading", "### Heading", or plain text "Heading\n" formats.
  // FIXED: More flexible pattern to handle various heading formats in Firecrawl markdown.
  const patterns = [
    new RegExp(`(?:^|\\n)##\\s*${heading}\\s*\\n+([\\s\\S]*?)(?=\\n##\\s+|\\n#\\s+|$)`, "i"),
    new RegExp(`(?:^|\\n)###\\s*${heading}\\s*\\n+([\\s\\S]*?)(?=\\n##\\s+|\\n###\\s+|\\n#\\s+|$)`, "i"),
    new RegExp(`(?:^|\\n)${heading}\\s*\\n+([\\s\\S]*?)(?=\\n##\\s+|\\n#\\s+|$)`, "i"),
  ];
  
  for (const rx of patterns) {
    const m = markdown.match(rx);
    if (m?.[1]?.trim()) {
      return m[1].trim();
    }
  }
  return null;
}

function extractDescription(markdown: string): string | null {
  // Prefer the "About the project" section, but stop before the KPI blocks.
  const rx = /About the project\s*\n+([\s\S]*?)(?=\n(?:Starting Price|Handover|Payment Plan)\b|\n##\s+|\n#\s+|$)/i;
  const m = markdown.match(rx);
  if (!m?.[1]) return null;
  const raw = stripMarkdownLinks(m[1]).trim();
  return raw.length ? raw : null;
}

function extractBasicFields(markdown: string) {
  const cleanMd = stripMarkdownLinks(markdown);

  // Name = H1 line, but keep exact title text before "by".
  const titleMatch = cleanMd.match(/^#\s+(.+)/m);
  let name = titleMatch?.[1]?.trim() || null;
  if (name) name = name.replace(/\s+by\s+.+$/i, "").trim();

  // Developer = "[by X]" link pattern
  const devLinkMatch = markdown.match(/\[by\s+([^\]]+)\]/i) || markdown.match(/by\s+\[([^\]]+)\]/i);
  let developerName = devLinkMatch?.[1]?.trim() || null;
  if (!developerName) {
    const devMatch = cleanMd.match(/by\s+([A-Z][A-Za-z\s&]+?)(?:\s*\n|\s*in\s)/i);
    developerName = devMatch?.[1]?.trim() || null;
  }

  // Location
  const locMatch = cleanMd.match(/(?:at|in)\s+([A-Z][A-Za-z\s,\-]+?)(?:\s*\||$|\n)/i);
  const location = locMatch?.[1]?.trim() || null;

  // Bedrooms
  const bedMatch = cleanMd.match(/((?:Studio|[\d,&\s\-]+)\s*(?:BR|Bedrooms?|Bedroom))/i);
  const bedroomsRaw = bedMatch?.[1]?.trim() || null;
  let bedroomsMin: number | null = null;
  let bedroomsMax: number | null = null;
  if (bedroomsRaw) {
    const nums = bedroomsRaw.match(/\d+/g);
    if (nums?.length) {
      bedroomsMin = parseInt(nums[0]);
      bedroomsMax = parseInt(nums[nums.length - 1] || nums[0]);
    }
  }

  // Price - prefer AED, else USD/EUR conversion (approx) just to fill numeric field.
  // NOTE: This numeric is for filtering; page copy remains in description.
  let priceFrom: number | null = null;
  const aedFromMatch = cleanMd.match(/(?:from|starting\s+from|starting\s+price)\s*AED\s*([\d,.]+)\s*(K|M)?/i);
  const aedMatch = cleanMd.match(/AED\s*([\d,.]+)\s*(K|M)?/i);
  const fxMatch = cleanMd.match(/(EUR|USD)\s*([\d,.]+)\s*(K|M)?/i);

  const parseWithSuffix = (numStr: string, suffix?: string | null) => {
    let val = parseFloat(numStr.replace(/,/g, ""));
    if (suffix?.toUpperCase() === "K") val *= 1000;
    if (suffix?.toUpperCase() === "M") val *= 1_000_000;
    return val;
  };

  if (aedFromMatch) {
    priceFrom = Math.round(parseWithSuffix(aedFromMatch[1], aedFromMatch[2]));
  } else if (aedMatch) {
    priceFrom = Math.round(parseWithSuffix(aedMatch[1], aedMatch[2]));
  } else if (fxMatch) {
    let val = parseWithSuffix(fxMatch[2], fxMatch[3]);
    if (fxMatch[1].toUpperCase() === "EUR") val *= 4.0;
    if (fxMatch[1].toUpperCase() === "USD") val *= 3.67;
    priceFrom = Math.round(val);
  }
  if (typeof priceFrom === "number" && priceFrom > 0 && priceFrom < MIN_REASONABLE_PRICE_AED) {
    priceFrom = null;
  }

  // Handover
  const handoverMatch = cleanMd.match(/(?:Handover|Completion)[:\s]*(Q[1-4]?\s*\d{4}|\d{4}|Ready)/i);
  const handover = handoverMatch?.[1]?.trim() || null;

  // Payment plan summary (e.g. 50/50)
  const ppMatch = cleanMd.match(/\b(\d{2}\/\d{2})\b/);
  const paymentPlan = ppMatch?.[1] || null;

  // Property type
  const typeMatch = cleanMd.match(/(Apartment|Villa|Townhouse|Penthouse|Sky[- ]?Villa|Studio|Mansion|Duplex)/i);
  const propertyType = typeMatch?.[1] || null;

  // Status label
  const statusMatch = cleanMd.match(/(Future Launch|New Phase|New Launch|Coming Soon|Sold Out)/i);
  const statusLabel = statusMatch?.[1] || null;

  return {
    name,
    developerName,
    location,
    priceFrom,
    bedroomsMin,
    bedroomsMax,
    handover,
    paymentPlan,
    propertyType,
    statusLabel,
  };
}

function extractImages(markdown: string, html: string, links: string[], nameForAlt: string | null) {
  const imageSet = new Set<string>();

  // Markdown images
  const mdImgRx = /!\[[^\]]*\]\(([^)]+)\)/g;
  for (const m of markdown.matchAll(mdImgRx)) {
    const url = m[1];
    if (url) imageSet.add(url);
  }

  // Links list
  for (const l of links || []) {
    if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(l)) imageSet.add(l);
  }

  // Raw HTML img tags
  const imgRx = /<img[^>]+(?:src|data-src|data-lazy-src)=['"]([^'"]+)['"]/gi;
  let mm: RegExpExecArray | null;
  while ((mm = imgRx.exec(html)) !== null) {
    const url = mm[1];
    if (url && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) imageSet.add(url);
  }

  // Filter placeholders + non-gallery assets
  const filtered = Array.from(imageSet)
    .filter((u) => u && !EXCLUDE_IMAGE_PATTERNS.test(u) && !isPlaceholder(u))
    .map((u) => (u.includes("cloudfront.net") ? normalizeCloudfrontImage(u) : u));

  const unique = Array.from(new Set(filtered));
  const top = unique.slice(0, 20);
  if (top.length < 2) return [];

  return top.map((url, i) => ({
    url,
    alt_text: `${nameForAlt || "Project"} - Image ${i + 1}`,
    display_order: i,
  }));
}

export function extractProvidentProjectFromScrape(args: {
  markdown: string;
  html: string;
  links: string[];
}): ExtractedProjectData {
  const { markdown, html, links } = args;
  const basic = extractBasicFields(markdown);
  const description = extractDescription(markdown);

  // USPs - FIXED: More flexible extraction to capture all bullet points
  // Try multiple heading formats: "## Unique Selling Points", "### Unique Selling Points", or just "Unique Selling Points"
  let uspSection = extractSection(markdown, "Unique Selling Points");
  
  // Fallback: try to find the section by scanning for the heading directly
  if (!uspSection) {
    const uspMatch = markdown.match(/Unique Selling Points[\s\S]*?(?=\n##\s+[A-Z]|$)/i);
    if (uspMatch) {
      uspSection = uspMatch[0].replace(/^Unique Selling Points\s*\n*/i, "").trim();
    }
  }
  
  let uspHeadline: string | null = null;
  const uspBullets: string[] = [];
  if (uspSection) {
    // Look for headline with ### or ####
    const headlineMatch = uspSection.match(/^#{2,4}\s+(.+)/m);
    uspHeadline = headlineMatch?.[1]?.trim() || null;
    
    // Extract all bullet points (lines starting with -)
    const bulletLines = uspSection.split("\n").filter(line => /^\s*-\s+.+/.test(line));
    for (const b of bulletLines) {
      const cleaned = stripMarkdownLinks(b.replace(/^\s*-\s+/, "").trim());
      if (cleaned && cleaned.length > 2 && !cleaned.toLowerCase().includes("find out more")) {
        uspBullets.push(cleaned);
      }
    }
  }

  // USP image: first image after USP label
  let uspImageUrl: string | null = null;
  const uspImgMatch = markdown.match(/Unique Selling Points[\s\S]*?!\[[^\]]*\]\(([^)]+)\)/i);
  if (uspImgMatch?.[1]) uspImageUrl = uspImgMatch[1];

  // Amenities - FIXED: More flexible extraction, try multiple patterns
  const amenities: string[] = [];
  let amenSection = extractSection(markdown, "Amenities");
  
  // Fallback: Direct scan for Amenities block
  if (!amenSection) {
    const amenMatch = markdown.match(/##\s*Amenities\s*\n+([\s\S]*?)(?=\n##\s+|$)/i);
    if (amenMatch?.[1]) {
      amenSection = amenMatch[1].trim();
    }
  }
  
  if (amenSection) {
    const lines = amenSection.split("\n").map((l) => stripMarkdownLinks(l).trim()).filter(Boolean);
    for (const line of lines) {
      // Ignore obvious CTA lines and navigation items
      if (/^(All Amenities|Find out more|View All|Show More)$/i.test(line)) continue;
      // Skip lines that look like links or buttons
      if (/^\[.*\]$/.test(line)) continue;
      if (line.length > 2 && line.length < 120) {
        amenities.push(line);
      }
    }
  }

  // Floor plan types
  const floorPlanTypes: Array<{ label: string; pdfUrl?: string }> = [];
  const fpSection = extractSection(markdown, "## Floorplans");
  if (fpSection) {
    const lines = fpSection.split("\n").map((l) => stripMarkdownLinks(l).trim()).filter(Boolean);
    for (const line of lines) {
      if (/^Download/i.test(line)) continue;
      if (line.length > 2 && line.length < 120) floorPlanTypes.push({ label: line });
    }
  }

  // Location
  const locSection = extractSection(markdown, "Location");
  let locationHeadline: string | null = null;
  let locationDescription: string | null = null;
  const locationDistances: Array<{ label: string; time: string }> = [];

  if (locSection) {
    const headlineMatch = locSection.match(/###\s+(.+)/);
    locationHeadline = headlineMatch?.[1]?.trim() || null;

    // Description: first paragraph after headline
    const afterHeadline = locSection.split(/###\s+[^\n]+\n/)[1] || locSection;
    const descLines: string[] = [];
    for (const line of afterHeadline.split("\n")) {
      const t = stripMarkdownLinks(line).trim();
      if (!t) continue;
      if (t.startsWith("- ")) break;
      if (/^Get more information$/i.test(t)) continue;
      descLines.push(t);
    }
    if (descLines.length) locationDescription = descLines.join("\n").trim();

    // Distances - FIXED: Handle en-dash (–), em-dash (—), and regular dash (-) 
    // Pattern: "- N Minutes – Place" or "- N Minute – Place"
    const distPattern = /^-\s+(\d+\s+Minutes?)\s+[–—\-]\s+(.+)/gim;
    const distLines = afterHeadline.match(distPattern) || [];
    for (const dl of distLines) {
      // Re-match to extract groups
      const m = dl.replace(/^-\s+/, "").match(/^(\d+\s+Minutes?)\s+[–—\-]\s+(.+)$/i);
      if (m) {
        locationDistances.push({ 
          time: m[1].trim(), 
          label: stripMarkdownLinks(m[2]).trim() 
        });
      }
    }
  }

  let locationImageUrl: string | null = null;
  const locImgMatch = markdown.match(/\nLocation[\s\S]*?!\[[^\]]*\]\(([^)]+)\)/i);
  if (locImgMatch?.[1]) locationImageUrl = locImgMatch[1];

  // Payment breakdown - FIXED: Handle various formats including double newlines
  const paymentBreakdown: { down_payment?: string; during_construction?: string; on_completion?: string } = {};
  let paySection = extractSection(markdown, "Payment Plans");
  
  // Fallback: Direct scan for Payment Plans block
  if (!paySection) {
    const payMatch = markdown.match(/##\s*Payment Plans?\s*\n+([\s\S]*?)(?=\n##\s+|$)/i);
    if (payMatch?.[1]) {
      paySection = payMatch[1].trim();
    }
  }
  
  if (paySection) {
    // FIXED: More flexible patterns to handle blank lines between percentage and label
    // Pattern: "10%\n\nDown Payment" or "10%\nDown Payment" or "10% Down Payment"
    const dpMatch = paySection.match(/(\d+)\s*%?\s*\n*\s*\n*Down\s*Payment/i);
    const dcMatch = paySection.match(/(\d+)\s*%?\s*\n*\s*\n*During\s*Construction/i);
    const ocMatch = paySection.match(/(\d+)\s*%?\s*\n*\s*\n*On\s*Completion/i);
    
    if (dpMatch?.[1]) paymentBreakdown.down_payment = `${dpMatch[1]}%`;
    if (dcMatch?.[1]) paymentBreakdown.during_construction = `${dcMatch[1]}%`;
    if (ocMatch?.[1]) paymentBreakdown.on_completion = `${ocMatch[1]}%`;
  }

  // FAQs - FIXED: More flexible pattern for FAQ extraction
  const faqs: Array<{ question: string; answer: string }> = [];
  let faqSection = extractSection(markdown, "Useful Information");
  
  // Fallback: Direct scan for Useful Information block
  if (!faqSection) {
    const faqMatch = markdown.match(/Useful Information[\s\S]*?(?=\n##\s+[A-Z](?![\s\S]*Useful)|Stay in the loop|$)/i);
    if (faqMatch) {
      faqSection = faqMatch[0].replace(/^Useful Information[^\n]*\n*/i, "").trim();
    }
  }
  
  if (faqSection) {
    // Look for ## Question followed by answer text
    // Pattern: "## Question?\n\nAnswer text" or "### Question?\nAnswer text"
    const qaPattern = /(?:^|(?<=\n))#{2,3}\s+([^\n]+\??)\s*\n+([^#\n][\s\S]*?)(?=\n#{2,3}\s+|$)/g;
    const qaMatches = faqSection.matchAll(qaPattern);
    for (const m of qaMatches) {
      const q = stripMarkdownLinks(m[1]).trim();
      let a = stripMarkdownLinks(m[2]).trim();
      // Clean up answer - remove "Stay in the loop" and trailing content
      a = a.split(/Stay in the loop/i)[0].trim();
      if (q && a && q.length > 3 && a.length > 5) {
        faqs.push({ question: q, answer: a });
      }
    }
  }

  const images = extractImages(markdown, html, links, basic.name);

  return {
    name: basic.name,
    developerName: basic.developerName,
    description,
    location: basic.location,
    priceFrom: basic.priceFrom,
    bedroomsMin: basic.bedroomsMin,
    bedroomsMax: basic.bedroomsMax,
    handover: basic.handover,
    paymentPlan: basic.paymentPlan,
    propertyType: basic.propertyType,
    statusLabel: basic.statusLabel,
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
  };
}
