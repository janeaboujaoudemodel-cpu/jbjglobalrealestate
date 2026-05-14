## Plan

1. **Fix why the uploaded PDF opens blank in Gmail**
   - The current e-sign email flow sends the attachment using the branded `/d?...` download page URL instead of the raw PDF storage URL.
   - Gmail/Drive previews that HTML page as if it were a PDF attachment, which explains the blank viewer in the screenshot.
   - Change the send payload so real email attachments are fetched from the direct signed PDF URL, while any branded/download page link is kept only for UI if needed.
   - Add a PDF sanity check in the attachment fetcher: if a `.pdf` does not start with `%PDF`, reject the send with a clear error instead of sending a blank/broken attachment.
   - Use Resend’s expected attachment field name consistently (`content_type`) so Gmail receives correct MIME metadata.

2. **Make the upload picker reusable across all owner email composers**
   - Keep the existing e-sign attachment picker, but harden it so it stores the correct metadata (`contentType`) and can be reused outside e-sign.
   - Show uploaded attachment count in the send preview/header wherever applicable.

3. **Add attachments to the universal branded email composer**
   - Add the upload picker to `BrandedEmailComposer` (`Send a branded email`).
   - Include uploaded files in test sends and live sends.
   - Extend the locked-send flow to persist attachment metadata and send them through Gmail as true MIME attachments, while preserving the existing “preview = delivered” locked-send rule for the email body.

4. **Add attachments to CRM email sends where email is manually triggered**
   - Extend developer registration and brokerage outreach send payloads to accept optional uploaded attachments.
   - Wire the attachment picker into the CRM send/test dialogs that use these hooks, without changing existing templates or removing any functionality.

5. **Add attachments to document/form email sends**
   - Extend `documents-send` and `useSendDocument` so document emails can include extra uploaded files.
   - Keep the signing link behavior unchanged.

6. **Verify with a test send**
   - Send a fresh test to `infoo.jane@gmail.com`.
   - Confirm the PDF arrives as a real attachment, opens with visible PDF content, and any extra uploaded documents also open normally.