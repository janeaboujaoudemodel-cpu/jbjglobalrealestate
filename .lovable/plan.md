

## Plan: Premium Horizontal & Vertical Navigation Fixes

### Issues Identified

1. **Vertical Sidebar**: Minimizer button too close to company name; logo monogram too small and not left-aligned enough
2. **Horizontal Bar**: Gap after Settings on right side; area unit toggle not styled as connected field box; dividers are half-height (`h-6`) instead of full-height (`h-full`); search icon not gold; heart not red; hover shows gray rectangle instead of premium styling

### Changes

**File: `src/components/navigation/GlobalVerticalNav.tsx`** (lines 1074-1090)

- Increase monogram from `w-10 h-10` to `w-12 h-12`
- Reduce left padding or adjust gap so logo sits more to the left (`px-3` instead of `px-4`)
- Add more spacing between company name and collapse button (add `ml-auto` or increase gap)

**File: `src/components/navigation/HorizontalUtilityBar.tsx`**

1. **Full-height dividers** (line 109): Change `railDivider` from `h-6` to `h-full` so dividers span top to bottom of the 48px bar:
   ```tsx
   const railDivider = <div className="w-px h-full bg-black/10 shrink-0" />;
   ```

2. **Add dividers between Tasks, Alerts, Inbox** (lines 287-320): Insert `{railDivider}` between each icon

3. **Remove spacer gap** (line 244): Remove or keep `flex-1` but ensure the right rail pushes flush to the right edge. Actually the `flex-1` spacer is correct for pushing right — the issue is Settings needs to be at the very end. Currently it is last, so the gap is likely from `pr-10`. Reduce right padding.

4. **Search icon gold** (line 135): Change `iconClass` for search to use gold color: `text-[hsl(var(--gold))]`

5. **Heart icon red** (line 177): Change Heart icon class to `text-red-500`

6. **Hover fix** (line 104): Change `cellHover` from `hover:bg-black/[0.06]` to a subtle champagne gold hover: `hover:bg-[hsl(var(--gold)/0.08)]` — no gray rectangles

7. **Area unit as connected field box** (lines 186-205): Wrap ft²/m² toggle in a border container styled like the footer's premium toggle with `border border-black/10 rounded-md` to make it look like one connected field

8. **Horizontal bar background matching sidebar header**: Already uses same champagne gradient — confirmed matching

### Files to Edit
- `src/components/navigation/GlobalVerticalNav.tsx` — sidebar header layout
- `src/components/navigation/HorizontalUtilityBar.tsx` — all horizontal bar fixes

