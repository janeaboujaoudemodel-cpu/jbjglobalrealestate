## What's actually broken in the screenshots

`/market-intelligence/overview` (and every sibling under `/market-intelligence/*`) is still rendering on a **neon dark shell** with **cyan badge**, **navy KPI cards**, **empty espresso bands between champagne cards**, **broken padding under the L-frame header/sidebar**, and a **blue "Explore More" pre-footer**. Root causes I confirmed:

- `MarketOverview.tsx` (and all sibling pages) wrap their root in `data-neon-page` + a custom dark gradient — should never apply to Market Intelligence.
- `MarketIntelligenceHero.tsx` uses `jj-hero-neon` with a cyan-tinted accent + cyan-looking badge text shadow stack; the title's contrast is also degraded.
- `jj-card-inner` and `jj-section-champagne` classes are **referenced everywhere but never defined in `index.css`** — so `<Card className="jj-card-inner">` falls back to default shadcn Card on a neon page = the black/navy KPI tiles in your screenshot.
- Section pattern `bg-[#1A1A1A]` parent wrapping `jj-section-champagne` children with `mb-8` produces the ugly espresso bands between cards.
- `PreFooterSeparator` "Explore More Market Intelligence" still ships the legacy electric-blue buttons.
- The five "Market Brief / Quarterly / Annual" pages render empty card shells — no government source content filled in.

## Scope (rebuild, not patch)

### 1. Kill the neon shell across all 8 Market Intelligence pages

Pages touched (all under `src/pages/market-intelligence/`):
`MarketOverview.tsx`, `AreaIntelligence.tsx`, `AreaDetail.tsx`, `MarketReports.tsx`, `Methodology.tsx`, `MonthlyMarketBrief.tsx`, `QuarterlyMarketReview.tsx`, `AnnualMarketSummary.tsx`.

For each page:
- Remove `data-neon-page` + custom dark gradient root → `<div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]" data-marketing-page>`.
- Remove inner `bg-[#1A1A1A]` content wrapper that produced espresso bands.
- Replace ad-hoc `jj-section-champagne` + `jj-card-inner` markup with the locked primitives: `<PremiumSectionCard>` for each top-level section, `<Surface tone="raised">` (or plain `.jj-band-raised`) for nested cards.
- Add the standard `pt-[88px]` header offset and remove the `xl:pr-80` global right-pad that was colliding with the right-rail TOC (the TOC will be repositioned, see §4).

### 2. Repaint `MarketIntelligenceHero`

`src/components/market-intelligence/MarketIntelligenceHero.tsx`:
- Drop `jj-hero-neon` + cyan accent span.
- Badge: swap to the champagne+gold pill primitive (`bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]/60`) on dark hero — no cyan glow, no text-shadow halo.
- Strengthen the legibility stack so the title is readable on any video frame: replace the three composite overlays with one `bg-black/72` + a clean `linear-gradient(180deg, rgba(0,0,0,0.85), rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.95))`.
- Title stays white-on-dark with `data-hero-dark` + `allow-white` (compliant with the black-CTA / white-on-light guards).

### 3. Rebuild the KPI / quarterly / property-type cards in champagne

In `MarketOverview.tsx`:
- "Key Market Statistics" 4 tiles → `<Surface tone="raised">` cards (`#EFE6D6` bg, 1px `#B89555/30` hairline, ink heading, `<PricePill />` style for the value where it's a monetary figure, emerald/red trend chip).
- "Quarterly Transaction Trends" 4 tiles → same champagne raised card, ink numerals, slim gold progress bar already in place.
- "Performance by Property Type" rows → champagne raised rows (already mostly correct, just need the parent espresso band removed).

`src/components/market-intelligence/DLDDailySnapshot.tsx` gets the same treatment so its KPI strip / Cash-vs-Mortgage / Top-10 panels stop rendering on the dark gradient.

### 4. Fix layout & padding under the L-frame

- Add `pt-[88px]` to every Market Intelligence page root (matches the locked header offset rule).
- Move `MarketIntelligenceTableOfContents` from a fixed right rail (which collided with the sidebar at <1280px and forced `xl:pr-80` on every section) to an in-flow sticky column inside a `lg:grid-cols-[1fr_280px]` container. Removes all the broken edge-padding.
- Container width: `max-w-[1200px] mx-auto px-6 lg:px-10` (no more edge-touching cards).

### 5. PreFooterSeparator palette fix

`src/components/PreFooterSeparator.tsx`:
- Replace the residual electric-blue primary/secondary button styling with `.jj-cta-dark` (clean black + gold hairline + white text) and `.jj-cta-champagne` (champagne + ink + gold hairline) primitives — already locked in the memory standard. No more blue anywhere on the Market Intelligence pages.

### 6. Fill the four empty "books" (Market Briefs)

`MonthlyMarketBrief.tsx`, `QuarterlyMarketReview.tsx`, `AnnualMarketSummary.tsx`, plus the "Market Reports" index — currently render header + empty shell. Fill each with real **government-source** content (no fabrication, every figure cited to DLD / RERA / DXB Interact / Dubai Statistics):

- **Monthly Brief**: latest month total registered transactions, value AED, off-plan vs secondary split, cash vs mortgage split, top 5 areas by volume, top 5 areas by avg AED/sqft, RERA rent-index change for the month, service-charge approvals. Source line + DLD/RERA portal links on every block.
- **Quarterly Review**: rolling 4-quarter trend (transactions, value, avg AED/sqft), property-type performance, area heatmap top 10, supply pipeline (DLD project registrations + handovers), rental-yield band by area. Pull from existing `dld_daily_snapshot` aggregates already wired in the prior phase.
- **Annual Summary**: full-year totals (transactions, value, off-plan share, mortgage share), top 20 areas table, top 10 developers by transaction volume, RERA service-charge index summary, D33 economic context block.
- **Market Reports index**: card grid linking the three above + a "Daily DLD Snapshot" card, every card on champagne raised tone, ink title, gold hairline, `Last updated <date>` footer pulled from `dld_market_data.updated_at`.

All data pulled live via the existing `useDLDMarketData` hook + the `dld_daily_snapshot` table — no new tables, no ingestion changes.

### 7. Verification

- Pure UI/data work — no DB migrations, no edge-function changes (DLD ingest cron from the prior phase stays).
- Visual check via `browser--view_preview` on `/market-intelligence`, `/market-intelligence/overview`, `/market-intelligence/areas`, `/market-intelligence/reports`, `/market-intelligence/reports/monthly`, `/market-intelligence/reports/quarterly`, `/market-intelligence/reports/annual`, `/market-intelligence/methodology` at 1440 + 1024 widths.
- Confirm: no cyan, no navy KPI tiles, no blue CTAs, hero title legible, no espresso strips between sections, content reaches edge of the L-frame inset (not under the sidebar), Market Briefs show real government-cited numbers.

### Out of scope (already shipped, will not be re-touched)

- DLD daily ingest edge function + 03:15 UTC cron — kept as-is.
- Behavioral recommendation popup, nearby projects map, mortgage calculator parity, presentations retirement — all confirmed from prior phases.
- Developer Detail 6-by-6 grid expansion — confirmed from prior phase.