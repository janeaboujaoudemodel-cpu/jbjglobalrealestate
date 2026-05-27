## Goal
Make the locked chrome (footer, stamp, owner name, signature styling) truly global across every template, paginate the preview into real A4 pages, auto-calculate money fields, and tighten the Holiday Home declaration.

## 1. Owner name — fix globally
- `src/components/document-studio/DocumentStudio.tsx` line 191: change initial state `useState<string>("Jameel Bou Jaoude")` → `"Jane Bou Jaoude"`. This is the only remaining "Jameel" string in the codebase; the composer default is already correct.

## 2. Lock chrome/stamp/footer to ALL templates (no per-template work)
The footer + stamp + signature block are already injected through `signatureBlock()` and `jbjLockedChrome.ts`, which every composer uses. Verify no composer renders its own footer/signature and that the `composeGeneric` fallback (Form A/F/I, PAA, Tenancy, NDA, HR Letter, Employment Contract, etc.) routes through the same `signatureBlock` — it already does. No code change needed beyond confirming all branches in the `compose()` dispatcher use `signatureBlock`. Add a guard comment at the top of `composers/index.ts` documenting the lock so it isn't bypassed.

## 3. Remove duplicate templates
Audit `documentCatalog.ts`:
- `partnership_referral` and the dispatcher alias `referral_agreement` — collapse to one (`partnership_referral`), remove the alias case from the `compose()` switch.
- Holiday Home + Facility Management are tagged `audience:"staff"` but currently sit in the CLIENT array — move them physically into the `STAFF` array so they appear in only one hub (Careers Portal · Contracts & Templates).
- Spot-check for any other catalog entries that share fields/intent.

## 4. Auto-calculate amounts (remove "Amount Paid" manual input where derivable)
Holiday Home form:
- Drop `amountPaid` input. Always derive `subtotal = nightlyRate × nights + cleaningFee + securityDeposit`.
- The "Amount Paid" row in the quotation table is computed from `paymentStatus`:
  - `Paid in Full` → amountPaid = subtotal, balance = 0
  - `Partial Payment` → keep one numeric input `paidNow` (renamed)
  - `Pending` → amountPaid = 0, balance = subtotal
- Keep `paymentMethod`, `paymentDate`, `paymentStatus` (status already in form).
- Show Total / Paid / Balance rows auto-rendered.

Commission Invoice already auto-calculates — leave as is.

## 5. Real A4 pagination in preview
Today the page grows tall and the PDF exporter slices it. Make the preview show that pagination live:
- In `DocumentStudio.tsx` replace the single tall `<div ref={pageRef}>` with a paginator:
  - After body renders, measure body height.
  - Compute `pageCount = ceil(bodyHeight / contentArea)` where `contentArea = PAGE_H − headerH − footerH`.
  - Render N stacked `<article class="a4-page">` cards (each exactly 816×1154), each containing the locked letterhead, a slice of the body via CSS `column`/transform-translate offset, and the locked footer.
  - Add `page-break-inside:avoid` style hints to `signatureBlock`, `termsTable`, `quotation` (already partially set) so logical blocks don't get cut.
- Switch `pages` state default from `"auto"` to derived `pageCount` and show "Page X of N" between page cards.
- Exporter (`exporters.ts`) already slices on 1154 boundaries — no change required, but verify the new DOM still feeds it a contiguous canvas (use a hidden export-only single-page wrapper if needed).

## 6. Holiday Home — final acknowledgement clause
Append a single bold block immediately above the signature block in `composeHolidayHome`:

> I, **{{guestName}}**, hereby agree to all the terms and conditions provided by **JBJ GLOBAL REAL ESTATE L.L.C — S.O.C**. I confirm that I have fully read and understood every clause above, that I am solely responsible for reading and understanding them, and that I sign below with my full and free decision and consent.

`{{guestName}}` is replaced live from `fields.recipientName` (the left-rail "Guest Full Name" input). Also pipe the same value into the signature block's applicant name (already done) and into the Acknowledgement clause's existing #11 entry so both stay in sync.

## 7. Placeholder sync (left rail → body)
Confirm every composer that references `recipientName` re-renders on every keystroke (currently driven by the `useEffect` that recomputes `autoBodyRef` on field changes). No code change expected — just ensure the new acknowledgement clause uses `f.recipientName` directly, not a one-time captured value.

## Files touched
- `src/components/document-studio/DocumentStudio.tsx` (owner name default, A4 paginator UI)
- `src/templates/composers/index.ts` (auto-calc, acknowledgement clause, remove `referral_agreement` alias)
- `src/config/documentCatalog.ts` (drop `amountPaid` field, move Holiday/Facility into STAFF array, dedupe)

## Out of scope
- Footer/stamp visual redesign (already shipped last turn — only auditing reach here).
- Translations / marketing pages mentioning the founder name (already correct).
