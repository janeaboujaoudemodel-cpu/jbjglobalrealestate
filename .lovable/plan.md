

# Fix Mega Menu Titles, Dividers, Project Card Title Color, and "...more" Text

## Changes

### 1. Center "Top Areas in Dubai" title (and all MegaMenuCard titles)

**File: `src/components/header/mega-menu-primitives.tsx`**

The `MegaMenuSectionTitle` component (line 201) uses `flex items-center justify-between`. Change to `justify-center` so the title text is centered. This applies globally to all mega menu cards (Areas, Developers, Buy, Sell, Rent, Insights, More).

### 2. Add gold divider between area links (all MegaMenuIconLink items)

**File: `src/components/header/mega-menu-primitives.tsx`**

The `MegaMenuIconLink` already has a thin gold divider at the bottom of each link (line 291: `bg-gradient-to-r from-transparent via-gold/30 to-transparent`). This is present but may not be visible enough. Make the divider slightly more prominent (`via-gold/50` instead of `via-gold/30`) to create a clear, elegant separator between each item. This applies to all mega menu sections consistently.

### 3. Change project title from gold to dark black

**File: `src/components/ProjectCard.tsx`** (line 292)
- Change `text-gold` to `text-black` and `hover:text-gold/80` to `hover:text-gold`

**File: `src/components/ReellyProjectCard.tsx`** (line 239)
- Same change: `text-gold` to `text-black`, hover to gold

### 4. Change "...more" from gold to black

**File: `src/components/ProjectCard.tsx`** (line 349)
- Change `text-gold font-bold hover:text-gold/80` to `text-black font-bold hover:text-black/70`

**File: `src/components/ReellyProjectCard.tsx`** (line 294)
- Change `text-gold font-bold` to `text-black font-bold`

---

## Summary of Files

| File | Change |
|------|--------|
| `src/components/header/mega-menu-primitives.tsx` | Center MegaMenuSectionTitle, strengthen link dividers |
| `src/components/ProjectCard.tsx` | Title to black, "...more" to black |
| `src/components/ReellyProjectCard.tsx` | Title to black, "...more" to black |

