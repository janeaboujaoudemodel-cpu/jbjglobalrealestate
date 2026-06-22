/**
 * Dubai/UAE real-estate-only news filter.
 * Used on both:
 *  - the News page (client-side render filter so legacy unrelated rows are hidden), and
 *  - the ai-news-collector edge function (server-side guard before insert).
 *
 * Keep both copies in sync — server copy lives at
 *   supabase/functions/_shared/realEstateFilter.ts
 */

const ALLOWED_KEYWORDS: string[] = [
  // Core real estate
  "real estate", "property", "properties", "realty", "housing", "residential",
  "apartment", "villa", "townhouse", "penthouse", "studio",
  // Off-plan / projects / developers
  "off-plan", "off plan", "off-plan launch", "launch", "developer", "developers",
  "handover", "construction", "ready", "project",
  // Market / transactions
  "transaction", "transactions", "sales volume", "market report", "price index",
  "yield", "rental yield", "rent", "rental", "leasing", "tenant", "landlord",
  // Authorities / regulators
  "dld", "dubai land department", "rera", "trakheesi", "dubai municipality",
  "ministry of economy", "uae cabinet", "central bank",
  // Investment / finance
  "investment", "investor", "mortgage", "ltv", "freehold", "leasehold",
  // Areas / segments
  "dubai", "abu dhabi", "uae", "sharjah", "ajman", "ras al khaimah", "rak",
  "downtown", "marina", "palm jumeirah", "business bay", "jvc", "jlt",
  "mohammed bin rashid", "mbr city", "dubai hills", "creek harbour", "emaar",
  "nakheel", "damac", "meraas", "sobha", "binghatti", "azizi",
  // Visas / residency
  "golden visa", "investor visa", "residency",
  // Luxury / commercial
  "luxury real estate", "luxury property", "commercial real estate",
  "office space", "retail space", "warehouse", "hospitality",
];

const BLOCKED_KEYWORDS: string[] = [
  // The exact complaint
  "traffic fine", "traffic fines", "speed camera", "speeding",
  // Transport noise
  "metro line", "bus route", "taxi fare", "rta fare", "salik toll",
  // Unrelated lifestyle/news
  "horoscope", "weather forecast", "ramadan timing", "prayer time",
  "football", "cricket", "f1", "formula one", "tennis",
  "recipe", "restaurant review", "movie", "concert", "festival ticket",
  // Generic UAE govt unrelated to property
  "passport renewal", "emirates id renewal", "covid", "vaccination",
  "school exam", "university ranking",
  // Crypto/general business not tied to property
  "cryptocurrency", "bitcoin price", "stock market", "ipo",
];

function normalize(s: string | null | undefined): string {
  return (s || "").toLowerCase();
}

/**
 * Returns true if the article looks like Dubai/UAE real-estate content.
 * Pass title + excerpt (+ optional content) — at least ONE allowed
 * keyword must appear AND NO blocked keyword can appear in the title.
 */
export function isRealEstateArticle(input: {
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  category?: string | null;
}): boolean {
  const title = normalize(input.title);
  const excerpt = normalize(input.excerpt);
  const haystack = `${title} ${excerpt} ${normalize(input.content).slice(0, 800)} ${normalize(input.category)}`;

  // Title-level blocklist — if blocked keyword is in title, drop immediately
  for (const bad of BLOCKED_KEYWORDS) {
    if (title.includes(bad)) return false;
  }

  // Must hit at least one allowed keyword
  for (const good of ALLOWED_KEYWORDS) {
    if (haystack.includes(good)) return true;
  }

  return false;
}

export const REAL_ESTATE_ALLOWED_KEYWORDS = ALLOWED_KEYWORDS;
export const REAL_ESTATE_BLOCKED_KEYWORDS = BLOCKED_KEYWORDS;
