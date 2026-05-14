I found two concrete causes to fix:

1. The branded email renderer is adding a `Reference: ... UTC` line above the message body. That is why the document reference/date/time appears twice. I will remove that line from both the in-app preview renderer and the delivered-email renderer.

2. The main PDF attachment URL is being wrapped through `/d?u=...`, which is a branded HTML download page. The backend then fetches that HTML and sends it as if it were a PDF, causing Gmail to preview a blank/broken document. I will change the send flow so:
   - The email body does not include a download/document button.
   - The backend receives and fetches the direct signed storage URL for the real PDF, not the branded HTML wrapper.
   - `fetchEmailAttachment` validates PDF magic bytes (`%PDF-`) whenever `application/pdf` is expected, so broken HTML can never be sent as a PDF again.
   - Extra uploaded attachments keep their original MIME types and are fetched from valid storage URLs.

Implementation files:
- `src/components/e-signature/SendViaEmailDialog.tsx`
- `src/lib/email/buildEnvelopeEmailHtml.ts`
- `supabase/functions/_shared/envelope-email-html.ts`
- `supabase/functions/_shared/fetchEmailAttachment.ts`
- `supabase/functions/esign-send-test-email/index.ts`
- `supabase/functions/esign-send-for-signature/index.ts`

Validation:
- Deploy the two updated email functions.
- Test the deployed send path with the current envelope payload shape.
- Confirm logs no longer show attachment fetch failures and the code rejects non-PDF content instead of delivering broken files.