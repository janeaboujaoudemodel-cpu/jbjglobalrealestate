
# Fix Plan: Broken Image Extraction & False "Repaired" Status

## Problem Summary
1. **Image extraction captures wrong images**: The extraction function is pulling `apartment_navbar_a62fb5b437.webp` (a generic navbar/placeholder image) instead of actual project gallery photos
2. **False "Repaired" markers**: System marks projects as "complete" based on image count (15), not image validity - all 15 images are the same broken navbar icon
3. **Result**: Cards show "Repaired" but display broken/placeholder images when scrolling through the gallery

## Root Cause (Technical)

### Image Extraction Filter is Missing Key Terms
The current exclude pattern in `batch-extract-pending/index.ts` line 69:
```javascript
const excludePatterns = /(logo|icon|avatar|placeholder|spinner|favicon|brochure|payment[-_]?plan|floor[-_]?plan|master[-_]?plan|pdf|document)/i;
```

**Missing from pattern:**
- `navbar` - catches `apartment_navbar_a62fb5b437.webp`
- `header` - catches header images
- `footer` - catches footer images
- `menu` - catches menu assets

### No Image Uniqueness Validation
The system stores 15 duplicate images of the same navbar icon and considers extraction "successful".

### No Project-Specific URL Pattern Enforcement
Real project images have URL patterns like `/off-plan/{id}/images/` but the current logic accepts ANY cloudfront image.

---

## Fix Implementation

### Change 1: Update Image Extraction Filter (`batch-extract-pending/index.ts`)

**Update the exclude patterns** to filter out navbar/header/footer/menu images:
```javascript
const excludePatterns = /(logo|icon|avatar|placeholder|spinner|favicon|brochure|payment[-_]?plan|floor[-_]?plan|master[-_]?plan|pdf|document|navbar|header|footer|menu|widget|sidebar)/i;
```

**Add project-specific image prioritization:**
- Prioritize URLs containing `/off-plan/` (project gallery images)
- Only fall back to generic cloudfront images if no project-specific ones found

### Change 2: Add Image Uniqueness Check

Before storing images, deduplicate by URL and require **at least 2 unique images** for extraction to be considered successful.

```javascript
// Deduplicate by full URL
const uniqueImages = [...new Set(imageUrls)];

// Must have at least 2 unique real project images
const hasValidImages = uniqueImages.length >= 2 && 
  !uniqueImages.every(u => u.includes('navbar') || u.includes('apartment_navbar'));
```

### Change 3: Update Completeness Check

Current logic (line 361):
```javascript
const hasMinimal = Boolean(extracted.description && extracted.developerName && imagesPayload.length >= 1);
```

Updated logic:
```javascript
// Check for VALID images (not navbar placeholders)
const validImages = imagesPayload.filter(img => 
  img.url.includes('/off-plan/') || 
  (!img.url.includes('navbar') && !img.url.includes('apartment_navbar'))
);
const hasMinimal = Boolean(
  extracted.description && 
  extracted.developerName && 
  validImages.length >= 2
);
```

### Change 4: Clear Bad Data from Database

Run a data repair to:
1. Identify all rows where images contain only navbar placeholders
2. Reset their `images` to `[]` and `review_notes` to `INCOMPLETE`
3. Allow re-extraction with the fixed logic

SQL to identify affected rows:
```sql
UPDATE pending_project_imports 
SET images = '[]'::jsonb, 
    review_notes = 'INCOMPLETE: Navbar images detected'
WHERE images IS NOT NULL 
AND jsonb_array_length(images) > 0
AND images->0->>'url' LIKE '%apartment_navbar%';
```

### Change 5: Update Repair Function (`repair-project-extraction/index.ts`)

Apply the same enhanced image filtering and validation to the single-item repair function.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/batch-extract-pending/index.ts` | Enhanced image filtering, uniqueness check, validity check |
| `supabase/functions/repair-project-extraction/index.ts` | Same enhanced image filtering |
| Database migration | Reset corrupted image data |

---

## Expected Outcome

1. **Image extraction will skip navbar/placeholder images** and only capture actual project gallery photos
2. **Projects will only be marked "complete"** if they have 2+ valid, unique project images
3. **Existing bad data will be cleared** and re-extracted with the fixed logic
4. **"Repaired" status will be accurate** - only shown when real images are present

---

## Verification Steps

After implementation:
1. Run bulk extraction on a few test items
2. Verify extracted images contain `/off-plan/` URLs (not navbar placeholders)
3. Confirm cards display actual project photos
4. Confirm "INCOMPLETE" badge shows for items that truly lack valid images
