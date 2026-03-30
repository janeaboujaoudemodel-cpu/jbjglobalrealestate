

# Fix Project Page Filter Strip Alignment & Color Unification

## Root Cause

1. **Cramped pills**: Row 2 container is `h-[40px]` with no vertical padding. The pills inside use `py-2 md:py-2.5` which makes them fill the space tightly with no breathing room.

2. **Subtle divider creates two-tone illusion**: Line 537 of HorizontalUtilityBar.tsx renders a `h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent` divider between Row 1 and Row 2. While both rows share the same parent background gradient, this divider creates a visible separation that makes the rows feel like different sections with different tones.

3. **Row 2 height too tight**: At 40px, the filter pills with their padding and border fill the vertical space completely, causing the bottom of pills to appear visually clipped.

## Changes

### File: `src/components/navigation/HorizontalUtilityBar.tsx`

| Line | Change | Detail |
|------|--------|--------|
| 537 | Remove divider | Delete the `h-px mx-4 bg-gradient-to-r...` div that creates visual separation between rows |
| 539 | Increase Row 2 height | Change `h-[40px]` to `h-[44px]` for more breathing room |
| 247 | Update total header height | Change `h-[88px]` to `h-[92px]` to accommodate the taller Row 2 |

### File: `src/components/filters/FilterShortcutBar.tsx`

| Line | Change | Detail |
|------|--------|--------|
| 232 | Refine pill padding | Change `py-2 md:py-2.5` to `py-2.5 md:py-3` for cleaner vertical centering and no bottom clipping |

### File: `src/components/MainLayout.tsx` + other files with `top-[88px]` or `pt-[88px]`

All references to the 88px header height must be updated to 92px to match the new header size. This includes:
- MainLayout `pt-[88px]` → `pt-[92px]`
- Any fixed elements using `top-[88px]` → `top-[92px]`
- Map page offsets (`top-[132px]` → `top-[136px]`)

**Wait** — this is a cascading change that touches many files and risks breaking the established layout standard. Let me reconsider.

## Revised approach (minimal, no height change)

Keep the header at exactly 88px. Instead:

1. **Remove the divider** between rows — this eliminates the two-tone visual effect
2. **Slightly reduce pill vertical padding** isn't needed — instead increase Row 2 from 40px to 40px but add `py-0.5` to the container for internal spacing
3. **Keep total header at 88px** by adjusting Row 1 from 48px to 46px and Row 2 from 40px to 42px

Actually, even simpler — the pills look cramped because the Row 2 container has `h-[40px]` as a hard constraint. Let me just add some internal padding and remove the divider.

## Final Minimal Plan

### File: `src/components/navigation/HorizontalUtilityBar.tsx`

1. **Line 537**: Remove the divider div entirely (`<div className="h-px mx-4 bg-gradient-to-r from-transparent via-gold/20 to-transparent shrink-0" />`) — this unifies the color appearance between rows.

2. **Line 539-540**: Keep `h-[40px]` but ensure pills have room. Change from:
   ```
   <div className="h-[40px] shrink-0 px-3 flex items-center">
   ```
   to:
   ```
   <div className="h-[40px] shrink-0 px-3 flex items-center py-0.5">
   ```

### File: `src/components/filters/FilterShortcutBar.tsx`

3. **Line 232**: Reduce pill padding slightly so they don't press against container edges. Change:
   ```
   py-2 md:py-2.5
   ```
   to:
   ```
   py-1.5 md:py-2
   ```
   This gives more visual breathing room within the fixed 40px container height.

## Summary

- Remove the gold divider line between Row 1 and Row 2 → unified background appearance
- Add `py-0.5` to Row 2 container for internal breathing room
- Adjust pill vertical padding for balanced, non-cramped appearance
- No height changes, no color changes, no layout restructuring
- Two files modified: `HorizontalUtilityBar.tsx`, `FilterShortcutBar.tsx`

