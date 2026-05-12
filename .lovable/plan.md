# Plan: E-signature flow polish + agreement layout + Omar reset

## 1. Outbound emails: Reply-To = contact@jbj.ae

All esign emails are sent from `noreply@jbj.ae` with no `reply_to`, so when a recipient hits Reply they end up writing to a black-hole address.

Add `reply_to: "contact@jbj.ae"` to every Resend payload in:
- `supabase/functions/esign-send-for-signature/index.ts` (line 192)
- `supabase/functions/esign-send-test-email/index.ts` (line 153)
- `supabase/functions/esign-send-signer-thanks/index.ts` (line 106)
- `supabase/functions/esign-send-reminder/index.ts` (line 162)

Centralise the reply-to in `supabase/functions/_shared/outreachIdentity.ts` as `REPLY_TO_CONTACT = "contact@jbj.ae"` so future sends inherit it.

## 2. Block inbound mail to noreply@jbj.ae (friendly bounce)

`supabase/functions/resend-inbound-email-webhook/index.ts` currently maps `noreply@jbj.ae → general` (line 27) and silently routes the email into the inbox. Change it to:

- Detect any inbound whose recipient is `noreply@jbj.ae` (or `no-reply@…`).
- Skip the normal ingest pipeline.
- Send an auto-reply via the existing Resend client back to `from`, using a branded HTML shell (same template as compose-branded-email) with copy roughly:

> Hi — thanks for writing in. This inbox doesn't receive replies. For anything you need, please email **contact@jbj.ae** and a real person on the JBJ team will get back to you shortly.

- Log the bounce in `email_send_log` with a `noreply_autoreply` tag and return 200 so Resend doesn't retry.

## 3. Property Advertising Agreement: fit on one page

Edit `src/templates/jbjPropertyAdvertisingAgreement.ts`:

- **Header** (`headerHtml` `monogram-wordmark` branch): keep monogram + the legal company line + Doc No. on the right. Remove the larger watermark/wordmark image — the legal title is enough.
- **Footer** (`footerHtml` `three-column` branch lines 230-250): drop the duplicated monogram + legal company name. Replace with three clean cells holding only contact details: 
  - Left: office address
  - Centre: `contact@jbj.ae · jbj.ae`
  - Right: `+971 54 716 7107` and labelled credentials line
- **Density** (the document body, lines ~363+): tighten paddings (`padding: 28px 44px`), reduce section gaps and the additional-notes minimum height, drop the central decorative gold underline, and switch the page wrapper to `@page { size: A4; margin: 18mm 14mm; }` via the rendered PDF wrapper. Goal is single A4 page when fields are normal length.

## 4. Branded email "attach + Sign with DocuSign" handoff

Today the EnvelopeDetail "Send for signature" button opens a generic compose flow. Rework so the flow is:

a. Owner opens an envelope, clicks **Send for signature**.

b. Branded compose modal pre-fills:
   - Recipient input (owner types client email)
   - Subject + body (already templated)
   - **The agreement PDF auto-attached** (uses the existing `renderHtmlToPdfBlob` blank export, uploaded to `esign-documents` storage and added as a Resend attachment in `esign-send-for-signature/index.ts`).
   - A required **Download & sign with DocuSign** CTA injected into the email body that points to `/sign/{signing_token}` (existing route).

c. Recipient lands on the signing page → can download the PDF or sign inline (existing UI). On Finish, `esign-process-signature` + `esign-complete-envelope` already:
   - Stamp signature into the document
   - Save signed PDF to storage (`esign_signed_documents`)
   - Mark envelope `completed`

d. After completion, send the signer a "Thank you" email (existing `esign-send-signer-thanks`) and a copy back to the sender containing the signed PDF link.

e. EnvelopeDetail page already lists the signed document; ensure the **Preview / Download signed** buttons point at `signed_document_url` from `esign_signed_documents` and refresh in real time via the existing Supabase channel subscription (verify the channel is subscribed on this page).

No new edge functions — just wire the attachment into `esign-send-for-signature` and surface the existing signed-doc record on `EnvelopeDetail`.

## 5. Reset Omar Allam envelope (it was a test)

Envelope `810df24a-145b-48f2-8e5a-f18e44e0c576` currently shows `status='sent'` and recipient `omar.a@shadid.org` `status='sent'` even though only the test inbox received the mail. Migration to:

- Set envelope `status = 'draft'`, clear `completed_at`, `signed_document_url`.
- Set recipient `status = 'pending'`, clear `sent_at`, `viewed_at`, `signed_at`, `signature_data`.
- Insert audit log row: `action = 'reset_test_send'`, note: "Test-only send to internal QA address; reverted to draft so the real client has not been contacted."

## Technical notes

- Reply-To: Resend supports `reply_to` as string; using a single shared constant keeps it DRY.
- Inbound auto-reply will reuse `_shared/email-shell.ts` to keep the bounce on-brand.
- PDF attachment in Resend: pass `attachments: [{ filename, content: base64 }]` from the rendered blob.
- The signing page route already exists at `/sign/:token` — no new public surface added.
- All footer/header edits keep gold strictly as a 1px hairline (per design memory).
