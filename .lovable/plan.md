## Plan: AI Home Finder Report Contrast + Preview/PDF QA

### Goal
Fix the remaining unreadable text inside every emerald/dark report block, then prove the live preview and downloaded PDF match through a real user download flow with screenshots.

### Step 1 — Reproduce and isolate the broken contrast
- Open the exact AI Home Finder results route currently shown.
- Click `Download Report` / `Download PDF` as a user.
- Inspect the report preview modal page-by-page, focusing on:
  - Cover `Report scope` emerald box
  - Client requirements `JBJ selection method` emerald box
  - Matched properties `RANK #` pills
  - Comparison matrix `Match summary` row
  - Property detail `AI recommendation` cards
  - AI summary `Lead recommendation` emerald box
  - Contact page emerald contact panel
- Before changing anything, capture screenshot proof of the current failing sections and collect computed CSS color / `-webkit-text-fill-color` values for text inside `[data-on-dark]` surfaces.

### Step 2 — Fix the source of truth, not a single screenshot
- Update only the shared report rendering source used by both preview and PDF: `ReportEngine` and its report tokens/style layer.
- Add a single high-specificity report contrast contract scoped to the report root:
  - Every `[data-on-dark]` and `[data-surface="emerald"]` descendant uses pure white text.
  - SVG/icon stroke/fill is pure white on emerald/dark.
  - Local report styles beat global champagne/ink guards.
  - The rule applies in both `mode="preview"` and `mode="pdf"`.
- Avoid scattered one-off component patches unless a specific report element is missing the shared dark-surface marker.

### Step 3 — Validate the first fixed section before moving on
- Reopen the preview modal.
- Validate the cover page first:
  - Screenshot the full modal.
  - Programmatically scan visible dark-surface descendants for non-white computed text fill.
  - If cover still fails, fix it before checking later pages.

### Step 4 — Validate each report section in order
For each page/section, scroll like a real user and capture screenshot proof before proceeding:
1. Cover page
2. Client requirements page
3. Matched properties page
4. Comparison matrix page
5. Property #1 detail
6. Property #2 detail
7. Property #3 detail
8. AI summary page
9. Contact page

For every section:
- Confirm no unreadable emerald/dark cards.
- Confirm rank chips and match-summary row are white-on-emerald.
- Confirm header/footer remain consistent.
- Confirm page content is not cropped or split incorrectly.

### Step 5 — Validate real download behavior
- Click `Download PDF` from the preview modal.
- Save the generated PDF.
- Convert all PDF pages to images.
- Confirm the PDF has exactly 9 pages.
- Compare the rendered PDF pages visually against the preview screenshots.
- Scan the PDF-rendered page images manually for the same contrast issues flagged in the user screenshots.

### Step 6 — Deliver proof artifacts
- Provide screenshot proof from the live preview.
- Provide a contact sheet of all 9 rendered PDF pages.
- Provide the downloaded PDF artifact.
- Include the technical validation result: number of contrast offenders found after the fix, and page count.

### Acceptance criteria
- Zero black/dark text inside emerald/dark report boxes in preview.
- Zero black/dark text inside emerald/dark report boxes in downloaded PDF render.
- Preview and PDF use the same `ReportEngine` layout.
- Download does not bypass the preview modal.
- PDF renders exactly 9 pages.
- Screenshot proof is produced after the final fix, not assumed from code.