

## Fix Developer Card Logo Backgrounds and Missing Photos

### Problem Summary

Three issues identified on the developers page:

1. **Logo background color not matching**: The `extractDominantCornerColor` function silently fails for cross-origin images (most logos are hosted on external CDNs like reelly.io). Without `crossOrigin="anonymous"`, the canvas cannot read pixel data, so it always returns white. This means the logo box always has a white background, creating visible white edges around logos with dark backgrounds.

2. **AAF Developments showing logo instead of photo**: The feature image URL (`aafdevelopments.com`) is blocked/failing to load. The fallback UI shows a dark box with the logo, but the user wants the actual project photo.

3. **Binghatti logo not visible**: The logo is a local file (`/developers/logos/binghatti-logo.webp`) that may be dark/transparent, making it invisible against the dark feature photo background.

---

### Solution

#### Fix 1: Dual-Load Strategy for Logo Background Color Matching

**File: `src/components/DeveloperCard.tsx`**

Replace the current `onLoad` color extraction (which fails for cross-origin images) with a **dual-load approach**:

- Display the logo normally (no `crossOrigin`) -- this ensures the logo always shows
- In the `onLoad` handler, create a **separate hidden `Image()` object** with `crossOrigin="anonymous"` pointed at the same URL
- If the hidden CORS image loads successfully, extract the corner color and apply it to the container
- If the hidden CORS image fails (CDN blocks CORS), the logo still displays fine with the default white background

This ensures logos are never broken, and color matching works whenever CORS headers are available.

#### Fix 2: Restore AAF Developments Feature Photo

**Database update**: The AAF Developments `feature_image_url` points to `aafdevelopments.com` which blocks external loading. Need to find a working image URL or accept the fallback gracefully. Check if there is an alternative image in the projects table linked to this developer that can be used as the feature image.

**File: `src/components/DeveloperCard.tsx`**

Currently when `feature_image_url` fails to load (line 80: `onError`), the fallback (lines 83-100) shows the logo on a dark background. This is what the user sees for AAF. The fallback should instead try to find a project image, or at minimum not use the logo as the main display.

#### Fix 3: Binghatti Logo Visibility

The Binghatti logo box sits on top of a dark photo. If the logo is dark/transparent, it becomes invisible. Add a subtle inner border or ensure the logo container always has enough contrast by:
- Keeping the `bg-white` default for the logo box (already present)
- Ensuring the local logo file renders with proper contrast

Since Binghatti's logo is a local file (`/developers/logos/binghatti-logo.webp`), the canvas CAN read it (same-origin), so the color extraction will work. Verify the logo file renders correctly.

---

### Technical Implementation

| # | File | Change |
|---|------|--------|
| 1 | `src/components/DeveloperCard.tsx` | Update `handleLogoLoad` to use dual-load approach: display logo normally, attempt CORS load in background for color extraction |
| 2 | `src/components/DeveloperCard.tsx` | Add `p-1` padding to logo image to prevent logos from touching the container edges (ensures clean look with background color matching) |
| 3 | `src/components/DeveloperCard.tsx` | Improve fallback when feature photo fails: show a gradient placeholder instead of showing the logo as the main card image |

### Updated handleLogoLoad Logic

```text
handleLogoLoad:
1. Try to create a new Image() with crossOrigin="anonymous"
2. Set its src to the same logo URL
3. On successful load of the CORS image -> extract corner color -> apply to container
4. On error of the CORS image -> keep default white background (logo still displays fine)
```

This approach guarantees:
- Logos ALWAYS display (never blocked by CORS)
- Background color matches when the CDN supports CORS headers
- For local logos (like Binghatti), color extraction always works since they are same-origin
- Each logo gets its own independent background color

