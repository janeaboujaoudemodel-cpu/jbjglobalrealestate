
# Phone fix + Template title + Drafts UX + Verification

## 1. Unify phone to +971 54 716 7107

Currently the e-signature emails and preview dialog use a stale number `+971 56 591 1000`. The correct number across the platform is `+971 54 716 7107`. Replace in:

- `supabase/functions/esign-send-for-signature/index.ts` (lines 94, 156)
- `supabase/functions/esign-send-test-email/index.ts` (lines 75, 136)
- `src/components/e-signature/SendForSignatureDialog.tsx` (line 419 — preview footer; line 343 input placeholder stays since that's a sample, not our number)

The premium signature (`Founder & CEO`) and document footer in `esign-complete-envelope` already use the correct number — leave as-is.

## 2. Template title cleanup — Property Advertising Agreement

In `src/templates/jbjPropertyAdvertisingAgreement.ts`:

- Remove `<br/><span style="font-weight:700;">FOR REAL ESTATE OWNERS</span>` from line 295.
- Centre the title block as a single luxury heading: `PROPERTY ADVERTISING AGREEMENT` in uppercase, letter-spacing `.22em`, with a thin gold hairline divider underneath, centred over the page.
- Update the file's top-of-file comment string to drop "for Real Estate Owners".
- Polish the cover header band (gold hairline, JBJ wordmark, doc number on the right) and the footer (one-line: `CONTACT@JBJ.AE · WWW.JBJ.AE · +971 54 716 7107` with a `JBJ GLOBAL REAL ESTATE` / page number row above) so both look truly premium and match the generated email shell.

## 3. Drafts UI — bulk select / delete-all / Recently Deleted

In `DocumentsFormsHub.tsx` (drafts list area), wire the existing `deleted_at` soft-delete column + RPCs (`restore_esign_envelopes`, `purge_deleted_esign_envelopes` from the prior migration):

- Add a checkbox column + "Select all on this view" / "Clear selection".
- Bulk action bar: **Delete selected**, **Delete all visible**.
- Add a tab/segment toggle: **Drafts** | **Recently Deleted**.
  - Drafts list filters `deleted_at IS NULL`.
  - Recently Deleted list filters `deleted_at IS NOT NULL` and shows a "Days left" countdown (30 days from `deleted_at`).
  - Per-row + bulk **Restore**; bulk **Delete forever** for hard purge.
- Allow template form creation without a client email (skip the required-email guard; insert envelope as `status = 'draft'` with whatever fields are filled in).

Cache invalidation hits `["esign-envelopes"]` after every mutation.

## 4. CRM merge + dropdown filters (queued continuation)

Resume the queued CRM work:

- Run the canonical merge into `crm_contacts` via `upsert_contact_with_company` for any leftover legacy rows in `rel_*` / `jbj_*` tables, deduped by lowercase email.
- Add the missing dropdown filters (Stage, Source, Owner, Tag) on the CRM list page using the same query-param pattern as the global filter system. Filters reset together via a single "Clear" chip.

(Scope held to UI + read paths — no schema changes; the unified-CRM tables already exist.)

## 5. End-to-end verification + screenshots

After deploy of the three edge functions and frontend changes:

1. Create an incomplete template (no client email) → confirm it lands in **Drafts** with whatever fields exist.
2. Bulk-select two drafts → **Delete selected** → confirm they vanish from Drafts and appear in **Recently Deleted** with a "30 days left" badge.
3. **Restore** one → confirm back in Drafts; **Delete forever** the other → confirm gone.
4. Send a real signature email → check footer phone reads `+971 54 716 7107`, title reads only "Property Advertising Agreement", header/footer look premium.
5. Click **Review & Sign Document** in the email → sign → submit → confirm sender notification (bell + inbox), signed PDF appears under `/e-signature` Signed tab, downloads work.

Capture screenshots of each verified step and attach them to the response.

## Files touched

- `supabase/functions/esign-send-for-signature/index.ts`
- `supabase/functions/esign-send-test-email/index.ts`
- `src/components/e-signature/SendForSignatureDialog.tsx`
- `src/templates/jbjPropertyAdvertisingAgreement.ts`
- `src/pages/.../DocumentsFormsHub.tsx` (+ small helper for soft-delete/restore)
- CRM list page (filters) + a one-shot merge helper

No new migrations (soft-delete + RPCs already shipped).
