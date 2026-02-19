
# Stamp Generator — Comprehensive Upgrade Plan

## Summary of Issues to Fix

1. **Color System** — Restore the preset shortcut colors (Gold, Navy, etc.) alongside the new color wheel. Add a tri-color gradient mode (from/mid/to positions on a slider track).
2. **Design Bugs** — Modern Minimal text overflows circle; Square Premium text clips the border; Geometric Modern ring text is unreadable.
3. **Trade License Upload + AI Extraction** — Upload a trade license or document → AI extracts company name in English + Arabic → pre-fills wizard and auto-generates bilingual stamps.
4. **Design Preview Screen** — Clicking "Select This Design" opens a full-screen mockup showing the stamp on business card, letterhead, and envelope before exporting.
5. **Export Fix** — PNG export fails (console shows "Image load failed") because SVG Blob URLs are blocked by the canvas `crossOrigin` policy. Fix the `svgToPng` helper using inline data URLs instead of Blob URLs. Add PDF, JPG (transparent + solid), and WEBP formats.
6. **Business Card Preview** — Currently renders the stamp without visible content context; redesign with proper card layout and mock company info.
7. **Three-Color System** — Add a tri-color picker with three stops — Primary (outer band), Secondary (inner ring / accents), and Accent (monogram/center). Each stop has its own color wheel.

---

## Technical Changes

### 1. Fix SVG → PNG Rasterization (Critical Bug)

**Problem:** `svgToPng` creates a Blob URL and loads it into an `Image` with `crossOrigin = 'anonymous'`. SVG Blob URLs containing inline elements do not need CORS, but the canvas taints on some browsers when the SVG references computed/external paths.

**Fix in `StampExportPage.tsx`:** Switch from Blob URL to a `data:image/svg+xml;base64,...` URL. This always works without CORS taint:

```typescript
async function svgToPng(svgString: string, size: number, transparent: boolean): Promise<Blob> {
  let svg = svgString;
  if (!svg.includes('xmlns=')) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  // Use base64 data URL instead of Blob URL — avoids canvas CORS taint
  const b64 = btoa(unescape(encodeURIComponent(svg)));
  const dataUrl = `data:image/svg+xml;base64,${b64}`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { /* canvas draw ... */ };
    img.onerror = reject;
    img.src = dataUrl;  // no crossOrigin needed
  });
}
```

### 2. Add PDF Export

Use the existing `pdf-lib` dependency (already installed) to embed the PNG into a PDF page at 300 DPI.

```typescript
async function svgToPdf(svgString: string, transparent: boolean): Promise<Blob> {
  const { PDFDocument, rgb } = await import('pdf-lib');
  const pngBlob = await svgToPng(svgString, 1200, transparent); // 4-inch at 300dpi
  const pngBytes = await pngBlob.arrayBuffer();
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([300, 300]); // points = 300dpi target
  const pngImage = await pdfDoc.embedPng(new Uint8Array(pngBytes));
  page.drawImage(pngImage, { x: 0, y: 0, width: 300, height: 300 });
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}
```

**New format chips in export:** SVG · PNG · JPG · PDF · WEBP

**Transparent option** applies to PNG and WEBP. JPG always gets white background. PDF always has white background.

### 3. Three-Color System

**In `StampGeneratorPage.tsx` (left panel):**

Replace the current single-wheel + dual-color toggle with a three-stop color system:

- **Stop 1 — Primary** (outer band / main ink): color wheel
- **Stop 2 — Secondary** (inner ring, accent lines): color wheel  
- **Stop 3 — Accent** (monogram, center fill, star ornaments): color wheel

Each stop has its own color wheel tab. A row of three colored circles acts as the stop selector.

Also restore the **preset shortcut palette**: Gold (`#B8860B`), Navy (`#1a2744`), Black (`#0d0d0d`), Dark Red (`#8B0000`), Royal Purple (`#4B0082`), Forest Green (`#1B4332`). Clicking a preset fills the currently active stop.

**In `StampSVGRenderer.tsx`:**

Extend tinting to support a third color — add `accentColor` prop. The renderer replaces:
- `#1a2744` → `primaryColor`
- `#2a3a5c` → `secondaryColor`  
- `#ffffff` (inner background circle/fill) is left alone
- Monogram `fill` in center circle → `accentColor`

**In `StampExportPage.tsx`:**

The export color section becomes a three-stop picker matching the generate page.

### 4. Fix Template SVG Clipping Bugs

**Modern Minimal (T2):** The text elements use fixed Y coordinates that can exceed the circle radius when company name is long. Fix by tightening the layout — reduce the top monogram position and shrink the inner safe zone padding.

**Square Premium (T8):** The company name + city text can overflow below the filled footer band. Fix by clamping the wrapping Y position so all text fits within `y1 + hdrH + 8` to `y1 + s*2 - ftrH - 14`.

**Geometric Modern (T7):** The `ringText` on the inner circle overlaps the company name text in the center rectangle. Fix by moving the ring text to a slightly larger radius and reducing its font size so it sits inside the stroke ring, not on top of the name.

Changes in `src/lib/stampTemplates.ts`.

### 5. Trade License Upload + AI Extraction

**New component: `StampLicenseUploader.tsx`**

A dropzone panel added to Step 0 of `StampProjectWizard.tsx` with:
- Upload button supporting image (JPG/PNG) and PDF files
- When a file is selected, calls a new edge function `ai-stamp-extract/index.ts`
- Shows a loading spinner: "Extracting company details…"
- On success, auto-fills `company_name`, `arabic_company_name`, `registration_number_optional`, `city_optional`, and sets `language_mode` to `BILINGUAL` if Arabic is found

**New Edge Function: `supabase/functions/ai-stamp-extract/index.ts`**

Uses Gemini multimodal (free — no extra cost) to extract text from an uploaded image/PDF:

```typescript
// Prompt:
"Extract from this trade license or business document:
1. Company name in English (exact as printed)
2. Company name in Arabic (exact as printed, if present)
3. Registration/license number
4. City
5. Country

Return as JSON: { company_name, arabic_company_name, registration_number, city, country }"
```

The image is passed as base64 to Gemini's vision input. Returns structured JSON.

**Language mode auto-detection:** If `arabic_company_name` is found in the response, wizard auto-selects `BILINGUAL`. Otherwise stays `EN`.

After extraction, a confirmation card shows what was found with "Use These Details" and "Edit Manually" options.

### 6. Full-Screen Design Preview Modal

**When user clicks "Select This Design"** on a concept card, instead of immediately saving and jumping to export, a full-screen modal opens showing:

- Large stamp preview (300px) centered
- Three mockup panels:
  - **Business Card**: Dark premium card with stamp + mock company info lines (white text)
  - **Letterhead Document**: White A4 page with stamp in top-right corner + mock content lines
  - **Envelope**: Kraft-brown envelope mockup with stamp in the wax-seal position (bottom-center)
- Two buttons at bottom: **"Back to Designs"** and **"Select & Export →"** (this is the action that actually saves and navigates to export)

This is a new component: `StampPreviewModal.tsx`.

### 7. Improved Business Card Preview (Export Page)

The current business card preview has the stamp plus placeholder grey lines but no readable context. Upgrade to show:
- Company name text (from `project.company_name`)
- A role title placeholder
- Phone/email placeholders matching the project's data
- Stamp at bottom-right instead of center-left

---

## Files to Create / Edit

| File | Change |
|------|--------|
| `src/lib/stampTemplates.ts` | Fix T2 (Modern Minimal), T7 (Geometric Modern), T8 (Square Premium) layout overflow bugs |
| `src/components/stamp-generator/StampSVGRenderer.tsx` | Add `accentColor` third color stop |
| `src/components/stamp-generator/StampColorWheel.tsx` | Minor: add `onCommit` callback for preset click |
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Three-color stop UI, preset palette shortcuts, improved mobile layout |
| `src/components/stamp-generator/StampExportPage.tsx` | Fix `svgToPng` (base64 data URL), add PDF/JPG/WEBP formats, transparent toggle per format, three-color export, improved business card preview |
| `src/components/stamp-generator/StampProjectWizard.tsx` | Add trade license upload section in Step 0 |
| `src/components/stamp-generator/StampLicenseUploader.tsx` | **New** — dropzone + AI extraction UI |
| `src/components/stamp-generator/StampPreviewModal.tsx` | **New** — full-screen design preview with business card / letterhead / envelope mockups |
| `supabase/functions/ai-stamp-extract/index.ts` | **New** — Gemini multimodal extraction edge function |

---

## Implementation Order

1. Fix the export PNG bug first (critical — export is broken)
2. Fix the three SVG template layout bugs
3. Add third color stop + preset palette
4. Add PDF/JPG/WEBP export formats + transparent/opaque toggle
5. Build the full-screen design preview modal
6. Improve business card preview on export page
7. Build the trade license uploader + AI extraction edge function
8. Wire extraction into the wizard
