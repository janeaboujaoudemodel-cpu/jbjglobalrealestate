

# Add Color Harmony Generator to BrandPaletteHub

## What's Being Built

A new **Color Harmony** card in the right sidebar that takes the current `draft.primary` color, computes three classic color harmony schemes (Complementary, Analogous, Triadic), and lets users apply any suggested palette with one click.

## How It Works

**Color math** (all done in-component, no dependencies needed):
- Convert primary hex → HSL
- **Complementary**: hue + 180°, generate secondary/accent from shifted hues
- **Analogous**: hue ± 30°, generate warm related tones
- **Triadic**: hue + 120° and hue + 240°, three evenly spaced colors

Each scheme produces a full 5-color `BrandPalette` (primary stays the same, secondary/accent are computed, background/text use sensible defaults derived from the primary's lightness).

**UI**: A card below the Monogram Preview card with three scheme buttons. Each shows a 5-color swatch strip. Clicking "Apply" sets the draft and triggers live preview.

## Changes

| File | What |
|------|------|
| `src/pages/owner/BrandPaletteHub.tsx` | Add hex↔HSL helpers (reuse `isLightColor` pattern), compute 3 harmony schemes from `draft.primary`, render a new "Color Harmony" card in the right sidebar with scheme swatches and apply buttons. Insert between Monogram Preview and Saved Palettes sections (~line 544). |

### Harmony Generation Logic
```text
hexToHsl(primary) → [H, S, L]

Complementary:  secondary=(H+180), accent=(H+210), bg=light, text=dark
Analogous:      secondary=(H+30),  accent=(H-30),  bg=light, text=dark
Triadic:        secondary=(H+120), accent=(H+240), bg=light, text=dark

All hues mod 360, S/L adjusted for readability
```

### UI Layout
```text
┌─ Color Harmony ──────────────┐
│ Based on: [primary swatch]   │
│                               │
│ ▸ Complementary               │
│   [5 color swatches]  [Apply] │
│ ▸ Analogous                   │
│   [5 color swatches]  [Apply] │
│ ▸ Triadic                     │
│   [5 color swatches]  [Apply] │
└───────────────────────────────┘
```

No new files, no database changes, no new dependencies required.

