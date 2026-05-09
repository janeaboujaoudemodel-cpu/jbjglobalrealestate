
# End-to-End Sign Flow

Goal: when the recipient clicks **Review & Sign Document** in the email, they sign on jbj.ae using our own e-signature tool. On submit, you (the sender) receive an email + an in-app notification + an inbox alert + a popup task, and the signed PDF is saved automatically in the e-signature dashboard's **Signed** section, accessible from `/e-signature`.

## What already works

- `/sign/:token` opens our own signing page (no third-party tool) with `ESignaturePad` for drawing the signature.
- `esign-load-document` validates the token and loads the document + fields (already deployed and fixed).
- `esign-process-signature` saves the drawn signature, marks the envelope completed when all signers are done, and calls `esign-complete-envelope`.
- `esign-complete-envelope` flattens a signed PDF, generates an audit certificate, saves the row in `esign_signed_documents`, sets `signed_document_url` on the envelope, and emails both the signer and the sender (`sender_email` + `contact@jbj.ae`).
- The dashboard at `/e-signature` already has a **Signed** filter card showing all `status = completed` envelopes with download/view actions.

## What's missing (this plan delivers)

### 1. Date field auto-fill at signing time (UI side)

In `SignDocument.tsx`, when the user submits, also send a `signed_date` (today, formatted `DD/MM/YYYY`) and have `esign-process-signature` write it into every `field_type = "date"` row tied to that recipient (`field_value` + `is_completed = true`). The signed PDF builder already uses signed_at as a fallback, but writing the value also makes it visible in `EnvelopeDetail` and audit views.

### 2. Owner in-app notifications on completion

In `esign-complete-envelope`, after the emails are sent:

1. Look up the sender's `auth.users.id` by `sender_email` (service role).
2. Insert one row into `public.notifications`:
   - `title`: `"<Signer Name> signed <Envelope Name>"`
   - `body`: `"Signed on <date>. Tap to view the signed document."`
   - `notification_type`: `"esign_signed"`
   - `action_url`: `/e-signature/<envelope_id>`
   - `metadata`: `{ envelope_id, signer_name, signer_email, signed_document_url, certificate_url }`
3. The existing `UserTasksPopupAlert` / notifications bell in the header will surface this as the popup task + inbox message + alert (one insert powers all three).

### 3. Confirm "Signed" section wiring

No code change needed — verify on the dashboard that the new envelope appears under the **Signed** filter, that **View Signed PDF** opens `signed_document_url`, and that **Download Audit Certificate** opens `certificate_url`. Both are already on `EnvelopeDetail`.

### 4. End-to-end verification (must run)

Send a real signature request to a test inbox → click **Review & Sign Document** in the email → draw signature on `/sign/:token` → submit. Then verify:
- Signer receives the "Thank you" email with the signed PDF link.
- Sender (you) receives the "Signed by …" email.
- A bell notification appears in the header with a link to the envelope.
- `/e-signature` → **Signed** card → envelope is listed.
- Opening the envelope shows signed PDF + audit certificate, both downloadable.
- Date fields on the document show today's date.

Capture screenshots of: signing page, submitted confirmation, owner notification bell, Signed list on `/e-signature`, and EnvelopeDetail with download buttons.

## Where to find things (for you)

- Signing link the recipient gets in the email → opens `https://jbj.ae/sign/<token>` (our own UI).
- All signed contracts → **E-Signature dashboard** at `/e-signature`, click the **Signed** stat card (or the `Signed` tab) → click any row to open `/e-signature/<envelope_id>` → buttons for **View / Download Signed PDF** and **Download Audit Certificate**.
- Bell icon in the global header → inbox of "X signed Y" notifications, each links straight to the envelope.

## Files touched

- `src/pages/e-signature/SignDocument.tsx` — pass `signed_date` on submit.
- `supabase/functions/esign-process-signature/index.ts` — write date fields, accept `signed_date`.
- `supabase/functions/esign-complete-envelope/index.ts` — insert owner row in `public.notifications`.
- Redeploy: `esign-process-signature`, `esign-complete-envelope`.

No DB migration required (notifications table + esign tables already exist).
