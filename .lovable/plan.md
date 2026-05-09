# Smart fields, smart cards & smart status

Three connected upgrades to the Property Advertising Agreement (and any envelope reusing the JBJ template).

## 1. Click-to-delete + hide-empty fields in the rendered document

Goal: empty/non-applicable fields disappear from the PDF; any field can be hit-deleted from the live preview.

### Template changes — `src/templates/jbjPropertyAdvertisingAgreement.ts`

- `fieldUnderline(label, value, key, hiddenSet)` returns `""` when:
  - `value` is empty AND the field is not in a force-shown allow-list (only signature anchors are forced)
  - OR the field key is present in `hiddenSet`
- All section grids switch from rigid 2-col to a flex-wrap row so removed fields don't leave empty columns. Section headers (`sectionTitle`) only render if the section has at least one visible field.
- Each rendered field is wrapped in `<span data-field-key="…">` so the editor can target it.
- New `PAA_LAYOUT_VERSION = 5` to auto-rerender old PDFs.

### EnvelopeDetail edit mode — `src/pages/e-signature/EnvelopeDetail.tsx`

- New `hiddenFields: string[]` persisted in `esign_envelopes.metadata.hidden_fields`.
- Live preview iframe gets a click overlay: clicking any `[data-field-key]` shows a small "Remove this field?" popover (champagne card). Confirm → adds key to `hiddenFields` → re-renders PDF.
- New "Manage fields" panel listing each field with eye/eye-off toggle so the user can also un-hide.
- "Edit any time": existing inline edit form already supports all fields; we lift the current `isDraft`-only gate so editing is allowed for any non-`completed`/`declined` envelope. For `completed` envelopes, edits are blocked but a "Clone & edit" action creates a new draft from the same data.

## 2. Status: stop calling completed-by-user envelopes "Draft"

A "draft" implies unfinished. Once the user has saved the filled fields the envelope is **Ready** even if not yet sent for signature.

### Logic

Introduce a virtual display status computed on the dashboard + detail header:

```text
DB status `draft` + has_required_fields filled  →  display "Ready"  (slate badge)
DB status `draft` + missing required fields     →  display "Draft"  (amber badge)
DB status `sent` / `viewed` / etc.              →  unchanged
```

`has_required_fields` = `landlord_name` + `mobile_number` + at least one property identifier (`building_name` OR `community_name` OR `property_reference_no`) are non-empty.

This is a pure UI/derivation change — the underlying enum stays `draft` so existing send/sign flows are not disturbed. When the user clicks "Send for signature", DB transitions to `sent` exactly as today.

The detail page header swaps the title from generic "Draft" to the agreement number, e.g. **`JBJ-PAA-LEASING-0007 · Ready`**, with the template label as a smaller subtitle.

## 3. Dashboard cards: show client + key context

Goal: from the list view I can already tell which agreement is which.

### `src/pages/e-signature/ESignatureDashboard.tsx`

Each card grows to show, in priority order:

1. Doc number badge (existing) + computed status badge (Ready / Draft / Sent…)
2. Client name (existing) — bold, primary
3. Sub-line of context built from filled fields (each piece omitted if empty):
   - Property type · Building / Community
   - Mobile number (masked: `+971 5• ••• ••67`)
   - Email (masked: `j•••@d•••.com`)
4. Template label (existing, demoted to small text)
5. Footer: recipient count + last updated (existing)

Privacy: phone/email are masked on the list view to comply with the project's "never show contact info publicly" rule; full values remain on the detail page only.

Search: extend the existing search-by-name to also match against `landlord_name`, `mobile_number`, `building_name`, `community_name`, and `doc_number`.

## Out of scope

- New DB columns or RLS changes — `metadata.hidden_fields` reuses the existing JSONB.
- Listing Authorisation template (separate file) — this round only updates PAA. The same hide-empty pattern can be ported in a follow-up.
- New send/share flows — they already exist and are untouched.

## Files touched

- `src/templates/jbjPropertyAdvertisingAgreement.ts` — hide-empty + `data-field-key` + `PAA_LAYOUT_VERSION = 5`.
- `src/pages/e-signature/EnvelopeDetail.tsx` — click-to-delete overlay, "Manage fields" panel, edit-any-time gate, header shows agreement number + computed status, "Clone & edit" for completed.
- `src/pages/e-signature/ESignatureDashboard.tsx` — richer cards, masked contact lines, computed status, broader search.
- New helper `src/pages/e-signature/envelopeStatus.ts` — `computeDisplayStatus(envelope)` + masking helpers, shared by both pages.
