
# AI Company Stamp Generator — Full Premium Rebuild

## Problems Identified

From reading the full codebase:

1. **Export fails silently** — `generateBundle()` in `StampExportPage.tsx` calls `downloadPNG()` which uses `canvas.toBlob()`, an async callback — but the SVG-to-canvas conversion often fails because SVG content with `<textPath>` and external fonts can't cross-origin render in a `<canvas>`. The catch block just logs to console but shows `toast.error('Export failed')` without telling the user what failed or offering recovery.

2. **No live stamp preview on the export page** — The export page shows the stamp on a plain white card and on a mock document, but there's NO color preview. The `StampExportPage` uses hardcoded `tintColor="#1a2744"` — the color choices made in the generator page are not carried to export.

3. **No way to edit text on the stamp** — "Official Stamp", "Since 2010", registration number, city text etc. are hardcoded in every template. There's no UI to remove or change these text elements on a generated concept before exporting.

4. **Color picker is basic** — The current color panel shows preset dot swatches + a hex input field. There is no color wheel / HSB picker with live preview as you move the mouse. The user explicitly asked for "the circle where I see all the colors, so I move the mouse, it sees the color changing on the live preview."

5. **Multi-color export** — No way to download the stamp in multiple colors in one batch. The user wants to load it in multiple colors.

6. **SVG templates are not premium enough** — The current templates use very basic stroke-only geometry. Premium stamps from BrandCrowd/LogoMaker level would have filled sections, radial gradients, shadow-like effects, decorative ornaments at multiple points, and more complex paths.

---

## What Gets Built

### Part 1 — HSB Color Wheel Picker (new component)

**New file:** `src/components/stamp-generator/StampColorWheel.tsx`

A real color wheel using pure CSS + canvas:
- An `<canvas>` element draws the HSB color wheel (hue around the ring, saturation from center, brightness adjustable via a separate vertical slider)
- Mouse move over the canvas updates the color in real-time with a draggable circle cursor
- Below it: a small brightness slider (dark → bright)
- Hex input that syncs both ways
- A "Recently used" row showing the last 5 colors picked
- Live preview: the `StampSVGRenderer` re-renders with every mouse move while hovering the wheel (debounced to 16ms = 60fps)

The wheel is drawn using `ctx.createConicGradient` (or polyfill with arc segments) for hue × `ctx.createRadialGradient` for white-to-transparent saturation overlay × a semi-transparent black overlay for the brightness layer.

**How it integrates:** Replaces the current collapsed "Preview Colors" section in `StampGeneratorPage.tsx` with an always-visible side panel (on desktop) or bottom drawer (on mobile) that shows the color wheel.

---

### Part 2 — Stamp Text Editor (inline SVG text editing)

**New file:** `src/components/stamp-generator/StampTextEditor.tsx`

A panel that appears below/beside the selected stamp card. It parses the selected stamp's SVG and extracts all `<text>` elements along with their content. The user sees a list like:

```
[✏] "OFFICIAL STAMP"    [🗑 Delete]
[✏] "Dubai, UAE"        [✏ Edit]
[✏] "REG: 12345"        [🗑 Delete]
[✏] "SINCE 2020"        [✏ Edit]
```

When the user clicks Edit, the text input appears inline. When the user deletes, the SVG is mutated to remove that `<text>` element. When the user edits, the content of that `<text>` element is replaced.

**Implementation:** Uses `DOMParser` to parse the SVG string, find all `<text>` nodes, serialize back with `XMLSerializer`. This is 100% client-side and instant — no edge function calls.

The text editor appears in the right panel when a stamp concept is selected (selected concepts get a detail panel that didn't exist before).

---

### Part 3 — Multi-Color Export Pack

**In:** `StampExportPage.tsx`

A new "Multi-Color Pack" section below the existing single-color export. The user can:

1. Pick up to 5 colors for export (using mini color swatches + the color wheel)
2. Click "Download Color Pack (ZIP)" → client-side creates a ZIP using `jszip` (already in dependencies!) containing one folder per color: `navy/`, `burgundy/`, `gold/` etc., each with SVG + PNG files.

The ZIP assembly happens entirely client-side:
- `JSZip` creates the archive in memory
- Each color variant: SVG blob (simple string replace of `#1a2744`) + PNG via canvas
- `zip.generateAsync({ type: 'blob' })` → `URL.createObjectURL` → auto-download

**Why this fixes the export failure:** The current export failure comes from using a complex SVG-to-canvas path. The new approach:
- SVG download: always works (direct string blob)
- PNG download: add `encodeURIComponent` to the SVG before creating the object URL and set the `<img>` `crossOrigin = "anonymous"` properly, plus add `xmlns` attribute enforcement to the SVG string before rasterizing
- PDF: use `pdf-lib` (already installed) to embed the SVG as an image in a PDF — this is more reliable than the current approach

---

### Part 4 — Premium Stamp Templates (upgraded SVG quality)

The existing 9 templates will be upgraded in `src/lib/stampTemplates.ts` and `supabase/functions/ai-stamp-generator/index.ts`:

**Specific upgrades:**
- **Classic Double Ring** → Add a filled dark navy outer ring band (like a real rubber stamp seal), decorative star dividers at 12/3/6/9 o'clock positions, inner filled monogram circle with white letter
- **Luxury Triple Ring** → Add concentric gradient fills (using `<linearGradient>` or `<radialGradient>` defs), ornate fleur-de-lis style dividers at the top and bottom points
- **Bold Rectangle** → Add corner ornament diamonds, filled header band, more sophisticated border with inset lines
- **Vintage Seal** → More authentic vintage texture simulation using many small dots in a ring (SVG `<circle>` array at radius intervals), authentic rope-style border approximation using zigzag path
- **New T10: Embossed Medallion** — A premium circular stamp with a filled dark outer ring, a thin gold inner ring (second color), an 8-pointed star/sunburst in the center, company name curved, very high-end look like a wax seal imprint
- **New T11: Art Deco Square** — Rectangle stamp with Art Deco ornamental corners (SVG paths), double border, and geometric interior lines matching the style of luxury brand stamps

These are implemented in `stampTemplates.ts` (client-side fallback) and mirrored in the edge function `buildSVG()`.

---

### Part 5 — Export Page Full Rebuild

`StampExportPage.tsx` gets a 2-column layout upgrade:

**Left column (Preview panel):**
- Large stamp preview (size 280, not 220) with the currently-selected export color applied — tracks live as user picks colors
- "Preview on document" mock — a nicer letter/contract mockup with a proper paper texture gradient, typed lines, signature line, and the stamp rendered at 90px in the bottom-right corner
- **NEW: Preview on business card** — small business card mock showing the stamp in the top-left corner

**Right column (Controls):**
- Format + size + DPI selectors (same as before)
- **Color section at top:** mini color wheel (compact version) or color swatches — the export page gets a proper color selector so the user can pick the export color (separate from the preview color in the gallery)
- **Multi-Color Pack section:** toggle "Export in multiple colors" → shows a color multi-select (up to 5 colors). "Download ZIP with all colors" button
- **Text overrides section:** shows a summary of key text elements (like "OFFICIAL STAMP" text) with a quick toggle to include/exclude it from export
- Fixed export error: SVG inline in the page is grabbed directly from the rendered `<div>` via `innerHTML`, not via canvas re-rasterization

---

## Files to Create / Edit

| File | Action | Description |
|------|--------|-------------|
| `src/components/stamp-generator/StampColorWheel.tsx` | **CREATE** | Full HSB color wheel canvas component with live preview |
| `src/components/stamp-generator/StampTextEditor.tsx` | **CREATE** | SVG text element extractor + inline editor/deleter |
| `src/components/stamp-generator/StampGeneratorPage.tsx` | **EDIT** | Replace color panel with color wheel; add text editor when design selected; upgrade layout |
| `src/components/stamp-generator/StampExportPage.tsx` | **EDIT** | Fix export failure; add multi-color ZIP export; add proper live color preview; add document/business card mockups |
| `src/lib/stampTemplates.ts` | **EDIT** | Upgrade all 9 templates to premium quality; add 2 new premium templates |
| `supabase/functions/ai-stamp-generator/index.ts` | **EDIT** | Sync upgraded `buildSVG()` templates to match client-side; add new template keys |

---

## Technical Details

### Color Wheel Canvas Drawing Algorithm

```typescript
function drawColorWheel(canvas: HTMLCanvasElement, brightness: number) {
  const ctx = canvas.getContext('2d')!;
  const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 2;
  
  // Draw hue wheel using arc segments
  for (let angle = 0; angle < 360; angle++) {
    const start = (angle - 1) * Math.PI / 180;
    const end = (angle + 1) * Math.PI / 180;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, `hsla(${angle}, 0%, ${brightness}%, 1)`);     // white center
    gradient.addColorStop(1, `hsla(${angle}, 100%, ${brightness/2}%, 1)`); // pure hue edge
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

function colorAtPosition(canvas, x, y, brightness): string {
  // Convert x,y to polar → derive hue + saturation → apply brightness → return hex
}
```

### SVG Text Parsing

```typescript
function extractTextElements(svgString: string): TextElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const texts = Array.from(doc.querySelectorAll('text'));
  return texts.map((el, i) => ({
    index: i,
    content: el.textContent || '',
    x: el.getAttribute('x') || '',
    y: el.getAttribute('y') || '',
  }));
}

function mutateTextElement(svgString: string, index: number, newContent: string | null): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const texts = Array.from(doc.querySelectorAll('text'));
  if (newContent === null) {
    texts[index]?.remove(); // delete
  } else {
    if (texts[index]) texts[index].textContent = newContent; // edit
  }
  return new XMLSerializer().serializeToString(doc);
}
```

### Multi-Color ZIP with JSZip

```typescript
import JSZip from 'jszip';

async function downloadColorPack(svgSource: string, colors: ColorEntry[], companyName: string) {
  const zip = new JSZip();
  
  for (const { label, hex } of colors) {
    const folder = zip.folder(label.toLowerCase().replace(/\s+/g, '_'))!;
    
    // SVG variant — simple color replace
    const coloredSvg = svgSource.replace(/#1a2744/gi, hex);
    folder.file('stamp.svg', coloredSvg);
    
    // PNG variants
    for (const size of [512, 1024]) {
      const pngBlob = await svgToPng(coloredSvg, size);
      folder.file(`stamp_${size}px.png`, pngBlob);
    }
  }
  
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${companyName}_stamp_pack.zip`;
  a.click();
}
```

### SVG to PNG Fix

The current export failure is because the SVG string doesn't have proper namespace declarations when injected into `<img>`. Fix:

```typescript
async function svgToPng(svgString: string, size: number): Promise<Blob> {
  // Ensure xmlns is present
  let svg = svgString;
  if (!svg.includes('xmlns=')) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => b ? resolve(b) : reject('Canvas toBlob failed'), 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject('Image load failed'); };
    img.src = url;
  });
}
```

---

## UI Flow Summary

### On the Generator Page (after stamps are generated):

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: [← Projects]  JBJ Global  [AI Designer] [Regenerate] [Export] │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐ │
│  │   COLOR WHEEL       │    │  STAMP GRID (4 cols)             │ │
│  │   [color canvas]    │    │  ┌──┐ ┌──┐ ┌──┐ ┌──┐            │ │
│  │   Brightness slider │    │  │▣▣│ │▣▣│ │▣▣│ │▣▣│            │ │
│  │   Hex: #1a2744      │    │  └──┘ └──┘ └──┘ └──┘            │ │
│  │   ─────────────     │    │  ┌──┐ ┌──┐ ┌──┐ ┌──┐            │ │
│  │   Dual Color        │    │  │▣▣│ │▣▣│ │▣▣│ │▣▣│            │ │
│  │   [2nd color wheel] │    │  └──┘ └──┘ └──┘ └──┘            │ │
│  │                     │    │                                   │ │
│  │   ─────────────     │    │  [When one selected:]            │ │
│  │   TEXT EDITOR       │    │  ┌─────────────────────────────┐ │ │
│  │   ✏ OFFICIAL STAMP  │    │  │ Text: "OFFICIAL STAMP"   🗑 │ │ │
│  │   ✏ DUBAI, UAE      │    │  │ Text: "Dubai, UAE"       ✏ │ │ │
│  │   ✏ REG: 12345      │    │  │ Text: "SINCE 2020"       🗑 │ │ │
│  └─────────────────────┘    └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### On the Export Page:

```
┌──────────────────────────────────────────────────────────────────┐
│ [← Back to Designs]       Export Pack              [Final Design]│
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LEFT: PREVIEWS                    RIGHT: OPTIONS                 │
│  ┌────────────────────┐            ┌───────────────────────────┐  │
│  │ Stamp Preview      │            │ Export Color              │  │
│  │ [large 280px]      │            │ [mini color swatches]     │  │
│  │                    │            │                           │  │
│  │ On Document:       │            │ File Formats / Sizes      │  │
│  │ [letterhead mock   │            │                           │  │
│  │  with stamp]       │            │ ─────────────────────     │  │
│  │                    │            │ Multi-Color Pack          │  │
│  │ On Business Card:  │            │ [Toggle] Export in colors │  │
│  │ [card mock]        │            │ ● Navy ● Red ● Gold       │  │
│  │                    │            │ [+ Add Color]             │  │
│  └────────────────────┘            │ [↓ Download ZIP Pack]     │  │
│                                    └───────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Premium Template Examples (Key Upgrades)

The templates get upgraded with:
- **Filled ring bands** — real rubber stamps have a solid dark band at the outer edge. Achieved with `<circle>` fill + white inner `<circle>` cutout  
- **Gradient fills** — `<radialGradient>` with two stops (darker at edges, slightly lighter center) to simulate ink depth  
- **Ornamental details** — 4-point stars at cardinal positions, fleur-de-lis separators, rose-like center ornaments for luxury templates  
- **Star/sun burst for Medallion** — SVG `<polygon>` with 16 alternating long/short points creates the medallion star  

These changes apply both in `stampTemplates.ts` (the 9 client templates) and in the edge function's `buildSVG()` (which needs to stay in sync for regeneration via AI).

---

## Summary of User Requests → Solutions

| User Request | Solution |
|---|---|
| "Export failed" | Fix `svgToPng()` with proper xmlns + crossOrigin; robust error handling with per-file status |
| "Show on screen and document" | Export page already has document mock; adding business card mock; adding live color to export previews |
| "Delete 'official stamp' or add text" | `StampTextEditor` panel — parse SVG text nodes, edit or delete inline |
| "Color wheel, move mouse, see live change" | `StampColorWheel` canvas component — full HSB wheel with mousemove → live preview |
| "Load in multiple colors" | Multi-Color ZIP pack with JSZip — pick up to 5 colors, download all in one ZIP |
| "More premium stamps" | 9 templates upgraded + 2 new templates (Embossed Medallion, Art Deco Square) |
