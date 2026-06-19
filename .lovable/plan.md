This is intentionally split into 12 numbered fixes, grouped by surface, so you can approve all or carve out. I will deliver each with a real browser screenshot before claiming done. No work begins until you approve.

## A. Project Detail Page

**1. Duplicate first photo in gallery (low-res + high-res of the same image)**
- Files: `src/components/project-detail/ProjectDetailLayout.tsx`, image pipeline `src/utils/getHighResImageUrl` / `developerLogo` helpers, `src/hooks/useProjects.ts`.
- Add a dedupe pass before the gallery renders: normalize each URL (strip CDN size suffixes like `/x/350x/`, query params, trailing `?v=`), group by normalized key, keep the variant with the highest resolution score (largest declared width, or the `getHighResImageUrl` upgrade). Drop the rest.
- Apply same dedupe to: cover, card, gallery, hero picker — so it can never re-appear on another project.
- Verify: load 3 known-affected projects in browser, screenshot the strip and the lightbox count.

**2. "+14" thumbnail must open full lightbox at index 0**
- File: the gallery grid in `ProjectDetailLayout.tsx` (the overlay tile with `+N`).
- Currently the overlay opens one image. Wire its onClick to the same lightbox `openAt(0)` that the visible tiles use, with `total = gallery.length` so all 20 (post-dedupe) are swipeable. Add keyboard `←/→/Esc`, swipe on touch, counter `i/total`.

**3. Project map → also show nearby projects**
- Files: `src/components/project-detail/ProjectNearbyPropertiesMap.tsx`, query layer.
- Add a `nearby_projects` query: same map bounds (e.g. 5 km radius from this project's lat/lng), exclude current id, only `is_published=true`, cap at 50.
- Render: current project = red pin (existing), others = blue pins. Click blue pin → small champagne popover with logo + name + price pill + "Open" link → `/project/:slug`.
- Verify: navigate to a Downtown project, screenshot showing red center + multiple blue pins.

## B. Brochure & Documents

**4. Brochure cover: company wordmark + project name unreadable**
- File: `src/components/project-detail/PremiumBrochureCard.tsx` (and any brochure generator template).
- Re-stack with a 60% black scrim over the bottom 40% of the cover, raise wordmark and title to white with `drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]`, increase title to 22px semibold, wordmark to 14px tracking-wide.
- Verify visually.

**5. Brochure label in Project Documents section unreadable**
- File: `src/components/project-detail/BookStyleDocuments.tsx`.
- Same scrim + ink-on-champagne or white-on-scrim treatment for the doc-card title strip; bump to `text-[#1A1A1A]` on champagne, never gold-on-gold.

## C. Mortgage Calculator (UI/colors unchanged)

**6. Match PropertyFinder feature parity, keep our look**
- File: `src/components/MortgageCalculator.tsx`.
- Add inputs (matching PropertyFinder's calculator): **Residency** toggle `UAE Resident / Non-Resident`; auto-set max LTV (80% resident, 50% non-resident for properties ≥ AED 5M cap rules); **Property Type** new/secondary; **Down Payment** field linked to LTV slider; **Loan Term** 5–25y; **Interest Rate** with default 4.25% editable; **Bank Fees** (1% arrangement default), **Valuation Fee** AED 3,000, **DLD Fee** 4%, **Agency Fee** 2%; **Pre-Approval CTA** at the bottom routing to consultation form prefilled.
- Recalc output: monthly EMI, total interest, total cost, upfront cash needed (down + DLD + agency + bank + valuation), affordability badge.
- No color/layout change beyond adding the new rows in the existing card.

## D. Dubai Market Intelligence

**7. Data freshness + headline KPIs**
- File: `src/pages/MarketIntelligence.tsx`, scraper edge function.
- Daily cron (already have `pg_cron`) hitting `dld-daily-ingest` edge function at 06:00 GST; write to `market_intel_daily` table.
- Add KPI strip at top: **Today's Transactions**, **AED Volume Today**, **YTD Volume**, **vs. Yesterday %**, **Last Updated**.

**8. Visual upgrade — premium repaint**
- Cash vs Mortgage chart: switch palette to **Black `#0A0A0A` + Gold `#B89555`** (cash = black, mortgage = gold hairline outline on champagne).
- Drop the green/brown duo.
- Top-10 Areas + Top-10 Buyers bars: the broken right-to-left white highlight is from a CSS `linear-gradient` clip-path. Replace with a single champagne base + animated gold fill that grows left-to-right via `transform: scaleX()` with `transform-origin: left`.

**9. "Notice something incorrect?" + "Expert Consultation" cards**
- Both are too dark/flat right now. Convert to premium black cards (`#0A0A0A` bg, gold hairline border, white headline, champagne body) with a single gold-metallic CTA button. Same primitive used for hero black CTAs.

## E. Developer Page (e.g. /developer/emaar)

**10. "More Projects by this Developer" expandable grid above Market Intelligence**
- File: `src/pages/DeveloperDetail.tsx`.
- Render 2 rows × 3 cards (desktop) = 6 visible. "View more" expands in-place (no navigation) to all projects in batches of 6, smooth height transition.
- Add filter bar above the grid: **Area** (multi-select), **Price range**, **Bedrooms**, **Handover year**, **Status**. Wired to `projects` query with developer_id constraint.
- All existing sections below (Consultation / Register Interest / Callback / Recommended) stay intact.

## F. Recommendations Engine

**11. Behavior-based recommended projects**
- Files: `src/components/PropertyRecommendationPopup.tsx`, `src/components/RecommendedFor*`, tracking events `jbj:browsing-tracked`.
- Scoring: weight last 10 viewed projects → infer dominant signal: `developer_id` (if ≥40% of views share one), else `area` (if ≥40% share area), else `price_band` (±20% of mean viewed price). Query top 8 matching that signal, exclude already-viewed.
- Popup repaint: kill the broken rectangular box that overlaps the hero. Use the existing minimized champagne chip (memory: `Recommended Popup` rule) — sits bottom-right, never covers hero, expands on click. Fix faded titles → `text-[#1A1A1A]` semibold.
- Remove "Add Application" CTA from the popup (we already have Download Brochure + Register Interest).

## G. Presentation Tool

**12. Generate Branded Presentation is broken — two-part fix**
- (a) **Delete the broken "Untitled Presentation" tool entirely**:
  - `/presentations` route already redirects to `/document-studio`. Remove the route, the redirect, and every link/entry that points there:
    - `src/routes/PublicRoutes.tsx` (route 417)
    - `src/pages/AIHub.tsx` (entry id `presentation-tool`)
    - `src/pages/DocumentStudio.tsx` (path entry)
    - `src/pages/Sitemap.tsx`
    - `src/pages/toolkit/CorporateSuite.tsx`
    - `src/pages/owner/AIToolsControlPanel.tsx`
    - `src/components/Footer.tsx`
    - `src/components/design-studio/CrossToolIntegration.tsx`
    - `src/components/navigation/GlobalVerticalNav.tsx` (two entries)
    - `src/components/ui/command-palette.tsx`
- (b) **Rebuild "Generate Branded Presentation" as a one-click silent export** (Reelly-style):
  - Single button on project page → calls `generate-branded-presentation` edge function → returns a finished branded PDF/PPTX styled with **locked** JBJ palette (champagne + gold + ink). No editor, no theme picker, no "Untitled" landing screen.
  - Pulls cover, gallery (post-dedupe), key facts, payment plan, developer profile, location.
  - Returns blob → triggers download. Logs to `admin_edit_log`.

---

## Validation discipline (applies to every item)

For each numbered item, before I tell you it's done I will:
1. `code--view` the new file(s) and confirm the change.
2. `browser--view_preview` the exact route and `browser--screenshot` the section.
3. Paste the screenshot URL + a one-line "checked: X visible, Y count, Z color = #hex".

If a fix doesn't visually match the spec, I roll it back in the same turn instead of shipping it.

---

## Order of execution (proposed)

Phase 1 (project page, highest user pain): #1, #2, #4, #5, #11, #12a (delete broken tool)
Phase 2 (map + brochure depth): #3, #12b (rebuild generator)
Phase 3 (mortgage + developer page): #6, #10
Phase 4 (market intelligence): #7, #8, #9

Approve all or pick which phases.

---

## Technical notes

- Dedupe key for gallery: `url.replace(/\/x\/\d+x\d*\//,'/').replace(/\?.*$/,'').toLowerCase()`.
- Resolution score: parse `1650x` / `2400x` from URL, fallback to natural width on first paint via cached `Image()`.
- Nearby projects radius: PostGIS `ST_DWithin(geog, geog, 5000)` if available, else lat/lng bounding box with Haversine fallback in JS.
- Daily ingest: `cron.schedule('dld-daily','0 2 * * *', net.http_post(...))` UTC = 06:00 GST.
- Recommendation signal stored in `browsing_history` (already exists per memory).
- Branded presentation edge function uses `@react-pdf/renderer` deno-compatible build or `pptxgenjs`, palette locked in `_shared/jbjPaletteLock.ts`.
