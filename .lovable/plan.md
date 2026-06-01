## Goal

Make `/list-property` (pick, manual, AI) feel like one coherent surface where every "white" area becomes a soft mode-tinted ombre (emerald for Manual, purple for AI, navy for Pick) and the hero only carries the structural CTA. Apply to all three flows using the same rule — color follows the active page theme.

## Changes

### 1. `src/pages/ListProperty.tsx` — Hero & Pick section

- **Remove** the two hero CTAs `List Manually` and `List with AI` (lines ~246–278). The Purpose + "How would you like to list?" picker below is the single entry point.
- **Move** `View my submissions →` (currently in the hero, line ~281) into the Purpose section, rendered inline next to the `Browse` pill (right side of the "How would you like to list?" row).
- **Hero title** `List Your Property` (line 224): paint with mode ombre text (`linear-gradient(135deg, theme.primary 0%, #FFFFFF 55%, theme.primary 100%)` via `WebkitBackgroundClip:'text'`) so it reads as white-ombre over the dark hero.
- **Purpose section wrapper** (section at line 300): apply `ombreSoft(theme)` background + 1.5px theme hairline so the area behind the Purpose card is no longer pure white. The inner Purpose card keeps its existing ombre but gets a slightly stronger inner contrast (raise card to `linear-gradient(135deg,#FFFFFF 0%, ombreSoft mid, #FFFFFF 100%)`) so it still pops against the new tinted backdrop.
- **No submissions card** + **Open full dashboard** + **My Listing Submissions header**: re-derive backgrounds from `ombreSoft(theme)` (already added) but deepen the stop mix (`theme.primary` at 18–22% alpha at start/end) so the card visibly matches Seller Details ombre instead of reading near-white.

### 2. `src/pages/SellerListing.tsx` — Manual (emerald) surface

- **Page background container** (the highlighted main layer wrapping the seller form): switch from white/beige to emerald ombre `linear-gradient(135deg,#E8F3EC 0%,#FFFFFF 55%,#D4E9DB 100%)`.
- **`List Your Property for Sale` h1** (line 553): white-emerald ombre text fill (same gradient technique as hero title).
- **`Seller Listing Tool` eyebrow** (line 546), **`Get Help with JBJ Seller Assistant`** button (line 570), and the **active step icon** for Seller Details (line 621): force `#FFFFFF` glyph + emerald ombre fill with 1.5px emerald hairline so the active state matches the card chrome.
- **`Next Step` button** (line 1458): repaint with Seller-Details ombre `linear-gradient(135deg,#E8F3EC 0%,#FFFFFF 55%,#D4E9DB 100%)`, emerald border, emerald text/arrow.
- All field labels / input borders / focus rings continue to use the premium emerald `#0F5132`.

### 3. AI mode (`ListingPortalSubmit.tsx`) — Purple surface

Apply the exact same rule with purple tokens:
- Page background ombre `linear-gradient(135deg,#F2EBFF 0%,#FFFFFF 55%,#E5D6FF 100%)`.
- Title `Smart Listing Creator` → purple-white ombre text.
- Active step icon, primary action button (`Extract with AI`, `Next Step`) → purple ombre fill, white icon/text on ombre when active, purple text on the soft variant for secondary actions.
- 1.5px `#A855F7` hairline on every card.

### 4. Pick / Hero (navy) — same rule

- Backdrop behind Purpose: soft navy ombre (`#E5EAF3 → #FFFFFF → #DDE3F0`).
- All "white" surfaces (no-submissions, open-dashboard, hero title fill) use the navy variant of the same rule.

### 5. Wiring guarantee

`?purpose=sale|rent` and `mode=manual|ai` already drive `theme` selection — confirm the `ombreSoft(theme)` helper is the single source of truth for soft surfaces in all three files so swapping mode automatically swaps the green/purple/navy tinting everywhere.

### 6. Validation

After implementation, in build mode:
- Browser screenshots at 1366×900 for: `/list-property`, `/list-property?mode=manual&purpose=sale`, `/list-property?mode=manual&purpose=rent`, `/list-property?mode=ai&purpose=sale`.
- Zoom-crop each: hero title, Purpose card + backdrop, View my submissions placement, Seller Details active step icon, Next Step button, No submissions card, Open full dashboard.
- Confirm: no pure-white panels remain inside theme sections, all titles/icons readable, View my submissions sits inline with Browse, hero contains no Manual/AI CTAs.

## Files touched

- `src/pages/ListProperty.tsx`
- `src/pages/SellerListing.tsx`
- `src/pages/ListingPortalSubmit.tsx`
- `src/index.css` (one shared `.jj-ombre-text` utility for white-tinted ombre titles)

No backend, no schema, no edge function changes.
