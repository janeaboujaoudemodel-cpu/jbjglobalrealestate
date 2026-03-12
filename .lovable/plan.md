

## Plan: Premium Image Resizer Overhaul

### Current State
The Image Resizer is a basic dark-themed tool with:
- Simple upload area, small thumbnail grid, basic preset checkboxes
- No live preview of resize results — user must click "Resize & Export" to see anything
- No editing tools (text, stamps, merge, overlay, borders, padding between images)
- Dark `#0C0E14` background inconsistent with the champagne-gold theme used across the platform

### Changes

**1. Theme Overhaul — Champagne-Gold Premium Design**
- Replace dark `#0C0E14` background with champagne gradient (`#FDFBF7` → `#EDE4D3`)
- Remove all gold-bordered dark cards; use clean white/cream cards with subtle shadows (Zillow-style)
- Typography: dark text on light backgrounds, gold accents for active states only
- Cards: `bg-white`, `shadow-sm`, `border border-stone-200` — no yellow/gold borders

**2. Large Center Preview with Live Resize**
- Replace the small thumbnail grid with a large center preview area (60%+ of viewport)
- When user uploads an image, it displays large in the center immediately
- When user selects a preset or changes fit mode, the preview updates **instantly** (no button click needed) using a live canvas render
- Show the active preset dimensions overlaid on the preview
- Side-by-side before/after or overlay comparison

**3. Multi-Image Thumbnail Strip**
- Below or beside the main preview: horizontal scrollable strip of uploaded image thumbnails
- Click any thumbnail to make it the active preview image
- Small "+" button to upload more photos
- Drag-to-reorder support

**4. Batch Select All Presets**
- "Select All" / "Deselect All" button for presets
- When multiple presets selected, download generates all sizes in a ZIP
- Preview cycles through selected presets or shows a grid of all sizes

**5. Editing Toolbar (Canvas-Based)**
Add a floating toolbar above the preview with:
- **Text**: Add text overlay with font, size, color controls
- **Signature/Stamp**: Import from the existing Scan & Sign module (session storage integration)
- **Date stamp**: Auto-insert current date
- **Borders**: Border width, style (solid/dashed/double), color picker
- **Padding**: Adjustable padding between merged images
- **Merge/Collage**: Place front + back side-by-side with configurable gap
- **Background color**: Color picker for padding/background fill
- **Crop region**: Visual drag-crop on the preview canvas
- **Remove background**: Quick link to the Background AI tool

**6. Merge & Collage Mode**
- Toggle to "Collage" mode: arrange multiple uploaded images in a grid
- Configurable padding/gap between images
- Layout options: 2-up horizontal, 2-up vertical, grid (2×2, 3×3)
- Perfect for business card front+back with adjustable padding

**7. Live Preview Engine**
- Use a hidden `<canvas>` that re-renders on every settings change (debounced 150ms)
- Display the canvas output as the main preview image
- Fit mode, crop position, padding background, borders — all reflected live
- No need to click "Resize & Export" just to see results

**8. Responsive & Device Compatible**
- Mobile: stacked layout with preview on top, controls below
- Touch-friendly sliders and drag interactions
- All canvas operations use `OffscreenCanvas` where supported for performance

### Technical Approach
- Single file rewrite of `src/pages/toolkit/ImageResize.tsx` (~800-900 lines)
- All processing remains client-side (canvas API)
- No new dependencies needed — uses existing canvas, JSZip, and UI components
- Editing state managed via React state (text overlays, borders, stamps stored as overlay objects rendered onto canvas at export time)
- Live preview via `useEffect` watching all settings + selected image, rendering to a preview canvas

### File Changes
| File | Action |
|------|--------|
| `src/pages/toolkit/ImageResize.tsx` | Full rewrite — new premium UI, live preview, editing toolbar, merge mode |

