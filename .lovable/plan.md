# /list-property restyle — match navy hero, kill black bands, animated navy border

## Scope
Frontend/presentation only. Two files do the heavy lifting:

- `src/pages/SellerListing.tsx` — source of every black band + invisible badge the user circled.
- `src/pages/ListProperty.tsx` — wrap the whole page in the animated navy border.
- `src/components/shared/FormDraftBar.tsx` — fix the red‑filled Reset button.

No business logic, routes, or data changes.

## Fixes (mapped to the 4 annotated screenshots)

### 1. Kill the black background bands (images 2, 3, 4)
In `src/pages/SellerListing.tsx`:
- Line 477 (submitted state `<main>`): `bg-[#1A1A1A]` → `bg-[#FDFBF7]` (champagne page).
- Line 541 (form `<main>`): `bg-[#1A1A1A]` → `bg-[#FDFBF7]`.
- Lines 543 + 590: remove the `mx-[0.125rem] md:mx-2 lg:mx-4 …` horizontal gutters that create the visible black left/right strips, and remove the rounded‑top so the champagne block runs full‑bleed inside the navy animated shell. Keep the champagne gradient (`from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6]`).
- Same treatment for the bottom band (image 4): drop the gutters so there is no black under the form, just champagne flowing into the page.

### 2. Fix the invisible "Seller Listing Tool" badge (image 1)
Line 546 currently renders `bg-[#1A1A1A] text-white` — that's the solid black pill the user circled. Replace with the standard ink‑on‑champagne pill used elsewhere on the page:

```
bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]
```

(with `data-no-contrast-guard` to keep it ink, matching `<ShieldCheck />` pills already used in `ListProperty.tsx`).

Also fix the leftover `<span className="text-[#1A1A1A]">for Sale</span>` inside the H1 — both halves are already ink so the span is redundant; collapse to one styled span so "for Sale" reads cleanly.

### 3. De‑red the Reset button (image 1/2)
In `src/components/shared/FormDraftBar.tsx`, change the Reset button from `bg-red-500/90 text-white` to a transparent/champagne chip with **only the icon + label in red**:

```
bg-transparent border border-red-500/40 text-red-600 hover:bg-red-500/10
```

Icon (`RotateCcw`) inherits `text-red-600`. Nothing else about Save Draft / New changes.

### 4. Wrap the entire /list-property page in the animated navy border
In `src/pages/ListProperty.tsx`, wrap the page body (hero + selector + active form + My Submissions) inside the existing `<AnimatedBorderShell tone="navy">` primitive (already used by Mortgage Calculator). This gives the slow conic‑navy spinning border the user asked for, wrapping every section. Add a small champagne page margin around the shell so the border is visible on all sides.

## Technical details

- Reuse `src/components/tools/AnimatedBorderShell.tsx` (`tone="navy"`) — no new component.
- All colour replacements use the locked tokens already in `ListProperty.tsx`: `#102540` navy, `#B89555` gold hairline, `#FDFBF7` champagne, `#F7F2EA` surface, `#EFE6D6` raised, `#1A1A1A` ink.
- Keep `data-no-contrast-guard` on the Seller Listing Tool pill and on every white‑on‑navy element so the global guards don't flip them.
- No edits to wizard steps, form fields, validation, Supabase, RLS, edge functions, or `My Listing Submissions`.

## Verification
After build, open `/list-property?purpose=sale&mode=manual` in the browser tool and screenshot:
1. Top of page — confirm "Seller Listing Tool" badge is now visible (ink on champagne pill with gold border).
2. Mid page — confirm no black strips around the form, single champagne surface, animated navy border visible on the outer frame.
3. Reset button — confirm red icon + red "Reset" label on transparent chip, no red fill.
4. Bottom — confirm no black band between form and "My Listing Submissions".
