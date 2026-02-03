import { fetchWithRetry } from "./http.ts";

const PDF_RX = /\.pdf(\?|$)/i;

function collectStringsDeep(value: unknown, out: string[]) {
  if (typeof value === "string") {
    if (PDF_RX.test(value)) out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectStringsDeep(v, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) collectStringsDeep(v, out);
  }
}

export type ProvidentPdfCandidates = {
  all: string[];
  brochure: string | null;
  paymentPlan: string | null;
  floorPlans: string[];
};

export function categorizePdfUrls(urls: string[]): ProvidentPdfCandidates {
  const dedup = Array.from(new Set(urls));

  let brochure: string | null = null;
  let paymentPlan: string | null = null;
  const floorPlans: string[] = [];

  for (const u of dedup) {
    const lower = u.toLowerCase();
    if (!brochure && lower.includes("brochure")) brochure = u;
    else if (!paymentPlan && (lower.includes("payment") || lower.includes("plan"))) paymentPlan = u;
    else if (lower.includes("floor")) floorPlans.push(u);
  }

  // Fallback: treat first uncategorized as brochure
  if (!brochure && dedup.length > 0) {
    const remaining = dedup.filter((u) => u !== paymentPlan && !floorPlans.includes(u));
    if (remaining.length > 0) brochure = remaining[0];
  }

  return { all: dedup, brochure, paymentPlan, floorPlans };
}

/**
 * Provident is Gatsby. The canonical, deterministic place to discover brochure URLs
 * is its page-data.json endpoint.
 */
export async function fetchProvidentPageDataPdfUrls(args: {
  baseUrl: string; // e.g. https://providentestate.com
  slug: string; // listing slug
}): Promise<ProvidentPdfCandidates> {
  const { baseUrl, slug } = args;
  const pageDataUrl = `${baseUrl.replace(/\/$/, "")}/page-data/new-projects/${slug}/page-data.json`;

  const res = await fetchWithRetry(pageDataUrl, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0",
      // No auth needed. Keep headers minimal.
    },
  });

  if (!res.ok) {
    // Soft failure: many pages still work without page-data PDFs.
    console.warn(`[page-data] Failed ${res.status} for ${pageDataUrl}`);
    return { all: [], brochure: null, paymentPlan: null, floorPlans: [] };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { all: [], brochure: null, paymentPlan: null, floorPlans: [] };
  }

  const pdfs: string[] = [];
  collectStringsDeep(json, pdfs);
  return categorizePdfUrls(pdfs);
}
