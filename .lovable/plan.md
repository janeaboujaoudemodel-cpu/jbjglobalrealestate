## Plan

### 1) Replace the current “one long page” preview with real A4 pages
- Stop rendering `pageRef` as one tall `PAGE_H * pageCount` document.
- Render separate A4 sheet containers, each exactly `816 × 1154` px.
- Page 1 keeps the locked letterhead at the top.
- Later pages start with a fixed safe top padding, never at the absolute top.
- Every page gets fixed bottom padding, so content moves before touching the bottom.

### 2) Add smart page cutting
- Measure logical document blocks from the rendered body (`[data-pdf-section]`, paragraphs, tables, signature block, custom fields).
- Pack blocks into pages using a safe content height, with reserved top/bottom padding.
- Never split protected blocks such as tables, signature blocks, stamp/signature areas, and footer.
- If a block does not fit in the remaining safe area, move the whole block to the next A4 page.
- Keep the hard cap as a safety guard only, but derive the visible page count from actual packed pages, not from a tall container height.

### 3) Put the footer directly under the signature content
- Remove the flex behavior that pushes the footer to the bottom of a huge final page.
- Treat the locked footer as a protected block that follows the signature block.
- If the signature plus footer does not fit together, move the signature/footer group to the next page.
- The footer will appear immediately after the signature area on the final used page, not after 17 empty pages.

### 4) Lock automatic vs manual pages
- Default to automatic pagination: start with 1 page, add pages only when content needs them.
- Add an “Add page” button at the bottom of the preview to manually add blank A4 pages when needed.
- Manual pages will be appended only after the real content pages and will not affect automatic page cutting.
- Remove or replace the existing confusing top “Pages Auto/1/2/3” control.

### 5) Fix PDF export to match the preview
- Update `exportPdf` so it exports the rendered A4 pages individually, not slices of one tall screenshot.
- Preserve smart block boundaries, safe margins, letterhead, signature/stamp, and footer placement.
- Prevent blank pages from being exported unless the user explicitly added them manually.

### 6) Clean legacy CV URLs fully
- Remove redirects from `/toolkit/corporate-suite/cv-resume` and `/toolkit/corporate-suite/cv-builder` to `/cv-builder`; they should no longer lead anywhere.
- Remove the Careers Portal `?tpl=candidate_cv` redirect to `/cv-builder`; instead it will clear the invalid `tpl` parameter and remain in the contracts area.
- Keep `/cv-builder` as the only clean CV Builder URL.
- Keep old paths disallowed from robots and ensure sitemap only lists `/cv-builder`.

### 7) QA after implementation
- Open Careers Portal → Contracts → Document Studio.
- Use the Holiday Home / contract flow and confirm:
  - starts at 1 A4 page,
  - no “3 of 20” empty-page state,
  - page 1 bottom padding is safe,
  - page 2 top padding is safe,
  - signature/stamp/footer are not split,
  - footer sits under the signature on the final content page,
  - manual Add Page appends one real blank A4 page,
  - PDF export matches the on-screen pages.
- Check legacy CV paths no longer redirect to `/cv-builder` and `/cv-builder` still loads directly.