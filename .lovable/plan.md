I found the issue: the branded email preview is technically present, but the dialog layout is broken at this viewport — the preview pane is squeezed into a thin strip on the right, so the full branded card, DocuSign CTA, App Store / Google Play fallback, and footer are not actually visible. The Send via Email dialog also does not yet expose the multiple email signature selector, even though the signature preset data exists.

Plan:

1. Rebuild the Send via Email dialog layout
   - Make the dialog use the available screen width correctly.
   - Keep the composer on the left and the full branded recipient email preview on the right.
   - Ensure the preview pane has a real minimum width/height, no squeezed vertical text, and is visible without hunting or horizontal overflow.
   - Add a clear proof label above the preview: this is the exact recipient email, including DocuSign CTA and fallback links.

2. Make the DocuSign CTA always visible in preview and sent email
   - Keep the existing shared renderer as the single source of truth.
   - Update the UI text so an empty DocuSign URL still shows the DocuSign CTA using the universal DocuSign entry, instead of implying the button will disappear.
   - Confirm the preview iframe receives the same subject, body HTML, document number, DocuSign URL fallback, and attachment name as the test/live send.

3. Add multiple signature selection to the email body
   - Load all available email signature presets from `email_signature_presets`.
   - Add a signature selector in the Send via Email composer.
   - Default to the saved/default signature, but allow choosing another preset.
   - When a signature is selected, inject/replace that signature block in the editable message body and immediately update the branded preview.
   - Keep the signature locked as rendered HTML in the outgoing email body so the preview and delivered email match.

4. Align test email and real send payloads
   - Ensure both “Send test” and “Approve & send” pass the same rendered HTML body and attachment metadata to the backend function.
   - Keep the test recipient as `infoo.jane@gmail.com`.
   - Avoid adding any internal signing link; the email remains DocuSign-only.

5. Backend deployment if shared email function code changes
   - If any edge function or shared email renderer is touched, redeploy the affected functions so test emails use the updated deployed code.
   - If only frontend dialog layout/signature selection changes, no backend deployment is needed.

6. Proof after implementation
   - Open the same envelope route.
   - Click Send via Email.
   - Verify the full branded card preview is visible, including JBJ header, subject, body, selected signature, OPEN IN DOCUSIGN button, App Store / Google Play fallback, attachment chip, and footer.
   - Click Send test and verify the network call succeeds or show the exact backend/email-domain blocker if delivery is blocked.