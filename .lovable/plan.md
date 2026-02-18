
## Photo → PDF Generator: Full Overhaul

### Problems to Fix

1. **No PDF upload support** - The `accept` attribute on the file input only allows images. PDFs are not accepted or processed.
2. **No PDF page management** - When a PDF is uploaded, its pages cannot be viewed, rearranged, added to, merged, or individually deleted.
3. **"Fit to Image" leaves white borders** - When `pageSize === "fit"`, the code sets the page dimensions as `embeddedImage.width + (margin * 2)` but then centers the image with centering math, leaving gaps. The fix: when margins = "none" and pageSize = "fit", the image must fill the page 100% with x=0, y=0, width=pageWidth, height=pageHeight.
4. **A4 leaves white borders** - Same root cause: the centering formula creates blank space around images. When margins = "none", the image should be scaled to fill the page with no padding.
5. **Outdated UI** - Needs a full premium dark-gold redesign with high readability.

---

### Technical Architecture

The tool will be renamed conceptually from "Photo → PDF" to a **Media → PDF Merger** tool that accepts both images and PDFs.

#### New Data Model

```typescript
// Unified page item (from image OR from an extracted PDF page)
interface PageItem {
  id: string;
  type: "image" | "pdf-page";
  name: string;         // display name
  sourceFile: string;  // original filename
  url: string;         // object URL for preview (canvas render for PDF pages)
  // For images:
  file?: File;
  width?: number;
  height?: number;
  // For PDF pages:
  pdfBytes?: ArrayBuffer;   // the original PDF bytes for re-embedding
  pageIndex?: number;       // which page from the source PDF
}
```

#### PDF Ingestion with pdf-lib

When a PDF is uploaded, we use `pdf-lib`'s `PDFDocument.load()` to open it, then for each page:
1. Create a new single-page `PDFDocument`, copy that page into it, save to bytes.
2. Generate a canvas thumbnail using a manual render approach (draw page to an offscreen canvas via a `<canvas>` element approach) — or simply use the page's `cropBox` dimensions to show a generic placeholder with the page number, since `pdf-lib` is not a renderer.
3. Store each page as a `PageItem` with `type: "pdf-page"`.

For the final PDF generation, PDF pages are re-embedded using `pdfDoc.copyPages()` from the saved single-page documents.

#### "Fit to Image" / "A4" White Border Fix

The fix for both page size modes when `margins = "none"`:
- **Fit to Image**: Page dimensions = exact image pixel dimensions. Image is drawn at `x=0, y=0` filling 100% with no scaling gap.
- **A4 / Letter with margins=none**: Image is scaled with `Math.min(pageW/imgW, pageH/imgH)` to fill the page, then centered. But with `margins=none` the `available` area equals the full page, so `x` and `y` will be 0 if the aspect ratios match. The real fix is: make the default margin selection **"None"** when the user picks "Fit to Image", and properly document that "A4 + None margin + auto orientation" means the image fills the page fully.

More precisely, the bug is that when `pageSize = "fit"`:
- Current: `pageWidth = embeddedImage.width + (margin * 2)` then `x = margin + (available - scaled) / 2`
- This creates white space equal to `margin` on all sides.
- Fix: When `pageSize = "fit"`, force `margin = 0` regardless of the margin setting.

---

### Files to Change

**`src/pages/toolkit/PdfFromPhotos.tsx`** — Complete rewrite with:

#### 1. Dual Upload Support
- `accept="image/jpeg,image/png,image/heic,image/webp,.jpg,.jpeg,.png,.heic,.webp,.pdf"` on the `<input>`
- `handleDrop` updated to route `.pdf` files to `processPdfFile()` and images to `processImageFiles()`

#### 2. PDF Processing Function (`processPdfFile`)
```typescript
const processPdfFile = async (file: File) => {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes);
  const pageCount = pdfDoc.getPageCount();
  
  const newPages: PageItem[] = [];
  for (let i = 0; i < pageCount; i++) {
    // Copy page to standalone single-page doc for re-embedding later
    const singleDoc = await PDFDocument.create();
    const [copiedPage] = await singleDoc.copyPages(pdfDoc, [i]);
    singleDoc.addPage(copiedPage);
    const singleBytes = await singleDoc.save();
    
    // Get page dims for display
    const { width, height } = copiedPage.getSize();
    
    newPages.push({
      id: crypto.randomUUID(),
      type: "pdf-page",
      name: `${file.name} — Page ${i + 1}`,
      sourceFile: file.name,
      url: "", // placeholder, show a PDF page icon thumbnail
      pdfBytes: singleBytes.buffer,
      pageIndex: i,
      width,
      height,
    });
  }
  setPages(prev => [...prev, ...newPages]);
};
```

#### 3. PDF Generation (handles both types)
```typescript
for (const page of pages) {
  if (page.type === "image") {
    // existing image embed logic with margin fix
  } else if (page.type === "pdf-page" && page.pdfBytes) {
    // Load single-page PDF and copy its page
    const srcDoc = await PDFDocument.load(page.pdfBytes);
    const [copiedPage] = await outputDoc.copyPages(srcDoc, [0]);
    outputDoc.addPage(copiedPage);
  }
}
```

#### 4. Margin Fix (the white border bug)
```typescript
// When "Fit to Image", force margin to 0
const effectiveMargin = pageSize === "fit" ? 0 : MARGIN_VALUES[margins];

// Then place image:
const x = effectiveMargin + (availableWidth - scaledWidth) / 2;
const y = effectiveMargin + (availableHeight - scaledHeight) / 2;
// Since margin=0 and image fills exactly, x and y will be 0
```

#### 5. Bulk Selection & Actions
- Checkbox on each page item in the list
- "Select All" / "Deselect All" buttons
- Bulk delete button when items are selected

#### 6. Premium UI Redesign
The UI will use a **deep charcoal + champagne gold** premium palette:

- **Background**: `bg-[#0A0A0B]` (near-black)
- **Cards**: `bg-gradient-to-br from-[#111113] to-[#16161A]` with `border border-[#C9A84C]/25`
- **Gold accent**: `#C9A84C` (warm champagne gold)
- **Step numbers**: Glowing gold circles with `shadow-[0_0_20px_rgba(201,168,76,0.4)]`
- **Upload zone**: Dark background with animated gold dashed border, subtle inner glow on hover
- **Page cards**: Thumbnail with type badge (IMAGE / PDF), drag handle, checkbox for bulk ops, delete icon
- **Buttons**: Primary = solid gold with black text; Secondary = outlined gold; Danger = deep red outline
- **Typography**: White for headings, `text-white/75` for body, `text-[#C9A84C]` for accents
- **Progress bar**: Gold fill on dark track
- **Badges**: `IMAGE` badge in blue/indigo, `PDF` badge in amber/gold

#### 7. Page Thumbnail Display
- For images: show actual `<img>` preview
- For PDF pages: show a styled "document page" icon with the page number and source filename (since pdf-lib cannot render)

---

### Summary of Changes

| Issue | Fix |
|---|---|
| Cannot upload PDF | Add `.pdf` to `accept`, route to `processPdfFile()` |
| No page management for PDFs | Extract each PDF page as a draggable `PageItem`, re-merge on export |
| White borders on "Fit to Image" | Force `effectiveMargin = 0` when `pageSize === "fit"` |
| White borders on A4 | Ensure image scaling fills available space correctly; no centering gap when margin=none |
| No bulk operations | Add checkbox selection, Select All, bulk delete |
| Outdated UI | Full premium dark-gold redesign |
