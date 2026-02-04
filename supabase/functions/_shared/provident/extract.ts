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

  // Bedrooms - FIXED: Multiple fallback patterns for bedroom extraction
  let bedroomsMin: number | null = null;
  let bedroomsMax: number | null = null;
  
  // Pattern 1: "1-3 Bedrooms" or "1 - 3 BR"
  const bedRangeMatch = cleanMd.match(/(\d+)\s*[-–—]\s*(\d+)\s*(?:BR|Bedrooms?|Bedroom)/i);
  if (bedRangeMatch) {
    bedroomsMin = parseInt(bedRangeMatch[1]);
    bedroomsMax = parseInt(bedRangeMatch[2]);
  }
  
  // Pattern 2: "Studio, 1, 2, 3 BR" or "Studio, 1 & 2 Bedrooms"
  if (!bedroomsMin) {
    const bedListMatch = cleanMd.match(/((?:Studio(?:\s*,|\s+&|\s+and)?\s*)?(?:\d+(?:\s*,|\s*&|\s*and)?\s*)+)\s*(?:BR|Bedrooms?|Bedroom)/i);
    if (bedListMatch) {
      const bedroomsRaw = bedListMatch[1].trim();
      const nums = bedroomsRaw.match(/\d+/g);
      if (nums?.length) {
        bedroomsMin = parseInt(nums[0]);
        bedroomsMax = parseInt(nums[nums.length - 1] || nums[0]);
      } else if (/studio/i.test(bedroomsRaw)) {
        // Studio only
        bedroomsMin = 0;
        bedroomsMax = 0;
      }
    }
  }
  
  // Pattern 3: Simple "2 Bedrooms" or "3BR"
  if (!bedroomsMin) {
    const bedSimpleMatch = cleanMd.match(/(\d+)\s*(?:BR|Bedrooms?|Bedroom)/i);
    if (bedSimpleMatch) {
      bedroomsMin = parseInt(bedSimpleMatch[1]);
      bedroomsMax = bedroomsMin;
    }
  }
  
  // Pattern 4: "Studio" only
  if (!bedroomsMin && /\bstudio\b/i.test(cleanMd)) {
    bedroomsMin = 0;
    bedroomsMax = 0;
  }

  // Size extraction - patterns like "500 - 2,500 sqft" or "from 800 sqft"
  // FIXED: Added support for "774 sq. ft. - 847 sq. ft." format with periods
  let sizeMin: number | null = null;
  let sizeMax: number | null = null;
  
  // Try range pattern first: "500 - 2,500 sqft" or "774 sq. ft. - 847 sq. ft."
  const sizeRangeMatch = cleanMd.match(/([\d,]+)\s*(?:sqft|sq\.?\s*ft\.?)\s*(?:to|-|–|—)\s*([\d,]+)\s*(?:sqft|sq\.?\s*ft\.?)/i) ||
                         cleanMd.match(/([\d,]+)\s*(?:to|-|–|—)\s*([\d,]+)\s*(?:sqft|sq\.?\s*ft\.?|square feet)/i);
  if (sizeRangeMatch) {
    sizeMin = parseInt(sizeRangeMatch[1].replace(/,/g, ""));
    sizeMax = parseInt(sizeRangeMatch[2].replace(/,/g, ""));
  } else {
    // Try single value: "from 800 sqft" or just "800 sqft" or "800 sq. ft."
    const sizeSingleMatch = cleanMd.match(/(?:from\s+)?([\d,]+)\s*(?:sqft|sq\.?\s*ft\.?|square feet)/i);
    if (sizeSingleMatch) {
      sizeMin = parseInt(sizeSingleMatch[1].replace(/,/g, ""));
      sizeMax = sizeMin;
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
    sizeMin,
    sizeMax,
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

  // USP image: find the ACTUAL USP section image (not floor plan diagrams)
  // FIXED: Look for image BEFORE the bullet list, and exclude floor plan images
  let uspImageUrl: string | null = null;
  const uspSectionMatch = markdown.match(/Unique Selling Points[\s\S]{0,1200}/i);
  if (uspSectionMatch) {
    // Find all images in the USP section
    const imgMatches = uspSectionMatch[0].matchAll(/!\[[^\]]*\]\(([^)]+)\)|(?:https:\/\/[^\s"'\)]+cloudfront[^\s"'\)]+\.(?:jpg|jpeg|png|webp))/gi);
    for (const m of imgMatches) {
      const imgUrl = m[1] || m[0];
      if (!imgUrl) continue;
      // CRITICAL: Skip floor plan diagrams and other non-USP images
      if (/floor[-_]?plan|floorplan|layout|diagram|pdf/i.test(imgUrl)) continue;
      if (/brochure|payment|document/i.test(imgUrl)) continue;
      // Found a valid USP image
      uspImageUrl = normalizeCloudfrontImage(imgUrl);
      break;
    }
  }
  
  // Fallback: If no USP image found in section, try to get from gallery (first non-floor-plan image)
  if (!uspImageUrl && args.links?.length) {
    for (const link of args.links) {
      if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(link)) continue;
      if (/floor[-_]?plan|floorplan|layout|diagram|brochure|payment/i.test(link)) continue;
      if (EXCLUDE_IMAGE_PATTERNS.test(link)) continue;
      uspImageUrl = normalizeCloudfrontImage(link);
      break;
    }
  }

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

  // Floor plan types - ONLY extract from Floorplans section, never from Location
  // FIXED: Filter out location distances, image links, and non-floor-plan content
  const floorPlanTypes: Array<{ label: string; pdfUrl?: string }> = [];
  
  // Valid floor plan type patterns (must match bedroom types or unit configurations)
  const VALID_FLOOR_PLAN_PATTERNS = [
    /^\d+\s*(?:BR|Bed(?:room)?s?)/i,
    /^(?:studio|townhouse|villa|penthouse|duplex|simplex|loft|mansion)/i,
    /^Type\s*[A-Z0-9]+/i,
    /^Unit\s*[A-Z0-9]+/i,
  ];
  
  const isValidFloorPlanLabel = (label: string): boolean => {
    const trimmed = label.trim();
    // Reject if it looks like location data
    if (/\d+\s*(?:minute|min)/i.test(trimmed)) return false;
    if (/^!\[/i.test(trimmed)) return false; // Image markdown
    if (/^###?\s*/i.test(trimmed)) return false; // Headings
    if (/^(?:Location|Get more|Download|View All|Find out)/i.test(trimmed)) return false;
    if (/[–—-]\s*(?:Dubai|Airport|Mall|Beach|Marina|School|Hospital)/i.test(trimmed)) return false;
    // Must match known floor plan patterns
    return VALID_FLOOR_PLAN_PATTERNS.some(p => p.test(trimmed)) || 
           (trimmed.length > 2 && trimmed.length < 50 && !trimmed.includes("–"));
  };
  
  // Try multiple heading patterns for floor plans section
  let fpSection = extractSection(markdown, "Floorplans");
  if (!fpSection) {
    fpSection = extractSection(markdown, "Floor Plans");
  }
  if (!fpSection) {
    // Direct match for ## Floorplans heading
    const fpMatch = markdown.match(/##\s*Floorplans?\s*\n+([\s\S]*?)(?=\n##\s+|$)/i);
    if (fpMatch?.[1]) {
      fpSection = fpMatch[1].trim();
    }
  }
  
  if (fpSection) {
    // Stop at Location heading or image markdown
    const cleanSection = fpSection.split(/\n(?:##|###)\s*Location/i)[0]
                                   .split(/\n!\[/)[0]
                                   .trim();
    
    const lines = cleanSection.split("\n").map((l) => stripMarkdownLinks(l).trim()).filter(Boolean);
    for (const line of lines) {
      // Skip download links and CTAs
      if (/^Download/i.test(line)) continue;
      if (/^View All/i.test(line)) continue;
      if (/^Find out more/i.test(line)) continue;
      if (isValidFloorPlanLabel(line)) {
        floorPlanTypes.push({ label: line });
      }
    }
  }

  // Location - FIXED: Extended patterns for distances
  // Note: Provident sometimes has just "Location" as plain text, not "## Location"
  let locSection = extractSection(markdown, "Location");
  
  // Fallback: Look for "Location" followed by "### headline" pattern (without ## prefix)
  if (!locSection) {
    const locMatch = markdown.match(/(?:^|\n)Location\s*\n+([\s\S]*?)(?=\n##\s+[A-Z]|\n##\s+Payment|\n##\s+The best|$)/i);
    if (locMatch?.[1]) {
      locSection = locMatch[1].trim();
    }
  }
  
  
  let locationHeadline: string | null = null;
  let locationDescription: string | null = null;
  const locationDistances: Array<{ label: string; time: string }> = [];

  if (locSection) {
    const headlineMatch = locSection.match(/###\s+(.+)/);
    locationHeadline = headlineMatch?.[1]?.trim() || null;

    // Description: first paragraph after headline (stop at numbered distance lines)
    const afterHeadline = locSection.split(/###\s+[^\n]+\n/)[1] || locSection;
    const descLines: string[] = [];
    for (const line of afterHeadline.split("\n")) {
      const t = stripMarkdownLinks(line).trim();
      if (!t) continue;
      // Stop if we hit a distance line (starts with number)
      if (/^\d+\s*(minute|min)/i.test(t)) break;
      if (t.startsWith("- ")) break;
      if (/^Get more information$/i.test(t)) continue;
      descLines.push(t);
    }
    if (descLines.length) locationDescription = descLines.join("\n").trim();
    

    // Distances - ENHANCED: Multiple patterns to handle all Provident variations
    // Format variations found:
    // - "3 minutes – Meydan Hotel & Racecourse" (no leading dash)
    // - "- 3 Minutes – Place"
    // - "N min drive to Place"
    // - "Place – N minutes" (reversed)
    // - "N km to/from Place"
    
    // IMPORTANT: Scan the ENTIRE locSection, not just afterHeadline
    // because distances may appear before or mixed with content
    const allDistLines = locSection.split("\n").filter(l => l.trim());
    
    for (const dl of allDistLines) {
      const trimmed = dl.trim().replace(/^-\s+/, "");
      
      // Skip non-distance lines
      if (!trimmed || /^!\[/.test(trimmed) || /^###?\s*/.test(trimmed)) continue;
      if (/^(Get more|Download|View All|Find out|Location|##)/i.test(trimmed)) continue;
      // Skip if too long (likely a paragraph, not a distance line)
      if (trimmed.length > 100) continue;
      
      // Pattern 1: "N minutes – Place" or "N minute – Place" (most common on Provident)
      // Uses en-dash (–), em-dash (—), or hyphen (-) as separator
      const m1 = trimmed.match(/^(\d+)\s*(minutes?|mins?)\s*[–—\-]+\s*(.+)$/i);
      if (m1) {
        const num = m1[1];
        const timeFormatted = parseInt(num) === 1 ? `${num} Minute` : `${num} Minutes`;
        locationDistances.push({ 
          time: timeFormatted, 
          label: stripMarkdownLinks(m1[3]).trim() 
        });
        continue;
      }
      
      // Pattern 2: "N min drive to Place" or "N mins to Place"
      const m2 = trimmed.match(/^(\d+)\s*(min|mins|minute|minutes?)\s*(?:drive\s+)?(?:to|from)\s+(.+)$/i);
      if (m2) {
        const num = m2[1];
        const timeFormatted = parseInt(num) === 1 ? `${num} Minute` : `${num} Minutes`;
        locationDistances.push({ 
          time: timeFormatted, 
          label: stripMarkdownLinks(m2[3]).trim() 
        });
        continue;
      }
      
      // Pattern 3: Reversed "Place – N minutes" or "Place - N min"
      const m3 = trimmed.match(/^([^–—\-\d]+?)\s*[–—\-]+\s*(\d+)\s*(minutes?|mins?)$/i);
      if (m3) {
        const num = m3[2];
        const timeFormatted = parseInt(num) === 1 ? `${num} Minute` : `${num} Minutes`;
        locationDistances.push({ 
          time: timeFormatted, 
          label: stripMarkdownLinks(m3[1]).trim() 
        });
        continue;
      }
      
      // Pattern 4: "N km to/from Place"
      const m4 = trimmed.match(/^(\d+)\s*km\s+(?:to|from)\s+(.+)$/i);
      if (m4) {
        locationDistances.push({ 
          time: `${m4[1]} km`, 
          label: stripMarkdownLinks(m4[2]).trim() 
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

  // FAQs - FIXED: Extended heading detection and flexible Q/A parsing
  // Provident format: "## Useful Information about [Project]\n## What is...?\n\nAnswer..."
  const faqs: Array<{ question: string; answer: string }> = [];
  
  // Try multiple FAQ section headings - ENHANCED: Added more variations
  const faqHeadings = [
    "Useful Information about", 
    "Useful Information", 
    "FAQ", 
    "FAQs", 
    "Frequently Asked Questions", 
    "Q&A",
    "Questions and Answers",
    "Common Questions",
    "Key Information"
  ];
  let faqSection: string | null = null;
  
  for (const heading of faqHeadings) {
    // First try extractSection which handles ## headings
    faqSection = extractSection(markdown, heading);
    if (faqSection && faqSection.length > 50) break;
    
    // Fallback: Direct regex scan - looser matching for "Useful Information about X" pattern
    const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const faqRegex = new RegExp(`(?:^|\\n)#{2,4}\\s*${escapedHeading}[^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,2}\\s+Stay|\\n#{1,2}\\s+The best deals|$)`, "i");
    const faqMatch = markdown.match(faqRegex);
    if (faqMatch?.[1]) {
      faqSection = faqMatch[1].trim();
      if (faqSection.length > 50) break;
    }
  }
  
  if (faqSection) {
    // Pattern 1: "## Question?\n\nAnswer text" (most common Provident format)
    // Match: ## heading followed by non-heading text
    const lines = faqSection.split("\n");
    let currentQuestion: string | null = null;
    let currentAnswer: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if this is a question heading (## What is...? or ### Why should...?)
      const headingMatch = trimmedLine.match(/^#{2,4}\s+(.+\??)$/);
      
      if (headingMatch) {
        // Save previous Q&A if exists
        if (currentQuestion && currentAnswer.length > 0) {
          const answerText = currentAnswer.join(" ").trim();
          if (answerText.length > 5 && !answerText.toLowerCase().startsWith("stay in the loop")) {
            faqs.push({ question: currentQuestion, answer: answerText });
          }
        }
        // Start new Q&A
        currentQuestion = stripMarkdownLinks(headingMatch[1]).trim();
        currentAnswer = [];
      } else if (currentQuestion && trimmedLine) {
        // Skip "Stay in the loop" and footer content
        if (/^Stay in the loop|^Subscribe|^By clicking/i.test(trimmedLine)) break;
        // Skip short lines that look like CTAs
        if (/^(Read More|Learn More|Contact Us|Get in Touch)$/i.test(trimmedLine)) continue;
        // Add to answer
        currentAnswer.push(stripMarkdownLinks(trimmedLine));
      }
    }
    
    // Don't forget the last Q&A
    if (currentQuestion && currentAnswer.length > 0) {
      const answerText = currentAnswer.join(" ").trim();
      if (answerText.length > 5 && !answerText.toLowerCase().startsWith("stay in the loop")) {
        faqs.push({ question: currentQuestion, answer: answerText });
      }
    }
    
    // Pattern 2: Bold questions "**Question?**\nAnswer" (fallback if no ## found)
    if (faqs.length === 0) {
      const boldQaPattern = /\*\*([^*]+\??)\*\*\s*\n+([^\n*][^\n]*(?:\n(?!\*\*)[^\n]+)*)/g;
      const boldMatches = faqSection.matchAll(boldQaPattern);
      for (const m of boldMatches) {
        const q = stripMarkdownLinks(m[1]).trim();
        let a = stripMarkdownLinks(m[2]).trim();
        a = a.split(/Stay in the loop/i)[0].trim();
        if (q && a && q.length > 3 && a.length > 5) {
          faqs.push({ question: q, answer: a });
        }
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
    sizeMin: basic.sizeMin,
    sizeMax: basic.sizeMax,
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
