

# Fix Plan: Developer Logos, Recommendation Photos, Feature Images, and Loading Screen

## Issues Identified

1. **Binghatti logo on developer card** uses a Reelly API URL that differs from the locked marquee logo (`/developers/logos/binghatti-logo.webp`). Need to update the database `logo_url` to match the marquee version.

2. **Recommendation popup shows Building icon instead of photos** because most projects (414 out of 512) have no `cover_image_url`. The popup query only checks `cover_image_url` and does not fall back to gallery images (`project_images` table).

3. **Emaar and Sobha feature images are low quality** -- both use tiny 260x200 thumbnails from the Reelly CDN. Need to find and set higher-resolution feature images.

4. **Loading screen monogram is invisible** -- `PageLoader` uses a `bg-black` background, but the monogram asset (`jbj-monogram-light-bg.png`) has black letters designed for light backgrounds. The "J" letters are black on black, making them invisible.

---

## Changes

### 1. Update Binghatti logo in database
- Run a SQL update to set `logo_url` for Binghatti to the same path used in the homepage marquee: `/developers/logos/binghatti-logo.webp`
- This ensures the developer card shows the same clean logo visible on the homepage

### 2. Fix Recommendation Popup to show project photos
- **File**: `src/components/PropertyRecommendationPopup.tsx`
- Update the query to also fetch from `project_images` as a fallback
- Modify the query to join or sub-select the first gallery image when `cover_image_url` is null
- Alternatively, add a database-side approach: create an RPC or modify the select to include a fallback image from the `project_images` table
- Simplest approach: after fetching projects, for any that lack `cover_image_url`, fetch their first gallery image and use it

### 3. Update Emaar and Sobha feature images
- Query the projects table to find high-quality cover images from Emaar and Sobha projects
- Update the `developers` table with better quality feature images (full-size, not 260x200 thumbnails)

### 4. Fix loading screen monogram visibility
- **File**: `src/components/ui/BrandedLoader.tsx`
- Change the monogram import from `jbj-monogram-light-bg.png` (black letters) to `jbj-monogram-dark-bg.png` (white letters)
- The white "J" letters will be clearly visible against the black loading background
- **File**: `src/components/PageLoader.tsx` -- no changes needed, the black background is correct once the right asset is used

---

## Technical Details

| Task | File(s) | Type |
|------|---------|------|
| Binghatti logo | Database UPDATE | SQL |
| Recommendation photos | `PropertyRecommendationPopup.tsx` | Code |
| Emaar/Sobha feature images | Database UPDATE | SQL |
| Loading monogram | `BrandedLoader.tsx` | Code |

