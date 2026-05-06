## Brokerage email — true WYSIWYG editor + content & branding fixes

### 1. True WYSIWYG editor (the big one)

**Problem**: The "Visual editor" tab today is a TipTap rich-text editor fed raw template HTML — so `<table>`, inline styles, `<img>` logos, the calendar SVG and `{{placeholders}}` all collapse into a wall of text/code instead of showing the same rendered card the preview pane shows. You can't click on a sentence in the rendered email and just retype it.

**Fix** — replace the TipTap pane with a **live contentEditable iframe** that mirrors the preview exactly:
- Render the same `previewHtml` (placeholders already substituted) into an iframe that is **`contentEditable`**, not just a static preview. Logos, calendar SVG, gold buttons, mini-calendar tile — all visible.
- Click any sentence → cursor lands on it → type. On blur (or `input` debounced 400ms), serialize the iframe `<body>` back to HTML, then re-tokenize: walk the DOM and replace the substituted sample strings (e.g. `Your Brokerage`, `AMRA`, `https://www.citidevelopers.com/...`, `Jane`, the breakfast `booking_url` sample) back into their `{{brokerage_name}}` / `{{project_name}}` / `{{project_url}}` / `{{owner_first_name}}` / `{{booking_url}}` tokens before writing back to `html` state. Tokens that aren't found in the body are preserved untouched (we keep the original tokenized HTML as the source of truth and only diff text/href changes).
- Keep an "HTML source" toggle for power-edits, but make **WYSIWYG** the default and persistent.
- Toolbar simplification: bold, italic, link, undo — operating directly on the iframe selection via `document.execCommand` (acceptable inside isolated iframes for this admin-only surface).
- The right-side preview pane stays, but becomes redundant when WYSIWYG is on — collapse it by default to give the editor the full width.

Files: `src/components/crm/TemplateEditorDialog.tsx` (replace the `<VisualEditor>` block, expand `previewHtml` to expose a tokenize-back map), new `src/components/crm/WysiwygEmailEditor.tsx`.

### 2. Lock / Unlock — make it round-trip cleanly

The Unlock button already exists when `locked_at` is set. The friction is the scary `confirm()` and the fact that a locked template disables everything. Adjustments:
- Drop the `confirm()` on Lock — replace with an inline toast "Locked. Click *Unlock template* anytime to edit again."
- Show **Unlock template** as the primary footer button when locked (currently a faint amber outline) so it's obvious you can flip back.
- While locked, the editor stays read-only but the "HTML source" toggle is still allowed for inspection.

File: `src/components/crm/TemplateEditorDialog.tsx`.

### 3. Developer logo — also at the bottom of the card

Both `brokerage_partnership_intro` and `brokerage_breakfast_invite` currently show the Citi Developers gold logo only in the header. Add a second logo block at the **end of the body**, just above the signature footer, sized smaller (height ~36px), centred, with a single line beneath it: *"In partnership with CITI Developers."*

Files: both DB rows in `crm_email_templates` (HTML update) + matching update to the legacy fallback in `supabase/functions/crm-send-brokerage-outreach/index.ts`.

### 4. Family name correction

Search the codebase + DB for any of: `Boujaoude`, `Bou jaoude`, `BouJaoude`, `Bou Jaoude` (any wrong casing/spacing) and normalise everywhere user-facing to **`Jane Bou Jaoude`** (three words, capital B, capital J). Confirmed locations to check first: email signatures in both brokerage templates, the developer registration template, the edge-function HTML fallbacks, and any seeded company-profile copy. Replace via `code--exec rg` then targeted SQL `UPDATE`s and edge-function edits.

Files: `crm_email_templates` rows, `supabase/functions/crm-send-brokerage-outreach/index.ts`, plus any other matches `rg` finds.

### 5. Premium SVG icons in the email signature

Replace the current emoji/low-quality icons used next to **Website**, **Location**, **WhatsApp** with inline gold-stroke SVGs (email-safe, no JS, 18×18, `stroke="#B89555" stroke-width="1.5"`). Designs:
- Website: globe outline.
- Location: pin outline.
- WhatsApp: rounded chat bubble with a phone glyph (no green fill — keep the gold-hairline aesthetic to stay on-brand).

Apply in both DB templates and the edge-function `signatureBlock` builder.

### 6. Always prefix website with `www.`

Wherever the signature shows the website, render it as **`www.citidevelopers.com`** (display) and link it to `https://www.citidevelopers.com` (href). Same rule for the AMRA URL: `www.citidevelopers.com/e-catalogue/amra`. Update both DB templates, the preview sample map (`previewHtml`) and the edge function.

### 7. Phone number — replace + clickable for both call and WhatsApp

Current number `+971 58 589 3499` (and any other phone in the signature) → replace with **`+971 54 716 7107`** (user-supplied `054 716 7107`). Render as two interactive icons in the signature (no auto-popup — single tap behaviour is whatever the OS does with `tel:` / `https://wa.me/`):

```
[ phone-svg ] +971 54 716 7107   [ whatsapp-svg ] Chat on WhatsApp
```

Both wrapped in `<a>`:
- Phone: `<a href="tel:+971547167107">` — opens the dialer.
- WhatsApp: `<a href="https://wa.me/971547167107">` — opens WhatsApp.

This satisfies the "ask call or WhatsApp" intent without a custom JS prompt (which doesn't run in email clients). Apply in both DB templates and the edge-function signature builder.

### 8. Add the RSVP request block before "Please confirm"

Insert a new block **above** the existing "Please confirm" / sign-off line in both templates. Wording (final, drop-in):

> **Before we lock your seats, kindly reply to this email with:**
> • Whether your agency is already registered with CITI Developers.
> • The existing WhatsApp group your team is on (if any).
> • The date & time slot you would like to confirm.
> • The full list of attendees — name, mobile, and email for each broker — so we can register them on the guest list.
>
> *This is a private breakfast hosted exclusively for your company. Kindly let us know at least **48 hours in advance** if you need to reschedule or cancel.*

Render as an ink-on-champagne tile (`#F7F2EA` bg, `1px #B89555` hairline, 14/22 type) so it visually separates from the rest of the message.

### 9. "Reserve a weekday slot" → "Reserve a slot" + hover style

- Rename label everywhere: DB templates and edge function.
- Add a hover state to the pill (email clients support `:hover` in `<style>`-in-`<head>` for desktop Gmail/Apple Mail). Wrap the CTA in a class `.jbj-cta` and inject:

```css
.jbj-cta { transition: background 120ms, transform 120ms; }
.jbj-cta:hover { background:#EFE6D6 !important; transform: translateY(-1px); }
```

inside a `<style>` block at the top of both template HTMLs, plus the matching change in the edge function. Mobile clients ignore `:hover` gracefully.

### 10. Verify

After all edits:
1. Open `TemplateEditorDialog` for both brokerage variants → confirm WYSIWYG renders the rendered card (logo top + bottom, gold-stroke icons, www. prefix, new phone, RSVP block, renamed CTA).
2. Click a sentence in the rendered editor → retype → save → reopen → confirms tokens preserved.
3. Lock → footer flips to a prominent **Unlock template** primary button → click → editor re-enabled.
4. Send a real test to the user's inbox → click website link, phone link (dialer), WhatsApp link, AMRA CTA, Reserve a slot CTA → all behave correctly.

### Files expected to change

- `src/components/crm/TemplateEditorDialog.tsx` — WYSIWYG swap, lock/unlock UX, default-hide preview pane.
- `src/components/crm/WysiwygEmailEditor.tsx` — new contentEditable iframe component with tokenize-back logic.
- `crm_email_templates` rows `brokerage_partnership_intro` & `brokerage_breakfast_invite` — bottom logo, premium SVG icons, www. prefix, new phone (tel:/wa.me), RSVP block, CTA rename, hover `<style>`.
- `supabase/functions/crm-send-brokerage-outreach/index.ts` — same content/branding updates in the legacy fallback HTML and signature builder.
- Any file `rg` flags carrying the misspelt family name.

No business-logic changes beyond what's listed.
