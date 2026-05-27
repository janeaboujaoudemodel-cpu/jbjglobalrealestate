## Goal

Lock the Holiday Home (and every Document Studio template) into a clean 3‑page A4 layout with no split blocks, a premium welcome intro, a generated booking ID, and a real "Generated Documents" library so saved docs persist.

## 1) Lock the page layout (visual + technical)

Edit `src/components/document-studio/DocumentStudio.tsx` body builder (the section around line ~698 that builds the premium body HTML) so it explicitly emits three page groups using `[data-pdf-page]` wrappers, in this order:

- Page 1 — Welcome intro + Guest/Booking details card. NO terms.
- Page 2 — Terms & Conditions only (single page, tightened spacing).
- Page 3 — Disclaimer + Signature block + (footer rendered by chrome).

Then change the pager (lines ~1638–1740):

- Replace the height-based `snapBreak` packing with a **page-group packer**: iterate the `[data-pdf-page]` children and render each into its own A4 sheet. No measurement-based splitting at all — the template owns the page boundaries.
- Keep `MAX_PAGES = 3` and remove the "Add page" button (template is locked).
- Keep `[data-pdf-section]` / `[data-signature-block]` atomic guards as a defensive fallback only.

Spacing fixes:
- Page 1: increase top/bottom breathing (FIRST_TOP 56, BOTTOM_PAD 80) so it reads spacious.
- Page 2 (terms): tighten `li` line-height to 1.45 and inter-item gap to 6px so all clauses fit one sheet.
- Page 3: center the disclaimer vertically, signature block under it, footer flush to bottom edge.

## 2) Footer + header chrome (premium, full‑bleed, no white gap)

In `LockedLetterhead.tsx` (the `LockedFooter` component):

- Make footer full-bleed: remove inner side padding wrappers, set `width: 100%`, background `#F7F2EA`, 1px top gold hairline, same vertical rhythm as header (≈ header height).
- Top row: company full legal name on ONE line (`white-space: nowrap; letter-spacing: .04em`), centered.
- Bottom row: 3-column grid — left: office address; center: phone; right: email + website (gold). Uses full width edge-to-edge.
- Remove any margin/padding under the footer in the page sheet (page 3 render: drop the trailing flex spacer so footer touches the sheet's bottom edge — no white gap).

In the page sheet wrapper (DocumentStudio.tsx ~line 1687), on page 3 the footer is positioned `absolute; left:0; right:0; bottom:0` instead of inside the padded body, so it goes edge-to-edge.

## 3) Stamp polish

- In the asset upload pipeline (or render path at ~line 1730): pass the stamp image through the existing `removeWhiteBackground` util (`src/lib/removeWhiteBackground.ts`) when the asset is first attached, cache the transparent data URL on the mark.
- Bump default `width` from 130 → 170 and add `transform: rotate(...) scale(1.05)` so it no longer reads as compressed.

## 4) Language field gold border (header)

The language Select in the topbar (~line 1801 area) currently inherits the default blue focus ring. Override with `className="border-[#B89555] focus:ring-[#B89555] focus:border-[#B89555]"` and remove any `border-input` blue fallback on its trigger.

## 5) Premium welcome intro + guest/booking block

In the body builder (~line 698), replace the current intro with a luxury welcome paragraph + a 2-column guest details card. Fields (all dummy until owner edits on the left form):

- Guest Full Name
- ID Type (Emirates ID Holder / Passport Holder) + ID Number (dummy)
- Nationality
- Date of Booking
- Check-in / Check-out
- Property / Unit
- Booking ID (auto-generated, see §6)

Wire each field to the existing `field_values` map so the left-side editor already updates them. Add the missing keys to the template's field schema.

## 6) Auto-generated Booking ID

- Add a DB sequence-backed generator: migration creating `public.document_booking_seq` sequence + `public.next_booking_id(prefix text)` returning e.g. `JBJ-HH-2026-000123` (prefix derives from template kind: HH = holiday home, CA = commission agreement, PAA = property advertising, etc.).
- On first save of a new `crm_documents` row, server-side trigger fills `field_values->>'booking_id'` if missing, so every saved document gets a unique chained number that survives reloads.

## 7) "Generated Documents" library (persist + browse)

Today `useSaveDocument` already writes to `crm_documents`, but there is no in-app browser grouped by template — the user perceives saves as "lost".

- Add a new panel in `DocumentStudio.tsx` (left rail, below the form): **My Documents**, grouped by `template_id` → collapsible sections ("Holiday Home", "Commission Agreement", "Property Advertising Agreement", …). Click a row → loads that document back into the editor (`setDocId`, `setFieldValues`, etc.).
- Source data: existing `useCrmDocuments()` hook (already returns owner-scoped rows). Group client-side by `template_id` using the template registry.
- After `useSaveDocument` success: invalidate `["crm_documents"]` (already done) AND keep the loaded `docId` so the doc stays open and shows in the list highlighted.
- Also expose this list at `/owner/careers-portal?section=contracts&view=library` so it can be opened standalone.

## 8) PDF export alignment

Update `src/components/document-studio/export/exporters.ts` `exportPdf`:

- Iterate `[data-document-page="true"]` (already in place after last pass) but now also strip the on-screen page chrome margins so each sheet exports as a true edge-to-edge A4 with the new full-bleed footer.
- Confirm page 3 footer renders flush bottom in the PDF.

## 9) QA — E2E checklist

Manually walk:

1. /owner/careers-portal?section=contracts → New → Holiday Home.
2. Confirm page 1 = welcome + guest card, page 2 = terms only, page 3 = disclaimer + signature + footer flush.
3. Verify no white gap below footer on any page; footer full-bleed; company name single line.
4. Verify language Select shows gold border / gold focus ring, not blue.
5. Upload a stamp PNG with white background → confirm background is removed and stamp is larger.
6. Save → reload page → document appears in "My Documents → Holiday Home" with its Booking ID; click reopens it.
7. Export PDF → 3 pages, matches preview exactly.
8. Repeat for one other template (Commission Agreement) to confirm grouping + unique booking ID prefix.

## Technical files touched

- `src/components/document-studio/DocumentStudio.tsx` — page-group packer, intro+guest block, language Select styling, stamp sizing, My Documents panel.
- `src/components/document-studio/LockedLetterhead.tsx` — full-bleed footer, single-line company name, redistributed contact row.
- `src/components/document-studio/export/exporters.ts` — page-group export.
- `src/hooks/useCrmDocuments.ts` — add `useCrmDocumentsByTemplate()` grouping helper.
- `src/lib/removeWhiteBackground.ts` — reused for stamp.
- New migration: `next_booking_id()` sequence + trigger on `crm_documents` to auto-fill `field_values.booking_id`.
- `src/templates/jbjPropertyAdvertisingAgreement.ts` (and sibling templates) — add `booking_id`, `guest_*`, `id_type`, `id_number` field keys where missing.

## Out of scope

- No changes to auth, RLS, or other CRM tables beyond the booking-id trigger.
- No redesign of the left-side editor form beyond adding the new guest/booking fields.
