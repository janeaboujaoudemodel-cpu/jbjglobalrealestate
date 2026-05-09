
## Turn 3 plan — 4 atomic fixes, end-to-end tested

You raised four concrete issues. I'll fix each one, then navigate through the flow and post a screenshot proving every fix landed.

---

### 1. Premium "big-company" signature block (replaces `— Jane Bou Jaoude\nJBJ GLOBAL REAL ESTATE`)

The current `{{sender_signature}}` resolves to two thin plain-text lines, with a literal newline that emails render as a flat run. That's why your name looks like it has an underscore behind it (it's actually the underline rule of the signature divider rendering against the name with no spacing) and why there's no title.

New `{{sender_signature}}` block — used in BOTH the live preview and the delivered email (byte-for-byte parity preserved):

```text
[Premium script wordmark — "Jane Bou Jaoude" in Cormorant Garamond Italic, 22px, ink #1A1A1A]
─────────────────────────  (1px gold #B89555 hairline, 56px wide)
JANE BOU JAOUDE            (Inter, 11px, .18em tracking, ink, 700)
Founder & Chief Executive  (Inter, 10.5px, .14em tracking, ink/70)
JBJ GLOBAL REAL ESTATE     (Inter, 11px, .22em tracking, ink, 700)
Private Office · Dubai, UAE   ·   contact@jbj.ae   ·   +971 54 716 7107
www.jbj.ae
```

Implementation:
- In `esign-send-for-signature/index.ts`, `esign-send-test-email/index.ts`, and `SendForSignatureDialog.tsx`, replace the plain-text `sender_signature` token with a multi-line HTML signature block (image-safe, table-based, email-client tested). Keep a plain-text fallback for the textarea editor (so the merge-tag chip still works).
- Add a new `sender_title` field on `esign_envelopes` (default `"Founder & Chief Executive"`) so any signed-in user inherits a sensible title; user can override per envelope.
- Font: Cormorant Garamond Italic for the script wordmark, served via Google Fonts CSS in the email head — this is the "premium luxury font" you asked for. Inter for the rest (already brand standard).
- The literal underscore problem is removed: no more raw `\n` rendered between name and company; the block is structured HTML with proper spacing + a thin gold divider.

Alternative font choices if you prefer different vibes (we'll go with **Cormorant Garamond Italic** by default; tell me to swap if you want one of these):
- *Playfair Display Italic* — editorial / Vogue
- *Pinyon Script* — flowing handwritten cursive
- *Marcellus* — refined Roman-inscription serif

---

### 2. "Send Test to Me" button — make it impossible to miss

The button already exists in the dialog footer but you didn't see it. Two fixes:
- Promote it from the footer into a **dedicated banner above the Subject field** with the gold hairline + flask icon: *"Preview before you send → [Send Test to infoo.jane@gmail.com]"*. Always visible, doesn't require scrolling to the footer.
- Keep the footer button too, so the action is reachable from both ends of the dialog.

---

### 3. Print: remove browser-injected URL/date/time header, premium printed header

Current `handlePrint` opens a bare `window.open` and prints — the browser then auto-injects URL, page title, and **date/time** into the page margins. That's the "date and time on top" you saw.

Fixes in `EnvelopeDetail.tsx → handlePrint`:
- Inject `<style>@page { size: A4; margin: 16mm 14mm 18mm 14mm; } @media print { html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; } .no-print { display: none !important; } }</style>` into the print window's head — this kills the auto date/time/URL header in Chrome/Safari/Firefox.
- Set `<title>` to just the document number (e.g., `JBJ-PAA-2026-0001`) instead of envelope name + property — so when the title DOES leak into a header, it's branded.
- Wrap the `previewHtml` in a print-mode container with the **monogram-wordmark** header style forced on (regardless of which chrome the user picked in the studio) for a uniform institutional look on print: monogram + JBJ GLOBAL REAL ESTATE wordmark + DOC NO. + thin gold rule. No property reference, no client name, no date in the page header.
- Keep the in-document content (which legitimately contains the property) untouched — only the page-level header is sanitised.

Result: print preview will match the on-screen preview, no auto date/time strip, no extraneous "this property" text in the page chrome.

---

### 4. End-to-end test + screenshot proof

After implementing 1-3 I will:
1. Navigate to `/owner/documents/forms`, open Omar's envelope.
2. Open Send-for-Signature, click the new prominent **Send Test to Me** button.
3. Wait for the toast, then capture screenshots of: (a) the dialog showing the test banner, (b) the live preview with the new premium signature, (c) the print preview with no date/time strip, (d) the `email_send_log` row proving delivery to `infoo.jane@gmail.com`.
4. Post the screenshots inline in the reply.

---

### Files to touch
```text
src/components/e-signature/SendForSignatureDialog.tsx          (banner + signature token)
supabase/functions/esign-send-for-signature/index.ts           (HTML signature block, sender_title)
supabase/functions/esign-send-test-email/index.ts              (mirror the same HTML block)
src/pages/e-signature/EnvelopeDetail.tsx                       (handlePrint @page CSS + branded title)
src/templates/jbjPropertyAdvertisingAgreement.ts               (force monogram-wordmark in print mode)
supabase/migrations/<ts>_esign_sender_title.sql                (new — adds esign_envelopes.sender_title)
```

### Out of scope (still queued)
- CRM Network merge into `/owner/crm`
- Dropdown filters + per-row CRM actions
- Investor toggle + category report configurator

Approve and I'll implement all four, run the test send, and reply with screenshots.
