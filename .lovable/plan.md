## Why nothing opens today

You're on `/e-signature/810df24a-…` (the draft for **Omar Alam Niazi Shah**). The page loads fine, but `EnvelopeDetail.tsx` only renders Recipients, Activity Log and a small sidebar — **it never embeds the document itself, and a draft has no Send / Open / Print / Share buttons**, so the only thing you can grab is a "Copy signing link" (the dirty `*.lovable.app/sign/<token>` URL). That's the whole reason "preview is not showing" and "I cannot open it." The PDF is already generated and stored — we just aren't displaying or acting on it.

## What we'll build

### 1. Real document preview + actions on the envelope page (the core fix)

In `src/pages/e-signature/EnvelopeDetail.tsx`, add a top-of-page **Document** card that shows:

- An inline `<iframe src={envelope.document_url} />` rendering the PDF (full A4 height, scrollable). For drafts, we re-render `template_html` into the iframe so edits are reflected instantly without re-uploading; once sent, we show the stored PDF.
- A **document number badge** like `JBJ-PAA-LEASING-0001` (see §3) next to the title.
- An action bar with these buttons, all working on both drafts and sent/signed envelopes:
  - **Open in new tab** — opens the PDF URL.
  - **Print** — `window.print()` on a hidden print frame containing the rendered HTML, so it prints with the JBJ letterhead/footer.
  - **Download PDF** — uses existing `maybeProxyStorageUrl`.
  - **Share via Email** — opens the existing email composer prefilled with the document attached (we already do this for signed docs; extend to any status).
  - **Share via WhatsApp** — `https://wa.me/<recipient_phone>?text=…signing link…` using the recipient's `signing_token` so it goes straight to the sign page; falls back to a generic WhatsApp web link if no phone.
  - **Copy signing link** — already there; we'll keep it but rename to "Copy client signing URL" and label it as the secondary option.
  - **Send for signature** — only visible when `status='draft'` and at least one recipient exists; calls the existing `esign-send-for-signature` edge function (currently only reachable from `CreateEnvelope`). Optimistically flips status and refreshes.

### 2. Always-editable fields panel

Right under the document preview, a collapsible **Edit fields** panel reads `envelope.template_field_values` and reuses the exact `PAA_FIELD_GROUPS` from `jbjPropertyAdvertisingAgreement.ts` — same inputs as the "Add property & contract details" section in the Use Template dialog. Saving:

1. Updates `template_field_values` on the envelope row.
2. Re-runs `buildPAAHtml(values)` → re-renders to PDF via the same `html2canvas + jsPDF` path used in `useCreateEnvelopeFromTemplate`.
3. Re-uploads to the same storage object (overwrite) and bumps `document_size_bytes`.
4. Refreshes the iframe.

Editing is allowed at any status; for `sent`/`completed` we show a confirmation: *"Editing will void the current signature request and require re-sending."* — and on confirm, voids existing recipient tokens and resets status to `draft`.

### 3. Branded document number (JBJ-PAA-LEASING-0001…)

- Add a sequence column `doc_seq INT` and a generated `doc_number TEXT` to `esign_envelopes` (or store the formatted number in `metadata.doc_number` to avoid a DB migration risk on existing rows). Per-template-key counter.
- Migration: create `public.esign_doc_counters(template_key TEXT PRIMARY KEY, last_seq INT NOT NULL DEFAULT 0)` and a `SECURITY DEFINER` RPC `next_doc_number(template_key TEXT)` that increments and returns `JBJ-PAA-LEASING-0001` for `jbj-paa-leasing`, `JBJ-LA-SELLING-0001` for `jbj-listing-authorisation-selling`, etc.
- `useCreateEnvelopeFromTemplate` calls `next_doc_number` before insert and stores the result in both `metadata.doc_number` and the rendered HTML (top-right of letterhead). Existing draft `810df24a…` will get number **0001** by a one-time backfill in the migration.

### 4. AI smart-fill from passport / Emirates ID / title deed / unit photo

In the **Use template** dialog (and in the new edit panel on the detail page), add a drag-and-drop zone "Upload passport, Emirates ID, title deed, unit photo or any document — AI will fill the form." Behavior:

- Accepts multiple files at once (PDF / JPG / PNG / HEIC).
- Calls the existing `document-extractor` edge function (already deployed) with each file. It already does OCR via Lovable AI Gateway. We add a **`schema_hint: "jbj_paa_leasing"`** parameter so it returns a typed payload mapping to `PAAFieldKey` (landlord_name, passport_number, emirates_id, mobile_number, email_address, building_name, unit_number, community, bua_sqft, bedrooms, bathrooms, rental_amount, etc.).
- Server-side prompt: pass the `PAA_FIELD_GROUPS` JSON as the target schema and ask Gemini to fill what it can, leaving missing fields empty. Confidence per field returned.
- Client merges the result into `extraValues`, highlighting AI-filled cells with a small "AI" chip you can click to clear or override. Nothing sends until you press Create / Save.

### 5. CC recipients on send (add / delete / bulk)

`esign-send-for-signature` already accepts a recipient list. We'll:

- Add a **CCs** section to the send panel on the detail page: free-text email input, "Add" button, removable chips, an "Add me as CC" shortcut (uses `auth.user().email`), and a "Bulk paste" textarea (newline / comma split).
- Persist the CC list in `envelope.metadata.cc_emails`.
- Edge function: BCC the CCs on the outbound notification email AND on the final "completed" email so everyone receives the signed PDF.

### 6. Live status sync

Subscribe in `EnvelopeDetail` to the `esign_recipients` and `esign_envelopes` realtime channels (Supabase Realtime is already wired in this project). When the recipient signs, the page flips from *Sent → Viewed → Signed → Completed* without refresh, and a toast fires. The Activity Log auto-appends.

### 7. Clean signing link

The `/sign/<token>` route already exists (`PublicSignDocument` → `SignDocument`). We'll:

- Render the document number in the page header instead of the raw envelope id, so links shared via WhatsApp/email show e.g. **JBJ-PAA-LEASING-0001 — Property Advertising Agreement**.
- Keep the URL exactly `https://jbj.ae/sign/<token>` when sending in production (we'll route off `*.lovable.app` by reading `window.location.origin` only as a fallback and prefer the configured custom domain `jbj.ae` from `src/config/backend.ts`).

## Files touched

- **edit** `src/pages/e-signature/EnvelopeDetail.tsx` — preview iframe, action bar (Open / Print / Download / Email / WhatsApp / Send), Edit Fields panel, CC manager, realtime subscription, document-number badge.
- **edit** `src/hooks/useEsignTemplates.ts` — call `next_doc_number` RPC, write `metadata.doc_number`, render number into HTML.
- **edit** `src/templates/jbjPropertyAdvertisingAgreement.ts` — add a `{{doc_number}}` slot in the letterhead.
- **new** `src/components/e-signature/SmartFillDropzone.tsx` — drag-and-drop AI extractor reused by the Use Template dialog and the Edit Fields panel.
- **edit** `supabase/functions/document-extractor/index.ts` — accept `schema_hint` and return mapped fields with confidences (Lovable AI Gateway, model `google/gemini-3-flash-preview`).
- **edit** `supabase/functions/esign-send-for-signature/index.ts` — accept and BCC `cc_emails`; include them on completion.
- **migration** — `esign_doc_counters` table + `next_doc_number(template_key)` RPC + backfill `metadata.doc_number` for existing envelopes.

## Out of scope (not changed)

- The PAA template wording, fields, and PDF layout (already approved).
- Existing `/sign/<token>` signing UX, audit-log certificate, stamp/signature studio.
- Templates other than PAA Leasing and Listing Authorisation.
- Switching away from the existing `esign-send-for-signature` / Resend stack.
