## Bugs to fix on /e-signature → Send by email + Sign page

### 1. Email preview header & footer broken on mobile
File: `src/lib/email/buildEnvelopeEmailHtml.ts` (and its byte-for-byte mirror `supabase/functions/_shared/envelope-email-html.ts`).

- Header table currently uses 3 fixed `<td>` columns — at narrow widths the JBJ wordmark wraps one word per line and the monogram drifts off-corner.
- Rebuild header as a stacked, mobile-first block:
  - Monogram aligned hard-left at 64×64.
  - "JBJ GLOBAL REAL ESTATE" forced on a single line (`white-space:nowrap; font-size:clamp(14px,3.6vw,18px)`) sitting next to the monogram.
  - Doc number drops under the wordmark on screens ≤ 480 px (use a `<br>` + `@media` block injected via `<style>` in `<head>`).
- Footer columns currently collide on phones (email/website/phone overlap, render in ink not gold). Rebuild footer:
  - One `<td>` per row inside a `@media (max-width:520px)` block (display:block, width:100%, text-align:center).
  - Email + website + phone styled with `color:#B89555` (gold) and `text-decoration:none`, separated by 6 px vertical spacing.
  - Company name stays on one line at the top, `Dubai, UAE` underneath.
- Increase `max-width` of inner table to 100 % below 520 px and remove side padding from outer `<td align="center">` so nothing clips the gold border.

### 2. Attachment chip not clickable
- `buildEnvelopeEmailHtml` currently renders the attachment chip as a plain `<div>`. Change the signature so the renderer accepts `attachmentUrl?: string` and wraps the chip in `<a href="${attachmentUrl}" download …>` styled gold-on-champagne with the paperclip icon. When `attachmentUrl` is missing, fall back to the current static chip.
- Thread the new prop through:
  - `EmailPreviewIframe` (add `attachmentUrl`),
  - `SendViaEmailDialog` (resolve from envelope `document_url` via `maybeProxyStorageUrl`),
  - test/send edge functions `esign-send-test-email` + `esign-send-for-signature` (add to payload + forward to `_shared/envelope-email-html.ts`).

### 3. PAA + Letterhead preview broken on mobile
File: `src/templates/letterheadChrome.ts`.

- `buildLetterheadHeader` uses a flex row with `min-width:150px` on the contact column → forces overflow on the phone preview iframe. Wrap the whole header in a responsive style block: stack the three columns vertically below 520 px, monogram + brand row first, contact column second (still gold, right-aligned on desktop, left-aligned on mobile).
- `buildLetterheadFooter` 3-column table → add the same `@media` block: stack each `<td>` to `display:block;width:100%;text-align:center` on phones; ensure email/website remain gold (`#B89555`) and the phone number remains ink.
- No copy or branding changes — chrome only.

### 4. Purge fake JBJ contact + "Citi Developers Sales & Experience Center" from signature presets
- Run a migration that updates every row in `email_signature_presets` so:
  - `address_line` → `'Office SM1-195, Port Saeed, Deira, Dubai, UAE'` (from `TRADE_LICENSE_OFFICE`).
  - `phone` → `'+971 54 716 7107'` for Founder / CEO and Executive Office; clear (`NULL`) the placeholder zero numbers on HR / Help Desk rows so they fall back to the company line until real numbers exist.
  - `email` → `'Contact@JBJ.AE'` for Founder / CEO + Executive Office; keep `careers@jbj.ae` and `support@jbj.ae` (real per `companyLegal.ts`).
  - `website` → `'https://www.jbj.ae'` for all (already correct).
- Update `renderSignatureHtml` so the title line (`Founder & CEO`) renders in gold (`color:#B89555;letter-spacing:.18em;text-transform:uppercase;font-weight:600`) — the user explicitly asked for the title (or the name) in gold for premium feel. Keep the rest ink.

### 5. Strip remaining fake `jane@jbj.ae` / `+971 50 000 0000` site-wide
- Replace literal `jane@jbj.ae` with `Contact@JBJ.AE` in:
  - `src/config/team-members.ts:343`
  - `src/config/assistant-brain-updates.ts:273`
  - `supabase/functions/_shared/ai-utils.ts:56`
  - `supabase/functions/ai-chat-support/index.ts:162`
- Search-replace `050 000 0000` / `0500000000` if any literal slipped in (none found in code today, but include the lint sweep so future edits stay clean).
- Add an entry to `scripts/contrast/...` style guard? No — out of scope. Just a one-pass `rg` clean-up.

### 6. Sign page (`/sign/:token`) — DocuSign CTA was opening blank/slow + no clear steps
File: `src/pages/e-signature/SignDocument.tsx` (+ `src/config/docusignHandoff.ts`).

- Replace the "Sign with DocuSign" button target with the faster, deterministic web sign-in entry: `https://account.docusign.com/` (loads instantly vs `apps.docusign.com` blank wait). Update `DOCUSIGN_WEB` in `docusignHandoff.ts` so every consumer (email CTA, sign page, mirrored edge fn, `buildEnvelopeEmailHtml.ts`) gets the new URL in one edit.
- Add a third CTA "Create a free DocuSign account" → `https://account.docusign.com/signup` directly under the Sign button (small outline button, gold border).
- Restructure the steps cards to read top-to-bottom as a numbered checklist:
  1. **Download the agreement** (existing card; promote to step 1 — the user must have the PDF before signing).
  2. **Install or open DocuSign** — App Store / Google Play / "Open DocuSign Web" with the new fast URL + Create-account link.
  3. **Open the PDF inside DocuSign** — short note: "In the DocuSign app, tap *+ → Upload* and pick the PDF you just downloaded. Place your signature, initials and date, then tap *Finish*."
  4. **Email the signed copy back** (existing card).
- Keep all existing copy, status / decline / expired states untouched.

### 7. Allow the in-app preview iframe to actually open the DocuSign CTA
File: `src/components/e-signature/EmailPreviewIframe.tsx`.
- Sandbox is `allow-same-origin` only — clicks on the OPEN IN DOCUSIGN button do nothing. Change to `sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"` so test clicks open in a new tab during preview.

---

### Technical notes
- The two `envelope-email-html` files (frontend + edge) MUST stay byte-for-byte identical (existing rule) — every change in §1, §2 is duplicated.
- The signature-preset migration is data-only (UPDATE on system rows). No schema change.
- No new packages. No backend logic changes beyond the signature-preset UPDATE and the new `attachmentUrl` payload field on the two send edge functions.
- Out of scope: changing the brokerage outreach pipeline (`crm-send-brokerage-outreach`) — that flow is correctly separated from JBJ-only signatures by the Single-Agency Email Rule and is unaffected by these fixes.