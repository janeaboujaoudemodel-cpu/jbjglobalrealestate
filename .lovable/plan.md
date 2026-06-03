## Plan

### 1. Fix the Share Report X button immediately
- Replace the inherited champagne/gold close button styling in the Share Report dialog with a dedicated Tiffany close control.
- Force the close icon and circle to use cyan/Tiffany glow at rest, hover, and focus.
- Keep it scoped to the AI Home Finder dialog so it does not affect other app dialogs.

### 2. Rebuild the downloaded report as a branded presentation-style PDF
- Replace the current jsPDF table-heavy export that creates blank gaps, Excel-like tables, cramped rows, and broken header/footer spacing.
- Use a consistent Tiffany visual system throughout:
  - deep ink/navy background
  - cyan/Tiffany glow borders and accents
  - white/Tiffany text only on dark backgrounds
  - no orange/brick/gold/green status palette in this report
- Redesign the header/footer as clean single-tone branded chrome with larger JBJ monogram + JBJ GLOBAL REAL ESTATE wordmark.
- Remove the empty first-page issue by turning page 1 into a real cover/summary page with the selected properties, badges/ranks, and key details.

### 3. Make the match table mirror the on-screen preview
- Recreate “How each property matches your requirements” as a centered, padded, dark Tiffany comparison panel instead of a generic grid table.
- Match the website layout more closely:
  - title + legend
  - property photo thumbnails and #1/#2/#3 badges in the header
  - requirement column on the left
  - property columns with verdict label and actual value
  - summary row at the bottom
- Use Tiffany-only verdict styling: match/close/miss will be visually distinct by icon/label and cyan intensity, not brick/orange/green/gold blocks.
- Control page breaks so the table never collides with header/footer and does not leave large black gaps.

### 4. Add full property report pages for each selected property
- For each selected property, generate dedicated pages using the data already loaded from the website/database:
  - project photo/cover image
  - rank badge (#1, #2, #3) and user-added badge if selected
  - developer, location, community, price, bedrooms, size, handover, payment plan, sale status
  - amenities/features when available
  - project description and developer description when available
  - clickable listing link
  - available brochure/document links when real documents exist
- Keep each property report clean and presentation-like, not a spreadsheet.
- If a property has enough content/photos, split it cleanly across multiple pages rather than squeezing or clipping.

### 5. Make all links visibly clickable and functional
- Style every PDF link with Tiffany blue text plus a proper underline directly under the link text.
- Apply this to listing links, website links, email links, and document/brochure links.
- Preserve PDF clickable link annotations across all link areas.

### 6. Verify the flow end-to-end
- Generate a fresh report from the current quiz-results flow.
- Convert the generated PDF pages to images and visually inspect every page for:
  - no blank first page
  - no clipped/hidden text
  - no broken table layout
  - no footer/header collisions
  - no large black gaps
  - photos visible where available
  - links visibly underlined
  - consistent Tiffany branding
- Re-check the Share Report dialog visually so the X button is no longer champagne/gold with a white icon.

## Technical notes
- Main file to update: `src/pages/QuizResults.tsx`.
- Reuse `buildCriteriaRowsForExport` and `computeMatchTotals` so the PDF verdict logic stays aligned with the on-screen Match Criteria table.
- Continue using the loaded `projects` query, which already includes project images, developer info, documents, community, and core project fields.
- Avoid global color changes outside the AI Home Finder report/dialog scope.