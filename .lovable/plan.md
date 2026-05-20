I’ll fix this in the e-signature/PAA flow with these changes:

1. Email body must render as a real email, not visible HTML code
- Harden the shared email renderer so `bodyHtml` is normalized before display.
- Decode saved/double-escaped HTML like `&lt;p&gt;...&lt;/p&gt;` before it reaches the iframe preview or the delivered email.
- Sanitize/allow only safe email tags so the preview and recipient email render formatted paragraphs, not raw tags.
- Apply the same fix in both the browser preview renderer and the backend send renderer so preview = delivered email.

2. Signature section must be editable from the send dialog
- Add an inline editable signature area below the signature picker.
- When a signature is selected, show its fields in editable inputs: name line, title line, company line, address, phone, email, website.
- Let you change wording immediately for this email preview.
- Keep the selected preset as the base, but render the edited signature live without needing to edit the database preset first.
- Keep the existing “Save signature” action so the chosen preset can still be saved as default for future PAA emails.

3. Executive Office signature wording
- Replace “Office of the Founder” with a more premium institutional wording.
- Recommended signature for PAA emails: `JBJ Executive Office` with title line `Executive Office` or `JBJ Executive Team`, because this is a formal document request and should feel institutional, not personal/founder-led.
- I’ll use `JBJ Executive Office` as the name line and `Executive Office` as the title line, avoiding “Office of the Founder.”

4. PAA document preview cropped / not scrollable enough
- Replace the auto-growing iframe behavior that creates a long vertical page and can crop the document.
- Make the document preview a full-width, one-screen viewer with a fixed responsive height based on the viewport.
- The iframe itself will be scrollable internally, so the whole PAA can be reviewed from header to footer without the page becoming endless.
- Preserve edit-click behavior inside the document preview.

5. Move all controls above the document and remove right-side/down-page feeling
- Keep Recipients/CCs, Details, Activity Log, Listing Draft, and Header/Footer customization as a compact top control band above the document.
- Surface the Header/Footer customize action as its own top control rather than burying it inside Details.
- Keep the document below as the full-width primary focus.

6. Deployment requirement
- Because the delivered email uses backend functions, after editing the email backend renderer/send functions I’ll redeploy the affected e-signature email functions so the fix applies to real sent emails, not only the local preview.