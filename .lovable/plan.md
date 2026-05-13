## Scope

Two areas, presentation-only fixes plus one edge-function reply-to/auto-reply tweak.

---

### 1. CRM Leads table — "NEW" badge looks broken

In `src/components/crm/CRMLeadsTableV2.tsx` the **Status** column is too narrow, so the dot + pill badge collide with the column frame.

**Fix**
- Widen the Status column (`min-w` / `w` on the `<th>` and matching `<td>`) so the full badge fits in one line.
- Add `whitespace-nowrap` and a small horizontal padding buffer around the badge cell so the circle and pill border never overlap the cell border.
- No change to badge styles themselves — the badge already has `whitespace-nowrap`; the problem is purely column width.

---

### 2. Branded envelope email — fix 5 issues

All edits in **`src/lib/email/buildEnvelopeEmailHtml.ts`** and the mirrored **`supabase/functions/_shared/envelope-email-html.ts`** (these two MUST stay byte-identical because the preview uses one and the edge function uses the other).

#### 2a. Header crowding (company name vs DOC NO.)
The header row puts `JBJ GLOBAL REAL ESTATE` and `DOC NO. JBJ-PAA-…` on the same line, which collides on narrow widths.
- Drop `DOC NO.` from the branded email entirely (it's already on the PDF and inside the document body).
- Keep the wordmark + monogram alone on the header row, with the gold hairline below.

#### 2b. Underscore/dash between "Agreement" and "Leasing"
Currently rendered as `Agreement — Leasing` but appears as a connector that looks like an underscore on some clients. Replace with a clean comma + space: `Agreement, Leasing` (and same in the subject builder + preview headline). Also fix the matching string in `src/pages/e-signature/EnvelopeDetail.tsx:868`.

#### 2c. "Founder & CEO" must be gold
In the signature block of both HTML builders, wrap the title line in `<span style="color:#B89555;font-weight:600;letter-spacing:.04em;">Founder &amp; CEO</span>`. Name stays ink, brand line stays ink, only the title turns gold.

#### 2d. PDF Download button opens a blank `…supabase.co/functions/v1/esign-document-proxy…` page
Root cause: `EnvelopeDetail.tsx:1390` wraps `envelope.document_url` with `maybeProxyStorageUrl(...)` before handing it to the email. The proxy edge function requires an `Authorization` header, which an email client cannot send → blank page with the React "enable JavaScript" fallback.

**Fix**
- For the email's attachment link, do NOT proxy. Instead, generate a **public signed URL** and pass that as `attachmentUrl`:
  - On `EnvelopeDetail.tsx`, when opening `SendViaEmailDialog`, derive `attachmentUrl` via `supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7)` (7-day signed URL) for the envelope's `document_url`. Fall back to the raw public URL if the file is already in a public bucket.
  - The signed URL ends in `…/object/sign/...?token=…` and works in any email client without auth.
- In the HTML builder, keep the chip as a plain `<a href="…signed-url…" download="…">` — no other change needed.

#### 2e. "OPEN IN DOCUSIGN" → blank "enable JavaScript" page
Same root cause when no specific envelope URL is supplied: the button currently points to a Supabase function URL (or to `about:blank` inside the sandboxed preview). Fix:
- Default `docusignUrl` to the universal public DocuSign entry: `https://apps.docusign.com/send/documents` (already what `src/config/docusignHandoff.ts` exposes — confirm and use that constant).
- In `buildEnvelopeEmailHtml`, when `docusignUrl` is empty/invalid, hard-fallback to that public URL so the `<a>` always points to a real DocuSign page.
- Also add `target="_blank" rel="noopener"` (already present) — no JS, just a real link.

#### 2f. Below the DocuSign button, add a short numbered "How to sign with DocuSign" mini-guide
Per the previous turn's request that's still active. 3 short steps + the Create-account / App Store / Google Play links. Pure HTML in the same builder.

---

### 3. Reply-to + auto-reply to `contact@jbj.ae`

In `supabase/functions/esign-send-for-signature/index.ts`:
- `reply_to` is already `contact@jbj.ae` (line 167) ✅ — verify and leave.
- BCC list already includes `contact@jbj.ae` ✅.
- Add an **auto-reply** template: when an inbound email lands on `contact@jbj.ae`, an acknowledgment is sent back. This requires a tiny new edge function `esign-inbound-autoreply` that:
  - Accepts the Resend inbound webhook payload.
  - Sends a single auto-reply via Resend from `contact@jbj.ae` with subject `Re: <original subject>` and a short branded body ("We've received your message and a member of the JBJ team will respond shortly.").
  - De-duplicates by `Message-Id` so loops are impossible.
- Update `src/components/e-signature/SendViaEmailDialog.tsx` `DISPLAY_REPLY_TO` label remains `contact@jbj.ae`. Replace any remaining `contract@jbj.ae` typo with `contact@jbj.ae` project-wide (search + replace).

---

### Files to change

- `src/components/crm/CRMLeadsTableV2.tsx` — Status column width
- `src/lib/email/buildEnvelopeEmailHtml.ts` — header, em-dash, gold title, signed-url chip, DocuSign fallback, how-to-sign block
- `supabase/functions/_shared/envelope-email-html.ts` — same edits, kept byte-identical
- `src/pages/e-signature/EnvelopeDetail.tsx` — generate signed URL for attachment instead of proxied URL
- `src/pages/e-signature/SignDocument.tsx` — same dash fix if present
- `supabase/functions/esign-send-for-signature/index.ts` — verify reply_to, no logic change
- `supabase/functions/esign-inbound-autoreply/index.ts` — **new** auto-reply handler
- Project-wide: replace any `contract@jbj.ae` typos with `contact@jbj.ae`

### Open question

The auto-reply needs Resend **inbound email** (a configured inbound route on `contact@jbj.ae`). If that inbound route isn't set up in Resend yet, the edge function will deploy but won't fire until the route is added in the Resend dashboard. Want me to deploy the function anyway so it's ready, or wait until inbound is enabled?
