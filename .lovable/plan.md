## Problem

The "Send for Signature" template dialog (`SendForSignatureDialog`) is the one tied to the template flow you're using. Two issues:

1. **In-app preview is fake** — it's a plain text preview built from the raw `body` Textarea. It does NOT use the same branded HTML shell (header monogram, JBJ wordmark, **OPEN IN DOCUSIGN** button, attachment chip, footer) that the recipient actually receives.
2. **Test email also lacks the CTA** — this dialog calls `esign-send-test-email` with only `interpolated_body` (plain text). Even though the edge function wraps it in the branded shell, the older deployed version of the shared renderer renders the CTA conditionally on a `docusign_url`, which this dialog never sends. The other dialog (`SendViaEmailDialog`) was already upgraded — the template dialog was missed.

The newer `SendViaEmailDialog` already does it right: live `EmailPreviewIframe` driven by the same `buildEnvelopeEmailHtml` renderer the edge functions use, and an always-on CTA fallback. We need to bring the template dialog up to the same standard, then redeploy.

## Fix

### 1. `SendForSignatureDialog.tsx`
- Replace the hand-rolled "Live preview" block (lines 404–432) with `<EmailPreviewIframe />`, fed by the same byte-for-byte HTML renderer.
- Add an optional **DocuSign envelope URL** input (mirrors `SendViaEmailDialog`); empty falls back to the universal DocuSign web entry, so the **OPEN IN DOCUSIGN** CTA is always visible.
- Build `interpolated_body_html` locally (escape body, replace `\n` with `<br/>`, swap `{{sender_signature}}` sentinel for the styled HTML signature block via `buildSenderSignatureHtml`).
- Pass `interpolated_subject`, `interpolated_body_html`, `docusign_url`, `attachment_name` to BOTH `esign-send-test-email` and `esign-send-for-signature` (keep `interpolated_body` for backward-compat).
- Fix the leftover "Downtown Dubai, UAE" line in the inline preview (now removed since iframe replaces it — done implicitly).

### 2. Redeploy edge functions
Deploy `esign-send-test-email` and `esign-send-for-signature` so the latest `_shared/envelope-email-html.ts` (with always-on CTA + `DOCUSIGN_WEB` fallback) ships. The shared module is bundled at deploy time; the previous redeploy happened before the always-on CTA edit.

### Result
- The preview iframe in the template dialog renders the exact same HTML as the test email and the real client email — header monogram, JBJ wordmark on the centerline, **OPEN IN DOCUSIGN →** button, App Store / Google Play hint, attachment chip, footer.
- "Send Test to Me" delivers that exact HTML to `infoo.jane@gmail.com` so you can approve once and trust every subsequent send.

No business-logic / DB changes. Frontend + 2 edge function redeploys only.