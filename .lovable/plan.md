

## Plan: Upgrade Photo & Image Suite + Document Designer

This is a substantial upgrade touching two major tools. I'll split it into two parts to keep changes manageable and testable.

---

### Part 1: Photo & Image Suite Expansion

**Current state**: 5 tabs (Background AI, Beauty Filters, Image Resize, Interior Design, Virtual Staging).

**New tabs to add**:
- **Scan & Sign** — reuse existing `ScanSignPage` component
- **Photo → PDF** — reuse existing `PdfFromPhotos` component  
- **Photo Collage** — new tool: upload multiple photos, arrange in grid/frame layouts, merge into single image
- **AI Slideshow** — new tool: select photos (or pull from project gallery), generate animated slideshow/promo video with text overlays and transitions
- **Color Palette** — wire to brand palette: owner sees company palette, regular users see customizable random palette

**File**: `src/pages/toolkit/PhotoSuite.tsx`
- Add 4 new lazy-loaded tab entries
- Create `src/components/toolkit/PhotoCollageBuilder.tsx` — grid layout builder with frame templates (2x2, 3x3, filmstrip, mosaic), drag-to-reorder, merge/export as single image via canvas
- Create `src/components/toolkit/AISlideshowCreator.tsx` — upload photos or search project images, add text/music selection, generate slideshow preview with CSS animations, export as video (or animated frames)
- Wire color palette: owner palette from `brand_palettes` table, user palette with color wheel picker

### Part 2: Document Designer Overhaul

**Current issues identified**:
1. Preview is left-aligned inside a `flex justify-center` container but toolbars span full width creating visual imbalance
2. Stamp button shows error "No stamp found" instead of offering upload/generate options
3. Color controls are basic — only 2 color pickers, no wheel, no gradient direction
4. Formatting buttons are in toolbar rows above, requiring scroll — need to frame around preview
5. Font dropdown only has 8 families — needs expansion
6. Dropdown styling doesn't match premium theme

**Layout restructure** (`src/pages/Documents.tsx`):
- Change to a **3-panel layout**: left sidebar (tools/AI), center (preview document), right sidebar (formatting/properties)
- Formatting buttons (bold, italic, underline, alignment) move to a **floating toolbar** above the centered preview
- AI tools (scan, find/replace, AI edit) move to left sidebar
- Insert tools (stamp, signature, QR, image) move to left sidebar
- Color palette + font controls move to right sidebar
- Preview stays centered and always visible

**Stamp integration**:
- Replace the current "No stamp found" error with a dialog offering: (a) Upload existing stamp image, (b) Upload trade license → AI extracts company info → generates stamp using same logic as Stamp Generator, (c) Use saved stamp from session storage

**Color palette upgrade**:
- Add HSL color wheel component (canvas-based)
- Support 3 or 5 color selection
- Gradient direction: radial, vertical, horizontal, diagonal
- Ombré preview strip

**Font expansion**:
- Add 30+ font families including Google Fonts (Playfair Display, Montserrat, Roboto, Lora, Merriweather, Raleway, etc.)
- Premium dropdown styling with font preview in each option

**More document templates**:
- When user clicks "Offer Letter" → load the offer letter template format into the editor
- Add real estate templates: Tenancy Contract, MOU, NOC Letter, Broker Agreement, Commission Invoice, Property Handover Checklist

### Navigation sync
- Update vertical sidebar and footer labels for the Document Designer page name change

### Files to create/modify

| File | Action |
|---|---|
| `src/pages/toolkit/PhotoSuite.tsx` | Add 4 new tabs (Scan & Sign, Photo→PDF, Collage, Slideshow) |
| `src/components/toolkit/PhotoCollageBuilder.tsx` | **New** — grid/frame photo merger with canvas export |
| `src/components/toolkit/AISlideshowCreator.tsx` | **New** — photo slideshow generator with text overlays |
| `src/pages/Documents.tsx` | Full layout restructure: 3-panel frame layout, floating toolbar, stamp upload/generate dialog, HSL color wheel, expanded fonts, template loader |
| `src/components/Footer.tsx` | Update document page label |
| `src/components/GlobalHeader.tsx` | Update document page label in navigation |

### Technical Details
- Photo Collage uses HTML Canvas to composite images into grid layouts, then `canvas.toBlob()` for export
- Slideshow uses CSS keyframe animations for preview, with option to export frames
- HSL color wheel: canvas-based hue ring + saturation/brightness square, outputs hex values
- Stamp from trade license: sends image to `document-ocr` edge function for text extraction, then generates stamp SVG client-side using same logic as stamp generator
- Font loading: use `@import` from Google Fonts for expanded family list
- Document templates: stored as HTML string constants, inserted into contentEditable on selection

