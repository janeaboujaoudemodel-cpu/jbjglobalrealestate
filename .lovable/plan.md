## Goal
Make the leasing/Property Advertising Agreement signature block match Property Finder's clean style, and add the JBJ monogram to header & footer.

## Changes (single file: `src/templates/jbjPropertyAdvertisingAgreement.ts`)

### 1. Fix signature block alignment
- Remove the italic "Awaiting signature — {landlord name}" placeholder. The signature line stays empty (just the gold hairline) until signed — exactly like Property Finder.
- Drop the second JBJ representative signature row entirely (Property Finder shows only the client/landlord signature; do not pre-print our company signature).
- Keep a single 3-column row for the landlord: **Name | Signature | Date**, all sharing the same baseline (unify min-height across the three cells so name, signature line, and date sit on one horizontal line — no more name-up / date-center / signature-down stagger).
- Section title becomes simply `4. LANDLORD` (Property Finder style).

### 2. Header & footer monogram
- Import `jbj-monogram-dark-on-light.png` from `src/assets`.
- Replace the current text "JBJ" box in the `monogram-wordmark` header with an actual `<img>` of the monogram (≈42×42, object-fit contain).
- Add a small monogram (≈18×18) to the left of the company name in the `three-column` footer so header and footer carry the same brand mark.
- All other header/footer styles untouched.

### 3. Schema cleanup (optional but consistent)
- Remove `jbj_signature_name` and `jbj_signature_date` from the `Signatures` group in `PAA_FIELD_GROUPS` (no longer rendered). Keep the keys in the type for back-compat but stop collecting them in the form.

## Out of scope
No changes to other templates, edge functions, or the e-signature flow. Pure presentation edit.
