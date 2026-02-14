

## Fix Broken Developer Logos

### Root Cause

The `crossOrigin="anonymous"` attribute added to the logo `<img>` tag (line 111 in `DeveloperCard.tsx`) is breaking logo display. This attribute was added so the canvas-based color extraction could read pixel data. However, when a CDN (like `api.reelly.io`, `reelly-backend.s3.amazonaws.com`, etc.) does not return `Access-Control-Allow-Origin` headers, the browser blocks the image entirely -- it doesn't even display it.

This affects hundreds of developer logos hosted on external CDNs.

### Fix

**File: `src/components/DeveloperCard.tsx`**

1. **Remove `crossOrigin="anonymous"`** from the logo image -- this immediately restores all broken logos
2. **Gracefully handle color extraction failure** -- the `extractDominantCornerColor` function already falls back to white on cross-origin errors, so removing `crossOrigin` means the canvas will throw a security error when trying to read pixels from non-CORS images, which is already handled by the try/catch returning white
3. **Add `referrerPolicy="no-referrer"`** to the logo image as well (same fix applied to feature images) to prevent referrer-based CDN blocking
4. **Add an `onError` fallback** for the logo image too, so if a logo fails to load, it shows the Building2 icon instead of a broken image

### Technical Details

| Line | Current | Change |
|------|---------|--------|
| 111 | `crossOrigin="anonymous"` | Remove this attribute entirely |
| 107 | Logo `<img>` | Add `referrerPolicy="no-referrer"` and `onError` handler |

The color extraction will still work for same-origin and CORS-enabled images. For non-CORS images, it gracefully falls back to white background -- which is the safe default.

