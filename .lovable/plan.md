## Scope

Six visual fixes on `/list-property` and its AI/Manual children — no logic, no routing, no data changes.

---

### 1. White icons on the AI shell (`src/pages/ListingPortalSubmit.tsx`)

- **Selected-type check** (line 722–724): the `Check` icon sits inside a champagne `#EFE6D6` circle, so the contrast guard flips it to ink. Repaint the circle to navy `#102540` and force the icon white at idle + hover via inline style + `data-no-contrast-guard`.
- **Extract with AI** (line 833–844): currently white background with navy `Sparkles`. Per the request, swap to navy fill + white label/icon at idle and hover. Use `jj-cta-dark` primitive (locked navy CTA) with `data-no-contrast-guard` and inline `WebkitTextFillColor:#FFFFFF` on the `Sparkles`.

### 2. Full-width AI shell, single layer (`src/pages/ListProperty.tsx` + child)

- Remove the rounded outer frame around the AI wizard so it runs edge-to-edge inside the navy border:
  - Drop the inner `rounded-2xl` / outer padded wrapper at lines 701–703 inside `ListingPortalSubmit.tsx` (the `absolute inset-0 -m-3 rounded-3xl bg-[#102540]/15 border` decorative layer).
  - In `ListProperty.tsx`, when `mode === "ai"`, remove side padding on the section wrapper (line 295) and let the AI section span the full width of the `AnimatedBorderShell`. Manual and Browse keep current padding.
- Net result: only one card (the navy `AnimatedBorderShell`) — no nested rounded card.

### 3. My Listing Submissions — navy/white restyle (`src/pages/ListProperty.tsx`, `MySubmissionsSection` lines 499–631)

- Section background: navy gradient (`BLUE_GRADIENT`), `data-surface="dark"`, `data-no-contrast-guard`.
- Heading "My Listing Submissions": white (was gold).
- Sub-copy + meta: `rgba(255,255,255,0.85)`.
- "Open full dashboard" button: white fill, navy text + icon (inverse of hero CTA), gold hairline.
- Empty/anonymous state cards: white background, navy border, navy heading, ink-on-white body, navy primary CTA with white text. Replace champagne fills with white.
- Submission cards (`SubmissionCard`): white card, navy hairline border, ink text, navy "View details" pill with white text. Keep status badges (semantic green/red/amber/blue).
- Loading skeletons: `bg-white/10` on the navy band.

### 4. List Manually — green/white palette (`src/pages/SellerListing.tsx`)

- Add a scoped theme override (gated by a `data-manual-listing-shell` attribute on the manual wizard root) in `src/index.css` (~25 lines):
  - Remap champagne backgrounds (`#FDFBF7`, `#F7F2EA`, `#EFE6D6`) → white.
  - Remap gold hairlines → emerald hairline `rgba(21,128,61,0.22)`.
  - Primary CTAs (Submit, Continue) → `bg-[#15803D]` + white text + `[&_svg]:text-white`.
  - Selected pills/cards → emerald outline + ink-on-white.
- Add `data-manual-listing-shell` to the root wrapper of `SellerListing.tsx`.
- Tag the "List Manually" hero button on `/list-property` with an emerald accent dot to match the new theme (keep base champagne so contrast guards stay happy).

### 5. List Your Property hero — purple accent (`src/pages/ListProperty.tsx`)

- Hero stays navy (matches header lock — we must not break the dark-CTA primitive system), but add a purple-and-white visual rhythm:
  - "JBJ Seller Portal" eyebrow badge → purple tint (`bg-[rgba(168,85,247,0.14)]`, border + icon `#A855F7`, white text).
  - "List with AI" button outline → purple border `#A855F7`, white text, purple `Wand2` + `Sparkles`.
  - Gold bottom hairline → purple gradient hairline.
- Net: hero reads as navy + purple/white instead of navy + gold, giving each page a distinct accent (purple = entry, green = manual, navy/white = AI). 

### 6. Verification (visuals only)

Use `browser--navigate_to_sandbox` + `browser--screenshot` to confirm at 1280×800 and 390×844:
1. `/list-property` — purple-accented hero, full-bleed band.
2. `/list-property?mode=ai` — single navy card, full width, white `Check` and white `Sparkles` (idle + hover), navy "My Submissions" with readable white text.
3. `/list-property?mode=manual` — green/white shell, emerald CTAs.
4. Zoom on the two previously-black icons to confirm they render white in both states.

---

### Technical notes

- All recolors stay inside `data-*-shell` scopes so the global contrast guard, `jj-cta-dark`/`jj-cta-outline` primitives, and "no white-on-light" lock keep working everywhere else.
- No new components, no new tokens, no DB or edge changes.
- Files touched: `src/pages/ListProperty.tsx`, `src/pages/ListingPortalSubmit.tsx`, `src/pages/SellerListing.tsx`, `src/index.css`.