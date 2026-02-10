

# Fix: Replace All Fake Area Photos with Real Project Images

## Problem

20 areas in the database have Unsplash stock photos instead of real Dubai location images. Every one of these areas already has real project images from Reelly in the `project_images` table that can be used instead. Additionally, the fallback for areas with NO image also uses an Unsplash photo, and some Unsplash URLs may fail to load (showing black).

## Solution: Two-Part Fix

### Part 1: Database Update -- Replace Unsplash URLs with Real Project Images (Edge Function)

Create an edge function `repair-area-images` that:
1. Finds all areas where `image_url` contains "unsplash.com"
2. For each area, looks up the first project image from `project_images` via matching `area_name`
3. Updates the area's `image_url` with the real project cover image
4. For areas with no matching project images, sets `image_url` to NULL (so the frontend fallback handles it gracefully)

This will replace all 20 fake Unsplash photos in one pass.

### Part 2: Frontend Fix -- Remove Unsplash Fallback

**File: `src/pages/AreaGuides.tsx` (line 306)**
- Remove the Unsplash fallback image (`unsplash.com/photo-1512453979798...`)
- Replace with a branded gradient placeholder (MapPin icon on dark gradient) -- no external stock photo

**File: `src/pages/AreaDetail.tsx` / `AreaHeroSection`**
- Verify the hero section also does not fall back to Unsplash

### Part 3: Run the Edge Function

After deploying, invoke `repair-area-images` to update all 20 areas in the database with real images from their associated projects.

## Areas That Will Be Fixed (all 20)

| Area | Current (Fake) | Will Use |
|------|----------------|----------|
| Abu Dhabi | Unsplash stock | Reelly project cover |
| Al Furjan | Unsplash stock | Reelly project cover |
| Arjan | Unsplash stock | Reelly project cover |
| Damac Hills | Unsplash stock | Reelly project cover |
| Damac Lagoons | Unsplash stock | Reelly project cover |
| Dubai Creek Harbour | Unsplash stock | Reelly project cover |
| Dubai Expo City | Unsplash stock | Reelly project cover |
| Dubai Hills | Unsplash stock | Reelly project cover |
| Dubai Islands | Unsplash stock | Reelly project cover |
| Dubailand Residence Complex | Unsplash stock | Reelly project cover |
| Jebel Ali Village | Unsplash stock | Reelly project cover |
| JVT (Jumeirah Village Triangle) | Unsplash stock | Reelly project cover |
| Majan | Unsplash stock | Reelly S3 cover |
| Meydan | Unsplash stock | Reelly project cover |
| Mina Rashid | Unsplash stock | Reelly project cover |
| The Valley | Unsplash stock | Reelly project cover |
| Town Square | Unsplash stock | Reelly project cover |
| Yas Island | Unsplash stock | Reelly project cover |
| Al Marjan Island | Unsplash stock | Reelly project cover |
| Azizi Riviera at Meydan One | Unsplash stock | Reelly project cover |

## Technical Summary

| File | Change |
|------|--------|
| `supabase/functions/repair-area-images/index.ts` | New edge function to replace Unsplash URLs with real project images |
| `src/pages/AreaGuides.tsx` | Remove Unsplash fallback, use branded gradient placeholder |

## Result
- Zero Unsplash/stock photos on area cards
- All area images sourced from real project photography
- Branded fallback for any area that genuinely has no project images
