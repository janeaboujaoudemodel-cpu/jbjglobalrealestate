## Root cause

The "Send by email" dialog has TWO independent sources of signature content that currently both end up in the preview:

1. **Picker preset** — One of 4 system rows from `email_signature_presets` (Founder/CEO, Executive Office, Front Desk, HR). Rendered via `renderSignatureHtml()` and appended to the body inside a `data-jbj-sig` wrapper.
2. **Body text itself** — `defaultBody` comes from `envelope.email_message`, a previously-saved string that already contains a hard-typed signature block ("Founder & CEO / JBJ GLOBAL REAL ESTATE / Office SM1-195… / www.jbj.ae"). This text is NOT inside the `data-jbj-sig` wrapper, so the picker's strip-and-replace logic doesn't touch it.

Result: every preview shows two signatures stacked, and switching the picker only swaps the wrapped one — the leftover "Founder & CEO" block never disappears, which makes the picker look broken.

In addition, the 4 presets render with inconsistent visual styles, the email/website strings show lowercase `jbj`, and links aren't always clickable.

## What we'll change

### 1. Single source of truth for signatures
- On dialog open, run a new `stripInlineSignature(html)` pass over `defaultBody` BEFORE wrapping the picker's signature. It removes any trailing block that looks like a signature (lines containing `JBJ GLOBAL REAL ESTATE`, the address, the phone, the website, or `Office of the Founder` / `Founder & CEO`-style closers, with whitespace/`<br>` siblings).
- The wrapped `data-jbj-sig` block from the picker becomes the ONLY signature in the message body.
- When the user picks a different preset, the existing `applySelectedSignature` swap continues to work — but now it has nothing leftover to fight with.

### 2. One canonical signature layout (the "JBJ HR" style the user approved)
Rewrite `renderSignatureHtml(sig)` in `src/hooks/useEmailSignatures.ts` so all 4 presets render with the same premium structure, only swapping the per-preset fields:

```text
─────────────── (1px gold hairline #B89555, width 100%)

  Name line                ← bold, ink #1A1A1A, 14px
  Title line               ← gold #B89555, italic, 12px, letter-spacing .04em  (premium)
  JBJ GLOBAL REAL ESTATE   ← bold uppercase, ink, letter-spacing .14em
  Office SM1-195, Port Saeed, Deira, Dubai, UAE   ← ink @ 70%, 12px
  +971 54 716 7107  ·  CONTACT@JBJ.AE             ← phone+email row (omit phone if null)
  www.jbj.ae/careers                              ← gold mailto/href link
```

Rules baked into the renderer:
- Always uppercase `JBJ` in any displayed string (email + website display labels). Hrefs stay lowercase so routing works.
- Email rendered as `<a href="mailto:…">` in gold.
- Website rendered as `<a href="…">` in gold (strip `https://`, force `JBJ` uppercase in display).
- Title line uses gold premium tone (`#B89555`, italic, slight letter-spacing) per user request — applies to every preset, not just HR.
- Top divider is the same 1px gold hairline for every preset.
- Removes the per-line styling drift that's making each preset look different today.

### 3. Capitalize JBJ everywhere
Database update for `email_signature_presets`:
- `email`: `Contact@JBJ.AE`, `careers@JBJ.AE`, `support@JBJ.AE` (already correct for Founder; normalize the others).
- `website`: keep lowercase host (`https://www.jbj.ae/careers`); the renderer will force `JBJ` uppercase in the visible label.

### 4. Wire DocuSign-button stays untouched
No changes to the CTA / DocuSign block, header, footer, or any other dialog logic. Strict no-removal.

### 5. Verify
- Open `/owner/documents/forms/810df24…` → "Send via email".
- Cycle the picker through all 4 presets and confirm:
  - Only ONE signature renders in the right pane each time.
  - The visible text matches the chosen preset (Executive Office actually shows "Office of the Founder", HR shows "Human Resources & Talent", etc.).
  - All 4 use the same gold-hairline + premium-title layout.
  - `JBJ` is uppercase in every email/website display.
  - Email + website links are clickable in the iframe preview.
- Send a test to `infoo.jane@gmail.com` with two different presets and visually compare.

## Files touched

- `src/components/e-signature/SendViaEmailDialog.tsx` — add `stripInlineSignature` and call it before the first signature wrap on open.
- `src/hooks/useEmailSignatures.ts` — rewrite `renderSignatureHtml` to the canonical premium layout, force `JBJ` uppercase in display labels, wire mailto/href links.
- One DB migration to normalize `email` casing on the 3 non-Founder preset rows.

## Out of scope (per "no removal" rule)

- Dialog layout, recipient/CC chips, subject, DocuSign URL field, attachment chip, header/footer of the email, edge functions — all left exactly as-is.