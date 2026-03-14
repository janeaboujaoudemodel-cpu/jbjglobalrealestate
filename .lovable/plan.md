

## Plan: Search Filter UI Fixes — Remaining Issues

The previous round fixed Developers, AreaGuides, PropertyMap, and Properties pages. Several pages still have sidebar overlay issues and need the same treatment.

### Task 1: Fix Filter Overlay on Remaining Pages

Three detail pages still use `top-0 left-0` without sidebar awareness or utility bar offset:

| File | Line | Current | Fix |
|------|------|---------|-----|
| `AreaDetail.tsx` L234 | `top-0 left-0 ... lg:left-[200px]` | Missing `top-[48px]` and collapsed sidebar class | Add `top-[48px]` and `[body.jj-vertical-nav-collapsed_&]:lg:left-[48px]` |
| `DeveloperDetail.tsx` L403 | `top-0 left-0 right-0` | No sidebar awareness at all | Add `top-[48px] lg:left-[200px] [body.jj-vertical-nav-collapsed_&]:lg:left-[48px]` |
| `ProjectDetailLayout.tsx` L680 | `top-0 left-0 right-0` | No sidebar awareness | Add `top-[48px] lg:left-[200px] [body.jj-vertical-nav-collapsed_&]:lg:left-[48px]` |

### Task 2: Header Already Fixed
`HorizontalUtilityBar.tsx` already uses `flex` (visible always) and sidebar-aware classes. No change needed — confirmed working.

### Task 3: Restructure Filter Rows (Developers)
The tier filter + developer count row already exists in `Developers.tsx` (lines 303-340 inline, lines 371-404 in fixed portal). This is already working as designed with "All Tiers" dropdown + developer count. No additional changes needed.

### Task 4: Gold Scroller Already Removed
`PremiumHorizontalScrollHint` is no longer imported or used in `FilterShortcutBar.tsx` or `ProjectDetailLayout.tsx`. Confirmed removed.

### Task 5: Search Bar Cropping
The `GlobalSearchModal` already has `top-[60px] sm:top-[72px]` and `px-4 sm:px-6`. However, `maxHeight` is still `calc(100dvh - 2rem)` which doesn't account for the 60px top offset, causing bottom cropping. Fix: change to `calc(100dvh - 80px)` on the outer div and `calc(100dvh - 96px)` on inner.

### Files to Change

| File | Change |
|------|--------|
| `src/pages/AreaDetail.tsx` | Add `top-[48px]` + collapsed sidebar class to fixed filter bar |
| `src/pages/DeveloperDetail.tsx` | Add `top-[48px]` + full sidebar-aware classes to fixed filter bar |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Add `top-[48px]` + sidebar-aware classes to sticky nav |
| `src/components/GlobalSearchModal.tsx` | Fix maxHeight to account for top offset |

