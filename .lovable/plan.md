## Goal

Rebuild the **Preview & send by email** dialog (`SendViaEmailDialog`) so the user sees the *real branded email* exactly as the recipient will receive it — fully editable, multi-recipient, responsive, with the JBJ logo, and **no internal signing link** (signing is handled via DocuSign).

---

## What's broken today

1. The "Body" is shown as a raw `<textarea>` with HTML/template tokens — not the actual rendered email.
2. There's no company logo/brand mark anywhere in the preview or in the sent HTML header.
3. **To** is a single input — can only send to one recipient.
4. Footer buttons (`Cancel · Send test → infoo.jane@gmail.com · Approve & Send`) overflow horizontally on desktop and stack badly on mobile.
5. A hint reads *"Signing link will be inserted in the branded email: …"* and the sent HTML embeds a **REVIEW & SIGN** button + link — but signing happens via **DocuSign**, so all of this is wrong and confusing.
6. The dialog content doesn't fit inside its box — long CC chip rows + long subject overflow.

---

## Plan

### 1. New WYSIWYG email preview (replaces the textarea)

Render the **exact same branded HTML** the recipient gets, inside a sandboxed iframe (`<iframe srcDoc=…>`), updated live as the user edits. The composer becomes two-pane on desktop, stacked on mobile:

```text
┌──────────────────────────────────────────────┐
│  Compose            │   Live preview         │
│  • To (chips)       │   ┌──────────────────┐ │
│  • CC (chips)       │   │  [JBJ LOGO]      │ │
│  • Subject          │   │  Doc № 2025-…    │ │
│  • Message  (rich)  │   │  ───────────     │ │
│                     │   │  Dear Omar,      │ │
│                     │   │  …rendered…      │ │
│                     │   │  — Jane          │ │
│                     │   └──────────────────┘ │
└──────────────────────────────────────────────┘
```

- Message field uses a lightweight contentEditable (bold/italic/link) — produces clean HTML, no markdown, no `{{tokens}}` shown to user.
- A small shared renderer (`buildEnvelopeEmailHtml.ts`) is extracted from the edge function so the client and the server produce **byte-identical HTML** (no preview/delivery drift — same rule the project already enforces with `outreach_locked_payloads`).
- The iframe is `sandbox="allow-same-origin"` and re-renders on every keystroke (debounced 150ms).

### 2. Add the company logo / brand mark

- Add `<img src="https://www.jbj.ae/brand/jbj-monogram.png" alt="JBJ" width="64" height="64">` (transparent PNG already in brand standard) to the email header table, left of the wordmark.
- Same logo is rendered in the live preview.
- Stored as a constant in the new shared renderer so both sides match.

### 3. Multi-recipient **To**

- Replace the single `<Input>` with the same chip pattern already used for CC.
- `to: string[]` — at least one valid email required to enable Approve & Send.
- The edge function `esign-send-for-signature` already accepts a recipient via `envelope.recipient_email`; we extend the body to accept `additional_recipients: string[]` and the function fans out one personalised send per address (each gets `{{client_name}}` resolved per recipient if known, else falls back to the address local-part).
- "Recipient: Omar" helper text is replaced with the chip list count: *"3 recipients · 1 CC"*.

### 4. Remove all internal-signing-link references

- Drop the *"Signing link will be inserted…"* helper line.
- Drop the **REVIEW & SIGN DOCUMENT** button + the *"paste this secure link"* paragraph from the email HTML in `esign-send-for-signature/index.ts`.
- Replace with a single **"Open in DocuSign"** CTA (or simply omit if DocuSign sends its own envelope email separately — see Open Question below).
- Remove `{{signing_link}}` from the merge-token list and from the default body template in `EnvelopeDetail.tsx`.
- The PDF attachment stays (recipient still gets the document inline).

### 5. Responsive / overflow fixes

- DialogContent: `max-w-5xl w-[min(96vw,1100px)] max-h-[92vh] overflow-y-auto p-0`. Inner padding handled per-section so chips and long subjects wrap inside their containers (`flex-wrap min-w-0 break-all`).
- Footer: switch to a flex layout that wraps — `flex-col sm:flex-row sm:justify-end gap-2 flex-wrap`. Button labels shorten on small screens (`Send test` instead of `Send test → infoo.jane@gmail.com`, with the address shown as a sub-line `text-[10px]`).
- Two-pane grid collapses to single column under `lg`.

### 6. Keep existing safety rails

- "Send test" still hard-targets `infoo.jane@gmail.com` (per user memory).
- Default CC chip remains `infoo.jane@gmail.com`, removable.
- Subject + body are sent verbatim to the edge function (locked-send rule).

---

## Files

**New**
- `src/lib/email/buildEnvelopeEmailHtml.ts` — shared renderer (client + edge import).
- `src/components/e-signature/EmailPreviewIframe.tsx` — sandboxed live preview pane.
- `src/components/e-signature/RecipientChipsInput.tsx` — reusable chip input (To & CC).

**Edited**
- `src/components/e-signature/SendViaEmailDialog.tsx` — full rebuild (two-pane, multi-To, no signing-link UI).
- `src/pages/e-signature/EnvelopeDetail.tsx` — pass `additional_recipients` and drop `signing_link` from default body template.
- `supabase/functions/esign-send-for-signature/index.ts` — accept `additional_recipients`, fan-out send loop, remove REVIEW & SIGN button block, add JBJ logo `<img>` to header, import shared renderer (inlined as Deno-compatible string).
- `supabase/functions/esign-send-test-email/index.ts` — same logo + same renderer so test emails match production.

---

## Open question (answer before I implement)

**On the "no signing link" rule:** for DocuSign, two patterns are possible —
  (a) **JBJ sends its own branded cover email** (no link) and DocuSign sends the actual signing email separately when the envelope is created, or
  (b) The branded JBJ email itself carries a single **"Open in DocuSign to sign"** button pointing at the DocuSign envelope URL.

I'll default to **(a)** — pure cover email, no buttons, PDF attached — unless you say otherwise.
