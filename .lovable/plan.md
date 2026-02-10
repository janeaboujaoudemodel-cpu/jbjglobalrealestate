
# Fix Developer Logos, Marquee, and Sticky Nav -- Global Consistency

## Problem Summary

1. **Developer logos everywhere lack the gold border style** that exists on the project detail page's DeveloperInfoCard
2. **Marquee on homepage** -- logos have no container/border, just raw images floating on champagne background
3. **Sticky sub-nav overlaps the main header** on project detail pages -- "Register Interest" / "Brochure" bar sits directly on top of the global header instead of below it
4. **DeveloperInfoCard logo uses `object-fill`** which stretches/distorts logos -- should be `object-contain` with padding

## Reference Style (from DeveloperInfoCard)

The gold-bordered logo container the user wants everywhere:
- White background square container
- 3px solid gold border (`border: 3px solid hsl(42 45% 59%)`)
- Gold box shadow
- `object-contain` with padding so logos are never cropped or stretched
- Rounded corners

---

## Changes

### 1. Fix DeveloperInfoCard Logo (Project Detail Page)

**File: `src/components/project-detail/DeveloperInfoCard.tsx`**

Line 68: Change `object-fill` to `object-contain p-2` so logos are not stretched/distorted inside the gold-bordered container.

### 2. Fix Homepage Marquee Logos

**File: `src/components/DeveloperPartnersMarquee.tsx`**

Update `renderPartner` to wrap each logo in a square container with:
- White background
- Gold border (3px solid, matching the DeveloperInfoCard style)
- Rounded corners (rounded-xl)
- `object-contain` with padding
- Consistent sizing across all developers (remove special-case sizing for individual developers)

This replaces the current approach of bare `img` tags with different height/width overrides per developer.

### 3. Fix Developer Cards Logo on Developers Page

**File: `src/components/DeveloperCard.tsx`**

Update the logo overlay container (lines 84-99) to use gold border instead of plain white:
- Change from `bg-white` with no visible border to `bg-white border-2 border-gold` (matching the gold style)
- Keep `object-contain p-1` which is already correct

### 4. Fix Sticky Sub-Nav Overlapping Main Header

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**

The sticky sub-nav (lines 567-618) uses `fixed top-16 lg:top-20` which places it directly touching/overlapping the main header. Fix:
- Increase offset so it sits clearly below the main header with a visible gap
- Change background from `bg-black` to a dark champagne/zinc tone to differentiate it visually from the main header
- Add `top-20 sm:top-24 lg:top-28` to match the content padding in MainLayout (`pt-16 sm:pt-20 md:pt-24 lg:pt-28`)

### 5. Fix Marquee Speed

**File: `src/components/DeveloperPartnersMarquee.tsx`**

The animation duration formula `Math.max(20, loopWidth / 60)` can produce very long durations when loopWidth is large (4 duplicate loops). Adjust the divider to produce a smoother, faster scroll.

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/project-detail/DeveloperInfoCard.tsx` | `object-fill` to `object-contain p-2` |
| `src/components/DeveloperPartnersMarquee.tsx` | Gold-bordered square containers for logos, fix animation speed |
| `src/components/DeveloperCard.tsx` | Add gold border to logo overlay |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Fix sticky nav position below header, different background color |
