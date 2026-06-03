## Goal
Fix the AI Home Finder report (PDF) and the on-screen "Your AI Selected Properties" section so the comparison table is restored, the layout breathes, the copy reads like a presentation (not "Furnishing: Yes."), each property gets its own brochure-style report, and the header chrome looks intentional. All work stays inside the matchmaker / quiz-results scope.

## Scope of files
- `src/pages/QuizResults.tsx` (primary — cover, criteria table, property pages, header/footer, share dialog, link wrapping)
- `src/components/matchmaker/MatchCriteriaTable.tsx` (on-screen table restore + shared row builder)
- `src/utils/contentSanitizer.ts` (extend `stripBoilerplateHeaders` so "Furnishing", "Kitchen and appliances", etc. no longer survive as labels)
- A small new helper `src/utils/matchmakerProse.ts` for label→sentence rewrites (e.g. `Furnishing: Yes` → "Comes fully furnished")

No other pages, no global tokens, no business-logic changes.

## 1. On-screen "Your AI Selected Properties" — restore the table
- Comparison table has disappeared in the preview. Re-mount `<MatchCriteriaTable>` directly under the 3-card row on `/quiz-results` with the same column order as the PDF (Requirement / #1 / #2 / #3, verdict pill + value).
- Keep card grid (#1/#2/#3) above the table; the table is the single source of truth for "How each property matches".
- Verdict pills use Tiffany palette only (cyan strong / cyan soft / cyan faded ring) — no green/amber/red.

## 2. PDF report — page architecture (fixes empty gap + ordering)
New deterministic page order, one logical block per page so we never leave half-empty pages:

```text
Page 1  Cover — header, "Prepared for {client name}", 3 property cards, "What's inside" list
Page 2  Comparison table — full-width Tiffany table, photo thumb + #rank in each column header
Page 3  Property #1 brochure (hero, key facts grid, narrative, amenities w/ photos, listing link, Download link)
Page 4  Property #2 brochure
Page 5  Property #3 brochure
```
- Each property brochure is exactly 1 page; if content overflows, it flows to a continuation page that keeps the same header/footer and a `Property #N (cont.)` strip — never a blank page.
- Remove the current "Confidential — for the addressee only" string. Replace right-header line with `Prepared for {clientName} · {date}` using the quiz form's captured name (fall back to `Prepared exclusively` when name missing).
- Fix the eyebrow chip `AI PROPERTY MATCHMAKER | EXCLUSIVE BY JBJ` overlapping the `Your AI Selected Properties` title: add 18pt top padding below the chip and 12pt below the title before the body copy.
- Fill the empty bottom half of page 1 by enlarging the 3 cards (taller image, taller info block) and pushing "What's inside this report" into a small footer strip just above the page footer — no large void.

## 3. Restore + improve the criteria table (in PDF)
- Bring back `autoTable` block on dedicated page 2 (currently missing because the table got pushed off the cover).
- Column headers: thumbnail (24×24 rounded) + project name + `#1/#2/#3` chip.
- Cell layout: verdict label on top (MATCH / CLOSE / MISS) in Tiffany shades, actual value below in white.
- Row striping uses two deep-navy tones; gridlines are 1px Tiffany at 25% alpha.
- Page break logic: if table doesn't fit, it continues on page 2b with repeated header row — never overlaps footer.

## 4. Property brochure page — layout + content rewrite
Layout (per property page):
- Hero photo strip (kept).
- Key facts as a 2×4 grid (Location, Community, Price, Bedrooms, Size, Handover, Payment Plan, Sale Status). Empty values render as "—" but the cell still keeps padding so the grid stays even.
- Narrative section "About this property" — natural prose, NOT label/value dumps.
- Amenities section with thumbnails (re-using the same Reelly `amenity_images` lookup as `AmenitiesWithPhotos`). Render each amenity as a 96×64 photo card with rounded corners + caption; fall back to icon tile when no photo. Wraps in a 4-col grid that page-breaks cleanly.
- Listing link rendered with proper word-break: split URL across lines at `/` boundaries, max width = content width, Tiffany underline, `doc.link()` annotation covers all wrapped fragments.
- "Download full brochure" button → links to the per-property PDF (see §5).

Content rewrite rules (`matchmakerProse.ts`):
- Drop boilerplate headers from descriptions (extend `stripBoilerplateHeaders` to include "Project general facts").
- Convert label/value pairs into sentences:
  - `Furnishing: Yes` → "Comes fully furnished."
  - `Furnishing: No` → "Delivered unfurnished, ready for your own styling."
  - `Kitchen and appliances: Fully equipped kitchen` → "Kitchen is delivered fully equipped."
  - `Finishing and materials: Modern finishing with high quality` → "Finished with modern, high-quality materials."
  - `Location description and benefits: …` → "Set in {community}, …" (keeps the long copy but reflows as prose paragraphs of ≤90 words, with blank-line breaks).
- Maximum 3 paragraphs per property; truncate gracefully with "Read more on the listing →" link if longer.
- Never emit "Furnishing", "Kitchen and appliances", "Finishing and materials", "Location description and benefits" as visible labels in the PDF.

## 5. Per-property downloadable brochure
- Add a "Download this property brochure" action both on the on-screen results card and on the property's PDF page.
- Reuse the same brochure renderer (`renderPropertyBrochurePage`) called standalone: builds a 2–3 page mini-PDF (cover with hero + facts, narrative, amenities + listing link) for the single project.
- Filename: `JBJ-{projectSlug}-Brochure.pdf`.

## 6. Header / footer chrome
- Tiffany hairline divider under the header: extend `doc.setLineWidth + doc.line` to `x1 = 0`, `x2 = pageW` (currently inset by margin) — full bleed, both top and bottom hairlines.
- Same full-bleed treatment for the footer hairline.
- `JBJ GLOBAL REAL ESTATE` wordmark in the header: render as Tiffany ombre using a left-to-right cyan→navy gradient. jsPDF has no native gradient, so draw the wordmark via 6 letter-segment fills stepping through `#5EEAD4 → #22D3EE → #0EA5E9 → #0369A1`, with a 1px outer glow rectangle behind it at 30% cyan alpha to simulate the glow. Apply on every page.
- Wordmark + monogram alignment: monogram 38×38, wordmark left-edge fixed at `M + 50`, vertical center matches monogram.

## 7. Share dialog X button
- Already converted to Tiffany cyan; re-verify it doesn't get re-skinned by the global navy/champagne CTA guard (add `data-no-contrast-guard data-allow-dark-cta` on the close button).

## 8. End-to-end QA (mandatory, with proof)
1. Navigate to `/quiz`, complete the quiz with a Dubai Hills selection + budget + 2BR (matches the user's earlier scenario) — confirm recommendations honour location/budget priority (already shipped last turn).
2. Land on `/quiz-results`, screenshot the page showing card row + restored comparison table.
3. Click `Download Report`, capture the PDF, run `pdftoppm` and inspect every page:
   - Page 1: no overlap between eyebrow chip + title; no big bottom gap; client name printed.
   - Page 2: comparison table present, no clipping, photo thumbs visible.
   - Pages 3–5: prose reads naturally; no "Furnishing: Yes" anywhere; amenities show photos; listing link wraps inside content width and is clickable.
   - Every page: full-width Tiffany hairlines, ombre wordmark, no "Confidential — for the addressee only".
4. Click `Download this property brochure` for property #1 and inspect the standalone PDF the same way.
5. Open the Share dialog and confirm the X button is Tiffany cyan in idle + hover + focus.
6. Attach the rendered page images + screenshots as proof in the reply.

## Technical notes
- Reuse `buildCriteriaRowsForExport` / `computeMatchTotals` so on-screen + PDF stay in sync.
- The amenity photo map already lives on the `projects` query (`amenity_images` Reelly field); pass it into the brochure renderer instead of re-fetching.
- Use `doc.splitTextToSize` for narrative paragraphs, and a custom `wrapUrl` helper for the listing link (splits on `/`, `?`, `&`).
- Keep the page-break guard from the SO reference: pre-measure each section, push a `doc.addPage()` before rendering if remaining height < section min-height — eliminates the blank-tail-of-page bug.
- No changes to quiz logic, scoring, or routing.
