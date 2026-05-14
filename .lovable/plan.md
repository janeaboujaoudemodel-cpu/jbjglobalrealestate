## Goal

When the owner clicks **Send to client** on a PAA (or any envelope), the generated PDF for that specific client (e.g. `JBJ-PAA-LEASING-0001.pdf`) must arrive in the recipient's inbox as a real **email attachment**, in addition to the existing "Download your document" button.

Today the email already includes a styled Download button that links to the PDF in storage, but no file is actually attached to the message — so users see only the link, not a paperclip / file in the email.

## Plan

### 1. Attach the PDF in `esign-send-for-signature`
File: `supabase/functions/esign-send-for-signature/index.ts`

- After resolving `attachment_url` and `attachment_name` (already passed from the SendViaEmailDialog), fetch the PDF bytes server-side:
  - `fetch(attachment_url)` → `arrayBuffer()` → base64.
  - Cap at ~10 MB (Resend's hard limit is ~40 MB; 10 MB is safe and matches typical PAA size). If oversize or fetch fails, log and fall back to link-only (do not block the send).
- Pass to Resend in the existing `POST https://api.resend.com/emails` body:
  ```ts
  attachments: [{
    filename: attachment_name,        // e.g. "JBJ-PAA-LEASING-0001.pdf"
    content: <base64 string>,
    content_type: "application/pdf",
  }]
  ```
- Keep the existing branded **Download your document** button in the email body unchanged — recipient gets the file two ways (paperclip + button), exactly what the user asked for.

### 2. Same change in the test-send path
File: `supabase/functions/esign-send-test-email/index.ts`

- Same fetch-and-attach logic so the owner's "Send me a test" preview also arrives with the real PDF attached. This is what the user uses to verify before sending to the client.

### 3. No client-side changes needed
- `SendViaEmailDialog` already forwards `attachment_url` (proxied/branded URL) and `attachment_name` (e.g. `JBJ-PAA-LEASING-0001.pdf`) to the edge function.
- `EnvelopeDetail` already passes `envelope.document_filename` and `envelope.document_url` into the dialog.
- The PAA editor stays locked; no template or UI rework.

### 4. Quick verification

- Click **Send to client** on the existing locked PAA envelope (Omar) → confirm:
  - Recipient sees `JBJ-PAA-LEASING-0001.pdf` as a real attachment in Gmail.
  - Existing Download button still works.
  - Test inbox `infoo.jane@gmail.com` (CC'd by default) also receives the file as an attachment.
- Edge function logs show no Resend errors and no oversize fallback for normal PAA-sized PDFs.

### Out of scope

- No changes to the PAA template, layout, or signing UI (PAA editor remains locked as agreed).
- No marketing / bulk email logic — this is a 1:1 transactional send triggered by the owner.
