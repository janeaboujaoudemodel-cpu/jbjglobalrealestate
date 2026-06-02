
## Scope

Large multi-area pass. Grouped into 5 workstreams. Will ship as one batch, validate visually in preview, then E2E-test the four tools.

---

### 1. Property Measurement — rebuild + readability + green/black/white ombré

**Page:** `/property-measurement` (`src/pages/toolkit/...` — locate exact file).

- **Contrast fix:** every section currently renders dark-on-dark (hero subtitle, step indicator labels, "Step 1: Property Information", "Property Type", "Property Name", "Unit Preference"). Force ombré-white (`rgba(255,255,255,0.92)` headings, `rgba(255,255,255,0.72)` body) on the dark hero/form surface. No pure `#FFF`.
- **Property-type cards** (Apartment / Villa / Office / Land / Retail): kill the navy `#1e3a8a` fill. Replace with the same `emerald → black` ombré used by the active "Both" pill and the "Continue" button (`linear-gradient(135deg,#10B981 0%, #064E3B 55%, #000 100%)`), 1px emerald hairline, ombré-white label + icon. Selected state = brighter emerald ring + inner glow.
- **Unit Preference** pills (Sq Feet / Sq Meters / Both): same ombré-white text rule; active stays emerald.
- **Rebuild flow E2E:**
  1. Step 1 property info
  2. Step 2 upload photos **or video** (drag-drop, multi-file, preview thumbs)
  3. Step 3 AI analysis (calls edge function)
  4. Step 4 per-room measurements table (sq ft + sq m toggle, both option)
  5. Step 5 downloadable PDF report with photo thumbnails + measurements + totals
- **Edge function:** `property-measurement-analyze` — accepts image/video URLs, returns `{ rooms: [{name, sqft, sqm, confidence, imageUrl}], totalSqft, totalSqm }`. Redeploy.
- **Unit selector** (sq ft / sq m / both) drives report rendering.
- **PDF export:** branded JBJ letterhead via existing `exportUnitComparisonPdf` pattern → new `exportMeasurementReport.ts`.

### 2. Horizontal header — gold icons

`src/components/navigation/HorizontalUtilityBar.tsx`:
- Search icon, Filter icon, Heart icon → `#B89555` stroke.
- AED chevron + Mode chevron → `#B89555`.
- Hover stays current (ink/navy).

### 3. Mortgage Calculator — neon premium restyle

Locate `MortgageCalculator` page. Add:
- Animated gradient border (cyan `#22D3EE` → magenta `#EC4899` → violet `#A78BFA` conic, slow rotate).
- Soft floating bubble particles (CSS keyframes, 6–8 blurred circles).
- Glow drop-shadow on the main card.
- Inputs: dark glass surface, ombré-white labels, neon focus ring.
- Result tiles: neon gradient text for the monthly payment.
- Fix all contrast (currently same dark-on-dark issue likely).

### 4. News & Insights + Market Intelligence — neon news-magazine style

- **News & Insights** (`/news` or similar): magazine grid, neon accent rules between cards, large editorial typography, animated underline on hover, featured story hero with glow.
- **Market Intelligence** (`/market-intelligence`): neon dashboard — animated chart gridlines, glowing KPI tiles, ombré-white body copy, dark glass cards with cyan/magenta accent.
- Both: fix all low-contrast text to ombré-white, validate visually.

### 5. E2E test pass (browser tools)

Log in as broker and as investor where applicable, then walk through:
- **Property Measurement** — upload sample photo, run AI, download report.
- **Rental Index** — search a community, verify chart loads, numbers render.
- **Property Evaluator** — submit a property, verify AI valuation output.
- **Property Comparison** (`/compare` units mode) — add 2 units, fill plan, export PDF.
- **List Your Property** — full submission flow to draft.

For each: capture screenshot, log every broken step, fix root cause, re-test.

---

### Technical notes

- New file: `src/lib/measurement/exportMeasurementReport.ts` (jsPDF + autotable, JBJ branding).
- New edge function or update existing: `supabase/functions/property-measurement-analyze/index.ts` using `google/gemini-2.5-pro` (vision) via Lovable AI Gateway. No API key needed.
- New CSS utility class `.jbj-ombre-emerald` in `index.css` for the green/black/white ombré card fill (re-usable).
- New CSS utility `.jbj-neon-frame` for animated neon border + bubbles.
- Header icon color via Tailwind `text-[#B89555]` override on the existing lucide icons.

### Files to touch (approx.)

- `src/pages/toolkit/PropertyMeasurement*.tsx` (rebuild)
- `src/pages/toolkit/MortgageCalculator*.tsx` (restyle)
- `src/pages/NewsInsights*.tsx`, `src/pages/MarketIntelligence*.tsx`
- `src/components/navigation/HorizontalUtilityBar.tsx`
- `src/index.css` (two new utility classes)
- `supabase/functions/property-measurement-analyze/index.ts`
- `src/lib/measurement/exportMeasurementReport.ts` (new)

### Out of scope (will NOT touch)

- Compare tool wiring (already shipped last turn).
- Vertical sidebar (already gold per memory).
- Mode/role logic.

### Validation

- Browser tool visual check on each page after styling.
- E2E walkthrough on the 4 named tools with screenshots + bug list per tool.
- No claim of "done" until all five flows return a usable artifact (report / PDF / valuation / comparison).
