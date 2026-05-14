## What I'll fix

### 1. "Open" attachment in the email preview is blocked
The Preview "eye" icon and the email-preview "Open" links point straight at the raw `*.supabase.co/storage/v1/...` signed URL. Desktop ad-blockers and corporate firewalls block that host (the same reason `/api/download-file` proxy and `/d` branded download page exist). On mobile it works because mobile blockers don't filter that pattern.

Fix:
- `src/components/e-signature/EmailAttachmentsPicker.tsx` — wrap the "Open / Eye" link with `maybeProxyStorageUrl(a.url, { filename: a.name, disposition: 'inline' })` so it routes through `/api/download-file` (already whitelisted in `public/_redirects`).
- Same treatment for the "Attachments the client will receive" preview list inside `SendViaEmailDialog.tsx` (open buttons next to each file).
- Confirm `download-file` edge function honours `disposition=inline` so the PDF renders in-browser instead of forcing download.
- Test by clicking Open in the dialog — must render the PDF inline, not the blocked page.

### 2. Remove "Sign with DocuSign (optional)" — signing is mandatory
In `src/lib/email/buildEnvelopeEmailHtml.ts` (and its server twin `supabase/functions/_shared/envelope-email-html.ts`):
- Change the step label from `"Sign with DocuSign (optional)"` to `"Sign with DocuSign"`.
- Keep the CTA button but remove the "(optional)" wording everywhere it appears.

### 3. Client thank-you email — strip owner-only content
Currently the thank-you uses `actionButtons({ viewUrl: …/e-signature/<id> })` which links the client into the private owner backend, plus the "we're now collecting the remaining signatures…" paragraph.

In `supabase/functions/esign-send-signer-thanks/index.ts`:
- Remove the `actionButtons(...)` call entirely from the client-facing email (no "VIEW SIGNED DOCUMENT", no "DOWNLOAD SIGNED PDF", no "DOWNLOAD AUDIT CERTIFICATE" buttons in client mail).
- Replace the `statusNote` block with the exact copy requested:
  > Thank you for signing, {client first name}. We have received your signature. Any questions, simply reply to this email.
- Keep the small "Signed {date/time}" confirmation card and the JBJ signature line.
- The owner notification (separate path in `esign-complete-envelope`) keeps the "VIEW SIGNED DOCUMENT" CTA — that one is for the owner only.

### 4. Footer polish in `_shared/esignEmailShell.ts`
The shared shell used by signer-thanks and complete-envelope shows:
- "Private Office · Dubai, UAE" — remove "Private Office", keep "Dubai, UAE".
- Phone wraps to two lines / wordmark wraps — switch the 3-column footer to the same responsive single-row layout already used in `buildEnvelopeEmailHtml.ts` (with `white-space:nowrap` on phone and `letter-spacing` reduced on mobile breakpoints) and force the wordmark to a single line via `white-space:nowrap` + smaller letter-spacing on narrow widths.
- The blue auto-linked email/website: wrap `contact@jbj.ae` and `www.jbj.ae` in explicit `<a>` tags styled with `color:#B89555;text-decoration:none;font-weight:600` (matches the other email shell) so Gmail doesn't auto-blue them.
- Bottom line currently reads `© 2026 JBJ Global Real Estate · Electronically signed & legally binding`. Change to: `© {year} JBJ GLOBAL REAL ESTATE` with the same letter-spacing treatment as the other shell, dropping the "Electronically signed…" tail to match the premium look.

### 5. End-to-end verification
- Deploy `esign-send-signer-thanks` after edits.
- Send a test thank-you to `infoo.jane@gmail.com` via the existing `test_recipient` parameter and confirm:
  - no "View Signed Document" / "Download Signed PDF" / "Download Audit Certificate" buttons,
  - new short body copy,
  - footer single-line wordmark + phone, no "Private Office", branded gold email/website links.
- Send a test signature-request email and confirm:
  - "Sign with DocuSign" (no "optional"),
  - clicking Open on each attachment in the in-app preview opens the PDF inline (no block page),
  - the same Open links inside the rendered email body open via the `/api/download-file` proxy.

## Files I'll touch

- `src/components/e-signature/EmailAttachmentsPicker.tsx`
- `src/components/e-signature/SendViaEmailDialog.tsx` (attachment-list Open buttons only)
- `src/lib/email/buildEnvelopeEmailHtml.ts`
- `supabase/functions/_shared/envelope-email-html.ts` (server twin — must stay byte-for-byte aligned)
- `supabase/functions/_shared/esignEmailShell.ts`
- `supabase/functions/esign-send-signer-thanks/index.ts`

No DB migration. No changes to the owner-facing `esign-complete-envelope` CTA buttons.
