/**
 * searchIntent — natural-language router for the hero search bar.
 *
 * Layer 1 (instant, offline): deterministic rules for the intents we know
 *   ("I want to sell my property", "how much is my property worth",
 *    "looking for a 2 bed in Marina", "mortgage", "golden visa", …).
 * Layer 2 (AI): `ai-search-intent` edge function resolves anything the rules
 *   miss into a route.
 * Layer 3 (human): if neither layer can answer, we hand the visitor's own
 *   sentence to chat support so the conversation continues instead of dead-ending.
 */

import { GEO_COUNTRIES } from "@/data/geography";

export type SearchIntentKind =
  | "sell"
  | "valuation"
  | "rent-out"
  | "rent"
  | "buy"
  | "off-plan"
  | "mortgage"
  | "golden-visa"
  | "advisory"
  | "support";

export interface ResolvedIntent {
  kind: SearchIntentKind;
  /** Where to send the visitor. Null = hand off to chat support. */
  route: string | null;
  /** Short line shown to the visitor so the jump never feels random. */
  message: string;
  /** Matched area/city slug, when the sentence named one. */
  areaSlug?: string;
  areaName?: string;
  beds?: string;
  confidence: "high" | "medium" | "low";
}

const ALL_AREAS = GEO_COUNTRIES.flatMap((c) => [
  ...(c.areas ?? []),
  ...(c.regions ?? []).flatMap((r) => [{ slug: r.slug, name: r.name }, ...r.areas]),
]);

const findArea = (text: string) => {
  const t = text.toLowerCase();
  // Longest name first so "Dubai Marina" wins over "Dubai".
  const sorted = [...ALL_AREAS].sort((a, b) => b.name.length - a.name.length);
  return sorted.find((x) => t.includes(x.name.toLowerCase())) ?? null;
};

const findBeds = (text: string) => {
  if (/\bstudio\b/i.test(text)) return "Studio";
  const m = text.match(/\b([1-7])\s*(?:-|\s)?\s*(?:bed|bedroom|br|bhk)\b/i);
  return m ? m[1] : undefined;
};

const has = (text: string, re: RegExp) => re.test(text);

/** Instant, offline resolution. Returns null when nothing matches confidently. */
export function resolveIntentLocally(raw: string): ResolvedIntent | null {
  const q = raw.trim();
  if (!q) return null;
  const t = q.toLowerCase();
  const area = findArea(t);
  const beds = findBeds(t);
  const areaBit = area ? ` in ${area.name}` : "";

  if (has(t, /\b(valuat|worth|how much is my|price of my|evaluate my|appraisal)\b/)) {
    return {
      kind: "valuation",
      route: "/tools/property-valuation",
      message: "Opening the instant property valuation tool.",
      confidence: "high",
    };
  }

  if (has(t, /\b(sell|selling|list my|dispose|offload)\b/) && has(t, /\b(my|our)\b|property|apartment|villa|unit/)) {
    return {
      kind: "sell",
      route: "/services/sell-property",
      message: "Taking you to our sell-side advisory.",
      confidence: "high",
    };
  }

  if (has(t, /\b(rent out|lease out|let my|tenant for my|manage my property)\b/)) {
    return {
      kind: "rent-out",
      route: "/services/property-management",
      message: "Opening leasing & property management.",
      confidence: "high",
    };
  }

  if (has(t, /\b(mortgage|loan|finance|financing|instalment|installment|payment plan)\b/)) {
    return {
      kind: "mortgage",
      route: "/tools/mortgage-calculator",
      message: "Opening the mortgage calculator.",
      confidence: "high",
    };
  }

  if (has(t, /\b(golden visa|residency|residence visa)\b/)) {
    return {
      kind: "golden-visa",
      route: "/services/golden-visa",
      message: "Opening Golden Visa advisory.",
      confidence: "high",
    };
  }

  if (has(t, /\b(off[-\s]?plan|launch|pre[-\s]?launch|new project|handover)\b/)) {
    const p = new URLSearchParams({ intent: "off-plan" });
    if (area) p.set("areas", area.slug);
    if (beds) p.set("beds", beds);
    return {
      kind: "off-plan",
      route: `/properties?${p.toString()}`,
      message: `Showing off-plan inventory${areaBit}.`,
      areaSlug: area?.slug,
      areaName: area?.name,
      beds,
      confidence: "high",
    };
  }

  if (has(t, /\b(rent|rental|renting|for rent|how much is rent)\b/)) {
    const p = new URLSearchParams({ intent: "rent" });
    if (area) p.set("areas", area.slug);
    if (beds) p.set("beds", beds);
    return {
      kind: "rent",
      route: `/properties?${p.toString()}`,
      message: `Showing rentals${areaBit}.`,
      areaSlug: area?.slug,
      areaName: area?.name,
      beds,
      confidence: area ? "high" : "medium",
    };
  }

  if (area || beds || has(t, /\b(buy|buying|looking for|invest|apartment|villa|townhouse|penthouse|studio)\b/)) {
    const p = new URLSearchParams({ intent: "buy" });
    if (area) p.set("areas", area.slug);
    if (beds) p.set("beds", beds);
    if (!area && !beds) p.set("q", q);
    return {
      kind: "buy",
      route: `/properties?${p.toString()}`,
      message: `Showing properties for sale${areaBit}.`,
      areaSlug: area?.slug,
      areaName: area?.name,
      beds,
      confidence: area || beds ? "high" : "medium",
    };
  }

  if (has(t, /\b(advis|consult|speak|talk|call me|meeting|appointment)\b/)) {
    return {
      kind: "advisory",
      route: null,
      message: "Connecting you with an advisor.",
      confidence: "high",
    };
  }

  return null;
}

/** Hands the visitor's sentence to live chat support and opens the widget. */
export function handOffToChatSupport(message: string, context?: Record<string, unknown>) {
  try {
    sessionStorage.setItem(
      "jbj:chat-prefill",
      JSON.stringify({ message, context: context ?? {}, at: Date.now() }),
    );
  } catch {
    /* storage blocked — the widget still opens, just without the prefill */
  }
  window.dispatchEvent(new CustomEvent("jbj:open-chat-support", { detail: { message } }));
}

/** Reads and clears a pending chat prefill. */
export function consumeChatPrefill(): string | null {
  try {
    const raw = sessionStorage.getItem("jbj:chat-prefill");
    if (!raw) return null;
    sessionStorage.removeItem("jbj:chat-prefill");
    const parsed = JSON.parse(raw) as { message?: string; at?: number };
    // Ignore stale handoffs (older than 10 minutes).
    if (!parsed.message || (parsed.at && Date.now() - parsed.at > 10 * 60_000)) return null;
    return parsed.message;
  } catch {
    return null;
  }
}
