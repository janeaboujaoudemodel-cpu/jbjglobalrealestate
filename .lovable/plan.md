

# Project Detail Page Fixes — Plan

## Issues Identified

1. **Duplicate photos**: `filterValidImages()` filters broken URLs but does NOT deduplicate by URL. If the same image is uploaded twice (same URL), both appear in the gallery.

2. **Fake/broken video**: The `video_url` field in the database likely contains a placeholder or incorrect URL (e.g., a generic water video). The component correctly handles direct URLs, YouTube, and Vimeo — the issue is the stored data, not the code. Video card and modal also lack centering styles.

3. **Section order wrong**: Currently the layout is:
   - AI Analyzer → DLD Market Widget → Brochure → Book Documents → Payment Plan → Report Issue → Investment → FAQ → Mortgage Calculator
   
   User wants:
   - Brochure → DLD Market Widget + AI Analyzer (under brochure/payment) → Payment Plan → Mortgage Calculator → AI Analyzer → DLD Transaction Data → Investment → FAQ → Report Issue

4. **Extraction deduplication**: When importing/uploading documents and images, the system must detect duplicates by URL/hash and skip them instead of creating new rows.

---

## Fix Plan

### Fix 1: Deduplicate images by URL in `filterValidImages`
**File**: `src/lib/imageUtils.ts`
- Add URL-based deduplication inside `filterValidImages()` — use a `Set` to track seen URLs (normalized, without query params) and skip duplicates
- This prevents the same photo from appearing twice in any gallery regardless of how many times it was uploaded

### Fix 2: Fix video centering in ProjectMediaSection
**File**: `src/components/project-detail/ProjectMediaSection.tsx`
- When only one media card exists (video only, no virtual tour), center the card using `justify-center` on the grid and limit card width to `max-w-2xl mx-auto`
- Center the video element inside the modal dialog using `flex items-center justify-center`
- Add `object-contain` instead of `object-cover` in the modal so the video displays properly without cropping

### Fix 3: Validate video_url before rendering
**File**: `src/components/project-detail/ProjectMediaSection.tsx`
- Add validation: only render the video section if `videoUrl` is a recognized format (YouTube, Vimeo, or direct .mp4/.webm/.mov)
- Reject URLs that don't match any known video pattern (catches placeholder/fake URLs like generic Supabase storage files that aren't real project videos)
- Add an `onError` handler on the `<video>` element to hide the section if the video fails to load

### Fix 4: Reorganize sections in ProjectDetailLayout
**File**: `src/components/project-detail/ProjectDetailLayout.tsx`

New section order (lines ~1046-1210):
1. **Brochure** section (as-is)
2. **Book-Style Documents** (as-is) 
3. **Payment Plan** section
4. **DLD Market Widget** + **AI Project Intelligence** (moved from above brochure to below payment plan, under the same area)
5. **Mortgage Calculator**
6. **AI Analyzer** (JBJ Analyzer)
7. **Investment Metrics** (transaction data / bond market intelligence)
8. **Report Issue**
9. **FAQ**
10. **Inquiry Form**

This places DLD Market Intelligence and AI Project Intelligence under the Payment Plan/Brochure area, and puts the AI Analyzer directly under Mortgage Calculator followed by Investment/Transaction data.

### Fix 5: Deduplicate images at import/extraction time
**File**: `src/pages/ProjectDetail.tsx`
- In `mappedFromDb`, deduplicate `images` array by URL before passing to layout
- In `mappedFromReelly`, the existing `find()` check already prevents URL duplicates — verify it works

**File**: `src/lib/imageUtils.ts`  
- The `filterValidImages` dedup (Fix 1) serves as a universal safety net

---

## Files to Modify
1. `src/lib/imageUtils.ts` — add URL deduplication to `filterValidImages`
2. `src/components/project-detail/ProjectMediaSection.tsx` — video validation, centering
3. `src/components/project-detail/ProjectDetailLayout.tsx` — reorganize section order
4. `src/pages/ProjectDetail.tsx` — deduplicate images at mapping time

