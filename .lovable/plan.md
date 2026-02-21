

# Stamp Generator - Comprehensive Fix Plan

## Issues Identified and Solutions

### 1. Multi-Color Pack Missing White + Engraved 3D Styles

**Problem:** The `PACK_COLORS` array in `StampExportPage.tsx` (line 189-196) has only 6 colors: Navy, Black, Dark Red, Forest Green, Royal Purple, Gold. No White or Engraved/3D styles.

**Fix:**
- Add White (`#ffffff`) to `PACK_COLORS`
- Add Engraved/3D style variants (Silver Embossed `#C0C0C0`, Bronze `#8B4513`)
- Add a color wheel (`StampColorWheel`) inside the Multi-Color Pack section so users can pick custom colors for the pack
- Also add White to the `PRESET_COLORS` array (line 198-205) which is used for the export page quick presets

### 2. Secondary and Accent Colors Not Affecting SVG

**Problem:** The `tintSvgFull` function in `StampExportPage.tsx` (line 157-162) only replaces `#1a2744` (primary) and `#2a3a5c` (secondary), but does NOT replace the accent token `#8b6914`. The accent replacement only targets `dominant-baseline="central"` fill patterns which may not match many SVG elements.

**Fix:** Update `tintSvgFull` to also replace `#8b6914` with the accent color, matching the logic in `StampSVGRenderer.tsx`:
```
function tintSvgFull(svgString, primary, secondary, accent) {
  let s = svgString.replace(/#1a2744/gi, primary);
  if (secondary) s = s.replace(/#2a3a5c/gi, secondary);
  if (accent) {
    s = s.replace(/#8b6914/gi, accent);
    s = s.replace(/(dominant-baseline="central"[^>]*fill=")[^"]+(")/g, `$1${accent}$2`);
  }
  return s;
}
```

### 3. Export Downloads as ZIP/Chrome Links Instead of Direct Files

**Problem:** The `generateBundle` function (line 358-408) downloads each file individually using `triggerDownload` with `URL.createObjectURL`. Some browsers may intercept multiple rapid downloads. The 200ms delays between downloads may not be sufficient.

**Fix:**
- Bundle all selected files into a single ZIP (using JSZip which is already imported) instead of triggering individual file downloads
- This prevents browsers from blocking multiple rapid downloads
- Add a "Download All as ZIP" option alongside individual file downloads

### 4. Monogram Tab Missing from Left Panel Tab Switcher

**Problem:** The left panel has 4 tabs: Colors, Fonts, Text, Art. The user wants a dedicated "Monogram" tab visible alongside them (not hidden inside Art). The Center Art tab already handles monogram but the user wants it more prominent and clickable.

**Fix:**
- Add a 5th tab "Logo" (or "Mono") to the left panel tab switcher in `StampGeneratorPage.tsx`
- This tab will show the monogram upload/editing controls currently in the "centerart" tab but with a clearer UX
- Make the monogram/logo clickable in the preview to remove it

### 5. Preview Zoom Only Affects Preview, Not Scrolling to Document Mockups

**Problem:** In `StampPreviewModal.tsx`, clicking the stamp zooms it via `logoScale` state but doesn't scroll down to show the document mockups (business card, letterhead, etc.).

**Fix:** When zoom changes, if the stamp is already at max zoom (1.5), auto-scroll to the mockup area instead of cycling back to 1.0.

### 6. Preview Card Touching Header + Gray Gap at Bottom

**Problem:** In `StampPreviewModal.tsx`, the stamp preview card in the left sidebar has insufficient top padding (line 129: `pt-8`), and the bottom of the mockup area shows a gray background gap.

**Fix:**
- Increase top padding on the left sidebar from `pt-8` to `pt-10`
- Extend the mockup area background to fill the full height by adding `min-h-full` and ensuring the footer area has consistent white/pearl background

### 7. Bilingual Stamp Layout (English Top Arc, Arabic Bottom Arc)

**Problem:** T12 template already implements this correctly (English curved over top, Arabic curved under bottom). The user wants this to be the standard for ALL bilingual stamps, and wants two versions generated: one with license number and one without.

**Fix:**
- For every bilingual stamp, generate TWO variants: one with REG number and one without
- Ensure T6 (Bilingual Official) uses arc text layout like T12 instead of flat horizontal text
- Apply the same English-top-arc / Arabic-bottom-arc pattern to T9 (Arabic Calligraphy)

### 8. Delete + Undo + Save Two Versions

**Problem:** User wants the ability to delete elements, save, then undo and save again to create two versions (with and without license number).

**Fix:**
- Add an undo history stack to `StampTextEditor` or the generator page
- Track SVG mutations with a history array
- Add Undo/Redo buttons
- Add a "Save as Version" button that saves the current state as a separate design variant

---

## Technical Implementation Details

### Files to Modify

1. **`src/components/stamp-generator/StampExportPage.tsx`**
   - Fix `tintSvgFull` function to replace `#8b6914` accent token
   - Add White + Engraved colors to `PACK_COLORS` and `PRESET_COLORS`
   - Add color wheel to Multi-Color Pack section
   - Change `generateBundle` to use ZIP download instead of multiple individual files
   - Add White to export preset colors

2. **`src/components/stamp-generator/StampGeneratorPage.tsx`**
   - Add 5th "Logo" tab to left panel tab switcher
   - Add undo/redo state management for SVG edits
   - Add "Save as Version" functionality

3. **`src/components/stamp-generator/StampPreviewModal.tsx`**
   - Increase top padding on left sidebar
   - Fix bottom gray gap by extending background
   - Improve zoom behavior to scroll to document mockups

4. **`src/lib/stampTemplates.ts`**
   - Update T6 (Bilingual Official) to use arc text instead of flat text
   - Update T9 (Arabic Calligraphy) similarly
   - Generate two variants per bilingual stamp (with/without license number)

5. **`src/components/stamp-generator/StampTextEditor.tsx`**
   - Add undo/redo history stack
   - Add clickable delete on individual elements

