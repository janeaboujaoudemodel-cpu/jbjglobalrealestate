## Audit findings

### Currently working
- The main `/e-signature/:id` document preview renders the Omar PAA and opens the `Send via Email` dialog.
- The current desktop dialog preview renders clean paragraphs for the Omar envelope: no visible `<p>`, `</p>`, `<br>`, `{{ }}`, JSON, or markdown in the iframe preview.
- The auto-attachment row is visible in the dialog for `JBJ-PAA-LEASING-0001.pdf`.
- The email shell/branding renderer is shared between client preview and backend send (`buildEnvelopeEmailHtml` / `_shared/envelope-email-html.ts`).
- The Resend payload is using `html: emailHtml` and a separate text fallback, so the intended MIME path is HTML email.
- The PDF generation hook uploads generated PDFs to `esign-documents` and stores `document_url` / `document_filename` on the envelope.

### Broken / risky logic found
- **Raw HTML regression can still happen server-side** when the body contains a mix of real HTML and escaped HTML. Current backend guard only decodes when there are escaped tags and no real tags. A mixed payload like `<p>&lt;p&gt;Dear Omar&lt;/p&gt;</p>` can still deliver visible `<p>` text.
- **Attachment synchronization is split across two dialogs.** `SendViaEmailDialog` has the stronger auto-attachment logic, but `SendForSignatureDialog` is still a duplicate send path and does not pass `attachment_name` / `attachment_url` to either test or live send.
- **Test send attachment fallback is incomplete.** `esign-send-test-email` only attaches when the client sends `attachment_url` + `attachment_name`; unlike the live send, it does not pull the latest document from the envelope if the client payload is missing those fields.
- **Preview can become stale after regeneration.** `onBeforeSend` re-pulls the fresh attachment before sending, but the visible attachment preview still uses the original `attachmentUrl` / `attachmentName` props from when the dialog opened.
- **PDF preview UX is incomplete.** The dialog offers an “Open” link, but there is no inline PDF preview panel/state inside the email dialog, so “preview before send” is not a true email + attachment + PDF preview bundle.
- **Desktop blocked-PDF issue is caused by opening/fetching raw storage URLs in some paths.** The download proxy exists, but the send/test payload can still depend on public storage URLs or stale signed URLs. Backend attachment fetch should resolve storage object paths itself instead of trusting client URL freshness.

### Duplicated components / flows
- `SendForSignatureDialog.tsx` duplicates recipient chips, subject/body editor, DocuSign input, test send, live preview, send button, and template locking logic.
- `SendViaEmailDialog.tsx` is the newer, stronger preview-first email workflow with attachment preview and auto-sync.
- Client and backend email shell renderers are intentionally duplicated mirrors and must remain synchronized, but should share the same normalization rules.

## Fix plan

### 1. Harden email body normalization everywhere
Files:
- `src/components/e-signature/EmailBodyEditor.tsx`
- `src/components/e-signature/SendViaEmailDialog.tsx`
- `supabase/functions/esign-send-for-signature/index.ts`
- `supabase/functions/esign-send-test-email/index.ts`

Implement a single defensive rule in each path:
- Decode escaped HTML markers even when real tags also exist.
- Collapse legacy nested escaped paragraphs into real paragraphs.
- Strip raw template tokens (`{{sender_signature}}`, `{{signing_link}}`) from delivered body content.
- Sanitize allowed body tags only (`p`, `br`, bold/italic/underline, safe links).
- Generate plain-text fallback from the final sanitized HTML, never from raw input.

This prevents any visible `<p>`, `</p>`, `<br>`, `<`, `>`, `{{ }}`, escaped HTML entities, or template syntax from reaching the client.

### 2. Make attachment sync authoritative from the envelope
Files:
- `src/components/e-signature/SendViaEmailDialog.tsx`
- `supabase/functions/esign-send-for-signature/index.ts`
- `supabase/functions/esign-send-test-email/index.ts`

Changes:
- Store the freshly resolved attachment in dialog state after `onBeforeSend`, so the visible preview updates to the exact URL/name that will be sent.
- Remove the silent “send without attachment” path unless the user explicitly clicks Remove.
- In both live and test backend functions, if the client omits `attachment_url`, load the latest `esign_envelopes.document_url` / `document_filename` server-side.
- Resolve storage object URLs server-side into fetchable bytes before calling Resend.
- Fail loudly with a clear dialog toast if no PDF can be resolved, instead of sending an attachment-less email.

### 3. Merge the duplicate send paths safely
Files:
- `src/pages/e-signature/EnvelopeDetail.tsx`
- `src/components/e-signature/SendForSignatureDialog.tsx`
- `src/components/e-signature/SendViaEmailDialog.tsx`

Changes:
- Keep `SendViaEmailDialog` as the canonical email send workflow.
- Make the “Send for signature” email action route through the same preview-first dialog or pass the exact same attachment fields if it remains available.
- Do not delete the older dialog yet; de-risk by disabling its incomplete direct email path or converting it to hand off to the canonical workflow.
- Preserve WhatsApp/copy-link behavior.

### 4. Add real PDF preview inside the email dialog
Files:
- `src/components/e-signature/SendViaEmailDialog.tsx`

Changes:
- Add a compact PDF preview drawer/inline panel using the existing download proxy URL with `disposition=inline`.
- Show attachment status states: syncing, attached, previewable, missing/error.
- Ensure the attachment preview URL is the same resolved URL used for send/test.

### 5. Keep email preview and sent email 1:1
Files:
- `src/lib/email/buildEnvelopeEmailHtml.ts`
- `supabase/functions/_shared/envelope-email-html.ts`

Changes:
- Keep both renderers synchronized.
- Add a visible, premium “PDF attached” strip using the real attachment filename so the email body itself makes the attachment obvious without fake placeholders.
- Preserve the DocuSign CTA and fallback signing URL behavior.

### 6. Verify end-to-end after implementation
I will test:
- Desktop preview dialog: no raw HTML, attachment row visible, PDF preview opens.
- Test email to `infoo.jane@gmail.com`: clean rendered HTML, PDF attached, DocuSign CTA present.
- Live send payload path: synchronized latest `document_url` / filename sent.
- Browser network: no failed PDF proxy requests.
- Backend logs: no PDF fetch failures and no Resend attachment errors.

## Expected final report after implementation
I will provide:
1. What is working.
2. What was broken.
3. Why desktop preview failed / was incomplete.
4. What caused the blocked/missing PDF issue.
5. Which components were duplicated.
6. What was merged or routed into the canonical flow.
7. What was optimized.
8. Exact fixes implemented.
9. Desktop screenshot proof from the tested preview flow, plus notes on email/PDF test results.