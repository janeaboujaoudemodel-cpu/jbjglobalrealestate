
# Comprehensive Listing Fix Plan
*Bedrooms, Sizes, Card Shape, USP Photo, Floor Plans, Newsletter Duplicate, and Contact Form*

---

## Summary of Issues Found

After analyzing the codebase and database:

1. **No listings appear** — The `projects` table is empty (0 rows). 16 items exist in `pending_project_imports` but have not been approved/inserted into `projects`.

2. **Bedrooms and Size show "Contact Us"** — The `ProjectCard.tsx` correctly reads `bedrooms_min`/`bedrooms_max` and `size_min`/`size_max` from the database. However, since no projects exist, this cannot be tested. Additionally, the extraction edge functions (`batch-extract-pending`, `sync-provident-page`) **do not extract `size_min`/`size_max`** from the source portal — they only extract bedrooms.

3. **Card is 4:3 (rectangular) instead of 1:1 (square)** — `ProjectCard.tsx` uses `aspect-[4/3]` for the image container, not `aspect-square`.

4. **USP photo not extracted correctly** — The extraction regex looks for an image **after** the "Unique Selling Points" heading in the markdown. This often fails because the source page structure varies. The `usp_image_url` field is populated but may contain the wrong image or none.

5. **Floor plan data mixed with location distances** — The extraction regex in `extract.ts` does not clearly separate floor plan types from location distances. Both patterns use similar bullet-point matching.

6. **"Stay in the Loop" duplicated** — The `NewsletterSection.tsx` component is rendered separately on project detail pages, while `Footer.tsx` also has its own newsletter section. This causes duplication. The user wants **only** the footer's newsletter, not a separate section.

7. **"Register Interest" form should match Contact page** — Currently `ProjectInquiryForm.tsx` uses a simplified form. The user wants the full `ConsultationRequestForm` style from the Contact page.

---

## Implementation Plan

### Phase 1: Enable Listings to Appear

**Files:** `supabase/functions/bulk-approve-imports/index.ts`

**Action:** Invoke the bulk approval function to move pending imports into the `projects` table. The 16 pending items will be inserted with their extracted data.

**Also:** Verify RLS policies on `projects`, `project_images`, and `project_documents` allow public `SELECT` access.

---

### Phase 2: Fix Size Extraction (size_min, size_max)

**Files:**
- `supabase/functions/_shared/provident/extract.ts`
- `supabase/functions/batch-extract-pending/index.ts`
- `supabase/functions/full-project-extract/index.ts`

**Problem:** The current extraction does not capture property sizes from the source portal.

**Solution:**
1. Add size extraction regex to `extract.ts`:
   - Pattern: `([\d,]+)\s*(?:sqft|sq\.?\s*ft|sqm|sq\.?\s*m)` to capture min/max sizes
   - Parse ranges like "500 - 2,500 sqft"
2. Add `sizeMin` and `sizeMax` to the `ExtractedProjectData` type
3. Map to `size_min` and `size_max` in `batch-extract-pending/index.ts`

---

### Phase 3: Fix Listing Card to Square (1:1)

**File:** `src/components/ProjectCard.tsx`

**Change:** Line 139
- From: `<div className="aspect-[4/3] overflow-hidden relative">`
- To: `<div className="aspect-square overflow-hidden relative">`

This makes listing cards match the source portal's square presentation.

---

### Phase 4: Fix USP Photo Extraction

**Files:**
- `supabase/functions/_shared/provident/extract.ts`
- `supabase/functions/_shared/provident/pagedata-detail.ts`

**Problem:** The USP image regex `Unique Selling Points[\s\S]*?!\[[^\]]*\]\(([^)]+)\)` often captures the wrong image or fails.

**Solution:**
1. Improve the regex to look for the **first cloudfront image URL within 500 characters** after the USP section heading
2. Add fallback: If no image found in USP section, use the second gallery image as USP background
3. Validate the URL is a cloudfront CDN image, not a brochure/floor plan PDF

---

### Phase 5: Separate Floor Plans from Location Distances

**File:** `supabase/functions/_shared/provident/extract.ts`

**Problem:** `floorPlanTypes` extraction uses a pattern that can match location distance entries, and vice versa.

**Solution:**
1. For **Floor Plans**: Only match content under the `## Floorplans` heading
2. For **Location Distances**: Only match content under the `## Location` heading with the pattern `(\d+\s*Minutes?)\s*[–—-]\s*(.+)`
3. Add explicit heading boundary checks to prevent cross-section leakage

---

### Phase 6: Remove Duplicate "Stay in the Loop" Section

**File:** `src/components/project-detail/ProjectDetailLayout.tsx`

**Current State:** Line 840 shows `{/* NOTE: Newsletter section removed */}` but the `NewsletterSection` component may still be imported/used elsewhere.

**Solution:**
1. Verify `NewsletterSection` is NOT rendered in `ProjectDetailLayout`
2. Ensure the Footer's built-in newsletter section is the only one displayed
3. Remove any duplicate "Stay in the Loop" cards that appear before the footer

---

### Phase 7: Use Contact Page Form for "Register Interest"

**File:** `src/components/project-detail/ProjectDetailLayout.tsx`

**Change:**
1. Replace `ProjectInquiryForm` with `ConsultationRequestForm` for the inquiry section
2. Pass project context as default values:
   - `serviceNeeded` pre-filled based on project type
   - Title customized to "Register Interest in [Project Name]"

---

### Phase 8: Approve Pending Imports and Verify

**Actions:**
1. Call `bulk-approve-imports` edge function to insert the 16 pending items into `projects`
2. Verify images appear (check `project_images` table)
3. Test one project detail page to confirm all sections render correctly

---

## Technical Details

### Database Column Mapping (batch-extract-pending)

```text
pending_project_imports       →   projects
--------------------------------------------
bedrooms_min                  →   bedrooms_min      ✓ Already mapped
bedrooms_max                  →   bedrooms_max      ✓ Already mapped
size_min                      →   size_min          ✗ NOT MAPPED (needs fix)
size_max                      →   size_max          ✗ NOT MAPPED (needs fix)
usp_image_url                 →   usp_image_url     ✓ Already mapped
floor_plan_types              →   floor_plan_types  ✓ Already mapped
```

### Size Extraction Regex (New)

```typescript
// In extract.ts
const sizeMatch = cleanMd.match(
  /([\d,]+)\s*(?:to|-)\s*([\d,]+)\s*(?:sqft|sq\.?\s*ft|square feet)/i
);
let sizeMin: number | null = null;
let sizeMax: number | null = null;
if (sizeMatch) {
  sizeMin = parseInt(sizeMatch[1].replace(/,/g, ""));
  sizeMax = parseInt(sizeMatch[2].replace(/,/g, ""));
}
```

### USP Image Extraction (Improved)

```typescript
// Better pattern: find first cloudfront image within USP section only
const uspSection = markdown.match(
  /Unique Selling Points[\s\S]{0,500}(https:\/\/[^\s"]+cloudfront[^\s"]+\.(jpg|jpeg|png|webp))/i
);
const uspImageUrl = uspSection?.[1] || null;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ProjectCard.tsx` | Change aspect-[4/3] to aspect-square |
| `supabase/functions/_shared/provident/extract.ts` | Add size extraction, improve USP image regex, separate floor plan from location |
| `supabase/functions/batch-extract-pending/index.ts` | Map size_min/size_max to database update |
| `supabase/functions/bulk-approve-imports/index.ts` | Add size_min/size_max mapping |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Remove any duplicate newsletter, switch to ConsultationRequestForm |

---

## Execution Order

1. **Fix extraction logic** (size, USP photo, floor plan separation)
2. **Deploy edge functions**
3. **Run bulk-approve-imports** to populate projects table
4. **Update ProjectCard** to square aspect ratio
5. **Update ProjectDetailLayout** to use correct form and remove newsletter duplicate
6. **Test end-to-end** on mobile/tablet
