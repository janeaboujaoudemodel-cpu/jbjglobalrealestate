

# Fix Mega Menu: Restore Title Dividers + Remove Row Gap Line

## Problem
Two issues in the Insights mega menu dropdown:
1. The gold divider under each card title (e.g., "NEWS & UPDATES", "BUSINESS SUITES") was incorrectly removed -- user wants these kept
2. A visible horizontal line cuts across all 4 cards in the second row -- this is caused by the grid gap between rows exposing the darker shell background behind the cards

## Changes

### File: `src/components/header/mega-menu-primitives.tsx`

**Change 1: Restore the gold divider under card titles in MegaMenuSectionTitle (line 201)**

Bring back the `border-b border-gold/30 pb-2 mb-5` that was previously removed:

```
// From:
"flex items-center justify-center mb-3 min-h-[36px]"

// To:
"flex items-center justify-center mb-5 pb-2 border-b border-gold/30 min-h-[36px]"
```

**Change 2: Remove the horizontal gap line between card rows in MegaMenuInsights**

### File: `src/components/header/MegaMenuInsights.tsx` (line 135)

Change the grid gap from uniform `gap-1.5` to only horizontal gap, eliminating the visible vertical line between rows:

```
// From:
"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5"

// To:
"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-1.5 gap-y-0"
```

This removes the vertical space between row 1 and row 2 so no shell background peeks through, while keeping horizontal spacing between cards intact.

## Result
- Gold dividers under each card title (NEWS & UPDATES, MARKET INTELLIGENCE, etc.) are restored
- The big horizontal line cutting across the second row of cards is eliminated
- All other mega menus (More, Areas, Developers, Projects) also get their title dividers back since they share MegaMenuSectionTitle

