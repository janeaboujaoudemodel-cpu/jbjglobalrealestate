

# Session 10 — E-Signature Foundation + Direct Stamp Handoff

## Current State Analysis

### Stamp Handoff (TASK 1)
- `StampExportPage.tsx` line 1181-1191: "Use in E-Signature" button exists. It saves `tintedSvg` to `sessionStorage('esignature_stamp_svg')` and navigates to `/e-signature/create`.
- **Problem**: `CreateEnvelope.tsx` never reads from `sessionStorage('esignature_stamp_svg')`. The stamp is lost on arrival. The handoff is broken.

### Asset Picker in E-Signature (TASK 2)
- `DocumentFieldPlacer.tsx` lines 60-103: Loads stamps from `stamp_designs` (favorite) and signatures from `ai_tool_projects`. These are hardcoded queries, not using `BrandAssetPicker` or `brand_assets` table.
- No UI for the user to browse/select from their brand asset library inside the e-signature flow.

### Preview Before Send (TASK 3)
- Step 4 (Review & Send) in `CreateEnvelope.tsx` lines 754-808: Shows only a text summary (document name, recipient count, field count). No visual preview of the document with placed fields/stamps/signatures.

## Implementation Plan

### 1. Fix Stamp Handoff from Export Page to E-Signature

**`CreateEnvelope.tsx`**:
- In the `useEffect` that reads `location.state`, also check `sessionStorage('esignature_stamp_svg')`.
- When found, store it in component state (`handoffStampSvg`).
- Pass `handoffStampSvg` to `DocumentFieldPlacer` as a new prop.
- Auto-place a stamp field on the document when a handoff stamp is detected (after PDF is loaded).

**`StampExportPage.tsx`**:
- Keep existing sessionStorage approach but also save to `brand_assets` as a data URI so the stamp persists beyond the session.
- Also pass via `navigate('/e-signature/create', { state: { stampSvg: tintedSvg } })` for immediate handoff.

### 2. Brand Asset Picker in E-Signature

**`DocumentFieldPlacer.tsx`**:
- Add a "Brand Assets" button to the toolbar that opens `BrandAssetPicker`.
- When a stamp asset is selected, set `savedStampSvg` to its `svg_content`.
- When a signature asset is selected, set `savedSignatureUrl` to its data URI.
- Keep the existing DB queries as fallback auto-loading, but give users explicit control.
- Support asset types: `stamp`, `signature`, `logo`.

### 3. Preview Before Send (Step 4 Enhancement)

**`CreateEnvelope.tsx` Step 4**:
- Add a visual document preview section showing the PDF with overlaid fields (reuse the same `PdfPageCanvas` + field overlay rendering from Step 3, but in read-only mode).
- Show a miniature version of each page with placed fields rendered.
- Alternatively, render a single-page preview of the first page with fields, plus a page count indicator.

**Implementation approach**: Create a `DocumentPreviewSummary` component that:
- Takes `pdfUrl`, `fields`, `recipients`, `savedStampSvg`, `savedSignatureUrl` as props.
- Renders a read-only scaled-down preview of page 1 with field overlays.
- Shows page thumbnails strip for multi-page documents.

## Files Modified

| File | Changes |
|------|---------|
| `CreateEnvelope.tsx` | Read handoff stamp from sessionStorage/location.state, pass to DocumentFieldPlacer, add visual preview to Step 4 |
| `DocumentFieldPlacer.tsx` | Add Brand Assets toolbar button with BrandAssetPicker integration, accept handoff stamp prop |
| `StampExportPage.tsx` | Pass stamp via navigation state in addition to sessionStorage |
| `DocumentPreviewSummary.tsx` (new) | Read-only preview component for Step 4 showing document + placed fields |

## What Will NOT Change
- SignDocument.tsx (external signer view)
- ESignatureDashboard.tsx
- SignatureStudio.tsx
- Database schema
- Edge functions
- StampGeneratorPage, StampLeftPanel, StampRightPanel

