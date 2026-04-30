## Goal

Lock Market Intelligence to one shared typography scale so eyebrows, headings, card titles, body copy, KPI numbers, chips, and TOC items render identically section to section.

## Typography scale (single source of truth)

| Role | Class string |
|---|---|
| Eyebrow / kicker | `text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground` |
| Section H2 | `text-3xl md:text-4xl font-bold leading-tight tracking-tight text-foreground` |
| Section lead | `text-base md:text-lg font-normal leading-relaxed text-muted-foreground` |
| Card title (H3 / CardTitle) | `text-lg font-semibold leading-snug text-foreground` |
| Sub-heading (H4) | `text-sm font-semibold leading-snug text-foreground` |
| Body | `text-sm font-normal leading-relaxed text-foreground` |
| Body muted | `text-sm font-normal leading-relaxed text-muted-foreground` |
| Caption / footnote | `text-xs font-normal leading-relaxed text-muted-foreground` |
| KPI value (large) | `text-2xl font-bold leading-none tracking-tight` (color preserved) |
| Stat value (mid) | `text-lg font-bold leading-none tracking-tight text-foreground` |
| Chip / pill | `text-xs font-semibold leading-none` |
| TOC item | `text-sm font-medium leading-snug` (active state adds `font-semibold`) |

Hero is exempt — uses its own oversized display scale (already standardized).

## Files & specific changes

1. **`MarketIntelligenceTypography.ts`** (new) — export the class strings as named constants (`MI_EYEBROW`, `MI_H2`, `MI_LEAD`, `MI_CARD_TITLE`, `MI_H4`, `MI_BODY`, `MI_BODY_MUTED`, `MI_CAPTION`, `MI_KPI`, `MI_STAT`, `MI_CHIP`, `MI_TOC_ITEM`). Single import point keeps drift impossible.

2. **`AIMarketInsights.tsx`** — eyebrow → `MI_EYEBROW`; H2 → `MI_H2`; CardTitle (line 159) `text-lg` → `MI_CARD_TITLE`; quote `text-sm italic` → keep italic + `MI_BODY_MUTED`; insight body (165) → `MI_BODY`; "Ask AI" H3 (181) `text-xl font-bold` → `MI_CARD_TITLE`; sub-headers (229) → `MI_H4`; answer body (233) → `MI_BODY`; disclaimer (252) → `MI_CAPTION`.

3. **`AreaIntelligenceGrid.tsx`** — chip (32) `text-[11px] font-bold` → `MI_CHIP`; area H3 (62) → `MI_CARD_TITLE`; "Dubai, UAE" (65) → `MI_CAPTION`; metric labels (74, 81) → `MI_CAPTION`; metric values (78, 85) → `MI_STAT`; demand/supply labels (93, 105) → `text-xs font-semibold`; values (94, 106) → `text-xs font-bold`; YoY label (119) → `MI_BODY`; bullet rows (128) → `MI_CAPTION`; CTA (138) → `text-sm font-semibold`; eyebrow (163) + H2 (166) → tokens.

4. **`MarketOverviewDashboard.tsx`** — KPI delta chip (52) → `MI_CHIP` + color; KPI title (58) `font-medium text-sm` → `MI_BODY`; KPI value (59) `text-2xl font-bold` → `MI_KPI`; eyebrow (83) currently `font-bold text-foreground` → `MI_EYEBROW` (fixes outlier); H2 (86) → `MI_H2`; quarter label (151) → `text-sm font-semibold`; bar value (160) → `MI_CHIP`; footnote (168) → `MI_CAPTION`; property type (189) → `MI_CARD_TITLE` size dropped to `text-base font-semibold`, transactions (190) → `MI_CAPTION`; price (193) → `text-sm font-bold`; change (194) → `MI_CHIP` + color; segment legend (213, 217) → `MI_BODY`/`MI_BODY_MUTED`.

5. **`MarketReports.tsx`** — eyebrow (128), H2 (131) → tokens; CardTitle (156) `text-xl` → `MI_CARD_TITLE`; description (159) → `MI_BODY_MUTED`; meta rows (164/168/172) → `MI_CAPTION`; methodology H4 (211) → `MI_H4`; methodology body (214) → `MI_BODY_MUTED`.

6. **`DataSourcesPanel.tsx`** — eyebrow (45), H2 (48) → tokens; source name (73) `font-semibold text-lg` → `MI_CARD_TITLE`; provider (74) → `MI_CAPTION`; description (75) → `MI_BODY`; tag (81) `font-medium text-xs` → `MI_CHIP`; status row (88) → `text-xs font-semibold`; link (98) → `text-sm font-semibold`; quality items (124/127) → `MI_BODY`.

7. **`MarketIntelligenceNavigation.tsx`** — promo H3 (47) `text-xl font-bold` → `MI_CARD_TITLE`; lead (48) → `MI_BODY_MUTED`; CTA (53) → `text-sm font-semibold`; Prev/Next eyebrow (73) `tracking-wider` → `tracking-[0.3em]` (matches rest); titles (74, mirror) keep current responsive scale but normalize to `font-bold leading-snug tracking-tight`.

8. **`MarketIntelligenceTableOfContents.tsx`** — Quick-Nav H4 (112) → `MI_H4`; intro (113) → `MI_CAPTION`; section title H3 (141) → `MI_CARD_TITLE` (drops to `text-base` here for sidebar density); item button (171) → `MI_TOC_ITEM`; active branch keeps `font-semibold`; numeric pill (178) → `MI_CHIP`.

9. **`src/pages/MarketIntelligence.tsx`** — top eyebrow (137) `tracking-[0.3em]` already aligns; bump body description (150) `text-lg md:text-xl` → keep as page-hero lead but standardize to `font-light leading-relaxed text-white/95` to match hero; data-pill labels (176/180/184) → `MI_BODY`; cluster H3 (218) `text-xl font-bold` → `MI_CARD_TITLE`; cluster body (221) → `MI_BODY_MUTED`.

## Validation

- `npm run check:contrast` and `npm run check:a11y` to confirm no regressions.
- Visual scan of `/market-intelligence` and the four subpages at 1920 / 1366 / 768 / 390 — eyebrows, H2s, card titles, KPIs, chips, and TOC items should render identically across sections.

## Out of scope

- Hero display scale (already standardized in the previous pass).
- Color/contrast tokens (handled by the prior token migration).
- No structural/layout changes; text-only class swaps.
