## Goal

Eliminate every visible silver/champagne hairline or gradient strip between the fixed header and the hero, and between every consecutive section across all pages. Sections should flow on padding/band-tone alternation only — no visible rule, no hairline, no gradient seam.

## What's causing the "silver" line today

1. **Header bottom borders (visible on every page)** — `src/components/GlobalHeader.tsx` lines 631–638 render two thin champagne gradient strips at the header's bottom edge:
   - A 2px `via-[#B89555]/60` + 1px `via-[#B89555]/40` pair shown when the header is solid.
   - A 1px `via-[#B89555]/40` gold divider shown when the header is transparent (the one explicitly labeled "separates header from hero").
2. **Header solid background** — `linear-gradient(90deg, #F7F1E6 0%, #ECE2D2 50%, #D8C7A6 100%)` at line 619 reads as a silver/champagne band where the header meets the dark hero on home and other transparent-hero routes.
3. **Residual section hairlines** — a handful of components still draw `border-y border-[#B89555]/XX` around full-width section wrappers, perceived as silver seams between sections:
   - `src/components/home/HeroSearchBar.tsx` line 1187 (suggestions group label band)
   - any other `border-y border-[#B89555]/…` regressions found via repo scan
4. **Header gradient overlay between menus** — line 564: `bg-gradient-to-r from-transparent via-gray-200 to-transparent` inside the account dropdown (raw gray — violates No-Gray rule).

## Changes

### 1. `src/components/GlobalHeader.tsx`
- Delete the bottom-border block (lines 631–635) and the transparent-state gold divider (line 638). Header gets zero visible bottom edge in either state.
- Replace the solid-state champagne gradient (line 619) with a flat `#FDFBF7` page tone so the solid header reads as page-continuous, not as a band. Keep opacity transition.
- Remove the `via-gray-200` dropdown top-fade line (line 564) — replace with nothing (no divider).

### 2. Section hairline sweep
- Run `rg "border-(y|t|b) border-\[#B89555\]/" src` and remove the `border-y …` / `border-t …` / `border-b …` classes from every full-width section wrapper (not from chips, pills, tabs, or icon tiles — only structural section seams). Confirmed targets so far:
  - `src/components/home/HeroSearchBar.tsx` line 1187 (suggestions group header) — drop `border-y border-[#B89555]/10`.
  - Any further hits the scan returns get the same treatment.

### 3. Verification
- After edits, re-run the same `rg` to confirm zero `border-y border-[#B89555]` occurrences on section/wrapper elements remain.
- Visually confirm in preview at `/` that:
  - The hero meets the header with no visible line, gradient, or champagne strip.
  - Scrolling past 80px keeps the header readable (now flat `#FDFBF7`) without re-introducing a seam.
  - Every other section transitions on padding/tone alone.

## Out of scope

- The `<SectionDivider*>` / `<AdaptiveHairline>` primitives are already permanent no-ops (per `mem://constraints/no-section-dividers-global`) — no change needed.
- Gold hairlines that are intentional ornament inside cards/pills (`<PremiumSectionCard>`, badges, price pill) stay — only structural section seams are removed.
- No layout, spacing, copy, or behavior changes. Pure visual seam removal.
