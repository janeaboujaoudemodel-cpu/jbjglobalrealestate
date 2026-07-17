## Area page (Dubai Islands) — Full repair, one task at a time

Every task is validated with a Playwright screenshot before moving to the next. No batching, no "done" claims without proof. Phase 4 (Excel bulk developer upload) is registered and starts only after all 15 items below are green.

### The single source of truth for backgrounds
The vertical sidebar emerald (`#064E3B → #042C1C → #010806`) is the ONE background used across the sticky filter bar, all filter dropdowns, and every "dark" area section. The pink-beige champagne is banned as a section background on the Area page except where explicitly kept (project cards themselves).

### Task list (executed and screenshot-verified in this order)

1. **Sticky filter bar** — currently overlays the vertical sidebar and shows broken contrast. Rebuild so it: (a) starts under the header, (b) becomes sticky at correct top offset, (c) never crosses `left: 56px` (sidebar width), (d) uses the emerald 3-stop gradient, (e) never disappears at "JBJ AI Area Intelligence" scroll position.
2. **Filter bar visual parity with Projects page** — same pill sizes, same emerald surface, same dropdown surface (match the Price dropdown color the user confirmed is correct). Apply identical pattern to Developers page, Areas page (list), Communities page.
3. **"View All Projects in Dubai Islands" CTA** — pure white text + classic sheen animation.
4. **Developers in Dubai Islands** — eager-load logos so name and logo appear together, no name-first flash.
5. **Developer logo fallback** — never render "NPF" style letter fallback. Always show the real `logo_url`; if missing, show a champagne-neutral JBJ monogram, not initials in black.
6. **Map of Dubai Islands** — force white on: "Click to enable map interaction", emerald price pins (numbers), Satellite/Street/Terrain toggle labels.
7. **DLD Live Market Data** — the big AED/transactions numbers render white on the emerald cards.
8. **JBJ AI Area Intelligence** — rebuild surface to premium emerald gradient. Fix: Investment Rating card (currently gray/broken), Price per sqft `%` label + icon → white, Supply vs Demand / Price / Investment Metric cards render immediately (no empty state), "Appreciation" text no longer clipped, everything loads fast (remove artificial delay/skeleton on already-cached data).
9. **Developer Landscape (inside AI Area Intelligence)** — swap initials tiles for real developer logos; if missing, JBJ monogram.
10. **Get In Touch card** — text is white, matches the emerald metallic animation used elsewhere.
11. **Similar Areas / Explore More in Dubai** — (a) reorder so "Explore More in Dubai" sits ABOVE the "Explore Dubai Islands Properties" CTA (that CTA is last), (b) rebuild with champagne-gold metallic vertical-center layout as the premium background, (c) remove all gold borders, (d) area name titles on all 4 cards → pure white.
12. **Page background** — replace the pink-beige champagne on all non-card Area page sections with the emerald sidebar gradient so the whole page reads premium and cohesive.
13. **Rogue emerald vertical line** — investigate the stray emerald bar visible on the right in the annotated screenshot. Likely a compressed section/card or a stuck sticky element. Remove it site-wide, verify at multiple viewports (1280, 1024, 768, 390).
14. **Hero title centering** — reconfirm center alignment holds after all above changes.
15. **Regression sweep** — Projects, Developers, Areas list, Communities: confirm shared filter/dropdown/card components did not regress.

### Validation protocol
For each task: make the change → Playwright screenshot at 1280×1800 → view screenshot → only then move on. If a screenshot shows the fix is not visible, iterate on that same task before advancing.

### Phase 4 (registered, starts after all 15 land)
Excel-based bulk developer profile upload — parse an admin-uploaded XLSX, dedupe by name/slug, keep richest fields per row, patch `developers` table, log an audit trail.

### Files expected to change
- `src/pages/AreaDetail.tsx`
- `src/components/area-detail/AreaHeroSection.tsx` (sticky bar host)
- `src/components/area-detail/AreaProjectsGrid.tsx`
- `src/components/area-detail/AreaDevelopersBar.tsx`
- `src/components/area-detail/AreaMapSection.tsx`
- `src/components/area-detail/AreaAIAnalyzer.tsx`
- `src/components/area-detail/AreaAboutSection.tsx`
- `src/components/shared/DLDMarketWidget.tsx`
- `src/components/ui/DeveloperLogo.tsx` (fallback behavior)
- Whichever component owns the "Explore More in Dubai" / Similar Areas block
- Global CSS only if a stray vertical emerald element is coming from a utility rule

Approve and I execute item #1, screenshot, then proceed sequentially.