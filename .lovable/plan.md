## Audit result

**Already mostly completed**
- Download PDF generation itself is separate from the preview and should not be touched.
- Test email HTML is premium and mostly correct.
- Signature email display is already forced to `contact@jbj.ae` in rendered signatures.
- Save buttons exist for recipient, subject, and signature fields.
- Forms & Agreements already lists Templates, Draft Applications, Forms Generated, Pending Signature, Signed, Recently Deleted, and Assets.

**Still pending / broken**
- PAA preview iframe forces an A4 ratio, but the embedded HTML still carries min-height/footer auto-spacing from the PDF template, causing the temporary blank area and persistent white strip under the footer.
- Email download CTA still includes a document glyph; the user wants no arrow/icon in the CTA.
- The branded `/d` download landing page still fetches the backend storage proxy from the browser, so blocker tools can still show the backend/storage host. The fallback page also feels too blank/cheap.
- Signature picker styling still lets Radix/theme blue focus/hover leak through.
- Signature preset filtering intentionally hides Front Desk / Help Desk, and labels/rendering do not clearly present those as individual signatures.
- Default PAA email subject currently normalizes to `Signature Pending:`; requested default is `Signature Required:` everywhere, including the card heading/body default.
- “Client emailed signed copy back” is only a weak acknowledgement: the database status enum does not include `awaiting_signed_return`, so the current endpoint’s status update can fail silently. Forms & Agreements therefore cannot reliably show “Contract submitted / Pending application review.”
- Inbound email attachment ingestion is not wired, so replying with an attachment will not automatically create a signed contract record.
- Some small-screen buttons/chips can overflow because controls use fixed inline layouts and don’t enforce `min-w-0`, wrapping, or responsive text behavior consistently.
- E-signature tools still navigate to standalone `/e-signature/*` routes from parts of Forms & Agreements; owner routes exist but some buttons still point outside the hub.

## Implementation plan

### 1) Fix only the PAA in-app preview layout
- Update the preview-only iframe CSS in `EnvelopeDetail.tsx` so the root A4 template is treated as a single bounded page in preview.
- Remove preview-only footer auto-spacing/min-height behavior without changing `renderHtmlToPdfBlob` or download/export behavior.
- Keep the iframe A4-sized and stable to avoid the “blank then snaps smaller” effect.

### 2) Make email download CTA icon-free and keep delivered/test emails consistent
- Update both client and backend email renderers:
  - `src/lib/email/buildEnvelopeEmailHtml.ts`
  - `supabase/functions/_shared/envelope-email-html.ts`
- Remove the glyph/icon from “Click here to download your document”.
- Change default wording to `Signature Required:` and ensure the email card heading uses the same subject.

### 3) Harden branded download landing page without touching PDF generation
- Keep `/d?u=...` as the branded link, but make the page premium and explicit: JBJ Global Real Estate LLC, document-ready message, filename, and a clear download button.
- Avoid exposing the backend/storage URL as the visible primary action where possible.
- Prefer a same-page, user-initiated blob download with a clear fallback that does not feel like a blank page.
- Deploy/update the `download-file` function if needed so responses use proper `Content-Disposition`, filename, cache, and brand-safe headers.

### 4) Fix signature picker UX and individual presets
- Force champagne/gold hover, selected, focus, and ring styles on the select trigger/items.
- Stop hiding Front Desk / Help Desk presets.
- Render each preset independently with its own title/role while keeping the displayed email fixed to `contact@jbj.ae`.
- Make the field border/hover gold champagne, not blue.

### 5) Add reliable “submitted signed copy / pending review” tracking
- Add supported lifecycle values to the document status enums:
  - `awaiting_signed_return`
  - optionally `pending_owner_review` if needed for owner approval.
- Update UI status maps and Forms & Agreements buckets to show a clear tab/label such as “Submitted / Pending Review”.
- Fix `esign-mark-awaiting-return` so when the signer clicks “I emailed the signed copy back,” the owner backend reliably shows the application as submitted.
- Add owner actions on the envelope detail page: approve uploaded/submitted signed contract or keep it pending.

### 6) Wire signed contract visibility inside Forms & Agreements
- Surface submitted/returned contracts in Forms & Agreements, not as a separate e-signature-only workflow.
- Keep “Open” inside `/owner/documents/forms/:id`.
- Change Forms & Agreements quick actions/buttons that still go to `/e-signature/*` so they use `/owner/documents/forms/*` owner routes.

### 7) Address reply-with-attachment limitation safely
- Audit existing inbound email/webhook code.
- If current infrastructure exposes inbound attachments, connect them to the matching envelope and store the returned signed PDF for owner review.
- If inbound attachments are not available in this project, keep the signer confirmation workflow reliable and show the pending review state, while leaving a clear upload path for the owner. Do not fake attachment ingestion.

### 8) Fix responsive overflow for the affected controls
- Tighten `EmailRecipientChips`, dialog footer buttons, document action buttons, and Forms & Agreements tab/buttons with wrapping, `min-w-0`, `break-words`, and responsive text sizing.
- Ensure labels like “Recipients & CCs” and button text stay inside their boxes on smaller widths.

### 9) Deploy and validate
- Deploy updated backend functions:
  - `esign-send-test-email`
  - `esign-send-for-signature`
  - `download-file`
  - `esign-mark-awaiting-return`
- Send a test email to `infoo.jane@gmail.com`.
- Validate: preview no blank strip, download page branded, CTA icon removed, default subject/card says `Signature Required:`, signature picker is gold/champagne, submitted return status appears in Forms & Agreements.