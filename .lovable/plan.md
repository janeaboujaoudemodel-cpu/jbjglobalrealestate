## Scope

Six concrete fixes on the e-signature flow, plus one architectural decision (document numbering).

---

## 1. PAA template chrome — header alignment + gold quality

File: `src/templates/jbjListingAuthorisation.ts` (and `jbjBlankLetter.ts` for parity).

- Header row becomes a 3-column flex with `align-items: center`: monogram (left) · wordmark "JBJ GLOBAL REAL ESTATE" (center, vertically centered on the same baseline as the monogram) · doc number (right).
- Wordmark moves from a separate stacked block to inline-flex aligned to the monogram's vertical centerline. Letter-spacing tightened, font-size raised one step so it visually matches the monogram height.
- Gold upgrade: replace the flat `#B89555` hairline with the tokenised premium gold gradient already used in the live web preview — `linear-gradient(90deg, #8A6A2A 0%, #C9A24E 50%, #8A6A2A 100%)` for the hairline rules, and the deeper champagne `#1A1A1A` text on `#FDFBF7` paper. Increase rule weight from 0.5px to 1px and add a 2px inner offset hairline under the header to match the rich preview look.
- Body container: switch render canvas to 2× device-pixel-ratio in `renderHtmlToPdfBlob` (html2canvas `scale: 2 → 3`) so the gold rules and wordmark stay crisp in the PDF export.

## 2. Preview blank gap under footer

File: `src/components/e-signature/DocumentPreviewSummary.tsx` (or whichever component renders the on-screen A4 sheet — confirmed by tracing `EnvelopeDetail.tsx` line ~1185).

- Current preview reserves the full 842pt A4 height regardless of body length, leaving a large blank stripe under the footer when the body is short. Export is fine because jsPDF pins to A4.
- Fix: in the on-screen preview only, swap `min-height: A4_PX_H` to `height: auto; min-height: A4_PX_H` and absolutely-position the footer to the bottom of the sheet inside a `position: relative` page wrapper. The export path (`renderHtmlToPdfBlob`) keeps the fixed 842pt canvas. Result: preview renders one tight page; export still pins A4.

## 3. `paa-sync-listing` 500 / blank screen

File: `supabase/functions/paa-sync-listing/index.ts`.

- The function currently selects `owner_user_id` and compares it to `user.id`. Earlier patch already addressed `sender_id`, but the latest deploy still throws because `category` may be null for blank letters and `template_field_values` may be null. Add null-guards, return 200 with `{ skipped: true }` for non-PAA categories (blank letter, generic), and wrap the whole handler in a try/catch that returns JSON 500 instead of letting Deno crash (which produces the blank-screen runtime error).
- Validate request body with a small zod schema. Redeploy.

## 4. Branded DocuSign cover-email preview (rebuild)

Files:
- `supabase/functions/_shared/envelope-email-html.ts`
- `src/lib/email/buildEnvelopeEmailHtml.ts` (mirror)
- `src/components/e-signature/SendViaEmailDialog.tsx`
- `src/components/e-signature/EmailPreviewIframe.tsx`

Rebuild the cover email so the iframe shows EXACTLY what the recipient will receive:

```text
┌─────────────────────────────────────────────┐
│ [JBJ MONOGRAM]   JBJ GLOBAL REAL ESTATE     │  ← centered on same line
│ ───── gold gradient hairline ─────          │
│                                             │
│ Subject: Please review — Property Authori…  │
│                                             │
│ Dear {{client_name}},                       │
│                                             │
│ Please find attached the Property Authori-  │
│ sation Agreement (Doc № JBJ-LSE-0002).      │
│                                             │
│ ┌──────────────────────────────────┐        │
│ │   ▶  OPEN IN DOCUSIGN TO SIGN    │        │  ← single CTA
│ └──────────────────────────────────┘        │
│                                             │
│ How to sign:                                │
│  1. Tap the button above                    │
│  2. Or download DocuSign:                   │
│     [App Store] · [Google Play]             │
│  3. Or open the attached PDF and upload it  │
│     to your DocuSign account                │
│                                             │
│ DocuSign signatures are legally recognised  │
│ in the UAE under the Electronic Trans-      │
│ actions Law.                                │
│                                             │
│ Warm regards,                               │
│ Jane Bin Jelmood                            │
│ Founder & CEO · JBJ GLOBAL REAL ESTATE      │
│ Dubai, UAE                                  │
│ [signature image]                           │
│                                             │
│ ───── gold gradient hairline ─────          │
│ jbj.ae · +971 … · contact@jbj.ae            │
└─────────────────────────────────────────────┘
```

- Remove every "Sign Here" / "click sign here to add your signature" / internal `{{signing_link}}` reference from `esign-send-for-signature` and `esign-send-test-email`. The email never collects a signature — it points to DocuSign.
- Remove the SignaturePad/AdoptAndSign UI from the recipient-facing path entirely (keep it only for the owner's own saved signatures library, see #5).
- Default email body becomes the locked DocuSign cover above with `{{client_name}}`, `{{doc_title}}`, `{{doc_number}}`, `{{docusign_url}}` merge tokens. Subject default: `Please review and sign — {{doc_title}} · {{doc_number}}`.
- Preview iframe is byte-identical to delivery (existing locked-send pattern).

## 5. Lock founder signature + picker

Files: `src/components/e-signature/SendViaEmailDialog.tsx`, new `SignatureBlockPicker.tsx`, plus `_shared/envelope-email-html.ts`.

- Founder/CEO sign-off block becomes a locked module rendered server-side from `useOwnerSignatureAssets`. Cannot be edited as raw HTML by the user — only the picker chooses which saved signature image is used.
- Picker shows all saved signatures (default ★ first), defaults to the user's marked-default signature.
- Title line is locked to `Founder & CEO · JBJ GLOBAL REAL ESTATE` whenever the sender is the owner account (per the Owner Verification Engine standard). Other staff get their own title from `profiles`.
- Address line locked to **`Dubai, UAE`** (replaces current `Downtown Dubai, UAE`). Update both the email shared renderer and the PDF templates (`jbjListingAuthorisation.ts`, `jbjBlankLetter.ts`).

## 6. Per-category document numbering (your open question)

Recommendation: **yes, switch to per-category counters with a category prefix.** Format:

```text
JBJ-LSE-0001   ← leasing PAA
JBJ-SLE-0001   ← selling PAA
JBJ-LTR-0001   ← blank letter
JBJ-NOC-0001   ← NOC, etc.
```

Each prefix has its own independent counter that resets at 0001 and increments only within its prefix. Benefits:
- A leasing contract is always identifiable by `LSE` regardless of how many sales contracts exist.
- Easier filing, audit, and CRM grouping (matches the way you already describe the documents to clients).
- The number you see on the document equals "this is the Nth leasing PAA we've ever issued" — clean, premium, and human-readable.

Implementation:
- DB migration: replace the single `next_doc_number(_template_key)` RPC with `next_doc_number(_category text)` backed by a `doc_number_counters(category text primary key, last_value int)` table. Upsert + atomic increment in one statement.
- Map: `paa-leasing → LSE`, `paa-selling → SLE`, `blank-letter → LTR`, `noc → NOC`, `offer → OFR`, `warning → WRN`, `vat → VAT`, `salary → SAL`, `termination → TRM`, `reference → REF`. Stored in `src/config/docNumberPrefixes.ts`.
- `allocateDocNumber()` in `src/hooks/useEsignTemplates.ts` now takes `category` (or template prefix) instead of `templateKey`.
- BlankLetterStudio + CreateEnvelope + EnvelopeDetail call sites updated.
- Existing envelopes keep their old number (no backfill); new envelopes follow the new scheme starting at 0001 per prefix.

---

## Files

**Edited**
- `src/templates/jbjListingAuthorisation.ts` — header alignment, gold gradient, "Dubai, UAE"
- `src/templates/jbjBlankLetter.ts` — same chrome parity
- `src/hooks/useEsignTemplates.ts` — html2canvas scale 3, `allocateDocNumber(category)`
- `src/components/e-signature/DocumentPreviewSummary.tsx` — preview footer-gap fix
- `src/components/e-signature/SendViaEmailDialog.tsx` — rebuilt DocuSign cover, signature picker, locked sign-off
- `src/components/e-signature/EmailPreviewIframe.tsx` — passes new merge tokens
- `src/lib/email/buildEnvelopeEmailHtml.ts` — DocuSign CTA layout, locked sign-off, gold gradient
- `supabase/functions/_shared/envelope-email-html.ts` — same renderer, byte-for-byte
- `supabase/functions/esign-send-for-signature/index.ts` — drop signing-link, fan-out, redeploy
- `supabase/functions/esign-send-test-email/index.ts` — same renderer, redeploy
- `supabase/functions/paa-sync-listing/index.ts` — null-guards, JSON 500, redeploy
- `src/pages/e-signature/BlankLetterStudio.tsx` + `EnvelopeDetail.tsx` — call `allocateDocNumber(category)`

**New**
- `src/components/e-signature/SignatureBlockPicker.tsx`
- `src/config/docNumberPrefixes.ts`
- DB migration: `doc_number_counters` table + new `next_doc_number(_category)` RPC

---

## Verification

1. Open PAA envelope → header monogram + "JBJ GLOBAL REAL ESTATE" sit on the same baseline; gold rules sharp; no blank gap under footer in preview; PDF export still 1 page.
2. Click "Preview & send by email" → iframe shows the exact DocuSign cover above; signature picker swaps signatures live; "Dubai, UAE" present.
3. Send test to `infoo.jane@gmail.com` → received email is byte-identical to preview, no "Sign here" UI, has Open in DocuSign button + App Store / Play links.
4. Create a new blank letter → number is `JBJ-LTR-0001` even though `JBJ-LSE-0002` exists. Create a new selling PAA → `JBJ-SLE-0001`.
5. Open envelope detail of a leasing PAA → no blank screen; `paa-sync-listing` returns 200.
