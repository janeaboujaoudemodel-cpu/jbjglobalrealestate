

# Premium Mega Menu Cards + Footer Navigation Overhaul

## Overview
Two areas need premium refinement: (1) the Insights mega menu cards need proper borders, spacing, and visual separation, and (2) the footer navigation card grid needs a premium upgrade.

## Part 1: Insights Mega Menu Card Fixes

### Problem
- Cards have NO borders (removed in a previous fix) making them look flat and blended
- Row 1 and Row 2 cards touch each other (gap-y-0) with no visual separation
- The "Legal" card appears to merge with the "Services" card above it

### Fix (mega-menu-primitives.tsx)

**Restore card borders with proper styling:**
- Add back `border border-gold/30` to MegaMenuCard (not the thick `border-gold/50` that caused the "cutting line" issue -- using a softer opacity)
- Add subtle inner shadow for depth: `shadow-sm`

**Fix row spacing (MegaMenuInsights.tsx):**
- Change `gap-x-1.5 gap-y-0` to `gap-1.5` (restore small uniform gap)
- The "cutting line" issue was caused by the old thick `border-gold/50` borders touching each other, NOT the gap itself. With softer `border-gold/30` borders, a small gap looks clean

### Files Changed
- `src/components/header/mega-menu-primitives.tsx` -- MegaMenuCard: add `border border-gold/30 shadow-sm`
- `src/components/header/MegaMenuInsights.tsx` -- grid: change to `gap-1.5`

---

## Part 2: Footer Navigation Cards Premium Upgrade

### Problem
- Footer navigation cards (FooterCard component) look basic with thin borders and minimal styling
- Need more premium presence with better padding, shadows, and visual hierarchy

### Fix (Footer.tsx - FooterCard component)

**Upgrade FooterCard styling:**
- Increase border to `border-2 border-gold/40` for more visible premium framing
- Add subtle shadow: `shadow-[0_4px_15px_rgba(200,167,102,0.1)]`
- Increase padding: `px-6 py-5` (from `px-5 py-4`)
- Add hover shadow enhancement: `hover:shadow-[0_6px_20px_rgba(200,167,102,0.2)]`
- Make title font slightly larger and add gold shimmer effect
- Increase link text size slightly for readability
- Add rounded-xl consistency with hover:border-gold/60 transition

### Files Changed
- `src/components/Footer.tsx` -- FooterCard component styling upgrade (lines 35-58)

---

## Summary of Changes

| File | Change |
|------|--------|
| `mega-menu-primitives.tsx` | Restore `border border-gold/30 shadow-sm` on MegaMenuCard |
| `MegaMenuInsights.tsx` | Change grid gap back to `gap-1.5` |
| `Footer.tsx` | Upgrade FooterCard with thicker borders, shadows, better padding and typography |

