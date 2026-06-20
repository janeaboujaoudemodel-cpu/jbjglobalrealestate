# Brand Repaint Finalization + Compare Units Fix + Loader Centering

## 1. Finish global brand repaint (champagne / gold / ink only)

Sweep every remaining surface still rendering neon, gradient, blue, purple-on-page, teal, or transitional colors and force them onto the locked palette (`#FDFBF7` page, `#F7F2EA` surface, `#EFE6D6` raised, `#B89555` 1px hairline gold, `#1A1A1A` ink, AI purple ONLY inside small `IconTile`s).

Scope (audited list — anything found off-brand gets repainted, never deleted):
- Owner dashboard inner pages (Communication Hub, Marketing Hub, AI Tools Control Panel, Meeting Summarizer, Note Center, Founders Activity, Audit, Inbox, CRM sub-tabs).
- Broker portal, Developer portal, Investor hub inner panels.
- Toolkit: Photo, Video, Voice, PDF, Brochure, Stamp, Scan&Sign, Virtual Staging, Background AI, Beauty Filters, Image Resize, Captions, Property Suite, Corporate Suite, Creative Suite, AI Video Studio shell + preview canvases.
- Document Studio editor chrome, AI Presentation Engine, Brand Palette Hub, Market Intelligence subpages, Guides/FAQ shells (keep neon ONLY where `data-neon-page` rule already allows).
- All exported artifacts: PDF reports (CRM, DLD, Brochure, Market Report, Company Profile), Excel exports' branded header, email templates, presentation decks — strip blue/purple gradients from cover pages, headers, footers, and section dividers; replace with champagne band + gold hairline + ink.
- Any remaining `bg-gradient-to-*` / `from-*-500` / hardcoded neon hex caught by the PASS 8 guard gets fixed at source (so the guard is belt-and-suspenders, not the sole defense).

For each file: replace off-brand classes/hexes with brand tokens, keep all features/content intact (No-Removal policy), verify dark CTAs stay clean black with `data-cta="dark"` / `data-allow-dark-cta`, verify text contrast passes the white-on-light + same-tone guards.

## 2. Remove `/quiz` entirely — one canonical URL per tool

- Delete the `/quiz` and `/quiz-results` routes from `src/routes/PublicRoutes.tsx` (no redirect — fully removed per user request).
- Move the page component to `src/pages/AIHomeFinder.tsx` (rename from `Quiz.tsx`) and results to `AIHomeFinderResults.tsx`. Update all imports.
- Grep every reference to `/quiz`, `Quiz`, "AI Property Finder", "Property Quiz" across:
  - `src/routes/*`, `src/config/*` (royalToolsRegistry, globalSearchIndex, publicToolAccess, mainLayoutRoutes, allToolsSuiteConfig, shortcutsConfig, accountShortcuts),
  - `src/components/header/*`, `MegaMenu*`, `GlobalVerticalNav`, `Footer`, `Sitemap.tsx`,
  - `public/sitemap.xml`, `public/robots.txt`, `scripts/generate-sitemap.ts`, `src/seo/*`,
  - `src/translations/*` (15 locales),
  - email templates, presentation links, CRM tool cards.
- Canonical name everywhere: **AI Home Finder** at `/ai-home-finder`.
- Update memory file `mem://constraints/tool-name-canonicality` to reflect "no redirect — `/quiz` removed".

## 3. Fix Compare Units (`/compare?mode=units`)

Currently broken: clicking the Units tab renders empty / search inert / manual add inert.

Investigation + fix plan:
- Read `src/pages/Compare.tsx`, `src/components/compare/CompareModeToggle.tsx`, `src/components/compare/units/UnitCompareShell.tsx`, `ProjectPicker.tsx`, `AddUnitDialog.tsx`, `PaymentPlanEditor.tsx`, `UnitComparisonTable.tsx`, `CompareAccessGate.tsx`.
- Confirm role gate (broker + owner only) is firing correctly and not silently blanking the page for the current user. Show a clear "Brokers/Owners only" gate card instead of empty render.
- Repair `ProjectPicker` search: ensure the Supabase query (likely `projects` table with `is_published=true`) actually fires, returns results, debounces input, and surfaces no-results state.
- Repair `AddUnitDialog` manual flow: validate required fields (project, unit type, bedrooms, size, price), wire submit handler to push into local state + `UnitComparisonTable`. Make sure dialog actually closes and the row appears.
- Verify the smart Payment Plan engine (down/milestone/monthly-till-handover/on-handover/post-handover) generates the schedule when a unit is added.

## 4. Fix Compare Projects "Add manually" + "Add by link"

`AddProjectDialog.tsx` already has the three tabs (Link / Upload / Manual). Reported broken end-to-end.

Plan:
- Manual: confirm `onAdd` is wired into `Compare.tsx`'s state setter, the new project row renders in `UnitComparisonTable`/projects table, and the dialog dismisses.
- Link: verify `compare-extract` edge function exists, is deployed, has correct CORS, and uses Lovable AI gateway. Fix any 404/400; surface real error text in the toast.
- File upload: same edge function path; confirm base64 + mimeType branch works for PDF + image; add a 30s timeout + retry hint.

Improvements (small, scoped — no scope creep):
- Add a 4th tab "From JBJ catalog" — quick picker of already-published JBJ projects so brokers can compare existing listings without re-entering data.
- Show pre-fill preview before commit (so AI extraction errors are correctable).
- Persist comparison set to `sessionStorage` so a page refresh doesn't wipe the table.

## 5. Loader centering — center inside the content area, not the full viewport

Today the page-load logo overlay covers the full screen and centers against the viewport, so on Owner shell pages it appears off-center (shifted left of the visible content area because the 64-px / 256-px sidebar is on the left).

Plan:
- Find the loader component (`PageLoader` / `LoadingScreen` / equivalent — likely under `src/components/loader/` or used by `OwnerDashboardShell`/`MainLayout`).
- Change positioning from `fixed inset-0` to `absolute inset-0` and mount it INSIDE the `<main>` content area (after the sidebar/header), so its centering math respects the L-shaped frame (88px header + sidebar offset).
- Keep z-index above page content but below header/sidebar so the brand chrome stays visible during load.
- Two variants:
  - Owner shell: loader fills the area to the right of the sidebar and below the 88px header.
  - Public site: loader fills the area below the 88px global header.

## Technical notes

- All edits respect: No-Removal policy, No-Gray-Surfaces, No-Gold-Fills, CTA primitive system, locked signature/divider primitives, gold-hairline-scope-rule, contrast guards (PASS 5/6/7/8).
- After repaint, run `scripts/contrast/check-white-on-light.mjs`, `check-same-tone.mjs`, `check-faded-gold.mjs`, `scripts/theme/champagne-sweep.mjs` to catch regressions.
- Update `mem://constraints/tool-name-canonicality` (remove `/quiz` redirect clause) and add `mem://features/compare/units-and-manual-add-fix` documenting the repaired flows.
- Verify visually with browser--view_preview on: `/compare`, `/compare?mode=units`, `/ai-home-finder`, `/mortgage-calculator`, `/property-evaluator`, `/owner` shell loading state, and two toolkit pages.

## Out of scope

- Backend schema changes.
- New tool creation.
- Pricing / payment-plan logic changes beyond wiring fixes.
