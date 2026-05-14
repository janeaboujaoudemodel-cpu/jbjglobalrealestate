## Audit findings

### What is currently working
- Branded envelope HTML (`src/lib/email/buildEnvelopeEmailHtml.ts` + server twin `supabase/functions/_shared/envelope-email-html.ts`) renders identically on mobile and desktop in the in-app iframe preview.
- PDF is **attached as base64 bytes** by Resend via `fetchEmailAttachment` (15 MB cap, magic-byte `%PDF-` validation). The email itself does **not** rely on a public link to deliver the PDF — Gmail/Outlook/Apple Mail render their own native preview from the attached bytes. This is correct.
- DocuSign CTA points to a public DocuSign URL (`DOCUSIGN_WEB` / passed `docusignUrl`) — never a Supabase host, so it cannot be blocked by ad-blockers.
- Branded download proxy exists: `public/_redirects` rewrites `/api/download-file` → `download-file` edge function. The function honours `disposition=inline|attachment`, sets correct `Content-Type`, `X-Content-Type-Options: nosniff`, sanitised filename, and falls back to authenticated private-bucket download for owner/admin.
- Owner-side preview links in `EmailAttachmentsPicker.tsx` and `SendViaEmailDialog.tsx` already wrap signed Supabase URLs with `maybeProxyStorageUrl(..., { disposition: 'inline' })`.

### What is actually broken / suboptimal

1. **Desktop "Open" still hits the raw signed Supabase URL in two places**
   - `SendViaEmailDialog.tsx` line ~565: the top-of-dialog "Open" anchor uses `href={attachmentUrl}` (raw signed URL). Only the *attachments-list* preview was proxied. Desktop ad-blockers / corporate firewalls flag `*.supabase.co/storage/v1/...` and block it. Mobile blockers don't.
   - The auto-attached envelope PDF preview link (line ~775) is proxied, but the in-line *signed-PDF* "Open" button at line ~565 is not.

2. **Email-rendered "Open" links from the Supabase storage host are still used in the iframe preview when an `attachmentUrl` is passed in.** Although `buildEnvelopeEmailHtml` does `void args.attachmentUrl` (so the recipient never sees a link — the PDF is attached as bytes), the *in-app preview* still surfaces an "Open" anchor using the raw URL upstream. We should proxy or drop it for consistency.

3. **Duplicate footer / contact info in the outbound email**
   - `buildSenderSignatureHtml` already prints: name, title, "JBJ GLOBAL REAL ESTATE", "Dubai, UAE", `CONTACT@JBJ.AE · +971 54 716 7107`, `WWW.JBJ.AE`.
   - The shell footer underneath repeats: "JBJ GLOBAL REAL ESTATE", "Dubai, UAE", `CONTACT@JBJ.AE`, `WWW.JBJ.AE`, `+971 54 716 7107`.
   - Result: every JBJ contact line is rendered **twice** (sender signature block + corporate footer). Same duplication on `_shared/esignEmailShell.ts` thank-you path.

4. **DocuSign CTA can fail silently** when `docusignUrl` is empty: it falls back to the generic `DOCUSIGN_WEB` homepage, not the actual envelope. The recipient lands on the marketing site with no envelope context.

5. **Attachment filename inconsistency**: `esign-send-for-signature` and `esign-send-test-email` accept `attachment_name` from the client, but the auto-sync path (`esign-sync-from-inbox` / saved template) sometimes regenerates the PDF with a different filename. Recipient and signed-back filename then no longer match, breaking the sync-back classifier.

6. **Race condition risk on send**: send functions call `fetchEmailAttachment(signedUrl, …)` which immediately fetches the storage URL. If the upload finished <1 s before send, Supabase storage CDN can briefly serve a 404 — caller silently falls back to "no attachment" with only a console.warn. There is no retry.

7. **Signed URL TTL**: `EmailAttachmentsPicker` uses 7-day signed URLs (good), but the auto-attached envelope PDF in some paths uses a much shorter TTL when fetched server-side. After 1 h the dialog's "Open" preview can 403 even though the email itself was already sent fine.

### Why desktop preview fails specifically
- Gmail/Outlook **do** render the attached PDF from the bytes fine on desktop — that part works.
- The *failure the user is seeing* ("blocked / can't open") is the **owner's in-app preview** dialog and the Eye/Open icon next to attachments **hitting raw `*.supabase.co/storage/v1/...` URLs that uBlock/AdGuard/corp-firewalls block on desktop**. Mobile content-blockers don't filter that pattern → "works on phone".
- Fix is consistent proxying through `/api/download-file?disposition=inline` everywhere, never letting a raw storage URL escape into a clickable link.

---

## Plan (targeted fixes, no rebuild)

### 1. Proxy every outbound storage link consistently
- **`src/components/e-signature/SendViaEmailDialog.tsx`** line ~565: wrap the top-row "Open" anchor with `maybeProxyStorageUrl(attachmentUrl, { filename: attachmentName, disposition: 'inline' })`.
- Audit `EmailPreviewIframe.tsx` consumers — pass through the proxied URL or drop the `attachmentUrl` prop entirely (it's `void`-ed by the renderer anyway).
- Add a tiny lint helper `assertProxiedUrl(url)` used in dev-only to surface any raw storage URL still leaking into anchors.

### 2. De-duplicate footer / contact info
- **`buildEnvelopeEmailHtml.ts`** + `_shared/envelope-email-html.ts`: collapse the corporate footer to a single line — keep wordmark + © + Dubai, drop the second `CONTACT@JBJ.AE` / `WWW.JBJ.AE` / phone since the sender signature already shows them. Same edit to `_shared/esignEmailShell.ts`.
- Alternative (preferred): keep the corporate footer untouched and slim the **sender signature** to: name, title, "JBJ GLOBAL REAL ESTATE", "Dubai, UAE" — no contact lines, no phone. Contact info lives only in the corporate footer. This matches premium executive emails (single contact block per message).

### 3. Make DocuSign CTA bullet-proof
- In `buildEnvelopeEmailHtml.ts`, when `docusignUrl` is empty or invalid, render the CTA pointing to the **owner-managed envelope landing page** on `jbj.ae` (`/sign/{envelope_id}`) instead of the DocuSign marketing homepage. That landing page already exists (`SignDocument.tsx`) and resolves to the real envelope.
- Add basic URL validation (`new URL(docusignUrl)` in try/catch) before injecting.

### 4. Harden the send path against race conditions
- In `esign-send-for-signature` and `esign-send-test-email`: if `fetchEmailAttachment` returns null **and** the URL is one of our own storage URLs, retry once after 1.5 s. If still null, fail the send with a 4xx and surface the message in the dialog instead of silently sending an attachment-less email.
- Ensure the storage upload uses `await` and the signed URL is created **after** the upload promise resolves (already the case in `EmailAttachmentsPicker`; verify same in the auto-attach path).

### 5. Stabilise filename + signed URL TTL
- Centralise filename generation in `src/lib/esign/attachmentFilename.ts` (`{docNumber}-{slugifiedTitle}.pdf`) and reuse from owner UI, send functions, and inbound sync classifier.
- Standardise signed URL TTL to **7 days** for every esign attachment path so the dialog "Open" doesn't 403 mid-session.

### 6. End-to-end verification (no shortcuts)
- Reuse the existing `esign-send-test-email` with `test_recipient = "infoo.jane@gmail.com"`.
- Send three test emails and inspect each in Gmail desktop, Apple Mail desktop, and Outlook web:
  1. With the attached envelope PDF only.
  2. With one extra owner-uploaded attachment.
  3. With a missing/invalid `docusignUrl` (verify CTA still resolves to `/sign/{id}` on jbj.ae).
- For each: confirm Gmail's inline PDF preview opens on desktop, "Download" works, no duplicate footer rendered, DocuSign CTA opens the right URL.
- Use `code--exec curl -I` against `/api/download-file?...&disposition=inline` to confirm `Content-Type: application/pdf` + `Content-Disposition: inline` headers come back.
- Capture screenshots via `browser--screenshot` of: the dialog "Open" working on desktop, the rendered email in Gmail desktop preview, and the DocuSign landing.

### Files to touch (no new modules, no duplicates)
- `src/components/e-signature/SendViaEmailDialog.tsx` (proxy the one remaining raw link)
- `src/components/e-signature/EmailPreviewIframe.tsx` (drop/proxy `attachmentUrl` prop)
- `src/lib/email/buildEnvelopeEmailHtml.ts` + `supabase/functions/_shared/envelope-email-html.ts` (CTA fallback URL, footer de-dupe)
- `supabase/functions/_shared/esignEmailShell.ts` (footer de-dupe to match)
- `supabase/functions/esign-send-for-signature/index.ts`, `esign-send-test-email/index.ts` (retry-once on attachment fetch, fail loud instead of silent)
- New: `src/lib/esign/attachmentFilename.ts` (single source of truth)
- No DB migration. No new edge function. No new email template.

### Out of scope (explicitly NOT doing)
- Rewriting the envelope/signing system.
- Adding a new email shell or second template.
- Changing brand/typography/spacing.
- Touching `esign-complete-envelope` owner CTA buttons.
