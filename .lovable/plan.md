# Homepage + Property Comparison + Mortgage + Footer overhaul

This is a large, multi-area change. I've mapped every request to a real file and grouped the work. **Two items need a quick clarification before I start (see "Open questions" at the bottom).**

---

## 1. Delete the RERA / 8-card trust section
**File:** `src/components/home/TrustBar.tsx` + 2 references in `src/pages/Index.tsx` (lines ~348-353).

That 8-card grid ("RERA Licensed", "Instant Response", "Verified Listings", "Award Winning", "Trusted by Thousands", "Excellence Guaranteed", "24/7 Support", "Certified Experts") is the **TrustBar**. Remove the `<TrustBar />` mount + its surrounding `Suspense` + the `<SectionDivider />` before and after it. Keep the file on disk (no-removal policy for source) but unmount it from the homepage.

## 2. Shrink the "Invest in Dubai from anywhere" banner
**File:** `src/components/home/OverseasInvestorsBanner.tsx` (currently a tall 4-stat + 6-highlight banner).

Replace the homepage instance with a slim single-line strip:
- 1 row, full-width, ~56px tall, champagne surface, 1px gold hairline
- Left: tiny globe icon + ink text "Invest in Dubai from anywhere in the world"
- Right: 4 micro-stats inline (`0% Tax · 10Y Golden Visa · #1 Safety · 200+ Nationalities`)
- Right-most: `→` link to `/overseas-investors`

The full banner stays available on its own page; only the homepage variant shrinks.

## 3. "Explore our services" → expandable header card
**Files:** `src/components/home/ExploreServicesCard.tsx`, `src/pages/Index.tsx`.

Convert into a **single header bar** (one card) that auto-runs a quiet carousel of service titles inside the header. Clicking the header expands a panel below with the existing service tiles and continues the auto-rotation/animation inside. Collapsed by default; click to open; click again to close; ESC closes; smooth height + fade animation.

## 4. AI Property Comparison — full rebuild
**Files:** `src/components/AIComparisonWidget.tsx`, new `src/pages/AIComparison.tsx` (or upgrade existing comparison page), edge function `supabase/functions/compare-projects/index.ts`.

### Homepage widget (entry)
On mount, fetch the user's recent searches/viewed properties and show:
- **Recommended to compare**: 3-6 chips of recent/related properties → click to add to comparison tray.
- Secondary CTA: **"Start exploring"** → routes to `/properties?compareMode=1` so any card on the listings page shows an "Add to compare" pill. Adding any property pushes it into the comparison tray (persisted in localStorage + URL).
- Tertiary CTA: **"Enter manually"** → opens the manual-entry form (see below).

### Full comparison page
- **No cap** on number of properties (replace the current "2-5" copy).
- **Manual entry**: form with project name, developer, location, price, size, ROI, handover, etc. + file/document drop zone (PDF, images, brochures). Files upload to a Lovable Cloud storage bucket (`comparison-assets`) and are linked to that comparison row.
- **AI generation**: button "Generate AI comparison" calls the redeployed `compare-projects` edge function with all properties + uploaded docs context; returns a structured comparison.
- **Two output styles** (toggle at top):
  1. **Premium Table** — branded champagne table with visuals, badges, ROI bars, and a "Drive link" column. Each row's link opens a dedicated **Documents page** for that property listing every uploaded file in a Google-Drive-style grid (preview + download).
  2. **Excel sheet** — one-click `.xlsx` download generated client-side from the same structured data (using `xlsx` lib) with the same columns.

### Edge function `compare-projects`
- Redeploy with input schema `{ projects: [...], documents: [...] }`.
- Use Lovable AI Gateway (`google/gemini-3-flash-preview`) with `Output.object` so the response is a typed comparison object the table + Excel both consume.
- CORS, JWT validation in-code, 400 on schema failure.

## 5. Mortgage Calculator — fix + premium compact restyle
**Files:** `src/components/MortgageCalculator.tsx`, all 6 call-sites (`Index.tsx`, `MortgageCalculator.tsx` page, `RealEstateSuite.tsx`, `PropertySuite.tsx`, `ProjectDetailLayout.tsx`).

- **Reactivity fix**: the "estimated monthly payment" stays stale because the value is computed from a snapshot rather than a derived value of the form state. Refactor to `useMemo(...)` keyed on principal/rate/term/down-payment so the number recalculates on every input/slider change in every call-site.
- **Slider track color**: currently fills black. Restyle the `[role=slider]` track-fill to a champagne→gold gradient (`#ECE2D2 → #B89555`). Applies to every slider in the calculator.
- **Premium compact layout**: tighten the `compact` variant — reduce padding, two-column input grid, smaller result tile, single accent hairline. Used on homepage and project detail.

## 6. Top Areas in Dubai — 3 per row, fixed contrast, working hover, two CTAs
**File:** `src/components/home/AreasWeCover.tsx` (+ any duplicate `AreaCard` usage on `/areas`, `/market-intelligence`).

- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` showing the top 3 (currently 4 across).
- Contrast: ensure overlay caption uses white on dark gradient bottom; badge chips switch to cream `#EFE6D6` + ink text + 1px gold border (per No-Gold-Fills rule).
- Fix the card hover/reload bug: today the hover zoom + image swap breaks on rapid hover; rewrite with `transform-gpu`, `will-change`, and stable `key={slug}` so React stops re-mounting on data refetch. Apply same fix anywhere `AreaCard` is reused.
- Two CTAs below the grid: `Read Area Guides → /area-guides` and `Explore All Areas → /areas`. Premium ink-on-champagne buttons with thin gold hairline.

## 7. Premium dividers everywhere
**File:** `src/components/ui/section-divider.tsx`.

Replace the current `<SectionDivider />` body with a true premium divider: ~32px vertical breathing room (vs the current large gap), centered 1px gold-tinted hairline that fades to transparent at both edges, optional tiny center ornament (1.5px champagne dot). One token; every existing call-site (`fullWidth` and default) inherits the new style. No call-site changes needed.

## 8. Footer — single line + premium Sitemap page
**Files:** `src/components/Footer.tsx`, new `src/pages/Sitemap.tsx`, route in `src/routes/PublicRoutes.tsx`.

- Collapse the current 706-line footer **on the public site** to one line:
  `Privacy Policy · Cookies Policy · Sitemap · Contact Us`
  Below it, centered: `© 2026 JBJ GLOBAL REAL ESTATE. All rights reserved.`
- Keep the existing rich `Footer.tsx` file alive (no-removal policy) but switch the public mount to a new `<MinimalFooter />` component.
- New `/sitemap` page: every internal route grouped by section (Properties, Services, Areas, Tools, Company, Legal, Owner-only routes hidden when not authed), premium champagne theme, Inter typography, gold hairline section dividers, alphabetised within each group.

---

## Order of execution (one PR per group, in this order)
1. Premium divider token (touches every section, do first) → group 7
2. Homepage section edits → groups 1, 2, 3, 6
3. Mortgage fix + restyle → group 5
4. Footer + Sitemap → group 8
5. AI Comparison rebuild (largest scope) → group 4

---

## Technical notes (safe to skim)
- Storage: new Cloud bucket `comparison-assets` with per-user RLS; signed URLs for downloads.
- Excel export: client-side `xlsx` (already in deps if not, will add).
- Edge function redeploy will be triggered via the deploy tool after code lands.
- No deletions of source files — components are unmounted, not removed (No-Removal policy).
- Mortgage reactivity bug verified by reading current `MortgageCalculator.tsx`; the fix is a `useMemo` keyed on form state, not a UI change.

---

## Open questions (please confirm before I start)

1. **"8 cards under Investor Opportunities"** — I read your request as deleting the 8-card RERA/trust grid (which is the only 8-card section near the top). There's no separate "Investor Opportunities" section with 8 cards on the homepage. Confirm I should just delete the TrustBar once, OR point me to the other section if I missed it.

2. **Comparison Drive-style link** — should the per-property "documents page" be **publicly viewable** by anyone with the link (like a real Drive share), or **private to the user who created the comparison**? This changes the RLS rules on the storage bucket.