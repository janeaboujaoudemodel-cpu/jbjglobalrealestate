## Scope

Fix only the email/preview signing flow you flagged in the screenshots. Don't touch the rest of the app.

Three concrete problems to fix:

1. **Download link is blocked** — the "Download" link in the preview and in the delivered email points at `mdafrewypkkrildjgtey.supabase.co/...`. Chrome / ad‑blockers / corporate proxies routinely block raw `*.supabase.co` URLs (`ERR_BLOCKED_BY_CLIENT`), which is exactly the screenshot you sent.
2. **"Open in DocuSign" button looks cheap** — the current 1px gold border around a flat black bar reads as an unbalanced rectangle with hard dividers, not a premium CTA.
3. **No clear "Download the form first" step** — users land on Open in DocuSign with no obvious place to grab the PDF first. The PDF *is* attached at the Resend layer, but visually nothing tells them so.

Out of scope for this pass (you said "don't touch the rest"): mobile slowness, header fade/scroll bug, the "API key not configured" message on login, and the global mobile redesign. Happy to plan those separately when you want.

## Plan

### 1. Route attachment downloads through `jbj.ae` instead of `supabase.co`

- Add a tiny public edge function `download-envelope-pdf` that:
  - Accepts a short‑lived signed token (HMAC over `envelope_id` + `expires_at`).
  - Resolves the envelope's storage path, generates a fresh signed Supabase URL, and **307‑redirects** to it with `Content-Disposition: attachment; filename="…pdf"`.
  - Returns the file bytes if the redirect itself would be blocked (fallback streaming mode).
- Email + preview send link as `https://www.jbj.ae/api/download/envelope/<token>` (rewritten to the edge function via `public/_redirects`). `jbj.ae` is your own domain → not on any blocklist.
- Resend attachment stays as today (PDF is still physically attached to the email; this just makes the in‑body Download button work even when supabase.co is blocked).

### 2. Premium "Download the signed form" CTA, then "Open in DocuSign"

Rebuild the CTA stack in `src/lib/email/buildEnvelopeEmailHtml.ts` and the mirrored `supabase/functions/_shared/envelope-email-html.ts` so the recipient sees, in order:

```text
┌───────────────────────────────────────────────┐
│  STEP 1  ·  DOWNLOAD YOUR AGREEMENT  (PDF)   │  ← solid champagne, gold hairline, tall
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│  STEP 2  ·  OPEN IN DOCUSIGN  →               │  ← solid ink, gold hairline, same width
└───────────────────────────────────────────────┘
        New to DocuSign? Create a free account
```

- Both buttons share the same width, padding, and corner radius so they read as a paired set, not a stretched bar.
- Replace the current heavy `border:1px solid #B89555` look with a refined inner gold hairline + soft shadow — no "bold dividers" feel.
- Drop the standalone `📎 PDF attached` chip; it becomes the Step 1 button itself.
- Keep the App Store / Google Play sub‑links but move them under Step 2 in lighter type.
- "How to sign with DocuSign" panel stays but is restyled to match (no change in copy).

### 3. Make the in‑app preview iframe use the same working URL

`SendViaEmailDialog.resolveAttachmentUrl()` currently produces a `supabase.co/storage/v1/.../sign/...` URL. Switch it to call a new `getDownloadProxyUrl(envelopeId)` helper that returns the `jbj.ae` proxy URL instead, so the preview's Step 1 button opens in a new tab without being blocked.

## Files I'll touch

- `supabase/functions/download-envelope-pdf/index.ts` — new public edge function (signed token → redirect/stream).
- `supabase/functions/esign-send-for-signature/index.ts` — pass `attachment_url = proxy URL` into the HTML builder; keep the real Resend `attachments[]` exactly as today.
- `supabase/functions/esign-send-test-email/index.ts` — same swap for the test send.
- `supabase/functions/_shared/envelope-email-html.ts` — new two‑step CTA block, premium styling, removed standalone chip.
- `src/lib/email/buildEnvelopeEmailHtml.ts` — byte‑identical mirror of the above.
- `src/components/e-signature/SendViaEmailDialog.tsx` — `resolveAttachmentUrl` returns the proxy URL.
- `public/_redirects` — `/api/download/envelope/*  https://<project>.functions.supabase.co/download-envelope-pdf/:splat  200!` (server‑side rewrite, not a 301, so the user never sees supabase.co in the address bar).
- DB: a small `envelope_download_tokens` table (or reuse existing share‑token infra if present) so the proxy can resolve envelope → storage path safely.

## What you'll see after

- Email "Step 1 · Download" button opens the PDF directly from `jbj.ae` — no more Chrome block page.
- Two equal, balanced premium buttons (Download → Open in DocuSign), no stretched rectangle, no harsh dividers.
- The PDF is still physically attached to the email itself (Resend `attachments[]`) — the visible button is now just the always‑working backup.
- Preview in `SendViaEmailDialog` matches the delivered email byte‑for‑byte.

Want me to also queue the mobile/header/login‑error issues as a follow‑up plan after this lands?