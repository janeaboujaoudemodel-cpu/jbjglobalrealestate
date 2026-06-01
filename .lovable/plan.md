
## Goal

Fix the remaining visual + functional issues on `/list-property` for all three modes (Pick = navy/purple, AI = purple, Manual = emerald) and wire the `purpose` toggle (sale/rent) end-to-end.

## Changes

### 1. Pick mode (main `/list-property`)
- **"Open full dashboard" button** in My Submissions: remove gold/champagne fill, repaint to match hero (navy `#0B1B33→#102540` ombre with white ring), white text + white arrow icon.
- **Arrow icons next to "Start" / "Open full dashboard" / "View my submissions"**: force `stroke: #FFFFFF` (currently invisible).
- **"Purpose" picker section**: replace harsh white background with a soft navy→white ombre (`linear-gradient(135deg,#EEF1F8 0%,#FFFFFF 60%,#E5E9F4 100%)`) + 1px navy hairline, matching seller-details ombre style.
- **"Start" buttons inside picker cards**: same soft navy ombre fill + navy text + purple hairline.
- **"No submissions yet" empty-state card**: soft navy ombre instead of pure white, navy text.

### 2. AI mode
- **"Smart Listing Creator" shell**: switch from full-bleed dark navy band to the same **wrapped card layout** used by Manual (centered max-w container, rounded-2xl, purple ombre `linear-gradient(135deg,#F3EEFF 0%,#FFFFFF 55%,#EADCFF 100%)`, 1px purple hairline) so it visually matches List Manually's premium card.
- **Stepper row** (Upload / AI Extract / Price Predictor / …): ink labels on the new light purple surface.
- **"What type of listing?" cards**: white cards with purple hairline + purple check.
- **"Extract with AI ✨" button**: rename to **"Extract with AI"** (drop the `+ ✨` suffix text), keep navy fill + white icon + white text.
- **Purpose section, Start button, No submissions card, Open full dashboard**: same soft purple ombre treatment as Pick mode but in purple tones.

### 3. Manual mode (emerald)
- **Purpose section, "Next Step" button, "No submissions yet" card, "Open full dashboard" button**: apply the same emerald→white ombre already used by Seller Details (`linear-gradient(135deg,#E8F3EC 0%,#FFFFFF 55%,#D4E9DB 100%)`) + emerald hairline + emerald text. Replace any harsh white or champagne remnants.

### 4. Purpose (Sale / Rent) wiring — functional
Currently clicking For Sale / For Rent on `/list-property` updates the URL but does **not** propagate into child surfaces. Fix:
- Read `?purpose=sale|rent` in `ListProperty.tsx` and pass as prop / context to:
  - Hero title ("List Your Property **for Sale/Rent**")
  - Sub-copy ("Priority listing… for sale/rent")
  - `ListingPortalSubmit` (AI wizard): pass `defaultPurpose` so the AI extractor + Pricing & Role step pre-selects sale/rent and labels switch (e.g. "Asking Price" vs "Monthly Rent").
  - `SellerListing` (manual): drive `listingPurpose` field, swap "Asking Price (AED)" ↔ "Monthly Rent (AED)", swap CTA copy ("List Your Property for Sale/Rent"), swap Pricing step labels.
- Persist selection in `sessionStorage` so refresh keeps state.
- Make For Sale / For Rent pills visually reflect active state in all 3 mode themes (already styled, just ensure `aria-pressed` + active gradient triggers re-render).

### 5. Contrast QA (mandatory)
After each change, take browser screenshots at desktop (1366) for:
- `/list-property` (Pick, default)
- `/list-property?purpose=rent`
- `/list-property` → AI mode
- `/list-property` → Manual mode
Verify: no faded text, no white-on-white, no invisible arrows, no champagne residue on Open full dashboard, Purpose pills re-render on toggle.

## Technical notes
- Edits limited to: `src/pages/ListProperty.tsx`, `src/pages/ListingPortalSubmit.tsx`, `src/pages/SellerListing.tsx`, `src/index.css` (theme tokens + 3 new ombre classes `jj-ombre-navy/-purple/-emerald-soft`).
- No backend / edge-function changes required — purpose is purely a UI/route concern. (User mentioned "redeploy edge function" but no edge function is involved in this flow; will note in final message.)
- Keep all existing features (no removal policy).
