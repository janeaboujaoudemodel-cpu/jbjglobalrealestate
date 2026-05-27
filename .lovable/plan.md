# Fix Document Studio pagination + finish pending CV cleanup

## 1. Root cause of "Page 10 of 20410"

In `src/components/document-studio/DocumentStudio.tsx`:

- `pageRef` has `minHeight: PAGE_H * pageCount`.
- `measuredPageH = pageRef.offsetHeight`.
- `pageCount = ceil((measuredPageH - chrome) / contentPerPage)`.

This is a feedback loop: every time `pageCount` grows, `minHeight` grows, which makes `measuredPageH` grow, which grows `pageCount` again — runaway until it hits 20,410.

## 2. Smart A4 pagination (replaces current formula)

- Add a dedicated `bodyRef` on the inner body wrapper (the `padding: 40px 56px` div) and measure ONLY its `scrollHeight` — never the outer page (no feedback loop).
- Compute:
  - `contentPerPage = PAGE_H - HEADER_H - FOOTER_H - BODY_PAD_TOP - BODY_PAD_BOTTOM` (keep generous bottom padding so nothing looks cropped).
  - `pageCount = max(1, ceil(bodyScrollHeight / contentPerPage))`, hard-capped at 20 as a safety net so a measurement glitch can never explode again.
- Smart break for stamp / signature / footer: before finalising `pageCount`, walk the floating marks (`marks.stamp`, `marks.signature`, locked footer band) and any element flagged `[data-pdf-keep-together]`. If a mark would straddle a page boundary, snap its Y to the next page's top (and bump `pageCount` only if it now overflows). The locked footer is always reserved at the bottom of the last page; if the last-page body would push into it, add one more A4.
- Always start at 1 page. New A4 sheets only appear when content actually overflows.

## 3. Visual page-break polish

- Keep the sibling gap-band overlays so they're not captured in the PDF.
- Cleaner styling: thinner band (12px), subtle hairline top/bottom, centred small chip `Page N / Total` in champagne tones.
- Hide the "Page 1 of N" chip when `pageCount === 1`.

## 4. Clean up the 20,410 stale "pages"

There are no extra DB rows — the number is purely the computed `pageCount`. The fix above eliminates it. No data migration needed; reloading the Holiday Home contract after the fix will render the correct 2–3 A4 pages.

I'll also clear any persisted `measuredPageH`-like values from `sessionStorage`/`localStorage` keys used by Document Studio at mount (defensive reset on this version bump).

## 5. Finish remaining CV cleanup

- `DocumentStudio` safety guard: confirm `readSnapshot` already drops stale `candidate_cv` template IDs; add the same guard to URL `?tpl=` parsing so a bookmarked `?tpl=candidate_cv` cannot reintroduce the broken state, and toast "This template moved to CV Builder" + redirect to `/cv-builder`.
- `scripts/generate-sitemap.ts`: add `/cv-builder` entry (weekly, 0.7); ensure no old `cv-resume` or `candidate_cv` paths are present (currently none — will keep it that way). Regenerate `public/sitemap.xml`.
- `public/robots.txt`: keep existing `Disallow` for the old CV builder paths (already added previously).

## 6. End-to-end QA pass

I'll manually walk through in the preview:

1. Open `/owner/careers-portal?section=contracts` → pick **Holiday Home Rental** → confirm preview shows correct page count (expected 2–3 A4), no "of 20410", stamp/signature/footer never split.
2. Type extra paragraphs until overflow → confirm a 2nd A4 appears smoothly, bottom padding preserved, stamp jumps to next page intact.
3. Export PDF → open the file, verify same page count, no clipped footer/stamp, A4 dimensions.
4. Verify HR Inbox tab is visible at the top of Careers Portal.
5. Visit `/cv-builder` directly → add experience/education/skills, live preview updates, export PDF (no JBJ branding).
6. Visit legacy `/toolkit/corporate-suite/cv-resume` → confirms redirect to `/cv-builder`.
7. Visit `/owner/careers-portal?section=contracts&tpl=candidate_cv` → confirms redirect/toast to `/cv-builder`, Document Studio sidebar stays intact (no empty state).
8. Check `public/sitemap.xml` after `predev` regen → `/cv-builder` present, no old CV URLs.

## Files to touch

- `src/components/document-studio/DocumentStudio.tsx` (pagination rewrite + URL guard + storage reset)
- `scripts/generate-sitemap.ts` (+ regenerated `public/sitemap.xml`)

No backend / RLS / schema changes.
