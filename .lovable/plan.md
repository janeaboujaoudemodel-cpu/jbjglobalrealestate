

## Fix Filter Bars: Show on Mobile (Project Detail) and Fix Developer Page Fixed Filter

### Problem 1: Project Detail Page - Filter Hidden on Mobile
In `ProjectDetailLayout.tsx` line 589, the previous fix incorrectly added `hidden sm:block` to the FilterShortcutBar row, which completely removes it on mobile. You want both the filter bar AND the project sub-navigation to show on mobile -- just without overlapping.

### Problem 2: Developer Page - Fixed Filter Bar Corrupt on Mobile
In `DeveloperDetail.tsx`, when the filter bar becomes fixed (portal at top-0), it renders the full FilterShortcutBar in a container with padding but no mobile-specific handling. On a phone, Row 1 (search + sort pills + map + saved + currency + filter) overflows and gets clipped because the connected toolbar doesn't wrap or scroll properly within the fixed container.

---

### Fix 1: Restore Filter Bar on Mobile in Project Detail Page

**File**: `src/components/project-detail/ProjectDetailLayout.tsx` (line 589)

- Remove `hidden sm:block` from the Row 1 wrapper
- Instead, add compact mobile styling: reduce padding on mobile (`py-1 px-2 sm:py-2 sm:px-4`) and ensure the FilterShortcutBar's scrollable Row 1 works within the sticky header
- This ensures both Row 1 (filter bar) and Row 2 (project shortcuts) are visible on all screen sizes

### Fix 2: Fix Developer Page Fixed Filter Bar on Mobile

**File**: `src/pages/DeveloperDetail.tsx` (lines 372-396)

The fixed portal filter bar needs mobile-safe styling:
- Add `overflow-x-auto` to the inner container so the FilterShortcutBar can scroll horizontally
- Reduce padding on mobile: `p-2 sm:p-4`
- Ensure the bar doesn't clip content by removing any implicit width constraints

Also fix the inline (non-fixed) filter bar at line 349 to use responsive padding: `p-2 sm:p-4`

---

### Technical Summary

| File | Line(s) | Change |
|------|---------|--------|
| `src/components/project-detail/ProjectDetailLayout.tsx` | 589 | Remove `hidden sm:block`, add compact responsive padding |
| `src/pages/DeveloperDetail.tsx` | 349, 372-396 | Add overflow handling and responsive padding to both inline and fixed filter bars |

