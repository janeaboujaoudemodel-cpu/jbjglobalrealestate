# Unified AI-Tool Report System + Title Deed Auto-Fill

## Goals
1. Fix Property Evaluator so the Title Deed upload is an **entry-mode choice** ("Fill manually" vs "Auto-fill from Title Deed"), not a mandatory drop zone in the middle of the flow.
2. Reuse AI Home Finder's `ReportEngine` (preview + branded PDF + share) as a **shared component** and wire every AI tool to it.

## Scope of tools receiving the unified report
- Property Evaluator
- Rental Index
- Property Comparison (Compare Projects / Compare Units)
- Mortgage Calculator
- Interior Design AI
- Property Measurement
- AI Home Finder (already uses it — reference implementation)

## Step 1 — Extract shared engine
- Move `src/components/ai-home-finder/report/ReportEngine.tsx` into `src/components/shared/report/UnifiedReportEngine.tsx` (re-export from the old path to avoid breaking imports).
- Generalize the props: `{ toolKey, title, subtitle, sections: ReportSection[], meta, brand }` where `ReportSection = { id, label, node, includeByDefault }`. Sections are toggleable in the preview builder (same pattern already present).
- Keep JBJ branding header/footer, section selector, "Preview → Download PDF / Print / Share" actions.

## Step 2 — Per-tool report adapters
Create one small file per tool that maps its result state to `ReportSection[]`:
```
src/components/shared/report/adapters/
  propertyEvaluatorReport.tsx
  rentalIndexReport.tsx
  propertyComparisonReport.tsx
  mortgageCalculatorReport.tsx
  interiorDesignReport.tsx
  propertyMeasurementReport.tsx
```
Each adapter renders that tool's cards (valuation summary, DLD comps, DXP completion, rental yield, mortgage schedule, design boards, measurement plan, etc.) as report sections.

## Step 3 — Wire a "Report" action into each tool
Replace ad-hoc download/print buttons with a single `<UnifiedReportButton toolKey=… data=… />` that opens the shared preview modal. Users pick sections → download PDF (via existing `renderReportToPdf`) / print / `navigator.share`.

## Step 4 — Property Evaluator title-deed flow
- Add a top-of-form **Entry Mode** switch: `Manual` | `From Title Deed`.
- `From Title Deed` shows the drag/drop upload (PDF/JPG/PNG). On upload, call existing `property-evaluation` edge fn with an OCR pass (Tesseract via `pytesseract` is not available client-side — use the Lovable AI Gateway with an image-capable model to extract: community, sub-community, tower, unit, size, bedrooms, floor, view, handover). Pre-fill fields; user can review/edit; results generate as usual.
- Move the current standalone Title Deed dropzone out of the middle of the specs grid.

## Step 5 — QA
- Playwright: for each tool, open results, click Report, verify preview renders, sections toggle, PDF downloads, share sheet fires. Screenshot each.

## Not in scope (this pass)
- No visual redesign of tool result pages beyond adding the Report button.
- No backend schema changes; adapters read existing state.

## Technical notes
- Reuse `renderReportToPdf.ts` unchanged; adapters must produce React nodes it can serialize.
- Title-deed OCR: `supabase.functions.invoke('parse-title-deed', { body: { fileBase64 } })` — new edge fn that calls Lovable AI Gateway with vision model and returns structured JSON.
- Persist entry-mode + parsed fields into the existing `jbj-property-evaluator-draft-v3` localStorage key so refresh survives.
