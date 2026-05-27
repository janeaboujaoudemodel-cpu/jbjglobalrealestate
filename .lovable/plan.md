## What's wrong today

In `src/templates/composers/index.ts` → `clientSignatureStrip` (lines 242–262):

1. The strip itself carries `border-bottom: 1px solid GOLD66` — so the signature line and the cursive name sit **inside / under** the page's bottom hairline. The user wants the order reversed: signature first, divider after, so nothing can be appended below.
2. The left label reads "Client Signature" / "Guest Signature". The user wants the **applicant's full legal name (as per ID/passport)** in that label slot, synced live from the form's `recipientName`. The literal words "Client" / "Guest" must disappear from the printed paper.
3. Padding is tight (`padding: 0 0 10px`) — needs comfortable breathing room on left/right and above the divider.
4. No vertical headroom is reserved on each A4 page for the **DocuSign Envelope ID** stamp that DocuSign automatically prints (small gray "Envelope ID: XXXXXXXX‑XXXX‑…" string, ~8pt, in the top ~0.4in / ~38px of every page, flush-left). Today `FIRST_TOP = 46` and `NEXT_TOP = 54` in `DocumentStudio.tsx` — page-1 letterhead chrome starts at y=0 with no reserved DocuSign band, so the stamp would overlay the gold header rule and the letter date.

## Fix — locked globally

### 1. `clientSignatureStrip` rewrite (`src/templates/composers/index.ts`)

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│         [cursive live name]                                  │
│         ─────────────────────────                            │
│         JOHN A. SMITH    ← uppercase legal name, ID/passport │
│                                                              │
│ ════════════════════════════════════════════════════════════ │  ← page divider
└──────────────────────────────────────────────────────────────┘
```

Concrete changes:
- Drop the word **"Signature"** / **"Client"** / **"Guest"** from the rendered label. The label slot becomes the legal name itself (uppercase, tracked, ink) — that *is* the identity caption above the signature line.
- Structure inside the strip:
  1. Cursive live name (Dancing Script) — the visible signature mark.
  2. 1px ink signature line directly underneath.
  3. Uppercase legal name (from `recipientName`) under the line as the printed caption.
- The strip itself **no longer carries `border-bottom`**. Instead, a separate sibling `<div data-page-divider>` 1px `GOLD66` rule is emitted **after** the strip → divider closes the page, signature sits above it.
- Padding bumped to `padding: 14px 8px 12px` and right-aligned block gets `min-width: 280px` with 28px gap from the page edge so the line never hugs the border.
- Helper signature stays the same: `clientSignatureStrip({ applicantName, page, totalPages })`. `label` param is removed (and `clientInitialsStrip` back-compat alias kept).

### 2. Holiday Home composer call sites (same file, lines 685–686)

Drop the `label: "Guest Signature"` arg (no longer accepted). The applicant's name carries the identity.

### 3. DocuSign envelope-ID safe band (`src/components/document-studio/DocumentStudio.tsx`)

DocuSign stamps the envelope ID in the top ~0.4in (~38px) of every page, flush-left, in 8pt gray. To guarantee zero overlay:

- Introduce `DOCUSIGN_TOP_RESERVE = 42` (px at PAGE_W = 816, i.e. ~0.44in at 96dpi).
- Apply it on **every** page:
  - Page 1: shift `<LockedLetterhead />` down by `DOCUSIGN_TOP_RESERVE` (wrap in a `paddingTop` div) so the gold header rule no longer sits at y=0.
  - Pages 2..N: bump `NEXT_TOP` from 54 → `54 + DOCUSIGN_TOP_RESERVE` (so body starts at y≈96) and bump the body-region `top` from `0` to `DOCUSIGN_TOP_RESERVE` on non-first pages.
- Mirror the same band on the auto-pagination measurement (`page0Cap` / `otherCap` in the lines ~323–327 block) by subtracting `DOCUSIGN_TOP_RESERVE` from both caps so pagination accounts for it.
- Also add a matching `LockedFooter` already sits flush-bottom; DocuSign does not stamp at the bottom, so footer stays as-is.

The reserved band is invisible in the preview (just whitespace), so the printed PDF looks unchanged when sent outside DocuSign — but the moment DocuSign processes the envelope, its ID lands cleanly in the safe band.

### 4. Lock the rule in project memory

Update `mem://documents/multi-page-signature-rule` with the four new clauses:
- Signature line is ALWAYS above the page divider, never inside it.
- The label under the line is the **applicant's legal name (as per ID/passport)** — never the words "Client" / "Guest" / "Initials".
- Every composer must wrap each non-final page with `clientSignatureStrip` followed by `<div data-page-divider>`.
- Every A4 page reserves a top ~42px DocuSign envelope-ID safe band; composers must never start content at y=0.

Add the corresponding one-liner under `## Core` in `mem://index.md`.

## Files touched

- `src/templates/composers/index.ts` — rewrite `clientSignatureStrip`, update Holiday Home call sites.
- `src/components/document-studio/DocumentStudio.tsx` — `DOCUSIGN_TOP_RESERVE` constant, page-1 header shim, NEXT_TOP bump, body-region top offset on non-first pages, pagination caps updated.
- `mem://documents/multi-page-signature-rule` — updated rule text.
- `mem://index.md` — core line updated.

## Validation

1. Visually inspect the holiday-home preview at `/owner/careers-portal?section=contracts` after switching to the holiday-home template — pages 1 & 2 show: cursive name → ink line → uppercase legal name → gold hairline divider, with ~28px right margin and 42px clear top band.
2. Browser preview at 1082×891 to confirm no border touches on the divider; legal-name caption visibly differs from "Client Signature".
3. Export preview PDF via existing export button and verify top 42px is empty whitespace on every page.
