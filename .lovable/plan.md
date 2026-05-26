
## Scope

Several connected fixes to `/owner/careers-portal` Contracts → Document Studio, plus one navigation bug. No backend logic change beyond a new `saved_document_templates` table for "Save as Template".

---

## 1. Save as Template (new)

- Add **Save Template** button in the topbar (next to Export/Print).
- Captures: current `templateId`, `fields`, `commissionRows`, `customFields`, `bodyHtml` (post-edits), `marks` (signature/stamp positions), `docLanguage`, optional user-provided name.
- New table `saved_document_templates` (owner-scoped, RLS by `auth.uid()`).
- New "My Templates" group at the top of the left rail template gallery; click loads the saved snapshot into Step 2 with everything pre-filled and editable.
- **Save Template & Adopt as Standard**: second menu item that marks the saved row `is_default = true` for that base template id, so next time that base template is opened it auto-applies the saved overrides.

## 2. Preview / editing fixes

- **Remove duplicate underlined date** in body — keep only the left-rail-controlled `letterDate`.
- **Remove calendar popover** on the body date. Date in preview becomes plain inline-editable text (gray ink, no highlight, no label chip). Calendar input stays only in the left rail field.
- **Remove highlight/label color** behind the date in preview.
- **Remove Notes column** from commission rows table (and from custom-fields default seed).
- **Fix overlapping Party B / Applicant Signature** — currently rendered absolutely inside the commission paragraph. Move signature block to a dedicated footer slot beneath the closing paragraph, above the JBJ founder signature row, with explicit page-break guard so the document still fits one A4.
- **Single A4 page guard**: enforce `max-height: 1123px` on `.jbj-page main` and shrink internal spacing if overflow detected (compact mode auto-toggle).
- **Stamp slot**: reserve a fixed 140×140 transparent stamp area next to the "Jameel Bou Jaoude · Founder & CEO" signature line + date. Clicking it opens the asset library (existing flow).
- **Make every preview field editable**: convert all spans currently rendered as plain text to `contentEditable` with the existing inline toolbar, and write back into `fields` / `bodyHtml`. Includes header recipient, dates, addresses, body paragraphs, signature labels.
- **Name spelling**: replace every occurrence of `Jaude` with `Jaoude` in code + composers + defaults.

## 3. Language picker visibility

- Remove the word "Language" label next to the picker.
- Move the Globe-only `<Select>` from the AI panel collapsed state into the **DocumentStudio topbar** (always visible regardless of AI panel open/closed).
- Remove the now-redundant "Live Document Editor" label.

## 4. Left-rail field CRUD

- Each field row in the left rail gets a trailing **pencil (rename)** and **trash (delete)** button.
- Rename updates the field's display label only for the current document.
- Delete removes the field from preview + form.
- Custom fields list already supports add; align styling so built-in fields share the same controls.
- "Save Template" persists these per-template edits as the new standard for that template (per §1).

## 5. Commission Structure UI

- Remove `paid / paid / trigger` columns and the duplicate "Paid" pill in the preview.
- Single editable column: **Commission % (broker share)** with numeric input.
- Auto-calc preview line: `Deal Value × Developer Commission % × Broker Share %` → "Broker Settlement: AED X".
- Remove the "Notes" column entirely.

## 6. New templates (legal/HR grade)

Add to `src/config/documentCatalog.ts` + composers:

1. **Broker / Partner Commission Invoice**
   - Fields: invoice no., date, payee name & type (broker/referrer/partner), developer, project, unit, deal closed date, deal value (AED), developer commission %, broker/partner share %, amount paid (auto), amount pending (auto), payment method, bank details (optional).
   - Body computes settlement automatically; includes UAE-compliant **full & final settlement / release** clause: "The Payee acknowledges receipt of all sums due from JBJ GLOBAL REAL ESTATE L.L.C in respect of the above transaction and irrevocably releases the Company from any further claims…".
   - Signature blocks: Payee + JBJ Founder, stamp slot.
2. **Referral Agreement** (with 1 or 2 structures toggle)
   - Structure A: Referrer introduces lead, JBJ closes → X% of net commission.
   - Structure B: Referrer closes independently (no JBJ involvement in negotiation) → Y% of net commission.
   - Editable percentages, non-circumvention 24-month clause, UAE governing law.

Both templates fully integrated with field CRUD, save-as-template, signature/stamp slots.

## 7. AI as "HR + Lawyer" upgrade

- Update `AiEditChatPanel` system prompt: persona is **"UAE-qualified HR director and corporate lawyer specialising in Federal Decree-Law 33/2021 and RERA"**. Every edit must:
  - Preserve mandatory UAE labour clauses (probation, notice, gratuity, working hours, leave).
  - Cite the relevant article when materially changing a clause.
  - Refuse edits that violate UAE law and propose a compliant alternative.
- Apply same upgraded prose to existing template `intros` / `closings` in `src/templates/composers/standardBody.ts` so the deterministic baseline is already lawyer-grade.

## 8. Export & Test Email fixes

- Debug `exportPdf` / `exportDocx` / "Send test to infoo.jane@gmail.com" path.
- Likely causes to verify: (a) `bodyHtml` empty because new contentEditable fields not flushed on blur, (b) DOMPurify stripping signature/stamp `<img>` data URLs, (c) edge function `send-document-test` missing or 401.
- Ensure Export button shows toast on error and resolves to a downloaded file. Test email always goes to `infoo.jane@gmail.com` per user pref.

## 9. Portal sidebar expand-then-redirect bug

- In the vertical sidebar item for **Portal** (`/owner/careers-portal` portal entry), the click currently both toggles the expandable children and navigates. Change behaviour: clicking the row navigates only and does NOT expand a child group; remove the now-empty expansion chevron. Children that previously appeared under it are top-level items inside the portal page itself, not the sidebar.

---

## Technical Section

### Files to edit
- `src/components/document-studio/DocumentStudio.tsx` — topbar (Save Template, language picker move, remove label), preview editing, single-A4 guard, stamp slot, name fix, field CRUD wiring.
- `src/components/document-studio/AiEditChatPanel.tsx` — remove inline language picker (now in topbar), upgrade system prompt.
- `src/components/document-studio/LockedLetterhead.tsx` — stamp slot anchor next to founder signature; remove duplicate date.
- `src/templates/composers/standardBody.ts` — Jaoude fix; legal-grade prose; remove second date insertion; signature block move.
- `src/templates/composers/index.ts` — new composers `commissionInvoice`, `referralAgreement`; drop commission "notes"/"paid" columns.
- `src/config/documentCatalog.ts` — register two new templates under HR + Broker audiences.
- `src/components/document-studio/export/exporters.ts` — flush contentEditable before export; whitelist data URLs in DOMPurify; surface errors via toast.
- New table migration `saved_document_templates(id, owner_id, base_template_id, name, payload jsonb, is_default bool, created_at, updated_at)` with RLS `owner_id = auth.uid()` and full GRANTs.
- New hook `src/components/document-studio/useSavedTemplates.ts`.
- Sidebar fix: locate the Portal entry in `src/components/owner/OwnerSidebar*.tsx` (or whichever sidebar renders `/owner/careers-portal`) and remove `children`/expand behaviour for the Portal node.

### Out of scope
- No design overhaul (UI already approved).
- No changes to global theme tokens or other portals.
