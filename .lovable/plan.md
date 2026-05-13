Plan to repair this without removing anything else:

1. Restore the client signing-step layout
- Put the document download step back in the live preview whenever an attachment URL/name exists.
- Keep both steps visible in the correct order:
  1. Download document
  2. Sign with DocuSign
- Move the signature to the very bottom, after the DocuSign section, so the signature is last.
- Add the requested gap under “Step 2 · Sign with DocuSign”.

2. Make preview and delivered email identical
- Update both email renderers together:
  - `src/lib/email/buildEnvelopeEmailHtml.ts`
  - `supabase/functions/_shared/envelope-email-html.ts`
- Fix header/footer dividers so the gold line sits exactly on the champagne/white boundary, not floating above it.
- Remove the extra footer divider above the copyright.
- Force all visible JBJ email/website text to uppercase: `CONTACT@JBJ.AE`, `WWW.JBJ.AE`, `JBJ GLOBAL REAL ESTATE`.
- Replace the “agreement — leasing” dash style with a cleaner subject/title format.
- Keep mobile responsiveness in the email HTML.

3. Lock signature behavior to one signature only
- Stop inserting signature HTML directly into the editable body as stackable content.
- Store the selected signature separately and render exactly one signature block at the final position.
- Selecting a new dropdown option replaces the previous signature immediately.
- The Insert button will become “Replace signature” behavior, never append.
- Make all presets use one premium left-aligned layout.
- Tighten spacing so `JBJ GLOBAL REAL ESTATE` sits closer to `Founder & CEO` / the selected role.
- Improve select/dropdown/button styling so hover/focus states stay champagne/ink/gold and do not break layout.

4. Persist edited subject/body before send/test
- When the subject is changed to “Signature Pending”, save that to the envelope instead of resetting to `Please sign` when reopening.
- Persist the edited body, selected signature ID, DocuSign URL, and CC list when sending or sending a test.
- If the parent document form is dirty, save/regenerate before opening/sending so the attached PDF and preview match the user’s latest edits.

5. Fix document download + attachment
- Ensure the preview always gets the signed/downloadable document URL, not only the edge function.
- Keep the Download PDF CTA in the email preview and delivered email.
- Attach the PDF automatically to the real client email.
- Also attach it to test emails so the test inbox reflects the real client email.
- Keep link fallback if the file is too large for provider attachment limits.

6. Fix DocuSign CTA target
- If a real DocuSign envelope URL is entered, the button opens that URL.
- If no real envelope URL is entered, do not route users to a broken app page that shows “You need to enable JavaScript to run this app.”
- Use a safe DocuSign web entry/sign-in fallback and clearly keep the download step available.

7. Verify existing thank-you flow
- Confirm the existing signer thank-you function remains active after signing.
- Do not create duplicate thank-you emails if the current `esign-send-signer-thanks` audit/idempotency flow is already handling it.

Validation after implementation:
- Open the current form route and confirm the preview shows Download first, DocuSign second, signature last.
- Change subject to “Signature Pending”, close/reopen, and confirm it stays saved.
- Switch between all four signatures and confirm only one appears, left-aligned, with no duplicate Founder/CEO block.
- Send a test to the saved test inbox and confirm the email includes the download button and attached PDF.
- Check mobile-width rendering for no overflow.

<lov-actions>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>