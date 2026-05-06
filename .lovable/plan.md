Current findings:
- `DocumentFieldPlacer` is not a URL/page. It is an internal component that appears inside `/e-signature/create` only at Step 3: Place Fields. Opening `/document-field-placer` will always show 404 because no route exists for it.
- The real template page is `/owner/documents/forms`, also reachable from the owner sidebar as Documents → Forms & Agreements. I verified the page loads and the two system templates exist in the database:
  - JBJ Property Advertising Agreement — Leasing
  - JBJ Listing Authorisation — Selling
- Your current screenshot shows a “Pending Tasks” modal covering the template cards. The templates are behind that modal, so the UI needs to suppress/delay owner-dashboard popups on signing workflows.
- The signing upload page is `/e-signature/create`. It currently only treats PDFs as the active signing document, even though the copy says mixed files are supported. Storage also only allows `application/pdf`, so non-PDF contract uploads can fail or cannot become signable.

Implementation plan:

Batch 1 — Navigation and discoverability
- Add clear entry points from `/owner/documents/forms`:
  - Use Leasing Template
  - Use Selling Template
  - Upload Contract to Sign
  - AI Contract Review
  - Manage Signature & Stamp
- Add an in-page “Where to find this” workflow strip so users do not need to guess URLs.
- Prevent/disable unrelated owner popups like “Pending Tasks” while using `/owner/documents/forms`, `/e-signature/create`, `/e-signature/:id`, and `/sign/:token`.
- Optional route safety: add a redirect/helper page for mistaken `/document-field-placer` searches that sends the user to `/e-signature/create` with a short explanation.

Batch 2 — Upload/import upgrade
- Replace the current PDF-only active document logic with a normalization layer:
  - PDF: use directly.
  - Images: convert into a PDF for signing.
  - TXT/RTF/HTML: render into a clean PDF.
  - DOCX: convert to readable HTML/PDF using a client-side converter.
  - Other unsupported file types: allow upload as attachments, but show a clear message if they cannot be converted into a signable PDF.
- Increase storage support for common contract formats and images while keeping private owner-scoped access.
- Raise the contract upload limit where safe and align the UI copy with the real backend limit.
- Ensure the selected signable PDF preview always appears immediately after import.

Batch 3 — Document preview, fields, signature, stamp, and export
- Make Step 3 more obvious: preview on the left, fields/tools on the right, with high-contrast labels.
- Auto-place owner date, owner signature, owner stamp, client signature, and client date when using JBJ templates.
- Preserve manual click-to-place fields for any uploaded contract.
- Fix the Step 4 preview so it shows the uploaded document with visible placed signature/stamp/date boxes before sending.
- Add “Export Preview PDF” before sending, so you can immediately download a PDF proof with the current field placements.
- Update the final completion function so the signed export is a real flattened PDF with signatures/stamps rendered onto the document, not just a link to the original file.

Batch 4 — AI lawyer review inside the signing flow
- Integrate the existing AI Contract Lawyer into `/e-signature/create` so uploaded contracts can be analyzed before sending.
- Improve text extraction from uploaded PDFs/DOCX/text files before sending to AI.
- Keep the legal disclaimer: this is contract analysis support, not legal/tax advice.
- Add multilingual analysis controls where they already exist.

Batch 5 — Send workflow and delivery
- Add channel toggles on Review & Send:
  - Email
  - WhatsApp link when phone exists
- Pass selected channels into `esign-send-for-signature`.
- Keep BCC to `contact@jbj.ae` for outgoing signing emails.
- Ensure sender/receiver email fields are clear and validation blocks bad emails before sending.

Batch 6 — Contrast and software polish
- Fix unreadable titles/buttons across `/owner/documents/forms`, `/e-signature/create`, `/e-signature/:id`, `/sign/:token`, and the contract review panel.
- Replace low-contrast gold fills/white text combinations with the project champagne/ink/gold hairline standard.
- Fix the current React warning from the Documents dialog header if it is still active after popup suppression.
- Keep every existing feature; no feature removal.

Batch 7 — Backend deployment and verification
- Apply the storage/database migration for expanded upload support and secure private access.
- Deploy these backend functions after edits:
  - `esign-send-for-signature`
  - `esign-process-signature`
  - `esign-complete-envelope`
  - `esign-auto-detect-fields`
  - `esign-contract-analyzer`
- Test the workflow end-to-end:
  1. Open `/owner/documents/forms` and confirm both templates are visible.
  2. Create a leasing template draft.
  3. Upload a custom contract at `/e-signature/create`.
  4. Preview the PDF.
  5. Place signature/date/stamp fields.
  6. Run AI contract review.
  7. Export preview PDF.
  8. Send to a recipient.
  9. Open the generated `/sign/<real-token>` link.
  10. Sign as client.
  11. Confirm completed signed PDF is generated and downloadable.
- Capture screenshot proof for the fixed pages and the preview/export state after implementation.