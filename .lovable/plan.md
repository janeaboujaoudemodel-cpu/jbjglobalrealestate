## Plan

1. **Drop the broken "Click here to download your document" button**
   - Remove the entire `downloadBlock` (download CTA + secure-PDF caption) from both renderers:
     - `supabase/functions/_shared/envelope-email-html.ts`
     - `src/lib/email/buildEnvelopeEmailHtml.ts`
   - Remove the `attachmentUrl`/`attachmentName` driven download UI; keep only the **Open in DocuSign** step.
   - Drop the `attachmentUrl` plumbing from `EmailPreviewIframe` / `SendViaEmailDialog` props since it no longer affects the rendered email.
   - This guarantees no broken `something went wrong, try again later` link in the email.

2. **Attach the PDF as a real file attachment (not a link)**
   - In `esign-send-for-signature` and `esign-send-test-email`:
     - Keep the existing `fetchEmailAttachment` step that fetches the envelope's PDF.
     - Pass it to Resend via the `attachments` array as `{ filename, content: base64 }` so it appears as a normal email attachment in Gmail/Outlook.
     - If the PDF cannot be fetched, return a 502 with a clear message instead of sending an attachment-less email.
   - Filename = `{Client Name} - {Document Title}.pdf` (sanitized).

3. **Update the default client message wording**
   - Change the saved default `email_message` for the PAA template (and the in-dialog default body) to:
     > "Please find attached the PDF document for your electronic signature. Kindly review it carefully, sign it, and reply back to this same email with the signed copy attached. If you prefer, you can also sign it directly in DocuSign using the button below."
   - Remove any phrasing that calls it "the signed PDF" — it is unsigned at send time.

4. **Fix Gmail "…" clipped / "load full message" behavior**
   - Gmail clips messages that are >102KB or that look identical to a previous send. Reduce template weight and add a unique header line so each send is unique:
     - Drop the now-removed download block markup (already shrinks HTML).
     - Remove the inlined Google Fonts `<link>` (Gmail strips it anyway and it inflates head).
     - Add a small unique reference line at the top of the body (e.g. `Reference: {docNumber} · {sentAt}`) so the message hash differs per send.
     - Keep the body single-pass — no hidden preheader duplicate content.
   - Verify the final rendered HTML is well under 102KB.

5. **Deploy & verify**
   - Redeploy `esign-send-for-signature` and `esign-send-test-email`.
   - Send a fresh test to `infoo.jane@gmail.com` and confirm:
     - PDF appears as a normal Gmail attachment (paperclip icon, preview inline).
     - No "Click here to download" button anywhere.
     - Message body is shown in full without needing to click the three-dot "show trimmed content".
     - Body wording matches the new copy.

### Technical notes
- Resend attachments accept `{ filename, content }` where `content` is base64 of the PDF bytes; `fetchEmailAttachment` already returns the bytes — just base64-encode before passing.
- `EmailPreviewIframe` will keep working with `attachmentName` only (shown nowhere now); we'll drop the prop to keep preview === delivered email.
- No DB schema changes; only the `esign_email_template_defaults` row for `jbj-property-advertising-agreement` gets its `body_html` rewritten via a small data update.