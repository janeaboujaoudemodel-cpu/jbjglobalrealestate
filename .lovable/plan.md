
# Remove Gold Horizontal Divider from Insights Mega Menu Card Titles

## Problem
Each card in the Insights mega menu has a gold horizontal divider line under its title (e.g., under "NEWS & UPDATES", "MARKET INTELLIGENCE", "BUSINESS SUITES", "COMPANY", "LEGAL", etc.). This line visually cuts across the cards and needs to be removed.

## What Was Wrong Last Time
The previous fix removed a divider from the `MegaMenuIconLink` component (the line under each individual link item). The actual divider the user wants removed is in the `MegaMenuSectionTitle` component -- the `border-b border-gold/30` on line 201 of `mega-menu-primitives.tsx`.

## Fix
**File: `src/components/header/mega-menu-primitives.tsx`** (line 201)

Remove `border-b border-gold/30` from the `MegaMenuSectionTitle` component's className. Change:

```
"flex items-center justify-center mb-5 pb-2 border-b border-gold/30 min-h-[36px]"
```

to:

```
"flex items-center justify-center mb-3 min-h-[36px]"
```

This removes the gold bottom border and adjusts spacing (removes `pb-2` padding and reduces `mb-5` to `mb-3` since the border no longer needs extra space).

This change affects all mega menus that use `MegaMenuSectionTitle` (Insights, More, Areas, Developers, Projects), keeping them all consistent.
