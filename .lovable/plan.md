
# Stamp Export Fix — Base64 Data URL + Format Cleanup

## What Is Actually Broken

The `svgToPng` function (lines 28–84 of `StampExportPage.tsx`) creates a Blob URL via `URL.createObjectURL(blob)` and sets it as the `<img>` src. When that image is then drawn onto a `<canvas>`, the browser flags the canvas as **CORS-tainted** because Blob URLs are treated as cross-origin in the canvas security model. The result: `canvas.toBlob()` either throws a `SecurityError` or returns a blank/corrupted PNG.

The fix is to replace the Blob URL with a **base64 `data:` URI**, which is always same-origin and never taints the canvas.

## What Already Works (No Changes Needed)

- JPG, WEBP, and PDF download functions are fully implemented and wired
- All five formats (SVG, PNG, JPG, WEBP, PDF) are already toggled on by default (`formats: ['svg', 'png', 'jpg', 'webp', 'pdf']`)
- Transparent/solid background toggle is wired to PNG and WEBP correctly
- `uniquifyIds()` ID de-duplication helper is already in place and called before rasterization
- The `generateBundle()` orchestrator correctly calls all per-format functions

## Changes Required — Only 1 File

### `src/components/stamp-generator/StampExportPage.tsx`

**Change 1 — Rewrite `svgToPng` (lines 28–84):**

Replace the Blob URL approach with a `data:image/svg+xml;base64,...` URI:

```typescript
async function svgToPng(svgString: string, size: number, transparent: boolean): Promise<Blob> {
  let svg = uniquifyIds(svgString);

  // Ensure required XML namespaces are present
  if (!svg.includes('xmlns=')) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!svg.includes('xmlns:xlink')) {
    svg = svg.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  // Inject explicit width/height so the browser knows the intrinsic size
  svg = svg.replace(/<svg([^>]*)>/, (match, attrs) => {
    let a = attrs;
    if (!/\bwidth=/.test(a)) a += ` width="${size}"`;
    if (!/\bheight=/.test(a)) a += ` height="${size}"`;
    return `<svg${a}>`;
  });

  // ✅ Use base64 data URL — avoids canvas CORS taint caused by Blob URLs
  const b64 = btoa(unescape(encodeURIComponent(svg)));
  const dataUrl = `data:image/svg+xml;base64,${b64}`;

  return new Promise((resolve, reject) => {
    const img = document.createElement('img') as HTMLImageElement;

    img.onload = async () => {
      try {
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        if (!transparent) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
        }
        ctx.drawImage(img, 0, 0, size, size);
        canvas.toBlob(b => {
          if (b) resolve(b);
          else reject(new Error('Canvas toBlob returned null'));
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('SVG image failed to load — check SVG validity'));
    img.src = dataUrl;
  });
}
```

Key differences from the current implementation:
- No `URL.createObjectURL()` — eliminates the Blob URL that taints the canvas
- `btoa(unescape(encodeURIComponent(svg)))` — safely handles Unicode characters in Arabic company names / bilingual stamps without truncation
- No `URL.revokeObjectURL()` calls needed (no Blob URL to clean up)
- `img.decode()` is kept to guarantee full rasterization before canvas draw

**Change 2 — Fix `pngToJpeg` and `pngToWebp` (lines 87–132):**

These two conversion helpers also use `URL.createObjectURL(pngBlob)` internally. Since `pngBlob` is already a same-origin canvas-generated blob (not from a cross-origin SVG), these are less likely to taint the canvas — but to be consistent and safe, they should also switch to base64:

```typescript
async function pngToJpeg(pngBlob: Blob): Promise<Blob> {
  const dataUrl = await blobToDataUrl(pngBlob);
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(b => { if (b) resolve(b); else reject(new Error('JPEG toBlob failed')); }, 'image/jpeg', 0.92);
    };
    img.onerror = () => reject(new Error('JPEG img load failed'));
    img.src = dataUrl;
  });
}
```

A small `blobToDataUrl(blob)` helper converts a Blob to a data URL via `FileReader`:

```typescript
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

This same helper is used in `pngToWebp` too.

## Summary of Edits

| Lines | Action |
|-------|--------|
| After line 25 (after `uniquifyIds`) | Add `blobToDataUrl` helper function |
| Lines 28–84 (`svgToPng`) | Rewrite: replace Blob URL with `btoa` base64 data URL |
| Lines 87–107 (`pngToJpeg`) | Update: use `blobToDataUrl` instead of `URL.createObjectURL` |
| Lines 110–132 (`pngToWebp`) | Update: use `blobToDataUrl` instead of `URL.createObjectURL` |

No database changes, no other files touched.
