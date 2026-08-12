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

import { AREA_ENTRIES } from "@/lib/areaResolver";
import { supabase } from "@/integrations/supabase/client";


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

/**
 * Every geography entry with its country / region, so a matched place can be
 * routed with the FULL geo chain. Emitting only `areas=<slug>` pinned every
 * query to the UAE and applied no filter at all (the results engine matches
 * display names, not slugs).
 */
const ALL_AREAS = AREA_ENTRIES;

const findArea = (text: string) => {
  const t = text.toLowerCase();
  // Longest name first so "Dubai Marina" wins over "Dubai".
  const sorted = [...ALL_AREAS].sort((a, b) => b.name.length - a.name.length);
  return sorted.find((x) => t.includes(x.name.toLowerCase())) ?? null;
};

/** Writes the complete geo chain (country → region → area, slugs + names). */
const setGeo = (p: URLSearchParams, area: (typeof ALL_AREAS)[number] | null) => {
  if (!area) return;
  p.set("country", area.countrySlug);
  if (area.isRegion) {
    p.set("region", area.slug);
    p.set("emirates", area.name);
    return;
  }
  if (area.regionSlug) p.set("region", area.regionSlug);
  p.set("areaSlugs", area.slug);
  p.set("areas", area.name);
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
    setGeo(p, area);
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
    setGeo(p, area);
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
    setGeo(p, area);
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
  // No owner alert here: the AI desk answers first. An owner ticket is only
  // created when the visitor explicitly transfers the chat to JBJ.
}

/**
 * Fire-and-forget owner alert: email + in-app notification so Jane can join
 * the conversation while the AI keeps the visitor engaged.
 */
export function notifyOwnerOfHandoff(message: string, context?: Record<string, unknown>) {
  const ctx = (context ?? {}) as Record<string, unknown>;
  void supabase.functions
    .invoke("chat-support-notify", {
      body: {
        message,
        source: typeof ctx.source === "string" ? ctx.source : "hero_search",
        pageSource:
          typeof ctx.path === "string"
            ? ctx.path
            : typeof window !== "undefined"
              ? window.location.pathname
              : undefined,
        visitorEmail: typeof ctx.visitorEmail === "string" ? ctx.visitorEmail : undefined,
        visitorName: typeof ctx.visitorName === "string" ? ctx.visitorName : undefined,
        conversationId: typeof ctx.conversationId === "string" ? ctx.conversationId : undefined,
        serviceType: typeof ctx.serviceType === "string" ? ctx.serviceType : undefined,
      },
    })
    .catch((e) => console.warn("[searchIntent] owner alert failed", e));
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
