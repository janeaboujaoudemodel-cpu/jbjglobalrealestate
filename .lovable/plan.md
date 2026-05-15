## Audit findings

### Currently working
- The core PAA document editor exists and saves field values into `esign_envelopes.template_field_values`.
- `handleSaveEdits` regenerates a new PDF object after field edits and updates `document_url` / `document_filename`.
- `SendViaEmailDialog` already has a branded email preview, DocuSign CTA, test send, final send, and attachment display.
- Server send functions already reject non-PDF attachment bytes and fail clearly if a PDF cannot be fetched.
- The affected real document record currently stores `template_field_values.exclusivity = NON EXCLUSIVE`.

### Broken / risky
- Opening the email preview does not force a fresh PDF sync. It hydrates from the `envelope.document_url` prop first, so preview can show an attachment before proving it matches the latest saved document state.
- `resolveFreshAttachment` only regenerates through `onBeforeSend`; it is not run on preview open, and it silently falls back to DB attachment if regeneration fails.
- `onBeforeSend` only saves/regenerates when the UI is dirty. If saved values changed but the stored PDF is older or stale, it can still use the old PDF URL.
- There is no explicit PDF version marker stored with the attachment; audit history has send events but not the exact attachment URL/version/date that was sent.
- The duplicate `SendForSignatureDialog` path still sends `envelope.document_url` directly and has no latest-version UI/status controls. It should not be expanded into another module.
- Desktop preview links use preview-domain proxy URLs such as `/api/download-file` on `lovableproject.com` in development/preview. Chrome/ad blockers can block that whole preview host, which causes the `lovableproject.com is blocked` screen.

### Why desktop preview fails
- The current Open button targets a new tab on the preview host (`id-preview...lovable.app` / `lovableproject.com`) or raw storage-derived URLs. In the user's environment Chrome blocks the Lovable preview domain when opened as a standalone file page.
- This is a URL-delivery problem, not the PDF bytes themselves. The fix is to use a brand-domain download/open route for email-facing and owner preview links, and avoid iframe-only/open-new-preview-domain behavior.

### What causes the stale/blocked PDF issue
- Stale: preview/send trust `document_url` without a mandatory “render latest PDF from current saved state, mark version, verify version” handshake.
- Blocked: Open links can route through the preview app host or raw storage URL instead of a stable JBJ-branded document route/proxy.

### Duplicated components
- `SendViaEmailDialog`: canonical branded preview/send workflow.
- `SendForSignatureDialog`: older duplicate send workflow with overlapping recipient/body/send logic and weaker attachment sync.

## Implementation plan

### 1. Add a canonical “latest PDF sync” helper in the existing document page
- In `EnvelopeDetail.tsx`, create one helper that always:
  1. saves in-progress edits if dirty,
  2. fetches the latest envelope row,
  3. regenerates a new PDF from the latest saved `template_field_values` every time preview opens and every time send/test occurs,
  4. writes version metadata into the envelope, including:
     - `pdf_version_id` (UUID),
     - `pdf_generated_at`,
     - `pdf_source_updated_at`,
     - `pdf_document_url`,
     - `pdf_document_filename`,
     - `pdf_status = latest`.
- This does not rebuild the document system; it wraps the existing `useRegenerateEnvelopePdf` flow and enriches metadata.

### 2. Make email preview attach the latest saved version immediately
- When `SendViaEmailDialog` opens, call the sync helper before showing the attachment as “Latest”.
- Add explicit attachment sync states: `syncing`, `latest`, `outdated`, `missing`, `failed`, `removed`.
- If sync fails, show `Failed` and disable `Send test` / `Approve & send` until regenerated.

### 3. Upgrade “Attachments the client will receive” inside `SendViaEmailDialog`
- Keep the existing section; do not create a new module.
- Add:
  - file name,
  - document type,
  - generated/version date,
  - latest synced status,
  - Open/Preview button,
  - X/remove button,
  - “Regenerate latest PDF” button,
  - “Attach latest saved version” button,
  - status label: Latest / Outdated / Missing / Failed / Removed.
- X/remove only removes the attachment from the current email draft; it will not delete the document or storage object.
- Reattach/regenerate restores the latest saved version.

### 4. Block stale sends with strict validation
- Before `Send test` and `Approve & send`, run sync/validation again.
- Compare the preview attachment’s `pdf_version_id` / `pdf_source_updated_at` with the latest envelope state.
- If mismatched, missing, failed, or manually removed while no other attachment is intended, block sending with a clear error.
- Send only the verified latest attachment URL/name/version.

### 5. Fix server send functions to reject stale attachment payloads
- Update `esign-send-for-signature` and `esign-send-test-email` to accept attachment metadata from the dialog.
- Server re-fetches the envelope and compares incoming attachment URL/version/source timestamp to envelope metadata.
- If the client sends an old URL or old version, return HTTP 409 with “Attachment is outdated — regenerate latest PDF before sending.”
- Server records the exact sent attachment metadata in `esign_audit_log.metadata`.

### 6. Store exact email attachment history
- No new duplicate email module.
- Use `esign_audit_log.metadata` for sent/test-send events with:
  - `attachment_url`,
  - `attachment_name`,
  - `attachment_version_id`,
  - `attachment_generated_at`,
  - `attachment_source_updated_at`,
  - `attachment_size_bytes`,
  - `attachment_content_type`.
- This satisfies “email history records the exact PDF version sent” without adding a parallel email-history system.

### 7. Fix desktop/mobile PDF opening
- Owner preview Open button should avoid blocked preview-domain tabs by using a brand-safe `/d` route on `https://jbj.ae` when a storage URL is available.
- For in-app owner verification, open/download via the existing `download-file` proxy with correct headers:
  - `Content-Type: application/pdf`,
  - `Content-Disposition: inline` for preview,
  - `Content-Disposition: attachment` for download,
  - no iframe dependency.
- Email-facing document links, if rendered, should use `https://jbj.ae/d?...` rather than raw storage or preview-host URLs.

### 8. Keep email body clean
- Preserve the existing HTML normalization safeguards.
- Ensure final send/test functions continue stripping escaped `<p>`, `</p>`, `<br>`, merge tokens, and raw template syntax.
- Do not change the branded email renderer except where needed for safe attachment metadata/display.

### 9. Deprecate the duplicate send path safely
- Do not delete `SendForSignatureDialog`.
- Route its email send through the same latest-PDF sync/validation or disable its direct email send path in favor of the canonical `SendViaEmailDialog` for email.
- Keep WhatsApp/copy-link behavior intact.

## Testing plan after implementation
- Desktop Chrome: open affected PAA, change/save `EXCLUSIVE` → `NON EXCLUSIVE`, open email preview, confirm attachment status `Latest` and preview opens.
- Desktop Chrome blocked-domain check: Open/Preview must not land on a blocked `lovableproject.com` page.
- Test email to `infoo.jane@gmail.com`: confirm clean branded HTML and latest PDF attachment only.
- Final send validation: server rejects stale payloads if forced; normal send succeeds with latest PDF.
- Mobile viewport check: attachment section remains usable, X/remove and regenerate buttons visible.
- Audit log check: latest sent/test event includes exact attachment version metadata.