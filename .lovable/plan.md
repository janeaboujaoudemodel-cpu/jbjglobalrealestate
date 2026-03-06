

## Diagnosis Summary

From the database and code audit:

**Pending queue (5 items, all Citi Developers):**
- All 5 have images (7-12 each) but they're broker-kit assets (fact-sheet.webp, material.webp, film.webp, about.webp, brand-guidelines) NOT property photos
- All 5 have zero documents, zero description, no coordinates
- Location = "Dubai Island", Emirate = "Umm Al Quwain" (correct per previous instruction)
- "Fix/Repair" button shows even though these are YOUR manual uploads, not auto-imports

**Published projects audit:**
- 48 projects missing location field
- 24 missing coordinates  
- 18 missing cover image

**Flyover animation:**
- Current: 3.5s duration, jumps from zoom 7 to zoom 16 in one step -- feels like a stuck screen then instant zoom
- Needed: Multi-step slow cinematic zoom (UAE overview → regional → neighborhood → project pin)

---

## Plan

### 1. Fix flyover animation (slow, cinematic, multi-step)

**File:** `src/components/project-detail/ProjectLocationFlyover.tsx`

Replace the single `flyTo` with a 3-step cinematic sequence:
- Step 1 (0-2s): Hold on UAE overview (zoom 7) with project name overlay
- Step 2 (2-6s): Slow fly to regional view (zoom 11), 4s duration, easeLinearity 0.1
- Step 3 (6-12s): Slow fly to project pin (zoom 16), 6s duration
- Step 4 (12-15s): Show name overlay for 3s, then fade

Total: ~15 seconds of smooth, understandable cinematic experience.

### 2. Strict photo-only gallery filter (no fact sheets, broker-kit assets)

**File:** `src/lib/imageUtils.ts`

Add new exclusion patterns to `SITE_ASSET_PATTERNS` or a new `BROKER_KIT_PATTERNS` array:
```
/fact[-_]?sheet/i, /material/i, /brand[-_]?guideline/i, 
/broker[-_]?kit/i, /about/i, /film/i, /book/i,
/renders?\.webp$/i (only if from broker-kit path)
```

Also add path-based filtering: if URL path contains `/broker-kit/` or `/kit/`, filter out ALL images from that path except those explicitly matching property renders (hero, gallery, exterior, interior patterns).

**File:** `supabase/functions/extract-listing-from-link/index.ts`

Update the `EXCLUDED_IMG_PATTERNS` regex to include the same broker-kit patterns so extraction itself doesn't capture them. Separately classify broker-kit PDFs/fact-sheets as documents, not images.

### 3. Remove "Fix/Repair" button for manual uploads

**File:** `src/components/listing-admin/PendingImportCard.tsx`

Add a prop or check: if `enrichment_source === 'file-upload'` OR `source_url` does not contain `reelly` or `provident`, hide the "Fix" button entirely. Manual uploads should never show repair since user provided everything.

### 4. Both maps on all project pages (including pending previews)

**File:** `src/components/project-detail/ProjectDetailLayout.tsx`

Current behavior: Flyover only shows when `project.latitude && project.longitude`. Interactive map always shows (falls back to Dubai center).

Change: Keep interactive map always. Keep flyover conditional on having real coordinates (per your answer: "Map always + flyover conditional").

**File:** `src/pages/listing-admin/PendingImportPreview.tsx`

Ensure the mapped `ProjectDetailData` passes `latitude`/`longitude` through so both maps render in the preview. Currently these fields may not be in the mapped object.

### 5. AI location analysis (nearby POIs)

**File:** `supabase/functions/extract-listing-from-link/index.ts`

When the AI extraction runs, add `nearbyLandmarks` to the extraction schema (already exists in the prompt). The issue is Citi Developer pages have short content, so AI can't extract POIs.

Add a **post-extraction enrichment step**: if `nearbyLandmarks` is empty/null AND we have a location/emirate, use the AI model to generate typical nearby POIs for that area:
```
"Given the project {name} in {location}, {emirate}, UAE, list the 8-10 nearest landmarks 
(hospitals, schools, airports, malls, beaches, metro stations, tourist destinations) 
with estimated driving distances/times."
```

Store result in `location_distances` field.

### 6. Fix Citi Developers data (DB update)

**SQL updates needed:**
- Set coordinates for Dubai Island, Umm Al Quwain (approx: lat 25.620, lng 55.782)
- Clear `review_notes` from "INCOMPLETE" once images are properly filtered (they'll have 0 valid photos after broker-kit filter, which means they genuinely need real photos uploaded)

Actually, the real issue: after applying the strict photo filter, ALL Citi projects will have **zero valid images** because every image is a broker-kit asset. The user needs to upload actual property renders/photos separately. The "Incomplete" status is therefore correct -- but the card should explain "0 property photos (broker-kit assets excluded)" instead of showing broken thumbnails.

### 7. Published projects data backfill

**SQL updates:** Backfill the 48 published projects missing location by matching their `area_name` or `developer_name` patterns to the `areas` table. Backfill coordinates from area centroids where possible.

### 8. "Open Full Listing" button text overflow fix

**File:** `src/components/listing-admin/ProjectPreviewModal.tsx`

Add `whitespace-nowrap` and reduce text to "View Listing" or ensure the button container uses `min-w-0` and truncation.

---

## Files to modify

| File | Change |
|------|--------|
| `ProjectLocationFlyover.tsx` | Multi-step slow cinematic animation |
| `imageUtils.ts` | Broker-kit / fact-sheet exclusion patterns |
| `extract-listing-from-link/index.ts` | Exclude broker-kit images at extraction + AI POI enrichment |
| `PendingImportCard.tsx` | Hide "Fix" for manual uploads; show "0 photos" explanation |
| `PendingImportPreview.tsx` | Pass lat/lng to detail layout |
| `ProjectPreviewModal.tsx` | Fix button text overflow |
| `ProjectDetailLayout.tsx` | Ensure interactive map always renders (already does) |
| DB updates | Citi coords, published project location backfill |

