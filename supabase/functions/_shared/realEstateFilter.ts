// Mirror of src/lib/news/realEstateFilter.ts — keep in sync.
// Dubai/UAE real-estate-only news filter, applied server-side before
// inserting/updating any market_news row.

const ALLOWED_KEYWORDS: string[] = [
  "real estate", "property", "properties", "realty", "housing", "residential",
  "apartment", "villa", "townhouse", "penthouse", "studio",
  "off-plan", "off plan", "launch", "developer", "developers",
  "handover", "construction", "ready", "project",
  "transaction", "transactions", "sales volume", "market report", "price index",
  "yield", "rental yield", "rent", "rental", "leasing", "tenant", "landlord",
  "dld", "dubai land department", "rera", "trakheesi", "dubai municipality",
  "ministry of economy", "uae cabinet", "central bank",
  "investment", "investor", "mortgage", "ltv", "freehold", "leasehold",
  "dubai", "abu dhabi", "uae", "sharjah", "ajman", "ras al khaimah", "rak",
  "downtown", "marina", "palm jumeirah", "business bay", "jvc", "jlt",
  "mohammed bin rashid", "mbr city", "dubai hills", "creek harbour", "emaar",
  "nakheel", "damac", "meraas", "sobha", "binghatti", "azizi",
  "golden visa", "investor visa", "residency",
  "luxury real estate", "luxury property", "commercial real estate",
  "office space", "retail space", "warehouse", "hospitality",
];

const BLOCKED_KEYWORDS: string[] = [
  "traffic fine", "traffic fines", "speed camera", "speeding",
  "metro line", "bus route", "taxi fare", "rta fare", "salik toll",
  "horoscope", "weather forecast", "ramadan timing", "prayer time",
  "football", "cricket", "f1", "formula one", "tennis",
  "recipe", "restaurant review", "movie", "concert", "festival ticket",
  "passport renewal", "emirates id renewal", "covid", "vaccination",
  "school exam", "university ranking",
  "cryptocurrency", "bitcoin price", "stock market", "ipo",
];

function normalize(s: string | null | undefined): string {
  return (s || "").toLowerCase();
}

export function isRealEstateArticle(input: {
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  category?: string | null;
}): boolean {
  const title = normalize(input.title);
  const excerpt = normalize(input.excerpt);
  const haystack = `${title} ${excerpt} ${normalize(input.content).slice(0, 800)} ${normalize(input.category)}`;

  for (const bad of BLOCKED_KEYWORDS) {
    if (title.includes(bad)) return false;
  }
  for (const good of ALLOWED_KEYWORDS) {
    if (haystack.includes(good)) return true;
  }
  return false;
}
