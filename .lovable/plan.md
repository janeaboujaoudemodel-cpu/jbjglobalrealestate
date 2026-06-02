
# Plan — Finish Rental Index, Measurement, and Comparison together

Three workstreams executed back-to-back in one build turn, then E2E-tested in the browser (navigate as a user through each tool, run real inputs, screenshot, validate output correctness).

---

## 1. Rental Index polish

**File:** `src/pages/RentalIndex.tsx` (+ any sub-components it uses for the estimate form)

- Wire `useGuidedRequiredFields` so submitting with empty Community / Bedrooms / Size pulses the offending field, scrolls it into view, and toasts "Please fill {label}".
- Replace the current "Get Rental Estimate" submit button with `<AnimatedShineCTA tone="emerald">Get Rental Estimate</AnimatedShineCTA>` (full-width on mobile, auto on desktop). Loading state uses the built-in `loading` prop.
- Keep DLD data source, year toggles, and result cards unchanged.

## 2. Property Measurement white-text overhaul

**File:** `src/pages/PropertyMeasurement*.tsx` / measurement components (locate via `rg "Property Measurement"`).

- Repaint the 5 metric cards to emerald surface (`bg-emerald-600` / gradient `from-emerald-700 to-emerald-500`) with `data-allow-dark-cta data-no-contrast-guard` + `allow-white` so the white-on-light guard doesn't flip them.
- All numeric values, labels, captions inside those cards → `text-white` (currently mixed black/ink).
- Unit toggle pills (sqft/sqm/m/ft) → emerald fill when active, white text; inactive = champagne + ink (unchanged primitive `.jj-pill-active`).
- Preserve pause/continue measurement controls and AR overlay logic — visual only.

## 3. Full Property Comparison rebuild

**Route:** `/compare` and `/compare-manual` (already in `AIComparisonWidget` CTAs).

**Files:**
- `src/pages/Compare.tsx` — rebuilt shell with 4 view tabs
- `src/components/compare/CompareTableView.tsx` — dense data table
- `src/components/compare/CompareExcelView.tsx` — spreadsheet-style with sticky header/first col
- `src/components/compare/CompareCardsView.tsx` — current card grid, cleaned up
- `src/components/compare/CompareSideBySideView.tsx` — 2-up detail view
- `src/components/compare/AddProjectDialog.tsx` — three tabs: Pick from listings (search projects table) / Paste link or upload brochure (PDF/image) / Manual entry
- `src/components/compare/DownloadPackDialog.tsx` — choose Excel (.xlsx) or Premium PDF, picks which fields to include
- `supabase/functions/compare-extract/index.ts` — edge function: accepts `{ url? , fileBase64? , text? }`, calls Lovable AI (`google/gemini-3-flash-preview`) with a JSON-schema tool call returning the canonical comparison fields (price, sqft, bedrooms, handover, developer, yield est., service charge, payment plan, location, amenities[]). Uses corsHeaders, validates with zod, `verify_jwt = false`.

**Features:**
- No 2–5 cap; unlimited add.
- Mode switcher (Table / Excel / Cards / Side-by-side) as segmented control using `.jj-pill-active`.
- Add Project button → AddProjectDialog. Manual link/file path posts to `compare-extract` and pre-fills a draft row; user reviews then confirms.
- Persist current comparison set to `localStorage` (`jj_compare_set_v2`) so refresh keeps state.
- Download Pack → builds .xlsx via the xlsx skill pattern (formulas for derived ROI = annualRent/price) or PDF via existing `exportPreviewPdf`.
- Champagne-gold theme throughout, emerald accents for derived metrics, navy CTAs (`.jj-cta-dark`) for primary actions, AI-purple chip for "AI fill" badges (`mem://brand/ai-premium-purple-standard`).

---

## E2E verification (browser tool, after build)

For each of the three tools:

1. `navigate_to_sandbox` → the tool route.
2. **Rental Index:** submit empty → confirm pulse + toast. Fill Dubai Marina / 2BR / 1,200 sqft → click emerald CTA → confirm result card shows a numeric AED range. Screenshot.
3. **Measurement:** open tool, start a measurement, confirm all 5 cards render white-on-emerald, toggle sqft↔sqm, pause/continue still works. Screenshot.
4. **Compare:** add 3 real projects (one via picker, one via pasted brochure URL → AI fill, one manual). Switch through all 4 views. Open Download Pack → export .xlsx → open file from `/mnt/documents` and confirm no `#REF!` via `recalculate_formulas.py`. Screenshot each view.
5. Spot-check console + network for errors during all flows.

Report: per-tool pass/fail with screenshots inline. Fix any regressions before closing the turn.

---

## Technical notes

- Respect locked CTA primitives — never raw `bg-black` (memory: black-CTA→navy guard).
- Emerald is allowed for semantic "measurement/rental" data (memory: data-visualization-standard).
- Edge function uses Lovable AI Gateway (no user API key needed).
- All new tables/queries are read-only against `projects`; no schema migration required.
- No removal of existing Compare features (memory: ui-restructuring-no-removal-policy).
