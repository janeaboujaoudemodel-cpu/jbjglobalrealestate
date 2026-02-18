
# Photo Suite — Complete Fix & Feature Expansion

## Problems Found

### 1. Double Headers (Layout Collision)
The `MainLayout` wraps all routes via `MainLayoutWrapper`, adding `pt-16 sm:pt-20 md:pt-24 lg:pt-28` to the page. But:
- `PhotoSuite.tsx` has its own suite header rendered inline — this stacks on top of the GlobalHeader correctly.
- **`InteriorDesignAI`** (line 197) renders its own full `<div>` header with title "AI Interior Design Assistant" even when embedded inside the Photo Suite tab — no `embedded` prop.
- **`VirtualStagingPage`** (line 197) renders its own full header with "AI Virtual Staging" title even when embedded — no `embedded` prop.
- Both need an `embedded?: boolean` prop added to suppress their inner headers.

### 2. Beauty Filters — Thin Feature Set
Currently only 6 basic sliders + 8 presets. Missing key features:
- More sliders: Exposure, Highlights, Shadows, Whites/Blacks, Sharpness, Noise reduction, Fade
- More presets: Fashion, Matte, Cinematic, B&W, Vintage, Sepia, Film Noir, Golden Hour
- **Clothing Whitening** mode: a dedicated "Make Clothing White" canvas pixel operation
- Preset before/after comparison (split-screen toggle)
- Reset individual sliders

### 3. Background AI — Clothing Whitening
User explicitly asked "make clothing very white." Add a new tab/mode: **"Whiten Clothing"** that applies a selective whitening filter targeting fabric regions in the image (boost brightness on near-white and desaturated areas).

---

## Implementation Plan

### File 1: `src/pages/toolkit/VirtualStagingPage.tsx`
Add `embedded?: boolean` prop to the component. When `embedded=true`, skip rendering the header block (lines 196–214).

### File 2: `src/pages/InteriorDesignAI.tsx`
Add `embedded?: boolean` prop to the component. When `embedded=true`, skip rendering the GlobalHeader-duplicate and navigation elements. (Interior Design already has complex layout; suppress just the top header section.)

### File 3: `src/pages/toolkit/PhotoSuite.tsx`
Pass `embedded` to `InteriorDesignAI` and `VirtualStagingPage`:
```tsx
<InteriorDesignAI embedded />
<VirtualStagingPage embedded />
```

### File 4: `src/pages/toolkit/BeautyFilters.tsx` — Major Rebuild
**New Adjustments (14 sliders total):**

```text
Exposure    -50 to +50
Brightness  -50 to +50
Contrast    -50 to +50
Highlights  -50 to +50
Shadows     -50 to +50
Whites      -50 to +50
Blacks      -50 to +50
Saturation  -100 to +100
Vibrance    -50 to +50
Warmth      -50 to +50
Tint        -50 to +50
Sharpness   0 to 50
Blur        0 to 20
Vignette    0 to 60
Fade        0 to 50
```

**New Presets (16 total):**
Original, Luxury Dark, Bright & Clean, Warm Glow, Cool Pro, HDR Effect, Soft Portrait, Dramatic, Fashion Editorial, Matte Film, Cinematic, Black & White, Vintage Film, Golden Hour, Sepia, Film Noir

**Canvas rendering upgrades:**
- Multi-layer CSS filter string built from all adjustments
- Sharpness uses an unsharp mask via OffscreenCanvas convolution
- Whites/Blacks use pixel-level clamping via ImageData
- Before/After split-view toggle button

**Clothing Whitening Button:**
A dedicated "Whiten Clothing" action button that:
1. Gets current canvas ImageData
2. For each pixel: if the pixel is "near-white" (R+G+B > 500 AND max channel diff < 80) — push all channels toward 255 (clothing white boost)
3. If pixel is "desaturated neutral" (saturation < 30%) — also whiten it
4. Re-renders output instantly

### File 5: `src/pages/toolkit/BackgroundAI.tsx`
Add a **"Whiten Clothing"** preset button in the background presets section. When clicked:
- Takes the current `imagePreview` and applies the same pixel-level whitening algorithm above
- Shows the result in the preview

---

## Technical Architecture

```text
PhotoSuite
├── GlobalHeader (from MainLayout) — top bar
├── Suite Header (inline) — title + back link
├── Tab Bar — 5 tabs
└── Tab Content
    ├── BackgroundAI embedded=true        (hides own header) ✓ existing
    ├── BeautyFilters embedded=true       (hides own header) ✓ existing
    ├── ImageResize embedded=true         (hides own header) ✓ existing
    ├── InteriorDesignAI embedded=true    (ADD embedded prop) ← FIX
    └── VirtualStagingPage embedded=true  (ADD embedded prop) ← FIX
```

### Clothing Whitening Algorithm
```text
For each pixel (R, G, B):
  brightness = (R + G + B) / 3
  maxDiff = max(|R-G|, |G-B|, |R-B|)
  saturation = (max(R,G,B) - min(R,G,B)) / max(R,G,B)

  isNearWhite = brightness > 160 AND saturation < 0.35
  
  if isNearWhite:
    strength = clamp((brightness - 160) / 95, 0, 1) * 0.85
    R = R + (255 - R) * strength
    G = G + (255 - G) * strength
    B = B + (255 - B) * strength
```

This targets white shirts, lab coats, dress shirts, wedding dresses without blowing out skin tones (which have higher saturation).

---

## Summary of Files Changed

| File | Change |
|---|---|
| `VirtualStagingPage.tsx` | Add `embedded` prop, suppress header when embedded |
| `InteriorDesignAI.tsx` | Add `embedded` prop, suppress header when embedded |
| `PhotoSuite.tsx` | Pass `embedded` to InteriorDesignAI and VirtualStagingPage |
| `BeautyFilters.tsx` | Full rebuild: 14 sliders, 16 presets, whitening button, split view |
| `BackgroundAI.tsx` | Add "Whiten Clothing" action button to the result panel |
