

## Fix Developer Card Logos and Photos

### Issue 1: Logo Background Color Matching

**Problem**: The logo container has a fixed white (`bg-white`) background. When logos have dark or colored backgrounds, the white edges are visible and look bad.

**Solution**: Use a client-side canvas-based color extraction approach. When each logo image loads, a small helper function will:
1. Draw the logo onto a hidden canvas
2. Sample the corner pixels (top-left, top-right, bottom-left, bottom-right) to detect the logo's background color
3. Set the logo container's background to that detected color
4. This runs per-logo independently, so each logo gets its own matching background

**Implementation in `src/components/DeveloperCard.tsx`**:
- Add a `useRef` for the logo container div
- Add an `onLoad` handler on the logo `<img>` that:
  - Creates a temporary canvas
  - Draws the loaded image
  - Samples corner pixels to get the dominant background color
  - Sets the container div's `backgroundColor` to that color via ref
- Keep `object-contain` and `p-0` so logos fill the space without cropping
- Default background stays white until the image loads and color is detected

**New utility function in `src/lib/imageUtils.ts`**:

```text
function extractDominantCornerColor(img: HTMLImageElement): string
  - Creates a 1x1 or small canvas
  - Draws the image scaled down
  - Reads corner pixel RGBA values
  - Returns the most common corner color as an rgb() string
  - Falls back to white if cross-origin errors occur
```

---

### Issue 2: Developer Photos Not Showing

**Problem**: Some developer cards show a logo fallback instead of the actual feature photo, even though all 540 developers have `feature_image_url` populated in the database.

**Root cause**: The current code at line 58 checks `developer.feature_image_url` -- if the image URL fails to load (404, CORS error, etc.), the broken image shows rather than gracefully falling back. However, the fallback (lines 65-83) only triggers when `feature_image_url` is falsy, not when the image fails to load.

**Solution in `src/components/DeveloperCard.tsx`**:
- Add an `onError` handler on the feature image `<img>` (line 59-64) that:
  - Attempts to load the image from an alternative source or
  - Hides the broken image and shows the fallback UI
- Use a state variable `imageError` to toggle between the real photo and the fallback
- Add `referrerPolicy="no-referrer"` to the feature image to prevent referrer-based blocking (some CDNs like reelly.io block requests with referrers)

---

### Technical Summary

| # | File | Change |
|---|------|--------|
| 1 | `src/lib/imageUtils.ts` | Add `extractDominantCornerColor()` utility function |
| 2 | `src/components/DeveloperCard.tsx` | Logo container: remove fixed `bg-white`, add dynamic background color detection via canvas on image load |
| 3 | `src/components/DeveloperCard.tsx` | Feature photo: add `onError` handler with state fallback + `referrerPolicy="no-referrer"` to fix missing photos |

