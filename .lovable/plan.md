
# Area Image Audit and Approval System

## Problem
62 area images currently in the database contain numerous violations:
- **Provident logos**: Al Bateen, Al Jafiliya (providentestate.com/icons/icon-512x512.png)
- **Shutterstock watermarks**: Al Nanda
- **Stock photo sites**: Al Hamra Village (Alamy)
- **Floor plans**: Al Nuaimia 1,2 (gjproperties brochure)
- **Interior apartment photos**: Al Rifa'ah, Wadi Al Safa, others (propertyfinder listing images)
- **Standalone buildings**: Al Jaddaf (single project render, not community)
- **Broken/irrelevant**: Es Sanhaya 2 (World Bank PDF), Fujairah City (propertyfinder blog)
- **Competitor-branded CDN**: ~20 images from d3h330vgpwpjr8.cloudfront.net (Provident CDN with potential watermarks in filenames like "Provident_Estate" in URL)
- **Wrong subject**: The World Islands showing Atlantis, Mariam Island not showing aerial view
- Many propertyfinder listing images are individual apartment/unit photos, not community aerials

## Plan

### Step 1: Add `image_approved` column to areas table
Add a new boolean column `image_approved` (default `false`) to the `areas` table. This creates a gating mechanism so only manually reviewed images appear on the site.

### Step 2: Nuclear cleanup -- NULL all non-compliant images
Set `image_url = NULL` and `hero_image_url = NULL` for ALL 62 areas that currently have images. This is the safest approach given the scale of violations. Specific blocked sources:
- providentestate.com (logo/branding)
- shutterstock.com (watermarked)
- alamy.com (watermarked)
- d3h330vgpwpjr8.cloudfront.net (Provident CDN -- many filenames contain "Provident_Estate")
- static.shared.propertyfinder.ae (individual listing photos, interiors)
- new-projects-media.propertyfinder.com (project renders, not community photos)
- gjproperties.ae (floor plans/brochures)
- documents1.worldbank.org (broken/irrelevant)
- propertyfinder.ae/blog (blog thumbnails)
- wikimedia (low quality panoramio uploads)

### Step 3: Update the UI to filter by `image_approved`
Modify `useAreas` hook and `AreaGuides.tsx` so that:
- Only areas with `image_approved = true` show their photo
- Areas with `image_approved = false` (or no image) display the branded gradient fallback
- The filter bar and page only show approved content by default

### Step 4: Build an approval-aware image display
Update the area card rendering in `AreaGuides.tsx` to check `image_approved` before displaying any image, regardless of whether `image_url` is populated.

---

## Technical Details

### Database Migration
```sql
ALTER TABLE public.areas 
ADD COLUMN image_approved BOOLEAN NOT NULL DEFAULT false;
```

### Data Cleanup
```sql
UPDATE areas 
SET image_url = NULL, hero_image_url = NULL, image_approved = false, updated_at = now()
WHERE image_url IS NOT NULL;
```
This clears all 62 images. Future images must be individually approved.

### Hook Changes (`src/hooks/useAreas.ts`)
- Add `image_approved` to the `Area` interface
- No query filter change needed -- the UI logic handles display

### UI Changes (`src/pages/AreaGuides.tsx`)
- Update the image rendering condition from:
  `(area.hero_image_url || area.image_url)` 
  to: 
  `area.image_approved && (area.hero_image_url || area.image_url)`
- Apply the same logic in the fixed/scrolled filter bar if images appear there

### Area Detail Page (`src/pages/AreaDetail.tsx`)
- Same approval gate on the hero image display

### Community Detail Page (`src/pages/CommunityDetail.tsx`)
- Same approval gate on the hero image display

This ensures no unapproved photo ever renders anywhere on the site. Areas without approved photos get the branded gradient fallback (MapPin icon + gold styling).
