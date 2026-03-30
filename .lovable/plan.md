

# Fix Duplicate Filter Bar and White Gap on Map Page (+ Audit Other Pages)

## Problems

1. **White gap on /map**: PropertyMap's fixed filter bar uses `top-[48px]` — but the full header is 88px (48px nav + 40px filter row). The map container then uses `pt-[140px]` which stacks on top of MainLayout's `pt-[88px]`, creating ~228px of dead space.

2. **Duplicate filter bar**: The HorizontalUtilityBar always renders a global FilterShortcutBar (Row 2). PropertyMap also renders its own FilterShortcutBar. Result: two filter rows visible on `/map`.

3. **Same bug on other pages**: `AreaDetail.tsx` and `Developers.tsx` also use fixed portals at `top-[48px]` — these are similarly hidden behind the 88px header.

## Fix

### 1. PropertyMap.tsx — fix position and remove duplicate

- Change fixed filter bar from `top-[48px]` to `top-[88px]` (below the full 88px header)
- Change map container padding from `pt-[140px]` to `pt-[52px]` (MainLayout already provides 88px, so only need ~52px for the map's own filter bar)
- Change list panel `top-[140px]` to `top-[52px]` for the same reason

### 2. HorizontalUtilityBar.tsx — hide global filter row on /map

- On `/map` route, hide Row 2 (the global FilterShortcutBar) since PropertyMap has its own specialized filter bar with map-specific controls (property count badge, list toggle, `isMapMode`)

### 3. AreaDetail.tsx — fix fixed portal position

- Change the fixed filter portal from `top-[48px]` to `top-[88px]`

### 4. Developers.tsx — fix fixed portal position

- Change the fixed filter portal from `top-[48px]` to `top-[88px]`

### 5. DeveloperHubShell.tsx — fix sidebar position

- Change sidebar from `top-[48px]` / `h-[calc(100vh-48px)]` to `top-[88px]` / `h-[calc(100vh-88px)]`

## Files to modify
- `src/pages/PropertyMap.tsx` — fix top offset + padding
- `src/components/navigation/HorizontalUtilityBar.tsx` — hide Row 2 on /map
- `src/pages/AreaDetail.tsx` — fix fixed portal top offset
- `src/pages/Developers.tsx` — fix fixed portal top offset
- `src/pages/developer-hub/DeveloperHubShell.tsx` — fix sidebar top offset

