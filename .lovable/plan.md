

# Footer Cards: 2-Per-Row Layout + No Text Cropping

## Problem
- Footer navigation cards display 3 per row on desktop, causing link labels to be cropped with "..." (the `truncate` class)
- On mobile, cards are already 1 per row (correct), but the truncation still affects readability

## Changes

### File: `src/components/Footer.tsx`

**1. Change grid from 3 columns to 2 columns on desktop**

Both grid containers (lines 637 and 654) will change from `lg:grid-cols-3` to `lg:grid-cols-2`. This gives each card more horizontal space, making link names fully readable.

```
// Line 637 - From:
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 auto-rows-auto

// To:
grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 auto-rows-auto
```

```
// Line 654 - From:
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-auto

// To:
grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 auto-rows-auto
```

**2. Remove `truncate` from link text (line 47)**

Remove the `truncate` class from the link elements inside FooterCard so names are never cropped with three dots.

```
// From:
"text-zinc-700 hover:text-gold transition-all duration-300 text-xs sm:text-sm inline-block hover:translate-x-1 truncate"

// To:
"text-zinc-700 hover:text-gold transition-all duration-300 text-xs sm:text-sm inline-block hover:translate-x-1"
```

## Result
- Desktop: 2 cards per row (wider cards, no text cropping)
- Tablet (sm): 2 cards per row (unchanged)
- Mobile: 1 card per row (unchanged)
- All link labels display in full without "..." truncation
