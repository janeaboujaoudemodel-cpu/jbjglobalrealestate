

## Fix Plan: Collapsed Nav Direct Navigation + Header Mode & Spacing

### Issues Found

1. **Collapsed sidebar click** (lines 1400-1404): Clicking a section icon when minimized expands the sidebar and opens the section, but does NOT navigate anywhere. User wants immediate redirect to the first page of that section.

2. **Mode switcher unreadable** (`ModeSwitcher.tsx` line 131-132): Currently shows only `shortLabel` (single letter "I", "B", "D") instead of the full label like "Mode: Investor". The `max-w-[160px]` constraint + `hidden sm:block` makes it too compact.

3. **Header spacing/gaps**: Badge sizing uses non-standard `w-4.5 h-4.5` classes (not valid Tailwind). Need to use `w-[18px] h-[18px]` or `min-w-4 h-4` for proper rendering.

### Changes

#### 1. `GlobalVerticalNav.tsx` — Collapsed icon click navigates directly

**Current** (lines 1400-1404): Expands sidebar + opens section, no navigation.

**Fix**: When collapsed and user clicks a section icon, navigate to the first item's `href` in that section instead of expanding. Keep sidebar collapsed.

```tsx
onClick={() => {
  const firstItem = sectionGroups[sectionKey]?.[0];
  if (firstItem?.href && firstItem.href !== '#') {
    navigate(firstItem.href);
  }
}}
```

#### 2. `ModeSwitcher.tsx` — Restore full readable label

**Current** (line 131): Shows `currentConfig.shortLabel` with `max-w-[160px]`.

**Fix**: Show `currentConfig.label` (e.g., "Mode: Investor"), increase `max-w` to `max-w-[200px]`, restore `text-[11px]` to `text-xs`.

#### 3. `HorizontalUtilityBar.tsx` — Fix badge sizing

**Current** (lines 287, 305): Uses `w-4.5 h-4.5` which is not a valid Tailwind class.

**Fix**: Replace with `min-w-[18px] h-[18px]` for proper badge rendering. Remove any unnecessary gaps between right-side items.

### Files to modify

| File | Change |
|------|--------|
| `src/components/navigation/GlobalVerticalNav.tsx` | Collapsed icon click → navigate to first page in section |
| `src/components/ModeSwitcher.tsx` | Restore full "Mode: Investor" label, widen container |
| `src/components/navigation/HorizontalUtilityBar.tsx` | Fix badge classes, tighten right-side spacing |

