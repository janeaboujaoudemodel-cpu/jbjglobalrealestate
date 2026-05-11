## Goal
Fix two visual issues in the JBJ Property Advertising Agreement template (`src/templates/jbjPropertyAdvertisingAgreement.ts`):

1. The DD / MM / YYYY date fields (Expiry Date, Vacating Date, Until Date, and any Date field shown in the agreement preview) currently render **three separate underlined boxes** — one under DD, one under MM, one under YYYY — and sit inside a wrapper that also draws an underline. Result: the user sees a "main underline" plus three small duplicate underlines.
2. The header logo + brand block and the footer logo are too small to actually read in the rendered agreement preview / PDF.

## Changes

### 1. `dateBox()` — single continuous underline (lines ~82–87)

Remove the per-cell `border-bottom` from each DD / MM / YYYY span. Wrap the three cells in **one** container that draws the single gold hairline underneath the whole `DD / MM / YYYY` group.

Result:
```text
 12  /  06  /  2026
─────────────────────   ← one gold hairline only
```
instead of:
```text
 12   /   06   /  2026
───       ───      ────  ← three small hairlines + outer one
```

This fixes every place `dateBox(...)` is used (Expiry Date, Vacating Date, Until Date) — including the Landlord section's date field once it's normalised to the same component.

### 2. Header — larger, clearly visible (lines ~175–193, `monogram-wordmark` style)

- Monogram image: `width:140px; max-height:72px` → **`width:200px; max-height:108px`**.
- Legal company line: font-size `10px` → **`13px`**, weight 600.
- Office line: `9.5px` → **`11px`**.
- Right-side contact block: `11px` → **`12.5px`**, line-height tightened so it reads as one tidy stack.
- Bottom hairline padding: `14px` → **`18px`** so the header has more visual weight.

Apply the same proportional size bumps to the other header styles (`wordmark-only`, `crest-address`, `minimal-hairline`) so they don't fall out of step.

### 3. Footer — larger logo + readable text (lines ~196–232, `three-column` style)

- Footer monogram: `width:64px; max-height:38px` → **`width:110px; max-height:60px`**.
- Footer base font-size: `10.5px` → **`12px`**.
- Legal company line: `10px` → **`12px`**, opacity `.9` → `1`.
- Compliance line (LIC / DCCI / CR / TRN): opacity `.7` → `.85`, font-size `10.5px` → **`11.5px`**.
- Bump `margin-top` from `36px` → `44px` and `padding-top` from `14px` → `18px` so the footer reads as a real footer band rather than a faint hairline note.

### 4. No business-logic changes
Pure presentation tweaks inside the template HTML strings. No changes to:
- Field schema (`PAA_FIELD_GROUPS`)
- Default values
- Build API / signatures
- Listing Authorisation template (unless you also want the same logo bump there — happy to mirror it on approval).

## Verification
- Open the agreement preview in the Documents & Forms hub.
- Confirm: every DD/MM/YYYY date renders as one continuous gold hairline under the three values — no small per-cell underlines.
- Confirm: the header monogram is clearly visible (~200px wide) and the JBJ legal/office text is legible at normal preview zoom.
- Confirm: the footer monogram is clearly visible (~110px wide) and the three-column footer text is comfortably readable.
- Re-export to PDF and re-check at print resolution.
