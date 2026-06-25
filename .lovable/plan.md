## Goal

One single source of truth for the AI Home Finder report. The Live Preview, the Downloaded PDF, the Print Preview, and the Email attachment must all render the **same React component**. Visual design (colors, gradients, typography, header, footer, logo, spacing, cards, badges) is shared; only the **content depth** changes between Preview (short) and PDF (long).

## Current state (why it's broken)

- `src/pages/QuizResults.tsx` contains an ~880-line jsPDF script (`buildPdf`) that hand-draws the PDF using `doc.text`, `doc.rect`, custom palette arrays, custom gold ombré wordmark, etc. — totally independent layout.
- `src/components/ai-home-finder/ReportPreviewModal.tsx` is a React component with its own JSX, palette `C`, emerald gradient header, champagne cards, JBJ monogram tile.
- Two parallel systems → divergent header, colors, typography, spacing, footer.

## Target architecture

```
src/components/ai-home-finder/report/
  ReportEngine.tsx          ← single shared report component (pages array)
  ReportPage.tsx            ← A4 page frame: header + footer + content
  pages/
    CoverPage.tsx           ← page 1: monogram + "JBJ GLOBAL REAL ESTATE" wordmark, salutation
    PicksPage.tsx           ← Your AI-Selected Properties (RANK #1/#2/#3 cards)
    ComparisonPage.tsx      ← criteria table + emerald Match summary row
    PropertyDetailPage.tsx  ← (PDF-only) per-project deep dive — area, developer, ROI, payment plan, amenities, AI reasoning
    ClosingPage.tsx         ← (PDF-only) market insights + CTA
  tokens.ts                 ← single palette: emerald gradient, champagne, gold, ink, muted
```

`ReportEngine` accepts:
- `mode: "preview" | "pdf"` — drives which pages render. Preview = Cover + Picks + Comparison. PDF = everything.
- `projects`, `branding`, `matchmakerFormData`, `salutation`, etc.

Visual primitives (header band, footer bar, page frame, card, badge, table) live in `ReportPage.tsx` and are **identical** in both modes. The only difference is which `<*Page>` children are mounted.

## PDF export path

Replace the entire `buildPdf` jsPDF script in `QuizResults.tsx` with a `renderReportToPdf` util:

```
src/utils/renderReportToPdf.ts
  - Mounts <ReportEngine mode="pdf" .../> into a hidden offscreen container (fixed width = A4 @ 96dpi = 794px, position: fixed; left: -10000px).
  - Waits for fonts + images (Promise.all on <img>.complete and document.fonts.ready).
  - For each [data-report-page] node:
      - html2canvas(node, { scale: 2, useCORS: true, backgroundColor: null })
      - pdf.addImage(...) at full A4 size, addPage() between
  - Returns { blob, filename }
```

`previewDownload(branding)` in `QuizResults.tsx` calls `renderReportToPdf({ projects, branding, salutation, matchmakerFormData })`. Same util is reused by the Send-to-Consultant / Email flows so the attached PDF is byte-identical to what the user previewed.

`ReportPreviewModal` is refactored: its right-hand "LIVE PREVIEW" pane mounts `<ReportEngine mode="preview" .../>` instead of its current bespoke JSX. The form (branding inputs, salutation, role) stays in the modal's left pane; on change it updates the same `branding` prop both panes consume.

## Tokens (single palette, used everywhere)

```ts
export const REPORT_TOKENS = {
  page: "#FDFBF7",
  surface: "#F7F2EA",
  raised: "#EFE6D6",
  gold: "#B89555",
  goldHair: "rgba(184,149,85,0.32)",
  ink: "#1A1A1A",
  muted: "#6B6B6B",
  emerald: "#064E3B",
  emeraldGradient: "linear-gradient(135deg,#064E3B 0%,#042c1c 58%,#000000 100%)",
  fontHeading: '"Inter", system-ui, sans-serif',
  fontBody: '"Inter", system-ui, sans-serif',
};
```

Pixel sizes are A4-based (794 × 1123 px @ 96dpi). Every page is rendered at exactly that size in both modes so html2canvas captures = preview screenshot.

## Migration steps

1. Create `src/components/ai-home-finder/report/tokens.ts` + `ReportPage.tsx` (header band, footer bar, page chrome).
2. Create `CoverPage`, `PicksPage`, `ComparisonPage` — port the JSX out of `ReportPreviewModal.tsx`'s preview pane into shared components.
3. Create PDF-only `PropertyDetailPage` + `ClosingPage` — port the *content* (not the jsPDF drawing) from `buildPdf`'s text/section logic. Re-implement as React using the shared primitives.
4. Build `ReportEngine` that maps `mode` → ordered pages array.
5. Refactor `ReportPreviewModal` preview pane to `<ReportEngine mode="preview" />`.
6. Write `src/utils/renderReportToPdf.ts` (offscreen mount + html2canvas + jsPDF.addImage, A4 page-by-page).
7. Replace `buildPdf` body in `QuizResults.tsx` with a thin wrapper that calls `renderReportToPdf`. Delete all jsPDF drawing helpers (`drawOmbreWordmark`, `drawPageBg`, `drawHeader`, etc.).
8. Update Send-to-Consultant / WhatsApp / Email flows to use the same util.
9. Typecheck.

## Validation

Drive Playwright via shell:
1. Open `/ai-home-finder-results?...`, click Generate Report → screenshot preview pages 1, 2.
2. Click Download PDF → save the blob.
3. Use `pdftoppm` to render each PDF page to PNG.
4. Diff preview screenshots vs PDF pages with `PIL` (mean abs pixel diff < 2% on cover/picks/comparison sections, which are shared).
5. Attach side-by-side strip to the response.

## Out of scope (this turn)

- Changing the **content** depth of the PDF (still includes area/developer/ROI sections — they're just rendered through the shared React primitives now).
- Touching unrelated reports (Compare, Brochure, etc.).
- Any backend changes.

## Risk notes

- html2canvas + emerald CSS gradient: must use `backgroundImage` inline style (already in tokens) — html2canvas supports it. Fallback solid color set as `backgroundColor`.
- Fonts: must wait on `document.fonts.ready` before capture, else PDF picks up fallback Times.
- Images (developer logos, project covers): `useCORS: true` + `crossOrigin="anonymous"` on every `<img>`; preload via `Image()` before capture.

## Deliverable

After merge, opening the modal and clicking Download PDF produces a PDF whose first 2–3 pages are **pixel-equivalent** to the on-screen Live Preview (same header gradient, same gold hairlines, same monogram, same RANK cards, same emerald Match summary row). Subsequent pages append the extended content using the same chrome.
