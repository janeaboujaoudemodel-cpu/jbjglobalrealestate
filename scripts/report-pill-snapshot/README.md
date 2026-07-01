# Report Pill / Button Snapshot Test

Preview-vs-PDF pixel-level regression for the AI Home Finder report.

For every viewport (`desktop 1440` / `tablet 820` / `mobile 414`) it opens the
`/__report-contrast` harness, screenshots every `[data-report-pill]` and
`[data-aihf-include-btn]`, then renders the PDF from the same DOM, rasterises
each page at 150 DPI, and crops the pill regions using each pill's
page-local bounding box scaled by `pdfImg.width / 794`.

## Run locally

Requires the dev server on `:8080` and `poppler-utils` (`pdftoppm`):

```bash
npm run dev &
python3 scripts/report-pill-snapshot/run.py
```

Outputs under `scripts/report-pill-snapshot/artifacts/<viewport>/`:
- `report.pdf`
- `pages/pg-*.png` (rasterised PDF pages)
- `preview_*.png` (element screenshots from the live preview)
- `pdf_*.png`     (matching crops from the rasterised PDF)
- `../report.json` (roll-up with per-pill color delta and dimension delta)

Exit code is non-zero when any pill breaches `meanRgbTol` (default 14) or
`dimTolPx` (default 3, expanded by the DPI scale factor).

## CI

`.github/workflows/report-pill-snapshot.yml` runs the same script on every PR
that touches the report engine or export utilities.
