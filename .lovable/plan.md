
# Fix: Hero Search Button Rounding

## Problem
The search button in the homepage hero section is currently using `rounded-full` which makes it a fully circular pill shape. You want it to match the original design with only a slight rounded border on both sides.

## Current Code (Line 918)
```tsx
className="h-10 px-6 py-2.5 bg-gold hover:bg-gold-dark text-black font-bold text-sm rounded-full transition-all duration-300 shadow-lg hover:shadow-gold/30"
```

## Fix
Replace `rounded-full` with `rounded-xl` to give it a subtle rounded corner on both left and right sides that matches the rest of the search bar container.

**File: `src/components/home/HeroSearchBar.tsx`** (Line 918)

Change from:
```tsx
rounded-full
```

To:
```tsx
rounded-xl
```

## Result
The search button will have slightly rounded corners (12px radius) on both left and right sides, matching the design of the main search bar container which also uses `rounded-xl`.

## Technical Detail
- `rounded-full` = 9999px radius (complete circle/pill)
- `rounded-xl` = 12px radius (subtle rounded corners)

This matches the search bar container at line 619 which uses `rounded-xl`.
