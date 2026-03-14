

## Session 7 — Download System / Export Formats / Print-Ready Output

### Current State

The `StampExportPage.tsx` (953 lines) already has a comprehensive export system:

**Already implemented:**
- Formats: SVG, PNG, JPG, WEBP, PDF ✅
- Sizes: 512, 1024, 2048px ✅
- DPI options: 72, 150, 300, 600 ✅
- Transparent background toggle ✅
- Multi-color ZIP pack (up to 5 colors) ✅
- 5 standard export colors with instant download ✅
- Three-color system (primary/secondary/accent) ✅
- Letterhead & business card preview contexts ✅
- Bilingual variant export ✅
- PDF via pdf-lib ✅

**Missing (to implement):**
1. **4096px size option** — not in the size toggles
2. **Custom resolution input** — no free-form px input
3. **Black background preview** and **paper texture preview** — only white/transparent exist
4. **Emboss/rubber stamp export** — no monochrome vector-outline mode
5. **Print-ready with margins** — current PDF is borderless, no bleed/margin
6. **Export preview panel** — no preview of the selected format/resolution/background before download

### Implementation Plan

#### 1. Add missing size options + custom resolution
Add `4096` to the size toggle chips. Add a custom resolution input field below the sizes row that accepts any value 128–8192px.

#### 2. Background mode selector (4 options)
Replace the single transparent checkbox with a radio group:
- **White** — white fill behind stamp
- **Transparent** — alpha channel (PNG/WEBP only)
- **Black** — black fill (for dark-theme previews)
- **Paper** — subtle paper texture overlay (cream/off-white with noise)

The main preview updates to show the selected background. JPG always forces white (noted in UI).

#### 3. Emboss / Rubber Stamp export mode
Add a new section: **"Manufacturer Export"** with two sub-modes:
- **Rubber Stamp** — converts to solid black (#000), removes all color, keeps fills solid. Exports as SVG + high-res PNG.
- **Emboss** — converts to single-color vector outlines only (stroke, no fill). Exports as SVG optimized for CNC/laser.

Implementation: A `convertToEmboss(svg)` function that:
1. Replaces all `fill="..."` with `fill="none"` 
2. Adds/replaces `stroke="#000000"` and preserves stroke-width
3. Removes any gradient/filter elements

A `convertToRubberStamp(svg)` function that:
1. Replaces all colored fills with `#000000`
2. Replaces all strokes with `#000000`
3. Strips filters/gradients

Both produce clean SVG files downloadable individually or included in the bundle ZIP under a `manufacturer/` folder.

#### 4. Print-ready PDF with margins
Enhance `svgToPdf()`:
- Add 12mm margin around the stamp on the PDF page
- Embed a crop-mark guide at corners
- Set PDF metadata (title, author, creation date)
- Label: "Print-Ready PDF (300 DPI, margins included)"

#### 5. Export preview panel
Add a preview card above the download buttons that shows:
- The stamp rendered at the **first selected size** with the **selected background mode**
- Labels showing: format list, resolution, background, color
- Updates live as options change

This replaces the current static "Live Preview" with a context-aware export preview.

#### 6. Bundle ZIP enhancements
When emboss/rubber modes are enabled, include `manufacturer/emboss/` and `manufacturer/rubber_stamp/` folders in the ZIP with SVG + PNG files.

### Files to Modify

| File | Action |
|------|--------|
| `src/components/stamp-generator/StampExportPage.tsx` | Add 4096px, custom resolution, background modes, emboss/rubber export, print-ready PDF margins, export preview panel |

No new files needed — all changes are within the existing export page. No database or edge function changes required.

