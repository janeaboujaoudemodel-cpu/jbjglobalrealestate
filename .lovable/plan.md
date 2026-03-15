

# Session 12 — E-Signature Quality / Preview / Reliability

## Issues Found

### 1. PDF Render Scale Too Low (Blurry on HiDPI)
`PdfPageCanvas.tsx` line 28: `scale: 1.5` is hardcoded. On 2x displays (user's current DPR is 2), the canvas pixels are sub-native, causing blurriness. Should use `window.devicePixelRatio * 1.5` (effectively 3.0 on 2x screens) for crisp rendering.

### 2. Stamp SVG Rendered Without Sanitization
`FieldContentRenderer.tsx` line 29-32: Uses `dangerouslySetInnerHTML` with raw SVG and a fragile regex to resize. Should use `DOMPurify.sanitize()` like `StampSVGRenderer.tsx` does, and properly set viewBox-based scaling instead of regex width/height replacement.

### 3. Preview Container Has No Scroll Indicator
`DocumentPreviewSummary.tsx`: The `overflow-auto` container at `maxHeight: 500px` gives no visual indication that content is scrollable. Long documents appear clipped.

### 4. PdfPageCanvas Double-Loads PDF
When `pdfDoc` is `null` on first render (common in `DocumentPreviewSummary` because the ref starts null), `PdfPageCanvas` independently calls `loadPdfJs()` + `getDocument()` — duplicating the same work the parent is doing. This causes a race condition and wasted network requests.

### 5. No Error Recovery in Preview
`PdfPageCanvas` falls back to an iframe on failure, but the iframe has `pointerEvents: none` and a fixed `1200px` height — unusable. No retry button exists.

### 6. Loading Spinner Mispositioned
`PdfPageCanvas.tsx` line 60: Spinner uses `absolute inset-0` but the parent div is `relative` with `minHeight: 800px` and `flex justify-center` — the spinner won't center correctly when the canvas hasn't rendered yet because there's no explicit width.

### 7. Submit Flow: No Guard Against Missing Session
`CreateEnvelope.tsx` line 460: `getSession()` could return null session, causing `access_token` to be `undefined`. The fetch would fail with a cryptic 401 instead of a user-friendly message.

## Implementation Plan

### 1. HiDPI-Aware PDF Rendering (`PdfPageCanvas.tsx`)
- Replace `scale: 1.5` with `Math.max(window.devicePixelRatio || 1, 1.5)` — renders at native DPR (2.0 on retina, 1.5 minimum).
- Set canvas CSS dimensions explicitly via `canvas.style.width` and `canvas.style.height` to the viewport dimensions (pre-DPR) so the browser downscales the high-res canvas to display size. This gives crisp text and sharp stamp/signature overlays.
- Fix the spinner by giving the container explicit dimensions matching the viewport.

### 2. Stamp SVG Sanitization (`FieldContentRenderer.tsx`)
- Import `DOMPurify` and sanitize `savedStampSvg` before rendering.
- Replace the fragile regex width/height replacement with proper SVG viewBox preservation: wrap in a `<div>` with fixed dimensions and let `viewBox` + CSS handle scaling.

### 3. Preview Scroll UX (`DocumentPreviewSummary.tsx`)
- Add a subtle gradient fade at the bottom of the preview container when content overflows, signaling scrollability.
- Add `scrollbar-thin` styling for a cleaner look.

### 4. Eliminate Double PDF Loading (`PdfPageCanvas.tsx`)
- Accept an optional `onDocLoaded` callback prop. When `pdfDoc` is null, load the doc and call back so the parent can cache it.
- In `DocumentPreviewSummary`, pass `pdfDocRef.current` only after it's loaded (use state instead of ref to trigger re-render).

### 5. Retry on PDF Failure (`PdfPageCanvas.tsx`)
- Replace the unusable iframe fallback with a retry button + error message card.
- Add a `retryKey` state that increments on retry to re-trigger the useEffect.

### 6. Submit Session Guard (`CreateEnvelope.tsx`)
- Before the edge function fetch, check `session?.access_token`. If null, show `toast.error("Session expired — please log in again")` and abort.

## Files Modified

| File | Changes |
|------|---------|
| `PdfPageCanvas.tsx` | HiDPI scale, CSS canvas sizing, retry button, spinner fix, onDocLoaded callback |
| `FieldContentRenderer.tsx` | DOMPurify sanitization for stamp SVG, viewBox-based scaling |
| `DocumentPreviewSummary.tsx` | Use state for pdfDoc (not ref), scroll fade indicator |
| `CreateEnvelope.tsx` | Session guard before edge function call |

## Known Limitations
- PDF.js CDN version (3.11.174) does not support all encrypted PDFs — these will show an error with retry. This is a library constraint, not a code bug.
- Stamp SVG rendering in the field overlay is a miniature preview (100×100px default). Very complex stamps with fine Arabic text may lose legibility at this size — this is inherent to the stamp's design density, not a rendering defect.

