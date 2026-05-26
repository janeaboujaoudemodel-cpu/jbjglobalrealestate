# Document Studio — Remaining Work Plan

State already landed: name fix, duplicate date removed, "Lang" label removed, commission Notes column dropped, `saved_document_templates` table + RLS, hide/rename/saving state scaffolded.

## Batch A — Left-rail field control + Save Template (UI wiring)
File: `src/components/document-studio/DocumentStudio.tsx`
- Wire `hiddenFieldKeys` / `fieldLabelOverrides` / `editingFieldKey` into the existing `template.fields.map(...)` rows:
  - Hide row when key is in `hiddenFieldKeys`.
  - Inline pencil → edit label (writes to `fieldLabelOverrides`), trash → `hideField(key)`.
  - Use override label everywhere the field title is rendered (rail + preview chips).
- Add "Restore hidden fields (N)" link at top of rail when set is non-empty.
- Add **Save as Template** button in topbar:
  - Opens small dialog (Name input + "Set as default for this audience" checkbox).
  - Persists `{ marks, hiddenFieldKeys, fieldLabelOverrides, ownerName, ownerDate, signatures, partyB, commission }` into `saved_document_templates.payload`.
- Add **My Templates** collapsible at top of left rail listing rows for current `audience`, click → loads payload back into state. Trash icon → delete.

## Batch B — Preview editability + signatures + one-page guard
- Make every visible preview chip click-to-edit (contentEditable span bound to the same `marks`/state used in the rail). Already-editable fields stay; missing ones (party B name, commission %, etc.) get the same affordance.
- Party B signature default `y` set below Party A (no overlap); reserve a stamp slot to the right of founder signature (empty box with "Stamp" hint, owner-uploadable later — slot only for now).
- A4 single-page guard: wrap preview in fixed-aspect container with `overflow-hidden` and shrink-to-fit transform when content height exceeds one page (visual only, export already paginates).

## Batch C — New templates + AI persona upgrade
- Add two composers under `src/templates/composers/`:
  - `commissionInvoice.ts` — invoice header, bill-to, line items, auto-calculated subtotal/VAT/total, payment terms, signature block.
  - `referralAgreement.ts` — parties, referral scope, fee %, payment trigger, confidentiality, signatures. Register both in `src/templates/composers/index.ts` and the Document Studio template picker.
- Upgrade `AiEditChatPanel` system prompt to "UAE-licensed HR director + corporate lawyer" persona; pass current template body so AI rewrites in lawyer-grade prose, citing UAE Labour Law (Federal Decree-Law 33/2021) where relevant. No fabrication.

## Batch D — Export + Send Test reliability + QA
- Audit the export edge function call (PDF/DOCX) — ensure payload includes overrides/hidden keys; surface toast on failure with message from response.
- Send Test always to `infoo.jane@gmail.com` (per user memory), via existing transactional email function; show success/failure toast.
- Manual visual QA pass at `/owner/careers-portal?section=contracts`:
  1. Switch each audience, confirm no duplicate date, no calendar in preview, single date chip controlled from rail.
  2. Hide a field → disappears from preview; rename → reflected in preview.
  3. Save as Template → reload → appears under My Templates → loads back identically.
  4. Party B signature does not overlap Party A; stamp slot visible.
  5. Commission table has 3 columns only.
  6. Export PDF and Send Test both succeed.
- Run `bunx tsc --noEmit` after each batch.

## Out of scope (not requested)
- Real stamp upload UI (only the reserved slot is added now).
- New backend tables beyond `saved_document_templates`.
