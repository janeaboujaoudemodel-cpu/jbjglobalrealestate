

# Fix: Mortgage Calculator Numbers Cropped/Unreadable

## Problem

All currency value elements in the mortgage calculator use the `truncate` CSS class, which applies `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`. On smaller screens or within the project detail page layout, long values like "AED 2,000,000" get clipped and become unreadable.

This affects two views:
- **Compact mode** (homepage): 6 cards in a row with `truncate` on every value
- **Full mode** (project detail page + standalone calculator): 6 summary cards in a 3x2 grid with `truncate` on every value

## Root Cause

The `truncate` class is applied on **14 separate elements** across the component. Combined with fixed card widths and font sizes that don't scale down enough, the numbers overflow and get cut off.

## Fix

**File:** `src/components/MortgageCalculator.tsx`

1. **Remove `truncate` from all currency value elements** -- allow text to wrap naturally instead of clipping
2. **Replace with `break-words` and responsive font sizing** -- use `text-xs sm:text-sm lg:text-lg` scaling so numbers shrink gracefully on small screens instead of being cropped
3. **Use abbreviated formatting for compact mode** -- in the compact (homepage) view where space is tightest, show values like "AED 1.6M" instead of "AED 1,600,000" to guarantee readability

### Specific Changes

**Compact mode cards (lines 97-179):**
- Remove `truncate` from all 6 card value `<p>` elements
- Change font size classes to `text-xs sm:text-sm` with `break-all` or use abbreviated currency format
- Add `min-w-0` to card containers to enable proper flex shrinking

**Full mode summary cards (lines 344-385):**
- Remove `truncate` from all 6 card value `<p>` elements  
- Use `text-xs lg:text-base xl:text-lg` for better scaling
- Add `break-words` to prevent overflow without clipping

**Monthly Payment hero (line 334):**
- Remove `truncate` from the large monthly payment display
- Use responsive sizing that already works: `text-xl sm:text-2xl lg:text-4xl`

This is a styling-only fix across one file with no logic changes.
