
## Scope

Five tool pages, two concerns: (1) rebuild the **Property Comparison** tool into a premium multi-view comparison table, (2) restyle the four other AI tool pages (Mortgage, Evaluator, Rental Index, Measurement) to a consistent locked premium frame with the correct hero color per tool, animated CTA, and step-guided required fields.

---

## 1. Property Comparison — full rebuild (`/compare` + `/compare/manual`)

Replace today's freeform AI page with the **same comparison structure used in the homepage sample**: a structured table with row groups, ✓/✗ ticks, project columns, add/remove project anytime.

### Two entry modes (tabs at top)
- **Pick from portal** — search/select published JBJ projects (existing shortlist + search). Click "Add" → column appears in table.
- **Upload manually** — modal with two sub-modes:
  - Paste **one link** per project (brochure / Drive / portal listing) → AI extracts fields.
  - Upload **files** (PDFs, images, docs) → backend uploads to storage, returns a shareable link (shown as a "Materials" row cell click-to-open); AI parses files to fill the comparison row.

### Comparison table (premium, not Excel)
- Sticky first column = attribute name; one column per project; gold hairline grid; champagne row banding; ink text.
- Row groups (collapsible): **Overview** (cover photo cell, developer, location, handover), **Pricing** (from, AED/sqft, payment plan), **Specs** (BR/BA, size, view, furnished), **Amenities** (✓/✗ across rows: pool, gym, beach, concierge, smart home, …), **Investment** (ROI, rental yield, tier), **Materials** (link chips opening uploaded docs/AI-generated Drive link).
- "+ Add project" button always visible at the end column. Each column has an "✕ Remove" in its header. Re-submit re-runs AI fill for new columns only (no re-fetch for existing).
- ✓ = `text-emerald-600`, ✗ = `text-red-500/70`, "—" for unknown — never blank.

### Views (toggle in toolbar)
1. **Table** (default, the premium grid above)
2. **Excel sheet** (denser, monospace-ish, alternating ink/champagne, single header band)
3. **Visual cards** (one card per project side-by-side, cover photo + KPI chips + amenities ✓ list)
4. **Side-by-side spec sheet** (2-up paginated, brochure feel; navigate with ← →)

### Download flow
Single "Download" button → dialog: "Download all views as a pack (ZIP)" OR "Pick a single view" (radio: Table / Excel / Visual / Side-by-side) → exports PDF (and CSV for Excel view). One filename: `JBJ-Comparison-{date}.{ext}`.

### Styling lock
- Page tone = champagne band system. Hero = navy `#102540` band with `<Back` inside header, white text, 100% animated-shine CTA (gradient + sweeping highlight). Card frame = full content wrapped in `rounded-2xl` with the same navy `#102540` 1px animated border (slow rotating conic gradient).
- All CTAs use `.jj-cta-dark` (navy + white + white arrow).

---

## 2. Mortgage Calculator (`/mortgage-calculator`)

- Replace the cream hero band with a **navy `#102540` hero band** (full-bleed) — same blue as Get Verified.
- `<Back to Home>` link → **white**, moved inside the navy header, top-left.
- Title `Mortgage Calculator` and subtitle **centered**, white text, no left-aligned column.
- Eyebrow chip "AI-Powered Financial Planning" → white outline pill on navy.
- Wrap the full calculator + CTA in a `rounded-2xl` shell with **animated navy border** (same as Evaluator/Rental).
- Reduce top padding above the header (currently big gap).

---

## 3. Property Evaluator (`/property-evaluator`)

- Remove gap above the page; `<Back>` moves **inside** the navy hero header (white text + white arrow).
- Wrap **the entire tool** (hero → tabs → forms → results) in a single `rounded-2xl` card with **navy `#102540` animated border** top to bottom — one continuous shell, no breaks.
- Reduce hero top padding.
- Primary CTAs use animated-shine navy fill.

---

## 4. Dubai Rental Index Evaluator (`/rental-index`)

- Same treatment as Evaluator but with **emerald** as the wrapping animated border (keep emerald hero, this tool is green-themed).
- Reduce top padding; `<Back>` moves **inside** the emerald hero, **white** text + white arrow.
- "Get Rental Estimate" CTA → full-color emerald fill with animated shine sweep.
- **Step-guided required fields**: clicking CTA when fields empty → no inline red error labels; instead toast/focus pulse on the first empty required field ("Please select Community / Area"), then on next click pulse the next empty field, etc. Only submits when all required filled. Field validation chip area is hidden.
- Animated border around the full card matches the hero color (emerald).

---

## 5. Property Measurement (`/property-measurement`)

- Reduce top padding above hero.
- **Hero text in white**: "Property" word currently ink-on-dark (invisible) → white; "Measurement" stays emerald gradient. Subtitle "Verify your property…" → white. "100% Free." → keep emerald accent.
- **Step indicator (1–5)**: numbers + connectors → all **white** at rest; the active step keeps the existing emerald fill + emerald number — do not touch.
- **Property Type cards** (Apartment / Villa-Townhouse / Office / Land / Retail): currently navy-blue → repaint all 5 to the **emerald ombre** gradient (same animated emerald used elsewhere in this tool). Labels white, icons white.
- **Unit Preference pills** (Square Feet / Square Meters / Both): blue → emerald (active = filled emerald, inactive = emerald outline on dark).
- **Property Name input**: white label + white placeholder text on dark.
- **All black text/numbers** inside the tool body → replace with white. Anything already emerald stays emerald.
- **Do not touch** the pause/continue media-recording buttons (functional, kept as-is).
- Wrap the tool in the **emerald animated border** shell.

---

## Shared primitives (new / extended)

- `src/components/tools/AnimatedBorderShell.tsx` — `rounded-2xl` wrapper with a slow conic-gradient border in a chosen tone (`navy` / `emerald` / `gold`). One component, reused by Mortgage / Evaluator / Rental / Measurement / Compare.
- `src/components/tools/AnimatedShineCTA.tsx` — full-color CTA (navy or emerald) with sweeping shine highlight + arrow. Wraps existing onClick.
- `src/hooks/useGuidedRequiredFields.ts` — given an ordered list of refs + values, on submit attempt: focus + pulse the first empty field, return `false`; only return `true` when all filled.
- `src/components/compare/ComparisonTable.tsx`, `ComparisonExcel.tsx`, `ComparisonCards.tsx`, `ComparisonSideBySide.tsx`, `AddProjectDialog.tsx`, `DownloadDialog.tsx`.
- Edge function `compare-extract` (extend existing AI compare function) — accepts `{ link }` or `{ fileIds }`, returns normalized row payload. File uploads go through existing Supabase Storage `tool-uploads` bucket; the function returns a public/shareable link and writes a `compare_materials` row.

---

## Out of scope / not touching

- Pause/continue media buttons in Measurement.
- Existing emerald hero gradient and emerald active-step circle in Measurement.
- Routes, auth gates, CRM lead capture, edge-function business logic outside the additive `compare-extract` extension.
- Other tools not listed.

---

## Files touched

```text
src/pages/Compare.tsx                    rewrite (keep CRM banner + auth)
src/pages/CompareManual.tsx              fold into Compare as a tab; route redirect
src/pages/MortgageCalculator.tsx         hero re-skin + animated border shell
src/pages/PropertyEvaluator.tsx          hero re-skin + back inside + shell
src/pages/RentalIndex.tsx                hero re-skin + back inside + guided fields + shell
src/pages/PropertyMeasurement.tsx        white text + emerald cards + shell

src/components/tools/AnimatedBorderShell.tsx   new
src/components/tools/AnimatedShineCTA.tsx      new
src/hooks/useGuidedRequiredFields.ts           new

src/components/compare/ComparisonTable.tsx     new
src/components/compare/ComparisonExcel.tsx     new
src/components/compare/ComparisonCards.tsx     new
src/components/compare/ComparisonSideBySide.tsx new
src/components/compare/AddProjectDialog.tsx    new
src/components/compare/DownloadDialog.tsx      new

supabase/functions/compare-extract/index.ts    new (link + files → row payload)
```

After implementing I'll browser-verify each of the 5 pages at 1280×900 and post screenshots before closing.
