

## Auto-Play Videos in Mega Menu Cards and Add Missing Videos

### Problem
1. Videos in mega menu featured cards only play on hover -- they should start playing immediately when the dropdown opens
2. Areas and Developers mega menus have no video at all
3. The image `menu-dubai-skyline.jpg` is used in both Developers and InvestorHub (duplicate)

### Changes

#### 1. Auto-play video immediately on mount (not on hover)

**File: `src/components/header/mega-menu-primitives.tsx`**

- Replace the `handleMouseEnter` / `handleMouseLeave` hover-based play/pause with a `useEffect` that calls `videoRef.current.play()` on mount
- Change the video element from `opacity-0 group-hover:opacity-100` to `opacity-100` so it's visible immediately
- Keep the static image as a loading fallback underneath (it shows while the video loads)
- Remove `onMouseEnter` and `onMouseLeave` from the Link wrapper

#### 2. Add unique videos to Areas and Developers menus

**File: `src/components/header/MegaMenuAreas.tsx`**
- Import `dubai-landmarks-hero.mp4` and pass it as the `video` prop to MegaMenuFeaturedCard (landmarks video suits the "areas" context)

**File: `src/components/header/MegaMenuDevelopers.tsx`**
- Import `burj-al-arab-aerial.mp4` and pass it as the `video` prop to MegaMenuFeaturedCard (aerial shot suits the "developers" context)

#### 3. No duplicate videos or images

All video assignments after the fix:

| Menu | Video | Unique |
|------|-------|--------|
| Buy | dubai-buying-hero.mp4 | Yes |
| Sell | dubai-selling-hero.mp4 | Yes |
| Rent | dubai-rental-hero.mp4 | Yes |
| Projects | burj-khalifa-day-to-night.mp4 | Yes |
| Areas | dubai-landmarks-hero.mp4 | Yes (new) |
| Developers | burj-al-arab-aerial.mp4 | Yes (new) |
| InvestorHub | dubai-investment-hero.mp4 | Yes |
| BrokerHub | broker-dashboard-hero.mp4 | Yes |

### Files to Change

| File | Change |
|------|--------|
| `src/components/header/mega-menu-primitives.tsx` | Auto-play video on mount instead of hover; show video immediately (opacity-100) |
| `src/components/header/MegaMenuAreas.tsx` | Add `dubai-landmarks-hero.mp4` video import and pass to featured card |
| `src/components/header/MegaMenuDevelopers.tsx` | Add `burj-al-arab-aerial.mp4` video import and pass to featured card |

