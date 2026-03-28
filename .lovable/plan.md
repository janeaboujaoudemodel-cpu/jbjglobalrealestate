

# Fix Logo White Background and Hero Overlap

## Problem
1. **GuidedTour modal** (the "Welcome" screen visible on load) uses `JJLogoImage variant="light"` which renders `jbj-monogram-light-bg.png` — an asset with a visible background box on a white modal.
2. **JJLogoImage component** uses `jbjMonogramLightBg` for `variant="light"`, which has a solid background. Should use `jbjMonogramNobuffer` (dark letters, transparent background) instead.
3. **BrandIntroSplash** and **AlertsDemo** use `jbj-monogram-light-on-dark.png` which may also carry a background — should use `jbjMonogramLightTransparent` for consistency.

## Changes

### 1. Fix JJLogoImage — swap light variant to transparent asset
**File**: `src/components/JJLogoImage.tsx`
- Change `variant === 'light'` to use `jbjMonogramNobuffer` instead of `jbjMonogramLightBg`
- Import `jbjMonogramNobuffer` instead of `jbjMonogramLightBg`
- Also update `JJLogoTransparent` component which uses `jbjMonogramLightBg`

### 2. Fix BrandIntroSplash — use transparent asset
**File**: `src/components/BrandIntroSplash.tsx`
- Replace `jbjMonogramLightOnDark` import with `jbjMonogramLightTransparent`

### 3. Fix AlertsDemo — use transparent asset
**File**: `src/pages/AlertsDemo.tsx`
- Replace `jbjMonogramLightOnDark` import with `jbjMonogramLightTransparent`

### 4. Fix BrandedLoader — use transparent assets
**File**: `src/components/ui/BrandedLoader.tsx`
- Replace `jbjMonogramDarkOnLight` with `jbjMonogramNobuffer` (for light backgrounds)
- Replace `jbjMonogramLightOnDark` with `jbjMonogramLightTransparent` (for dark backgrounds)

## What stays the same
- All layout, animations, UX, and design remain identical
- Only the PNG asset references change to transparent variants
- The monogram design itself is the same, just without background boxes

## Technical Details
Asset mapping:
- `jbj-monogram-light-bg.png` → `jbj-monogram-nobuffer.png` (dark letters, transparent bg, for light surfaces)
- `jbj-monogram-light-on-dark.png` → `jbj-monogram-light-transparent.png` (light letters, transparent bg, for dark surfaces)
- `jbj-monogram-dark-on-light.png` → `jbj-monogram-nobuffer.png` (dark letters, transparent bg, for light surfaces)

