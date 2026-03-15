

# Add Palette Export & Monogram Preview to BrandPaletteHub

## What's Being Built

Two missing features will be added to `BrandPaletteHub.tsx`:

### 1. Export All 5 Colors (JSON + CSS + PNG Swatch)
Add an **Export** dropdown button in the header toolbar (next to Save/Revert) with three options:
- **Export as JSON** — downloads `brand-palette.json` with all 5 color keys
- **Export as CSS** — downloads `brand-palette.css` with CSS custom properties
- **Export as PNG Swatch** — renders the 5 colors as a horizontal swatch strip on a canvas and downloads as `brand-palette-swatch.png`

### 2. Monogram Preview with Current Palette
Add a **Monogram Preview** card in the right sidebar (below the existing Preview card) that renders the `BrandMonogram` component using the current draft palette colors. This shows how the JBJ monogram looks with the active color scheme — no letter editing needed here since that belongs to Stamp Studio.

## Changes

| File | What |
|------|------|
| `src/pages/owner/BrandPaletteHub.tsx` | Add `Download` icon import, export dropdown with 3 formats (JSON/CSS/PNG), and a Monogram Preview card in the sidebar |

### Export Implementation Detail
- **JSON**: `JSON.stringify(draft, null, 2)` → Blob → download
- **CSS**: Template string mapping each key to `--brand-{key}: {hex}` → Blob → download  
- **PNG**: Create offscreen `<canvas>` (500×100), fill 5 equal rectangles with draft colors, label each, `canvas.toBlob()` → download

### Monogram Preview
- Import `BrandMonogram` component
- Render it in a card with the draft palette's primary/secondary colors applied via inline styles
- Shows real-time update as user changes colors

