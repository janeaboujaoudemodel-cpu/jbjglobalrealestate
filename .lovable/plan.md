
## Goal

Stop building the in-house signature tool. Replace the public `/sign/:token` signing experience with a **"Sign via DocuSign"** handoff page that:

1. Tells the recipient the agreement must be signed in **DocuSign** (the only government-approved e-signature in UAE per the user).
2. Provides a **"Download DocuSign"** button → App Store link (and Play Store fallback).
3. Provides a **"Download Agreement PDF"** button so they can open the file in DocuSign.
4. Instructs them to sign in DocuSign and **email the signed PDF back** to a monitored inbox.
5. After the signed PDF arrives by email, the system files it into the owner's **Signed Contracts** section and triggers the existing **thank-you email** to the client.

All other e-sign infrastructure (envelopes, templates, drafts, CRM linkage, audit log, owner inbox, thank-you email, PDF storage) **stays exactly as built** — only the in-app signature pad / field placement / token-based signing UI is bypassed.

---

## Scope

### A. Signing handoff (replaces in-app signing)

**File:** `src/pages/e-signature/SignDocument.tsx`

Replace the existing field-placement / signature-pad UI with a single branded "DocuSign Handoff" card containing:

- JBJ header + envelope title + sender name
- Step 1 — **Download DocuSign** (primary button)
  - iOS App Store: `https://apps.apple.com/app/docusign/id474990205`
  - Google Play (secondary link): `https://play.google.com/store/apps/details?id=com.docusign.ink`
- Step 2 — **Download Agreement** (downloads the envelope's source PDF from storage via the existing `download-file` proxy with auth headers, same fix already applied in `ExportEnvelopeDialog`)
- Step 3 — Instructions: "Open the file in DocuSign, follow the on-screen prompts to sign, then email the signed copy to **contracts@jbj.ae**." (Email address configurable — see Technical section.)
- Step 4 — "I've sent the signed copy" button → posts to a new edge function `esign-mark-awaiting-return` which sets envelope status to `awaiting_signed_return` and notifies the sender.
- Keep the four terminal screens (error / expired / completed / declined) and the "Return to Homepage" button already added.

**Removed from this page:** PDF.js viewer with field overlays, `ESignaturePad`, signature/initial/date input flow, `esign-submit-signature` invocation. Code stays in repo (used by owner-side adopt studio) but is no longer reachable from the public token URL.

### B. Envelope status model

Add status `awaiting_signed_return` between `sent` and `completed`. Existing statuses (`draft`, `sent`, `completed`, `declined`, `expired`, `voided`) are preserved.

### C. Inbound signed-PDF capture

Two acceptance paths:

1. **Owner manual upload (built now):** In `EnvelopeDetail.tsx`, add an "Upload signed PDF" action visible when status is `sent` or `awaiting_signed_return`. Uses existing `esign-signed-documents` storage bucket + `esign_signed_documents` table; on upload, sets envelope `completed`, writes audit row, fires the existing thank-you email via `esign-complete-envelope` (refactored to skip PDF generation when an externally-signed file is supplied).
2. **Email ingestion (stub now, documented for later):** Edge function `esign-ingest-signed-email` placeholder + README note. Requires an inbound email provider (Resend Inbound / Mailgun) — flagged as a follow-up that needs a connector decision; no secrets requested in this turn.

### D. Template wording update

Inject a standard preamble into all templates in `src/templates/*.ts` and the dynamic envelope email body:

> "This agreement must be signed using **DocuSign**, the only e-signature platform officially recognised by UAE authorities. If you do not have the app, download it here: [App Store] [Google Play]. Open the attached PDF in DocuSign, complete the signature, and email the signed copy back to contracts@jbj.ae."

Implementation: add `src/config/docusignHandoff.ts` (links + copy + return email) and reference it from the template renderer and the SignDocument page so wording stays in one place.

### E. Outbound envelope email

`supabase/functions/esign-send-envelope/index.ts` (existing) — append the DocuSign handoff block to the email body and attach the source PDF directly (so the recipient doesn't need to revisit the link). The token URL still works as a fallback landing page.

### F. Remaining items from previous turn

1. **Drafts: bulk-select + Recently Deleted**
   - `src/pages/e-signature/EnvelopesList.tsx` (or equivalent drafts view): add row checkboxes, "Select all", bulk **Delete** + bulk **Send** actions.
   - Soft-delete: add `deleted_at` column to `esign_envelopes` (migration), update RLS/select queries to filter out soft-deleted by default.
   - New tab **Recently Deleted** showing rows where `deleted_at` is within 30 days, with **Restore** and **Delete forever** actions.

2. **Allow template creation without client email**
   - `src/components/crm/SendAgreementDialog.tsx` and the standalone "Create envelope from template" page: allow `Create Envelope` when `lead.email_lower` is empty by saving as `draft` (no send). Currently blocked by the `disabled={!lead?.email_lower}` guard and the early `toast.error("This lead has no email address")`.

3. **CRM merge & dropdown filters**
   - Merge: in the CRM leads grid, add multi-select + "Merge selected" → opens dialog showing field-by-field picker, calls existing `crm-merge-contacts` RPC (or creates one if absent — verify in `supabase/functions/`).
   - Dropdown filters: convert the current free-text filter row into shadcn `<Select>` dropdowns for **Lead type**, **Stage**, **Source**, **Owner**, **Tag**. Persist selection in URL search params per the Global Filter System standard.

4. **Repair signed-document download** (already partially fixed via `maybeProxyStorageUrl`) — verify on Omar's envelope and on a freshly uploaded signed PDF.

5. **Full E2E screenshots** — Playwright/manual run capturing:
   - Send envelope → recipient opens token URL → sees DocuSign handoff
   - Owner uploads signed PDF → envelope completes → thank-you email logged
   - Drafts bulk select + restore from Recently Deleted
   - CRM merge + dropdown filter applied
   - Signed PDF downloads from owner detail view without auth error
   Screenshots saved to `/mnt/documents/esign-e2e/` and listed as `<lov-artifact>` tags in the final reply.

---

## Technical notes (for the engineer/agent)

- **New config file** `src/config/docusignHandoff.ts`:
  ```ts
  export const DOCUSIGN_APP_STORE = "https://apps.apple.com/app/docusign/id474990205";
  export const DOCUSIGN_PLAY_STORE = "https://play.google.com/store/apps/details?id=com.docusign.ink";
  export const SIGNED_RETURN_EMAIL = "contracts@jbj.ae"; // confirm with user
  ```
- **Migration:** `ALTER TABLE esign_envelopes ADD COLUMN deleted_at timestamptz;` + partial index `WHERE deleted_at IS NULL`. Update RLS select policies to keep current behaviour (owner sees own rows incl. deleted; recipient token resolver filters out deleted).
- **Migration:** extend `esign_envelope_status` enum with `awaiting_signed_return` (use `ALTER TYPE ... ADD VALUE IF NOT EXISTS`).
- **Edge function refactor:** `esign-complete-envelope` gains a branch — if `external_signed_file_path` is provided, skip pdf-lib coordinate work and use the uploaded file as-is; still write audit row, signed_documents row, fire notifications + thank-you email.
- **New edge function:** `esign-mark-awaiting-return` — small status flip + sender notification.
- **Deferred:** inbound-email auto-ingest (needs Mailgun/Resend Inbound setup; flag for follow-up).
- **Do NOT touch:** `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `.env`, `supabase/config.toml` project-level settings.

---

## Out of scope

- Building any further in-app signature pad / field placer features for the public flow.
- Inbound email auto-parsing (stubbed; requires connector + user approval of return-address).
- Government registration / DocuSign API integration (handoff is link-based, not API-based, per user request).

---

## Open question (one)

Confirm the **return email address** clients should send signed PDFs to. Plan currently uses `contracts@jbj.ae` — change before implementation if different.

---

## Verification

1. Open `/sign/<live-token>` → DocuSign handoff card renders with both app store buttons + agreement download + return instructions.
2. Owner opens envelope detail → "Upload signed PDF" works → status flips to `completed` → thank-you email logged in `email_send_log` → file appears in Signed Contracts section.
3. Drafts tab: select 3 drafts → Delete → they move to Recently Deleted → Restore one → it returns to Drafts.
4. SendAgreementDialog: pick a lead with no email → Create Envelope succeeds and lands on draft detail.
5. CRM: select two duplicates → Merge → resulting record has chosen fields; dropdown filters update URL params and persist on reload.
6. Download signed PDF from `EnvelopeDetail` works without "Authentication required" error.
7. Screenshots written to `/mnt/documents/esign-e2e/` and surfaced as artifacts.
