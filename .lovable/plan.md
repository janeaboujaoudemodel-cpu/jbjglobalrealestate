

## Fix Vertical Sidebar Logo Header Layout

### Problem
The 88px logo header has three elements stacked vertically (logo+wordmark link, then minimizer button below), causing the minimizer to push content down and break visual centering.

### Changes — Single File: `src/components/navigation/GlobalVerticalNav.tsx`

**Lines 1070-1084** — Restructure the expanded sidebar header from vertical stack to horizontal row:

**Current layout (vertical):**
```
[Logo + Wordmark] (stacked center)
[Minimizer button] (below, mt-1.5)
```

**New layout (horizontal row):**
```
[Logo (larger, left-aligned)] [Wordmark (centered vertically)] [Minimizer (right)]
```

Specific changes:
1. Change outer div from `flex-col items-center justify-center` to `flex-row items-center justify-between`
2. Move the minimizer button **inline** to the right of the wordmark, inside the same row
3. Enlarge monogram from `w-11 h-11` → `w-14 h-14`
4. Shift monogram left with `ml-1` (slight left bias to fill empty space)
5. Add `gap-2` between wordmark and minimizer, remove `mt-1.5` from minimizer
6. Add `mt-1` to wordmark container to nudge it slightly down for vertical centering
7. Keep minimizer as a `shrink-0` element with `ml-auto` or explicit right placement

**No changes to:**
- Sidebar width (200px)
- Header height (88px)
- Fonts, colors, typography
- Collapsed sidebar state (lines 1275-1279)
- Any other component or layout

### Color codes used
None changed — same `from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]`

