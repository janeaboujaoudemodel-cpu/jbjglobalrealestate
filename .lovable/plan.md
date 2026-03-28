

# Fix Logo Backgrounds and Homepage Hero Overlap

## Problems Identified

1. **White/solid background behind logos**: The image file `jbj-monogram-dark-bg.png` has a visible solid background box. It is used in 6+ components, making the logo appear on a white or dark square instead of blending into the page.

2. **Homepage hero unreadable**: The fallback screen (logo + tagline) renders at z-index 1 and never fully disappears — it bleeds through under the gradient overlays, stacking on top of the hero text content at z-index 10, making everything unreadable.

## Plan

### 1. Replace all `jbj-monogram-dark-bg.png` with transparent variants
Every file using `jbjMonogramDarkBg` will switch to the correct transparent logo:
- **Dark surfaces** (modals on dark bg, video players, dark pages): use `jbj-monogram-light-transparent.png` (light/gold letters, transparent background)
- **Light surfaces** (walkthrough modal with white bg): use `jbj-monogram-nobuffer.png` (dark letters, transparent background)

Files to update:
- `src/components/ActionGateModal.tsx` — switch to `jbjMonogramLightTransparent`
- `src/components/WelcomeModal.tsx` — switch to `jbjMonogramLightTransparent`
- `src/components/YouTubeVideoPlayer.tsx` — switch to `jbjMonogramLightTransparent`
- `src/components/broker-toolkit/BrokerToolkitReferral.tsx` — switch to `jbjMonogramLightTransparent`
- `src/pages/ComingSoon.tsx` — switch to `jbjMonogramLightTransparent`
- `src/pages/News.tsx` — switch to `jbjMonogramLightTransparent`
- `src/components/JJLogoImage.tsx` — switch dark variant to `jbjMonogramLightTransparent`
- `src/components/GlobalHeader.tsx` line 1088 (walkthrough modal, light bg) — switch to `jbjMonogramNobuffer`

### 2. Fix homepage hero fallback overlapping content
In `src/pages/Index.tsx`, the fallback screen (lines 166-199) must be fully hidden once the video loads, and must not visually overlap with the hero text content:
- Add `visibility: hidden` when `videoLoaded` is true (not just `opacity: 0`) so it cannot bleed through
- Add `pointer-events: none` to prevent interaction blocking
- Ensure the fallback container has a lower z-index than the gradient overlay so it never shows through

### 3. Remove unused `jbjMonogramDarkBg` import from GlobalHeader
The import at line 40 is no longer needed after these changes — clean it up to avoid confusion.

## What stays the same
- All visual design, layout, colors, and UX remain identical
- The transparent logo variants are the same monogram design, just without the background box
- The hero content, animations, and video behavior are unchanged

