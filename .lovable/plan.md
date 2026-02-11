

# Footer Navigation Cards Layout Redesign

## Overview

Restructure the footer navigation card grid for a more premium, spacious layout on both desktop and mobile.

## Changes (single file: `src/components/Footer.tsx`)

### A. FooterCard Component -- Add Gold Divider Between Columns (lines 29-55)

The FooterCard already uses a 2-column grid for links. Add a vertical gold divider between the two columns using CSS:

- Apply `gap-x-0` and instead use padding + a gold border on the right side of the first column items (or use a CSS pseudo-element / `divide-x` approach)
- Better approach: wrap the 2-column grid with `relative` and add a centered vertical gold line via an absolutely positioned `div` (1px wide, gold gradient, centered horizontally)
- Make the category title gold (`text-gold`) and centered (already centered)

### B. FooterCard on Mobile -- Rectangular Shape

Currently on mobile (`grid-cols-1`), each card stacks vertically and takes full width but can be tall. To enforce a rectangular (horizontal) shape:

- The 2-column link grid already makes the card wider than tall
- Ensure padding is balanced (`px-5 py-4` instead of `p-4`) so horizontal emphasis is clear
- The card will naturally be rectangular with the 2-column layout

### C. Desktop Grid -- 3 Cards Per Row

Change all three row grids from `lg:grid-cols-4` to `lg:grid-cols-3`:

- **Row 1** (line 633): `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` becomes `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
  - 4 cards (Properties, Services, Guides, About) -- 3 on first row, 1 wraps to next
- **Row 2** (line 645): same change to `lg:grid-cols-3`
  - 4 cards (Sell, Education Hub, Legal, Business Suites) -- 3 + 1
- **Row 3** (line 662): already `lg:grid-cols-3` -- no change needed

This gives a balanced 3-column desktop layout with cards that are wider and more premium-looking.

### D. Merge Rows 1 and 2 into a Single Grid

Since both rows now share the same `lg:grid-cols-3` layout, merge them into one continuous grid to avoid the visual gap between "rows". This creates a natural flow: 3 cards per row on desktop, 2 on tablet, 1 on mobile.

- Remove the separate `mb-4` dividers between rows
- One single grid container with all 8+ cards from rows 1 and 2, plus row 3 cards

## Summary

| Area | Current | New |
|------|---------|-----|
| Desktop columns | 4 per row | 3 per row |
| Mobile card shape | Vertical stack | Rectangular (2-col links + gold divider) |
| Category title | Dark text | Gold (`text-gold`) |
| Column divider | None | Vertical gold line between the two link columns |
| Row structure | 3 separate grids | Merged into fewer grids for natural flow |

