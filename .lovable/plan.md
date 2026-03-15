

## Mega Menu: Connected Layout (No Extra Card Borders)

### Problem
The mega menus currently wrap each section inside `MegaMenuCard` -- a component that adds its own `rounded-xl border border-gold/30` container. This creates separate "boxes within a box" instead of one connected, seamless panel.

### Solution
Remove the card borders/backgrounds from section groups so content flows directly inside the mega menu shell. Sections will be separated by thin gold dividers (like the `railDivider` pattern in the HorizontalUtilityBar) rather than individual bordered cards.

### Changes

**1. `src/components/header/mega-menu-primitives.tsx`**
- Add a new `MegaMenuSection` component that replaces `MegaMenuCard` for this use case:
  - No border, no rounded corners, no separate background
  - Just the section title + content
  - Sections separated by vertical dividers (in grid layouts) or horizontal dividers (in stacked layouts)
- Keep `MegaMenuCard` available for any menu that still needs it

**2. All mega menu files that use `MegaMenuCard`:**
- `MegaMenuInsights.tsx` -- 8 cards in 4x2 grid → 8 sections with vertical dividers between columns
- `MegaMenuProjects.tsx` -- 1 card on right side → section without card border
- `MegaMenuSell.tsx` -- 1 card → borderless section
- `MegaMenuRent.tsx` -- similar
- `MegaMenuBuy.tsx` -- similar
- `MegaMenuServices.tsx` -- similar
- `MegaMenuDevelopers.tsx` -- 1 card → borderless section
- `MegaMenuAreas.tsx` -- 1 card → borderless section
- `MegaMenuMore.tsx` -- multiple cards → borderless sections
- `MegaMenuToolkit.tsx` -- already uses direct grid (no MegaMenuCard), keep as-is

Each section keeps its title header (icon + uppercase label + gold underline) but drops the card border, background, and rounded corners. The mega menu shell's own border and background become the only visible container.

**3. Grid dividers**
- Between grid columns: thin vertical `border-l border-gold/20` on each column except the first
- Between grid rows: thin horizontal `border-t border-gold/20`
- This creates the "connected segmented" feel matching the HorizontalUtilityBar

### About the onboarding question
That question was about the welcome popup that appears when you first open the site on a tablet. It sometimes covers the stamp editor. Since you said "keep as-is" before, I will not change it. If it ever blocks your work on the stamp page, let me know and I can disable it specifically there.

### Files affected
- `src/components/header/mega-menu-primitives.tsx` (add `MegaMenuSection`)
- ~10 mega menu files (swap `MegaMenuCard` → `MegaMenuSection`)

