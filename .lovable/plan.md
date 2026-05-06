
## What exists today

Two parallel signing systems live in the project — they were never wired together, which is why `/sign/:token` says "unable to load document":

**Engine A — Real e-Signature (working, DocuSign-style)**
- Pages: `ESignatureDashboard`, `CreateEnvelope`, `EnvelopeDetail`, `SignDocument` (`/sign/:token`)
- Tables: `esign_envelopes`, `esign_recipients`, `esign_fields`, `signed_contracts`, `esign_signature_assets`, `esign_stamp_assets`
- Edge functions: `esign-send-for-signature`, `esign-process-signature`, `esign-complete-envelope`, `apply-adopt-signature`, `esign-auto-detect-fields`, `esign-send-reminder`
- Flow: upload PDF → drag fields (signature, initials, date, text, stamp) onto pages → add recipients → send → recipient opens `/sign/:token` → signs → PDF stamped → stored in `signed_contracts` → emailed to all parties
- Already supports: saved signature/stamp assets (`useOwnerSignatureAssets` + `apply-adopt-signature`), audit trail, multi-recipient routing
- Migration just landed: `esign_envelopes` now has `category`, `template_key`, `template_html`, `template_field_values`, `client_lead_id`; new `esign_templates` table with `field_schema` exists; RLS recursion fixed

**Engine B — Legacy PAA "Forms Hub" (the one giving you the error)**
- Page: `/owner/documents` → `DocumentsFormsHub.tsx`
- Tables: `crm_documents` (HTML form values, no PDF, no drag-drop fields)
- Edge functions: `documents-send`, `documents-public-fill`
- Public route: `/documents/sign/:token` → `PublicSignDocument.tsx` (single signature pad on rendered HTML)
- Template: only the JBJ Property Advertising Agreement, hard-coded in `src/templates/jbjPropertyAdvertisingAgreement.ts`
- This engine has no field placement, no stamp, no auto-date, no client signature placeholder, no integration with the saved signature/stamp library

The `/sign/:token` link you visited literally has the placeholder text `:token` — there is no envelope or document for it. Engine A returns "invalid link", and the fallback to Engine B 404s.

## What's missing

1. The two systems must become one. Right now Forms Hub doesn't talk to the e-Signature engine at all.
2. Leasing/Selling templates don't exist as reusable templates — only the single hard-coded PAA HTML.
3. Saved signature/stamp/auto-date are not auto-placed when the owner opens a template (you have to drag them every time).
4. CRM has no "Send Agreement" button that pre-fills the client and opens a template.
5. WhatsApp delivery of the signing link is not yet wired into `esign-send-for-signature` (only email works).

## Plan

### 1. Make templates first-class (Leasing + Selling)

Seed two system templates into `esign_templates`:
- `jbj-paa-leasing` — the existing Property Advertising Agreement (category = `leasing`)
- `jbj-listing-authorisation` — Selling listing authorisation (category = `selling`), based on the same legal frame
Each template stores: `name`, `category`, `html_body`, and `field_schema` (the default positions for Owner Signature, Owner Stamp, Auto-Date, Client Signature, Client Initials, plus any text fields the owner wants pre-placed).

You will be able to add more templates yourself from the hub.

### 2. Rebuild `DocumentsFormsHub` as the unified Documents hub

Single page at `/owner/documents` with tabs:
- **Templates** — chips: All / Leasing / Selling. Cards for every template. Buttons: "Use template" (creates a draft envelope) and "Edit template" (opens the template editor — change HTML, add/remove/move fields, save).
- **Drafts / Sent / Signed** — pulls from `esign_envelopes` filtered by status, with the Signed tab showing the final stamped PDF + audit trail from `signed_contracts`.
- **Stamps & Signatures** — your existing saved-asset library (`esign_signature_assets`, `esign_stamp_assets`), with one designated "Default" for each.

"Use template" will:
1. Render the template HTML to a single-page PDF (jsPDF + html2canvas) and upload it as the envelope's `document_url`
2. Create an `esign_envelopes` row with `template_key`, `template_html`, `category`
3. Pre-place fields from `field_schema` on that PDF page
4. Open `CreateEnvelope` with everything pre-filled, ready to set the recipient and send

### 3. Auto-fill (signature, stamp, date) in `DocumentFieldPlacer`

When the owner drops or opens a field on the editor:
- `type = date` → today's date is filled in automatically
- `type = signature` and recipient role = owner → preload `defaultSignatureAsset.image_url`
- `type = stamp` and recipient role = owner → preload `defaultStampAsset.image_url`
- `type = signature` and recipient role = client → stays empty/pending until the client signs at `/sign/:token`
The owner can still click any field to swap the asset.

### 4. Send → Sign → Save workflow (using Engine A end-to-end)

1. Owner clicks **Send for Signature** in `CreateEnvelope`
2. `esign-send-for-signature` creates `esign_recipients` with a unique `signing_token`, emails the client via Resend (BCC `contact@jbj.ae`), optionally sends a WhatsApp link (`wa.me` fallback if Twilio isn't configured)
3. Client opens `/sign/:token` → `SignDocument.tsx` loads the PDF, draws the fields, lets them sign/initial
4. `esign-process-signature` writes their signature into the field, `esign-complete-envelope` flattens the PDF, writes a row to `signed_contracts`, marks the envelope `completed`
5. Final signed PDF is emailed to both parties and visible under the **Signed** tab in the hub. Downloadable from there.

### 5. CRM "Send Agreement" button

In `CRMLeadDrawer` add a button that opens a template picker (filtered to Leasing or Selling depending on lead type), pre-fills client name/email/phone from the lead, sets `client_lead_id` on the envelope, and jumps straight to `CreateEnvelope`.

### 6. Decommission Engine B safely

- Keep `crm_documents` table for audit/history but stop writing to it
- Remove `/documents/sign/:token` route and `PublicSignDocument.tsx`
- Delete edge functions `documents-send` and `documents-public-fill`
- Add a redirect helper so any old `/documents/sign/:token` link surfaces a clear "this link is no longer valid — please request a new one" page

### 7. Redeploy

After the code changes I will redeploy: `esign-send-for-signature`, `esign-process-signature`, `esign-complete-envelope`, `apply-adopt-signature`, `esign-auto-detect-fields`, `esign-send-reminder`. Engine B functions get deleted.

## Where you'll find everything after the merge

- **Sidebar → Documents** → unified hub
  - **Templates** (Leasing / Selling chips) → Use template / Edit template
  - **Drafts** → envelopes you haven't sent yet
  - **Sent** → awaiting signature, with reminder + revoke
  - **Signed** → final PDFs, downloadable
  - **Stamps & Signatures** → set default
- **CRM lead drawer** → "Send Agreement" button
- **Public link** → `/sign/:token` (the real one with a UUID, not the literal `:token`)

## Technical details

- Migration adds two seed rows in `esign_templates` for Leasing + Selling, with `is_system = true` and pre-positioned `field_schema`
- New helper `useEsignTemplates()` for CRUD on templates
- New helper `createEnvelopeFromTemplate(templateKey, lead?)` that does HTML→PDF→upload→envelope insert→fields insert
- `DocumentFieldPlacer.tsx` reads `useOwnerSignatureAssets` and auto-applies on drop based on field type and recipient role
- `esign-send-for-signature` extended: optional `channel: "email" | "whatsapp" | "both"`; WhatsApp uses Twilio if `TWILIO_*` secrets exist, else opens `https://wa.me/<phone>?text=<link>` from the client
- `SignDocument.tsx` already redirects gracefully when the token is invalid; keep as-is
- All edge functions redeployed in one batch at the end
