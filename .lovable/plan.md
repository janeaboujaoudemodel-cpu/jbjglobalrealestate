## Goal

Three problems on the e-signature envelope page:

1. **Logo broken in document preview** — JBJ monogram displays as a broken image inside the preview iframe.
2. **Popups blocked** — clicking Print (and possibly other actions) still triggers Chrome's "popup blocked" warning.
3. **Too many dividers in PAA header/footer** — under "PROPERTY ADVERTISING AGREEMENT — LEASING" there is a thin gold underline AND, just above it, a thick gradient bar. Footer has the same gradient bar above the contact row. User wants exactly **one full-width hairline at the bottom of the header** and **one full-width hairline at the top of the footer** — nothing else.

---

## Plan

### A. Fix broken logo in preview

`src/templates/jbjPropertyAdvertisingAgreement.ts` and `src/templates/letterheadChrome.ts` import the monogram via `?inline` (Vite base64). For the 44 KB PNG this still resolves correctly in most contexts but renders broken inside the srcDoc iframe on this user's session — same root cause already solved for the email path by using the absolute public URL (`JBJ_LOGO_URL = "https://www.jbj.ae/jbj-monogram-dark-on-light.png"`).

Change:
- Replace the inlined `monogramUrl` reference inside the rendered header `<img src=...>` (PAA template) and the rendered header in `letterheadChrome.ts` with the public absolute URL `https://www.jbj.ae/jbj-monogram-dark-on-light.png`. Keep `crossorigin="anonymous"` so html2canvas can still rasterise it for the PDF.
- Keep the `?inline` import as a fallback constant only if needed; otherwise delete the unused import to keep the bundle clean.

### B. Stop popup-blocked dialog appearing

`src/components/e-signature/DocumentEditor.tsx:215` still calls `window.open(url)` after async work — this is the leftover trigger Chrome flags. Replace it with the same blob-download-via-anchor pattern already used in `EnvelopeDetail.tsx` (`savePdfBlob` style). No `window.open` anywhere in the envelope flow.

`src/pages/e-signature/SignDocument.tsx:98` also has `window.open(docUrl, "_blank")` — convert to the same anchor-download pattern so the public sign page never trips the blocker either.

After the change, no envelope screen calls `window.open` at all.

### C. Simplify dividers in header + footer (PAA template + Letterhead chrome)

**`src/templates/jbjPropertyAdvertisingAgreement.ts`** — `headerHtml` `monogram-wordmark` branch (around lines 258–282):

- Delete the gradient divider line:
  `<div style="margin-top:10px;${goldGradient(accent)}"></div>`
- Delete the small 48 px gold underline beneath the title:
  `<div style="margin:6px auto 0;width:48px;height:2px;background:${accent};border-radius:1px;"></div>`
- Keep the title text "PROPERTY ADVERTISING AGREEMENT — LEASING" centered with comfortable top/bottom padding so it sits on the champagne band with no decorative bars around it.
- Keep the existing `border-bottom:1px solid ${accent}` on the champagne band as the single full-width header hairline.

**`footerHtml` three-column branch (around lines 311–330):**

- Delete the inline gradient line `<div style="${goldGradient(accent)}margin-bottom:8px;"></div>`.
- Keep the existing `border-top:1px solid ${accent}` on the champagne band as the single full-width footer hairline. Bump the band's `padding-top` slightly to compensate for the removed gradient spacing so the contact table still breathes.

**`src/templates/letterheadChrome.ts`** — apply the same two deletions:
- In `buildLetterheadHeader`: remove `goldGradient` rows in both `titleBlock` and the no-title fallback (so the only divider is the band's `border-bottom`).
- In `buildLetterheadFooter`: remove the gradient row above the contact table (only the band's `border-top` remains).
- Remove the now-unused `goldGradient` helper if no other call site uses it.

End state: every PAA + Letterhead document has exactly **two** decorative lines — one full-width hairline at the bottom of the champagne header band and one full-width hairline at the top of the champagne footer band. Nothing else.

### D. Lock policy

No DB changes. No template version bump needed (visual only, identical fields). Email layout untouched (already locked). No business logic changed.

---

## Files

- `src/templates/jbjPropertyAdvertisingAgreement.ts` — swap monogram src to public URL; remove gradient + 48 px divider in header; remove gradient in footer.
- `src/templates/letterheadChrome.ts` — same monogram + divider cleanup.
- `src/components/e-signature/DocumentEditor.tsx` — replace `window.open` with anchor-download.
- `src/pages/e-signature/SignDocument.tsx` — replace `window.open` with anchor-download.

## Verification

1. Reload `/e-signature/810df24a-…` → JBJ monogram appears in the preview iframe (no broken-image icon).
2. Click any "Print" / "Download" / "Open PDF" button → file downloads cleanly, **no Chrome "popup blocked" badge**.
3. Inspect preview: header shows monogram + legal name + contacts + centered "PROPERTY ADVERTISING AGREEMENT — LEASING" title, with **one full-width hairline below** and nothing else. Footer shows three-column contacts with **one full-width hairline above** and nothing else.
4. Click Download / Open PDF → exported PDF matches preview byte-for-byte (chrome shared via the same template code).
