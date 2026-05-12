## What I'll change

### 1. Remove all dividers except two full-width hairlines (header + footer)

**`src/templates/jbjPropertyAdvertisingAgreement.ts`** — `monogram-wordmark` header case (around line 254-276):
- Delete the small **vertical 1px gold strip** between the monogram and the company name (`<div style="width:1px;height:42px;background:${accent};...">`).
- Keep the single full-width gold hairline that already sits at the bottom of the champagne header band (extends edge-to-edge via the `-36px` negative margin) — this is the only header divider that survives.
- Title block "PROPERTY ADVERTISING AGREEMENT — LEASING / SELLING" stays centered inside the champagne band, with no extra rule between it and anything else.

**Footer** (`three-column` case, around line 305-323):
- Already has a single full-width gold hairline as the band's `border-top`. Confirm no other inner `border-*` rule is rendered. Nothing else to change here besides the cleanup above.

**`src/templates/letterheadChrome.ts`** (shared by Leasing Letter + Blank Letter):
- Remove the matching vertical 1px gold strip between monogram and wordmark in `buildLetterheadHeader`.
- Keep the existing full-width header `border-bottom` and full-width footer `border-top`.

Net result on every JBJ document (PAA Leasing/Selling, Leasing Letter, Blank Letter): exactly **two** hairlines — one edge-to-edge under the header band, one edge-to-edge above the footer band. No vertical separators, no duplicates.

### 2. Fix "broken logo" in the e-signature preview

- `letterheadChrome.ts` currently loads the monogram from the external URL `https://www.jbj.ae/jbj-monogram-dark-on-light.png`. Inside the preview iframe (`srcDoc`) this image race-fails / shows the broken-image icon for some sessions.
- Switch it to the same inline base64 asset PAA already uses: `import monogramUrl from "@/assets/jbj-monogram-nobuffer.png?inline"`. Inline data URIs render instantly in `srcDoc`, in `html2canvas` PDF export and in any new-tab print window — eliminating the broken-image state.

### 3. Fix Print being "blocked" / popup blocked

Two root causes are layered together; both need to go.

**a. Global anti-print CSS in `src/components/SecurityShield.tsx`:**
- It injects `@media print { body { display: none !important; } }` for every visitor, including the owner. This is what makes the browser print preview render as a blank page and what the user is calling "blocked".
- Remove that `@media print` block entirely. (The real anti-capture protections — `useAntiCapture` — already guard the auditor role and are scoped correctly.)

**b. "Popup blocked" on Print button in `src/pages/e-signature/EnvelopeDetail.tsx` (`handlePrint`) and `src/components/e-signature/DocumentEditor.tsx` (`print`):**
- Today both functions `await` PDF rendering then download a `.pdf`, asking the user to manually press Ctrl/⌘+P. The user wants Print to actually open the print dialog.
- Replace with a synchronous-iframe pattern that keeps the user-gesture and never triggers a popup blocker:
  1. On click (no `await` first), create a hidden `<iframe>` appended to `document.body` with the preview HTML written via `srcdoc`.
  2. Wait for `iframe.onload`, then call `iframe.contentWindow.focus(); iframe.contentWindow.print();`.
  3. Remove the iframe a few seconds after `afterprint`.
- For `EnvelopeDetail`, `previewHtml` is already memoised, so the iframe path runs without an `await`. If it ever returns null, fall back to the existing PDF-download path.
- Result: one click → native browser print dialog, no popup blocker, no "downloaded — open and Ctrl+P" toast.

### 4. Verification

- Open `/owner/esignature/<envelope>` for the PAA Leasing template, confirm:
  - Logo renders (no broken-image icon) in the live preview iframe.
  - Header shows monogram + wordmark + contacts with **only** the full-width gold hairline below the band (no vertical strip, no extra rules).
  - Footer shows the three-column band with **only** the full-width gold hairline above it.
  - Click "Print" → browser print dialog opens directly. Page is not blank.
- Repeat for Leasing Letter and Blank Letter to confirm `letterheadChrome.ts` cleanup applied.
- Re-run `bun run build` (auto by harness) — no TS errors from the asset import or removed nodes.

### Out of scope for this turn

Nothing else in the CRM / sidebar / forms hub is touched in this plan — only the e-signature preview chrome, logo source, and print pipeline as requested.