

## Goal

Generate an automated **visual diff report** comparing any future PDF export against the stored baseline (the Company Profile baseline PDF), with per-page pixel-level change highlighting and a single HTML summary file the user can open and share.

## Approach

A self-contained Python pipeline (run via `code--exec`, no app changes) that:

1. **Rasterizes** both PDFs to PNG at 150 DPI (`pdftoppm`).
2. **Aligns** page counts (pads shorter PDF with blank pages so every page has a comparison).
3. **Computes per-page diff** using Pillow + NumPy:
   - Pixel-level absolute difference
   - Changed-pixel ratio (% of pixels that differ above a small tolerance)
   - SSIM-style "changed regions" highlighted in red over a desaturated baseline
4. **Renders** three images per page side-by-side: `baseline | candidate | diff-overlay`.
5. **Emits** a single self-contained HTML file embedding all images as base64, with:
   - Top-level summary table (page #, % changed, verdict: identical / minor / major)
   - Per-page section with the 3-up image strip + numeric stats
   - Color-coded verdict pills

## Inputs / outputs

- **Inputs**:
  - Baseline: `public/documents/JBJ-Global-Real-Estate-Company-Profile.pdf` (already in repo)
  - Candidate: same file for the first run (sanity check — should report 0% diff on every page). Future runs swap in a newer export.
- **Output**: `/mnt/documents/company-profile-visual-diff.html` (single file, embedded images, no external assets).

## What gets built

### 1. New helper script: `scripts/visual_diff_report.py` (committed to repo so it can be re-run)
A CLI: `python scripts/visual_diff_report.py <baseline.pdf> <candidate.pdf> <output.html>`
- Uses `pypdfium2` (already common) or `pdftoppm` for rasterization (whichever is available — script auto-detects).
- Pillow + NumPy for diff math.
- Embeds all images as base64 PNG into the HTML.

### 2. First run — sanity check
Run the script against `baseline vs baseline` to prove 0% diff, then deliver the resulting HTML to `/mnt/documents/`.

### 3. README note in script header
Brief usage block at the top of the script explaining how to run it for any future export.

## Files touched

- `scripts/visual_diff_report.py` (new)
- `/mnt/documents/company-profile-visual-diff.html` (generated artifact)

## Out of scope

- No app/UI changes. No new routes, no buttons. (Owner already has "Open Clean Preview" + "Open Page Baseline" from the previous task — this report is run on demand from those exports.)
- No database/edge-function changes.
- No automatic CI hook — purely on-demand. (Easy to wire later if desired.)
- No diffing of HTML pages (route renders) — only PDF↔PDF. The print-mode baseline already lets you save any route as a PDF via the browser's print-to-PDF, which then becomes a valid input to this script.

