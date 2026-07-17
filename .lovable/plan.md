## Area page (Dubai Islands) — full repair pass

All fixes target `/area/:slug` and any shared components that leak the same issue into other pages. Every change is verified with a Playwright screenshot before we move to Phase 4.

### 1. Hero — center the title
- `AreaHeroSection.tsx`: change the content column from left-aligned to centered. Location pill, H1 (`{area.name}`), breadcrumb, and stats bar all center horizontally. H1 stops using `max-w-3xl` left-anchor; wraps in `mx-auto text-center`.
- Applies to every area page, not just Dubai Islands.

### 2. Filter bars — remove duplicates, fix broken search sizing
- Current state: sticky-on-scroll emerald filter (top) + tabs bar (Developer/Floor Plans/Location/AI Analyzer) + a second inline emerald filter below hero. That's the "duplicated" filter and the "third filter" the user called out.
- Keep exactly ONE filter: the inline emerald bar directly under the hero (matches Properties page pattern).
- Remove the sticky-on-scroll duplicate filter and its scroll listener / body-class side effect.
- Keep the sticky tab bar (Developer / Floor Plans / Location / AI Analyzer) but fix its contrast (§3).
- Fix the search pill height/width so it matches the other pill controls (h-10, same rounded-full, same font-size, no oversized appearance).

### 3. Sticky tab bar — text becomes black on champagne
- `AreaDetail.tsx`: the Developer / Floor Plans / Location / AI Analyzer buttons currently render white (global contrast guard override). Force `text-[#1A1A1A]` with `!important`-equivalent scope so they stay black on the champagne band. Icons also black. Hover fills stay subtle emerald tint.

### 4. Projects grid — fix all card contrast + slow images
- `AreaProjectsGrid.tsx`: the "Projects in {area}" H2 currently renders white on champagne. Add `allow-black` and explicit `!text-[#1A1A1A]` so guard cannot invert it.
- `ProjectCard` (shared): inspect and fix so:
  - Project name (e.g. "Beach Oasis 2"): black.
  - Meta row (studio, bedrooms range, sqft): black, not white.
  - Developer name ("by Azizi Developments"): render in animated gold-champagne text using the existing `.jj-text-gold-animated` token.
  - Price from + AED number: black.
- Images: switch cover image + first `project_images[0]` to `loading="eager" fetchPriority="high" decoding="async"` for the first row of the grid (first 3 cards) so above-the-fold cards no longer flash black-then-load.

### 5. Developers bar — all text black on champagne
- `AreaDevelopersBar.tsx`: force developer name labels + section title + count badge to black (`allow-black text-[#1A1A1A]`). Any pill/chip on champagne uses `bg-white/60 border-[#064E3B]/20`.

### 6. About Dubai Islands section — contrast fix
- `AreaAboutSection.tsx`: title, subtitle, description, stat labels, stat values all black on champagne. "About Dubai Islands" heading gets `allow-black text-[#1A1A1A]` and matching black location-pin icon.

### 7. Map section — title black with icon
- `AreaMapSection.tsx`: the "Map of {area}" title and its map-pin icon become black on the champagne background. Ensure the actual map (Mapbox / Leaflet layer) renders correctly and points to the area's `latitude/longitude`.

### 8. DLD Market Intelligence widget — champagne background = black text
- `DLDMarketWidget.tsx`: currently renders "Dubai Market Intelligence" title, "Download Report", "YTD Market Growth", and every stat card ("YTD Volume", "Transactions", "Off-plan sales", "Secondary sales", "Cash deals", "Mortgage deals") with white text on champagne. Convert all card surfaces to `bg-white/60` with `text-[#1A1A1A]`. Emerald KPI cards keep white text; only cards on the champagne band flip. Applies globally — this widget is also used elsewhere (property map, market intelligence pages).

### 9. Area AI Analyzer — background match + contrast
- `AreaAIAnalyzer.tsx`: background currently silver/gray-ish, breaks brand. Convert outer surface to the emerald 3-stop gradient used by the vertical sidebar (`#064E3B → #042C1C → #010806`). Title/subtitle/cards white. "Behind Explore Dubai Island Properties" strip: black background swap out for emerald gradient continuation.

### 10. Explore More in {emirate} — kill gold cards
- `AreaDetail.tsx`: the four Similar Areas photo cards fall back to a champagne gradient when no `image_url` exists. Swap to the emerald gradient fallback (already partially there — verify none remain gold). Ensure fallback JBJ monogram is not gold.

### 11. Visual + technical validation (before saying done)
- Playwright: navigate to `/area/dubai-islands`, screenshot: hero, sticky bar, projects grid card, developers bar, map, DLD widget, AI analyzer, similar areas. View each screenshot to confirm the fix.
- Check the same components on `/properties` and `/developers` pages to confirm no regression from shared-component fixes (ProjectCard, DLDMarketWidget).
- Run typecheck/build.

### 12. Then — Phase 4 kickoff
- After screenshots confirm every item above, start Phase 4 (Excel-based bulk developer profile upload) as previously scoped.

### Files touched
- `src/pages/AreaDetail.tsx`
- `src/components/area-detail/AreaHeroSection.tsx`
- `src/components/area-detail/AreaProjectsGrid.tsx`
- `src/components/area-detail/AreaDevelopersBar.tsx`
- `src/components/area-detail/AreaAboutSection.tsx`
- `src/components/area-detail/AreaMapSection.tsx`
- `src/components/area-detail/AreaAIAnalyzer.tsx`
- `src/components/shared/DLDMarketWidget.tsx`
- `src/components/ProjectCard.tsx` (shared — verified against other pages)

Approve and I execute all of it in one pass, screenshot-verify each surface, then move directly to Phase 4.
