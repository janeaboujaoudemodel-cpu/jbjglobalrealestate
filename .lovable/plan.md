## Plan: E-signature signing + agreement layout correction

### 1. Fix the broken recipient signing preview
- Replace the `/sign/:token` iframe PDF preview with the same PDF.js renderer used inside the e-signature tool, so it works reliably in Chrome/Google/browser previews.
- Overlay the recipient’s signing fields directly on top of the rendered page.
- Add page navigation for multi-page documents and a clear loading/error state if the PDF cannot be fetched.

### 2. Add true “Sign Here” field interaction
- Render signature fields as a visible **Sign Here** target on the document itself.
- When the recipient clicks **Sign Here**, open the signature drawing box.
- After drawing, place the signature visually into the correct field immediately.
- Keep the final **Submit/Sign Document** button only for confirming and saving the completed signature.

### 3. Fix date behavior so dates appear only after signing
- Stop auto-filling date fields during template creation, auto-detect fallback, and preview/export.
- Keep date fields blank until the recipient signs.
- On submit, auto-fill the recipient’s date fields with the signing date only.
- Ensure the signed PDF uses that stored signing date, not today’s date as a preview/default.

### 4. Correct field-coordinate alignment for template-generated documents
- Standardize template field coordinates so `x_position` / `y_position` are stored and read as percentages.
- Fix template-created envelope fields so signatures and dates flatten into the exact visual positions shown in the signing preview.
- Add compatibility handling for existing draft/template envelopes whose coordinates were generated with the previous scaling behavior.

### 5. Clean the Property Advertising Agreement header
- Remove the duplicated “Document Number / DOC NO.” label.
- Show only the document code, e.g. `JBJ-PAA-LEASING-0001`, once in the header.
- Remove any centered duplicate code/document-number display.
- Keep the title centered as **Property Advertising Agreement** only.
- Remove browser/date/time chrome from the app-generated print/save flow by replacing the `about:blank` print popup with a controlled printable/PDF output.

### 6. Improve the landlord/owner details layout
- Remove the gold divider line next to **Landlord / Owner Details**.
- Make field underlines cleaner and content-aware: values wrap/fit without breaking the layout, and blank fields still keep professional editable lines where needed.
- Adjust spacing so the owner name, mobile number, email, and other filled values align naturally with their underline instead of leaving awkward gaps.

### 7. Fix footer size and bottom blank space
- Increase footer readability slightly while staying premium/champagne-gold.
- Reduce excessive bottom padding and whitespace under the footer.
- Make the preview height/content fit the actual generated document instead of showing a large blank area below the footer.

### 8. Keep templates editable and make “approved” version the sent version
- Keep generated template envelopes editable before sending.
- When fields/chrome are changed, make **Save & re-render** update the stored PDF and metadata.
- Before sending, ensure the latest approved/rendered PDF is what the recipient opens from the email signing link.
- Avoid sending an old/standard template PDF after the owner has edited and approved the document.

### 9. Verification pass
- Create a leasing template draft with partial fields.
- Save/re-render it and confirm no `about:blank`, no print date/time, no duplicated document number, no top-left date/time.
- Confirm the footer is readable with no large blank area underneath.
- Send/open the signing link in the browser, confirm the document renders, click **Sign Here**, draw signature, submit, and confirm the date appears only after signing and in the correct date field.
- Confirm the signed PDF download contains the signature/date in the same positions shown to the signer.