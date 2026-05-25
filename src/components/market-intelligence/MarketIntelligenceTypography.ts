/**
 * Market Intelligence — shared typography scale.
 *
 * Single source of truth for font size / weight / line-height / tracking
 * across all Market Intelligence sections. Always import these constants
 * instead of writing inline `text-xx font-xx leading-xx` strings.
 *
 * Color tokens (text-foreground / text-muted-foreground) are baked in
 * where the role implies a fixed color; otherwise the consumer adds
 * the appropriate semantic color class alongside the token.
 */

// Section eyebrow / kicker (above an H2) — gold accent
export const MI_EYEBROW =
  "text-xs font-semibold uppercase tracking-[0.3em] text-[#B89555]";

// Section H2 — navy blue accent
export const MI_H2 =
  "text-3xl md:text-4xl font-bold leading-tight tracking-tight text-[#102540]";

// Section lead paragraph (under H2) — gold
export const MI_LEAD =
  "text-base md:text-lg font-normal leading-relaxed text-[#B89555]";

// Card title / H3 / shadcn CardTitle — navy blue
export const MI_CARD_TITLE =
  "text-lg font-semibold leading-snug text-[#102540]";

// Sub-heading / H4
export const MI_H4 = "text-sm font-semibold leading-snug text-[#102540]";

// Body
export const MI_BODY =
  "text-sm font-normal leading-relaxed text-foreground";

// Body (muted)
export const MI_BODY_MUTED =
  "text-sm font-normal leading-relaxed text-muted-foreground";

// Caption / footnote
export const MI_CAPTION =
  "text-xs font-normal leading-relaxed text-muted-foreground";

// KPI value (large) — color provided by consumer
export const MI_KPI = "text-2xl font-bold leading-none tracking-tight";

// Stat value (mid)
export const MI_STAT =
  "text-lg font-bold leading-none tracking-tight text-foreground";

// Chip / pill — color provided by consumer
export const MI_CHIP = "text-xs font-semibold leading-none";

// Table-of-contents item (base; active state adds font-semibold)
export const MI_TOC_ITEM = "text-sm font-medium leading-snug";
