

# Fix: Developer Marquee Logo Spacing and Sizing

## Problem

The developer logos in the homepage marquee strap have inconsistent spacing and sizes. Some logos appear larger and some have bigger gaps between them. The Emaar and Sobha Realty logos are the correct reference size -- all others should match.

## Root Cause

The current code uses `px-5 md:px-7 lg:px-9` padding on each link item, combined with a fixed-width container (`w-[120px] md:w-[150px] lg:w-[170px]`). However, the `img` inside uses `h-full w-auto` with various max constraints, so logos with different aspect ratios end up at visually different sizes. The padding is also applied as horizontal padding on the link, not as a fixed gap, so the visual spacing depends on how much of the container each logo fills.

## Solution

1. **Remove per-item horizontal padding** -- replace it with a uniform `gap` on the parent flex container so spacing is identical between every logo regardless of their visual width.

2. **Constrain all logos to the same fixed box** -- use a strict fixed-size container (e.g., `w-[100px] md:w-[120px] lg:w-[140px]`) with `h-[28px] md:h-[36px] lg:h-[40px]` and `object-contain` so every logo scales to the same bounding box, matching the Emaar/Sobha reference size.

3. **Reduce overall spacing** -- use `gap-6 md:gap-8 lg:gap-10` on the flex container (approximately 24-40px between logos), which is tighter than the current padding-based approach.

## Technical Details

**File:** `src/components/DeveloperPartnersMarquee.tsx`

**Line 77 (Link element):** Remove all `px-*` padding classes. Keep only `flex-shrink-0 flex items-center justify-center transition-opacity duration-300 hover:opacity-70`.

**Line 81 (inner div container):** Change to a strict fixed size: `w-[100px] md:w-[120px] lg:w-[140px] h-[28px] md:h-[36px] lg:h-[40px] flex items-center justify-center`. Remove the old `h-10 md:h-12 lg:h-14` which was taller than needed.

**Line 86 (img element):** Simplify to `max-h-full max-w-full object-contain` -- the parent container now controls the exact size, so we don't need separate `max-h` and `max-w` pixel constraints.

**Lines 134 and 138 (flex containers for Loop A and Loop B):** Add `gap-6 md:gap-8 lg:gap-10` so every logo has the exact same spacing between them.
