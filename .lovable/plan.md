# Plan: Property Advertising Agreement — premium edit/export, smart auto‑fill, brand fixes

## 1. Brand chrome (header / footer)

- **Switch the document logo from the gold "JBJ" monogram to the real full company logo**
  - Replace `monogramUrl` import in `src/templates/jbjPropertyAdvertisingAgreement.ts` with `jbj-fulllogo-light-bg.png` (or `jbj-fulllogo-light.png`) so header *and* footer use the real wordmark+icon lockup.
  - Increase the header logo box (around 130×56) so the logo isn't a tiny square.
- **Office line** stays from `src/config/companyLegal.ts` (`Office SM1-195, Port Saeed, Deira, Dubai, UAE`) — this already matches the uploaded trade license. No edit needed there, except making sure the office line is what appears in the header (not a generic "Downtown Dubai · DIFC" placeholder).
- **Trade license metadata** to surface in the footer compliance line: `LIC 1591031 · DCCI 666113 · CR 2789619`.

## 2. Intro copy cleanup

In `buildPAAHtml` opening paragraphs:

- Remove the phrase *"a private office offering"*.
- Remove the en‑dash ("—") that visually reads as an underscore between **JBJ Global Real Estate** and the next clause. Replace with a normal period/sentence break.
- New opening reads (plain, no marketing fluff):
  > As a property owner or landlord, you are partnering with **JBJ Global Real Estate** to advertise and represent your property for sale or lease at the best terms in the shortest time.
- Keep the next two paragraphs (verified listing + exposure) as they are.

## 3. Property Details — interactive chips + auto‑hide

Currently the radio chips ("Villa / Apartment / Office / Warehouse" and "Vacant / Tenanted") are **render‑only**: they show the selected dot but the user can't click them in the preview, and on export *all* options stay visible.

- Make all chips (`propTypeChip`, `statusChip`, `furnChip`, `exclusivityChip`, `periodChip`) clickable in **edit mode** inside the iframe preview by attaching `data-field-key` and a `data-field-value`, then posting a `jbj-set-field` message back to the parent on click.
- In **edit mode**: clicking a chip just updates that field's value in `editValues` (so the user can change their mind, see all options).
- In **export / view mode** (i.e. the saved/sent PDF render): once a chip is selected, render **only the selected option** as a clean inline value (e.g. `Property Type: Apartment` with a thin gold underline) and drop the other chips. Same rule for Status, Furnishing, Exclusivity and Listing Period.
- This is driven by a new `opts.renderMode: "edit" | "final"` flag in `buildPAAHtml`. `EnvelopeDetail` passes `"edit"` while `editing === true`, `"final"` when generating the saved document.

## 4. Right‑sized underlines

`fieldUnderline` sets `min-width:120px` which is why short values get a long trailing line (the user called this out for *Al Tajer*).

- Drop the `min-width:120px`, replace with `min-width: 1ch` and let the inline‑block hug its content. Add a small left/right padding so very short text isn't cramped.
- For currency / numeric fields keep right‑alignment within the underline.

## 5. Vacating date — always editable

- Keep `vacating_date` visible in the edit sidebar **unconditionally** (today it's hidden under a `conditional`). The smart auto‑infer (future date ⇒ Tenanted) stays, but the field is always typeable.
- Pre‑filled with the example the user just dictated for this lead: `2026‑05‑24` (entered as `24/05/2026`). They asked for it to be editable any time — the sidebar input is the source of truth.

## 6. Keep every Property Finder field — even when blank in edit mode

User rule: in the editor every field stays visible (so nothing gets dropped at signing time), but in the **final / sent PDF**:

- Selected single‑choice options collapse to a single clean line.
- Empty text fields with no value are hidden from the final render (already behaves this way).
- Conditional fields (Plot Number, Vacating Date, "Until" date) collapse based on rules.

In edit mode every field from `PAA_FIELD_GROUPS` is rendered in the form sidebar regardless of `conditional`, but conditionals are shown as soft hints ("only included if Tenanted").

## 7. Click‑to‑edit, not click‑to‑delete (the main bug)

Today: clicking any field in the preview iframe triggers `confirm("Remove field ...?")`. This is what destroyed two fields on Omar Alam Niyazi Shadid.

New UX:

- Hovering a `[data-field-key]` block in the preview shows:
  - A subtle gold dashed outline (current behaviour, but champagne tone, not red).
  - A small **× button** anchored to the top‑right of the field box (8 × 8 px, ink on cream, thin gold border).
- **Clicking the field body** → posts `{type: "jbj-edit-field", key}` to parent. Parent opens the sidebar in edit mode and focuses the matching input.
- **Clicking the × button** → posts `{type: "jbj-hide-field", key}` (current behaviour) — *no native `confirm()`*. Instead a sonner toast appears with **Undo** that calls `toggleHiddenField(key, false)`.
- Update both `previewSrcDoc` script and the `useEffect` message listener accordingly.

## 8. Restore Omar Alam Niyazi Shadid's accidentally‑deleted fields

- One‑off fix: locate the envelope by client name and clear the `metadata.hiddenFields` array (set to `[]`) so every hidden field reappears.
- Done via a small admin button on the envelope page — **"Restore all removed fields"** — visible only when `metadata.hiddenFields?.length > 0`. Clicking it sets `hiddenFields = []` and re‑renders the document. This is safer than a blanket migration because the same fix is available for any future envelope.

## 9. Faster, more premium editing & export

Editor loop:

- Debounce live preview re‑renders 250 ms instead of regenerating on every keystroke (today every field change calls `buildPAAHtml` on the main thread).
- Render preview as a memoised HTML string keyed on `JSON.stringify(editValues) + hiddenFields + chrome`.
- "Save & re‑render" → call `regenerate` once with the final values, show a small progress chip rather than disabling the whole panel.

Export view:

- Convert the preview iframe to use `print-color-adjust: exact` so colours don't shift in the printed PDF.
- Increase content width to 794 px (A4) and centre it; current 44 × 52 padding stays.
- Set page break rules so Sections 1/2 stay together, Terms starts on a new page only if it would split badly.

## Files we'll touch

- `src/templates/jbjPropertyAdvertisingAgreement.ts` — logo, intro copy, render modes, chip rendering, underline width, footer compliance line.
- `src/pages/e-signature/EnvelopeDetail.tsx` — iframe click script, message handlers (`jbj-edit-field` + `jbj-hide-field` + undo toast), restore‑all button, debounced preview, focus‑into‑sidebar.
- `src/pages/owner/DocumentsFormsHub.tsx` — no functional change beyond passing through `template_field_values`.
- `src/config/companyLegal.ts` — no change (already matches trade license).
- No database migration needed.

## Out of scope (for this round)

- Re‑typesetting the Terms & Conditions clauses. They already match the Property Finder standard text the user shared; if they want exact byte‑for‑byte parity I'll do that as a follow‑up with their PF copy in hand.
- Multi‑page selling‑side template (`jbjListingAuthorisation.ts`) — the same fixes will be applied in a follow‑up so leasing ships first.
