I’ll implement this as one focused e-sign email fix.

Plan:

1. Show the automatic PDF inside the branded preview
- Add a recipient-visible attachment strip at the bottom of the branded email preview, after the message/signature area, using the real document filename.
- Make it clear this is the PDF attached to the email, not a separate broken download button.
- Keep the delivered email and preview renderer in sync by updating both the client email renderer and the deployed email renderer.

2. Add document controls beside the preview
- Show the automatically attached PDF as a managed attachment in the compose dialog.
- Add actions to preview/open it, remove it from this send, replace it, and upload extra files.
- If the automatic PDF is removed, it will not be sent unless replaced.
- Extra uploaded attachments remain supported.

3. Make the test/real email include the same attachment state
- Pass the current managed attachment list to the test send and real send paths.
- Ensure the email function attaches the selected/replaced PDF and any extra uploaded documents.
- Keep PDF-byte validation so broken HTML can never be attached as a PDF.

4. Fix Gmail “only attachment + three dots” behavior as much as code can control
- Reduce the delivered email HTML size and remove large/nonessential content that can trigger Gmail clipping/collapse.
- Remove the DocuSign button/extra app-store fallback block from this attachment-first email if it is contributing to Gmail hiding the body.
- Add a short plain-text fallback alongside HTML so email clients have immediate body text even when rendering quirks occur.
- Important note: Gmail’s three-dot clipping is controlled by Gmail itself, but reducing HTML and making the body first/short is the correct fix path.

5. Validate end-to-end
- Open the e-sign document page and the send-by-email dialog.
- Verify the preview shows the PDF attachment at the bottom.
- Take screenshots of the updated dialog/preview.
- Send a test email to infoo.jane@gmail.com.
- Check deployed email function logs/network results for a successful send and attachment processing.

Technical details:
- Main files to change: `SendViaEmailDialog.tsx`, `EmailPreviewIframe.tsx`, `buildEnvelopeEmailHtml.ts`, `_shared/envelope-email-html.ts`, `esign-send-test-email`, and `esign-send-for-signature`.
- If edge function files are changed, deploy the updated functions immediately after editing.