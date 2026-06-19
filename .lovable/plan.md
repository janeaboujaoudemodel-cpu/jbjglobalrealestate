# Market Intelligence — Global Layout & TOC Fix

Apply the same fix set across all 4 pages that use `MarketIntelligenceTableOfContents`:
- `src/pages/market-intelligence/MarketOverview.tsx`
- `src/pages/market-intelligence/Methodology.tsx`
- `src/pages/market-intelligence/MarketReports.tsx`
- `src/pages/market-intelligence/AreaIntelligence.tsx`

## 1. TOC component — shrink, scroll, never crop CTA
Edit `src/components/market-intelligence/MarketIntelligenceTableOfContents.tsx`:
- Outer wrapper: cap height to **half viewport** with internal scroll, anchor at `top-28`, width `w-60 lg:w-64` (down from `w-64 lg:w-72`):
  - `fixed right-4 lg:right-6 top-28 z-40 w-60 lg:w-64`
- Card container: `max-h-[55vh]` (down from `calc(100vh-200px)`), `flex flex-col` so the nav region is the only scroller.
- Nav region: `overflow-y-auto flex-1 min-h-0`, compact item padding `px-2.5 py-1.5`, smaller number chip `w-5 h-5 text-[10px]`, item text `text-[13px]`.
- **Sticky CTA footer** for "Find Your Property": move the `ctaAction` Link out of the scrolling `<nav>` into a non-scrolling footer pinned at the bottom of the card (`border-t border-[#B89555]/25 p-3 bg-[#FDFBF7]`) so item 11 + the CTA button are always visible and never cropped.
- Replace generic `bg-muted`/`bg-card`/`text-muted-foreground` with palette tokens (`bg-[#FDFBF7]`, `border-[#B89555]/30`, `text-[#1A1A1A]`, active = `bg-[#1A1A1A] text-white`, inactive number chip = `bg-[#EFE6D6] text-[#1A1A1A]`) for guaranteed contrast on champagne.

## 2. Reduce section spacing (all 4 pages)
- Parent wrapper: `pt-16 pb-16` → `pt-8 pb-10`.
- Each `<section>`: `py-12 mb-8` → `py-6 mb-3`.
- Inner card padding: `jj-card-inner p-8` → `p-6`.
- Replace `xl:pr-80` (only kicks in at xl) with `lg:pr-72 xl:pr-72` so the TOC never overlaps content from `lg` upward, and rail width matches new `w-64` + gutter.

## 3. Remove duplicate cards
- **MarketOverview**: "Performance by Property Type" currently renders both the `PROPERTY_TYPE_TRENDS` rows AND the new DLD `<DLDDailySnapshot />`/by-property cards introduced earlier — keep only the DLD live cards and remove the static `PROPERTY_TYPE_TRENDS` block (single source of truth).
- Audit `MarketReports.tsx` / `AreaIntelligence.tsx` for similar duplicated KPI/quarterly card pairs and collapse to one.

## 4. Contrast pass
- Tooltip card: swap `bg-card`/`border-border` → `bg-[#FDFBF7] border-[#B89555]/40`, icon tile `bg-[#1A1A1A] text-white`.
- KPI/quarterly cards keep champagne bg + ink text; remove residual `text-white/70` (line 135, 349) → `text-[#1A1A1A]/60`.
- PreFooterSeparator: confirm both buttons render `.jj-cta-dark` / `.jj-cta-champagne` — no electric blue.

## 5. Fix "Explore More" (#11) cropping
Root cause = TOC card was taller than viewport and CTA lived inside the scrolling nav, so the last item + button fell below the viewport with no scroll indicator. Fixes in step 1 (`max-h-[55vh]`, sticky footer CTA, `min-h-0` on scroll region) resolve it on every breakpoint.

## 6. Visual validation (proof)
Using `browser--view_preview` at 1440×900 then 1024×768:
1. `/market-intelligence/overview` — screenshot top (hero+KPIs), middle (sections + TOC visible), bottom (Explore More + footer CTA).
2. `/market-intelligence/areas` — screenshot showing TOC + no overlap.
3. `/market-intelligence/reports` — screenshot.
4. `/market-intelligence/methodology` — screenshot.
Verify in each: TOC ≤ half viewport, scrolls internally, CTA "Find Your Property" pinned and visible, no card duplication, sections compact, no blue/neon, no content cropped under the rail.

## Out of scope
DLD ingest cron, recommendations engine, mortgage calc, presentations retirement, Developer Detail grid — already done in prior batches.
