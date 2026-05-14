## Audit findings

### 1. Why the email shows raw `<p>` / `</p>` text
`EmailBodyEditor` is a textarea that round-trips between HTML and plain text on every keystroke:

- On hydrate it runs `htmlToText(value)` — this strips real tags **and decodes HTML entities** (`&lt;` → `<`).
- On change it runs `textToHtml(text)` which **escapes `<` back to `&lt;`** and wraps in `<p>`.

If a saved `envelope.email_message` / `esign_email_template_defaults.body_html` row contains *double-encoded* HTML (e.g. `&lt;p&gt;Dear Omar&lt;/p&gt;` — which a previous write path produced), the round-trip turns it into literal text `<p>Dear Omar</p>` in the textarea, then re-escapes it to `&lt;p&gt;Dear Omar&lt;/p&gt;` on send. The renderer injects `${bodyHtml}` raw into the email, which displays the visible `<p>` characters the user is seeing.

A second trigger: any content that lands in `bodyHtml` containing already-escaped angle brackets (e.g. legacy drafts in `localStorage`) hits the exact same path.

### 2. Why the attachment disappeared
`resolveFreshAttachment` calls the parent's `onBeforeSend` first; if that resolves with `{ url: undefined }` (parent is "clean", no regenerate needed) the code returns `{ url: undefined, name: attachmentName }` and the signed URL step is skipped. Combined with `autoAttachmentRemoved` defaulting to `false` but `attachmentUrl` being momentarily empty during template hydration, the dialog can fire `interpolated_body_html` send with `attachment_url: undefined`, and the edge function never falls back to the envelope's stored signed PDF.

### 3. What is actually working (do NOT touch)
- `buildEnvelopeEmailHtml` shell, branding, footer, CTA, IconTile, gold hairline.
- `EmailPreviewIframe` — uses the same renderer as the edge function, byte-for-byte parity.
- `download-file` proxy + `/api/download-file` rewrite — desktop preview links work.
- DocuSign CTA fallback to `/sign/{token}` on jbj.ae.
- Resend attachment fetch with retry + 15 MB cap + `%PDF-` validation.

---

## Plan (surgical repair, no rebuild)

### Step 1 — Stop the HTML-escape round-trip in the body editor
File: `src/components/e-signature/EmailBodyEditor.tsx`

- Add an input **normalizer** at hydrate time: if `value` contains `&lt;` / `&gt;` / `&amp;lt;`, decode once before `htmlToText` so the textarea shows clean prose, never raw `<p>` text.
- Make `textToHtml` resilient: if the user pasted plain-looking text that *already contains* literal `<p>` / `<br>` markers (because they typed them, or pasted from a doc), treat them as text (current behavior is fine) — but never let the editor emit a string that round-trips into `&lt;p&gt;` when re-hydrated.
- After `onChange`, also store the raw textarea text on a ref and prefer re-rendering from that text (not from `value`) while the textarea is focused — already done, just tighten the equality check so `value === textToHtml(currentText)` short-circuits.

### Step 2 — One-shot DB cleanup of double-encoded bodies
File: `src/components/e-signature/SendViaEmailDialog.tsx`

- Extend `scrubLegacyBody` with a `decodeIfDoubleEscaped` pass: when the body's plain-text projection contains `&lt;` or visible `<p>` / `</p>` literals as text, run `DOMParser` decode once and re-sanitize.
- Apply it to **both** hydration sources: `legacyBodyToHtml(defaultBody, …)` AND `data.body_html` from `esign_email_template_defaults` AND the `localStorage` draft.

### Step 3 — Defensive escape detection in the edge functions
Files: `supabase/functions/esign-send-for-signature/index.ts`, `supabase/functions/esign-send-test-email/index.ts`

- Before injecting `interpolated_body_html` into `buildEnvelopeEmailHtml`, run a guard: if the string does **not** contain any real tag (`/<[a-z][^>]*>/i` → false) AND contains escaped markers (`&lt;`), decode once. This is a server-side safety net so a poisoned client payload can never deliver visible `<p>` to the recipient.

### Step 4 — Guarantee the latest PDF is always attached
File: `src/components/e-signature/SendViaEmailDialog.tsx`

- In `resolveFreshAttachment`: when `onBeforeSend` returns `{ url: undefined }`, **always** fall through to `fetchLatestAttachment()` (which re-reads `esign_envelopes` for the freshest signed PDF) instead of returning early.
- In the edge function, if `attachment_url` is empty, look up the envelope row server-side and resolve its current `signed_pdf_url` (or re-sign from storage path) before sending — never send an attachment-less email unless `autoAttachmentRemoved` was explicitly set.
- Surface a hard error in the dialog if neither path produces a PDF, so the owner sees "No document attached" instead of silently sending nothing.

### Step 5 — Verify end-to-end
- Send three test emails to `infoo.jane@gmail.com` covering: (a) freshly-generated envelope, (b) envelope with poisoned legacy body, (c) envelope where parent skips regeneration.
- Confirm in Gmail desktop: clean paragraphs (no visible `<p>`), PDF attachment present with correct filename, inline preview opens via `/api/download-file`, DocuSign CTA resolves correctly.

### Files touched (no new modules)
- `src/components/e-signature/EmailBodyEditor.tsx`
- `src/components/e-signature/SendViaEmailDialog.tsx`
- `supabase/functions/esign-send-for-signature/index.ts`
- `supabase/functions/esign-send-test-email/index.ts`

### Out of scope (explicitly preserved)
- Email shell / branding / footer / typography
- DocuSign integration handshake
- PDF generation pipeline
- `esign-complete-envelope` and signer thank-you flow
- Storage bucket layout and signed-URL TTLs (already standardized at 7 days)