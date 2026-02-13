

## Fix Area Guide Images: Optimization and Quality Audit

### Problems Identified

1. **Slow Loading**: Area images are massive uncompressed PNGs (1.9-2.2 MB each). Loading 24 per page means downloading ~48 MB of images. Network traces show individual images taking 2-4 seconds each.

2. **Image Authenticity**: All 185 area images were batch-generated/downloaded and stored as `.png` files in the `area-images` storage bucket. Some may not accurately represent their areas (e.g., Sobha Hartland shows an MBR City District One Wikipedia photo which is the correct general area but may not look like the actual Sobha Hartland community).

3. **No Broken Images Found**: All images return HTTP 200. Maryam Island and all Wadi Al Safa areas already have images and they load correctly. The "broken" appearance the user sees is likely caused by the slow loading -- images appear blank for 2-4 seconds before rendering.

---

### Fix Plan

#### Part 1: Optimize Image Loading Speed (Primary Fix)

The storage bucket supports Supabase Image Transformations via the `/render/image/` endpoint. This serves resized, compressed WebP versions on-the-fly without re-uploading anything.

**File: `src/pages/AreaGuides.tsx`**

Create a utility function that converts storage URLs from:
```
/storage/v1/object/public/area-images/business-bay.png
```
to:
```
/storage/v1/render/image/public/area-images/business-bay.png?width=600&quality=70
```

This will reduce each image from ~2 MB to ~30-60 KB (a 30-50x reduction), making the page load nearly instantly.

Apply this transformation to the `<img>` tag on line 207 where `area.hero_image_url || area.image_url` is used.

**File: `src/components/home/AreasWeCover.tsx`**

Apply the same optimization to the areas grid on the homepage (if it uses area images).

**File: `src/lib/imageUtils.ts`**

Add a new `optimizeStorageImageUrl(url, width, quality)` utility function that:
- Detects if the URL is from our storage bucket (`mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/`)
- Replaces `/object/public/` with `/render/image/public/`
- Appends `?width=600&quality=70` for card thumbnails
- Returns the URL unchanged if it is not from our storage

#### Part 2: Verify Sobha Hartland Image

The current Sobha Hartland image was sourced from a Wikipedia photo of MBR City District One (the broader district where Sobha Hartland is located). While geographically correct, it may not specifically show the Sobha Hartland community.

**Action**: Use the `enrich-area-images` edge function to replace the Sobha Hartland image with a more accurate one. Update the curated map in `supabase/functions/enrich-area-images/index.ts` to use a verified Sobha Hartland aerial photo from an official or editorial source, then re-run enrichment for that specific area.

---

### Files to Change

| File | Change |
|------|--------|
| `src/lib/imageUtils.ts` | Add `optimizeStorageImageUrl()` utility function |
| `src/pages/AreaGuides.tsx` | Apply image optimization to area card images (line 207) |
| `src/pages/AreaDetail.tsx` | Apply image optimization to area detail hero if applicable |
| `supabase/functions/enrich-area-images/index.ts` | Update Sobha Hartland curated URL to a more accurate image |

### Expected Impact

- **Image load time**: From 2-4 seconds per image down to ~100-200ms (WebP at 600px width)
- **Page data transfer**: From ~48 MB to ~1.5 MB for 24 area cards
- **No re-upload needed**: Transformation happens server-side on existing files

