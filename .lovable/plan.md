

## In-App Canva PDF Print Check

Add an owner-facing tool that accepts a Canva PDF export, runs the same corner-to-corner / DPI validation logic used by the CI gate, and renders the resulting `*_PRINT_CHECK.txt` summary directly in the UI.

### User flow

1. Owner opens **`/owner/print-check`** ("Canva Print Check") from the Royal Tools Hub.
2. Picks **Target size** (A4, A3, US Letter, US Tabloid, Square 1080, Custom WxH mm) and **Min DPI** (150 / 200 / 300, default 300 for print).
3. Drag-and-drop or browse a `.pdf` (≤25 MB).
4. Clicks **Run print check** → progress indicator while the file is uploaded and analyzed.
5. Result panel shows:
   - PASS / FAIL banner
   - Per-page table: dimensions (mm), edge-coverage %, embedded image min DPI, blank-page flag
   - Failure reasons list (e.g. "Page 2: content within 4mm of trim", "Page 3: image at 96 DPI < 300")
   - **Download `<filename>_PRINT_CHECK.txt`** button + raw text preview
6. History list of the last 20 checks for this owner (filename, date, PASS/FAIL).

### Files to add / edit

**Frontend**
- `src/pages/owner/PrintCheck.tsx` — page UI (uploader, options, results, history).
- `src/components/print-check/UploadDropzone.tsx` — drag/drop using existing `useFileUpload` pattern.
- `src/components/print-check/ResultPanel.tsx` — PASS/FAIL banner + per-page table + TXT preview/download.
- `src/components/print-check/TargetSizePicker.tsx` — size + DPI selectors.
- `src/routes/OwnerRoutes.tsx` — register `/owner/print-check` behind `OwnerGuard`.
- `src/pages/RoyalToolsHub.tsx` (or equivalent hub page) — add "Canva Print Check" tile.

**Backend (Lovable Cloud)**
- New edge function `supabase/functions/print-check/index.ts`:
  - Accepts `multipart/form-data` (`pdf`, `targetWidthMm`, `targetHeightMm`, `minDpi`, `edgeMarginMm` default 4).
  - Uses `requireOwnerAuth` middleware (per Zero Trust standard).
  - Runs Deno-compatible PDF analysis:
    - `pdf-lib` for page sizes & image metadata.
    - `pdfjs-dist` (Deno build) to rasterize each page to a canvas, then scan the configurable margin band for non-white pixels (mirrors `scripts/pdf-qa/check-exports.mjs` logic).
  - Returns JSON `{ pass, pages: [...], reasons: [...], txtReport }` and persists artifacts to Storage.
- New storage bucket `print-checks` (private) with RLS: owner-only read/write.
- New table `print_check_runs`:
  - `id uuid pk`, `user_id uuid`, `filename text`, `target_w_mm int`, `target_h_mm int`, `min_dpi int`, `pass boolean`, `report_path text`, `pdf_path text`, `summary jsonb`, `created_at timestamptz default now()`.
  - RLS: `user_id = auth.uid()` for select/insert; owner role can read all.

**Shared logic**
- Extract the edge-coverage / DPI math from `scripts/pdf-qa/check-exports.mjs` into a small reusable module that both the CI script and the edge function consume (CI keeps using poppler; edge function uses pdfjs raster output but applies the same thresholds).

### Report format (`<filename>_PRINT_CHECK.txt`)

```
JBJ Global Real Estate — Print QA Report
File: brochure-final.pdf
Target: A4 portrait (210 × 297 mm) · Min DPI: 300 · Edge margin: 4 mm
Generated: 2026-04-22 14:08 UTC

Result: FAIL (2 issue(s))

Page 1 — 210.0 × 297.0 mm — edge coverage 0.12% — min image DPI 312 — OK
Page 2 — 210.0 × 297.0 mm — edge coverage 1.84% — min image DPI 300 — FAIL (content within trim margin)
Page 3 — 210.0 × 297.0 mm — edge coverage 0.05% — min image DPI 96  — FAIL (image below 300 DPI)
...
```

### Access & guardrails

- Route gated by `OwnerGuard` (per `mem://security/owner-restricted-route-inventory`).
- 25 MB upload cap, `application/pdf` MIME enforced client- and server-side.
- Edge function rate-limited (per API protection standard): 10 runs / hour / user.
- All runs audited via existing `global_audit_events` (`event_type = 'print_check.run'`).
- No competitor branding, monochrome layout, Inter font, premium card styling per design standards.

### Out of scope

- No CI workflow changes — this reuses the same thresholds but runs on demand.
- No edits to existing PDF generators or the No-Removal Policy items.

