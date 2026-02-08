

# Full Developer and Project Synchronization - Completion Plan

## Current Status (After Sync)

| Metric | Count | Status |
|--------|-------|--------|
| Live Projects | 1,804 | Complete |
| Pending Imports | 0 | Done |
| Projects with Cover Image | 1,802 | 99.9% |
| Project Images | 1,802 | Synced |
| Projects with Coordinates | 1,804 | 100% |
| Total Developers | 554 | Synced |
| Developers with Logos | 550 | 99.3% |
| Developers with Feature Images | 24 | 4.3% - Needs Fix |
| Developers with Descriptions | 420 | 75.8% |

## Remaining Tasks

### Task 1: Auto-Fill Developer Feature Images

530 developers are missing feature images. We can automatically fill these from their project cover images.

**Implementation:**

Create an edge function that:
1. Queries developers without `feature_image_url`
2. For each, finds the highest-quality cover image from their projects
3. Updates the developer record with this image

**File: `supabase/functions/sync-developer-feature-images/index.ts`**

```typescript
// For each developer without feature_image:
UPDATE developers d
SET feature_image_url = (
  SELECT p.cover_image_url 
  FROM projects p 
  WHERE p.developer_id = d.id 
  AND p.cover_image_url IS NOT NULL 
  ORDER BY p.created_at DESC 
  LIMIT 1
)
WHERE d.feature_image_url IS NULL
```

### Task 2: Enhance Developer Detail Page with Map

The `DeveloperDetail.tsx` page needs a developer-specific map showing all their projects.

**Changes Required:**

1. Add a new section after stats grid showing a map
2. Filter projects by developer ID
3. Display all project pins on the map with:
   - Project name popup
   - Price indicator
   - Click to navigate to project

**Component Structure:**
```text
DeveloperDetail
├── Back Button
├── Logo + Name + Description
├── Stats Grid (Founded, Units, Projects, HQ)
├── NEW: Developer Projects Map ← Add this
│   └── Leaflet map with all developer project pins
├── Emirates Tabs
└── Project Cards Grid
```

### Task 3: Add Developer-Specific Map Component

Create a new component `DeveloperProjectsMap.tsx` for the developer page:

**File: `src/components/developer/DeveloperProjectsMap.tsx`**

Features:
- Cluster nearby project markers
- Custom gold-themed marker icons
- Click marker → project popup with image
- Zoom to fit all projects
- Satellite/Street view toggle

### Task 4: Enhance Project Card Image Gallery

The project cards should use Reelly's image array properly:

Current behavior:
- Shows first image only on initial load
- Carousel arrows work but dots limited to 5

Enhancement:
- Pre-sort images by `display_order`
- Show image count badge (e.g., "1/12")
- Lazy load images on carousel

### Task 5: Improve Project Detail Page Sections

Ensure all Reelly sections are visible when data exists:

| Section | Data Source | Current State |
|---------|-------------|---------------|
| Details | project.description | Working |
| Gallery | project_images | Working |
| Units | unit_types JSONB | Working if data exists |
| Construction | construction_progress | Working |
| Developer | developer relation | Working |
| Floor Plans | floor_plan_types | Working |
| Amenities | amenities[] | Working |
| Location | latitude/longitude | Working |
| Payment Plan | payment_breakdown | Working |
| FAQs | faqs JSONB | Working |

**Gap identified:** Many projects have null `floor_plan_types`, `documents`, `unit_types` because Reelly API returns these separately. The `reelly-fetch-details` function exists but isn't being run after bulk sync.

### Task 6: Run Detail Enrichment

After bulk sync, run the detail enrichment function to fill:
- `floor_plan_types`
- `documents` (brochures)
- `unit_types`
- `amenities`

**Run:** `POST /reelly-fetch-details` with `{"mode": "batch", "batch_size": 50}`

### Task 7: Global Projects Map Enhancement

The `PropertyMap.tsx` already exists with:
- All projects displayed
- Price markers
- Filters (price, bedrooms, status)

**Enhancements needed:**
- Add Buy/Rent filter toggle (currently all are off-plan/buy)
- Add developer filter dropdown
- Improve marker clustering for dense areas
- Add "Developer View" mode that colors pins by developer

## Implementation Priority

| Priority | Task | Effort |
|----------|------|--------|
| 1 | Auto-fill developer feature images | Low |
| 2 | Run detail enrichment for floor plans/docs | Low |
| 3 | Add DeveloperProjectsMap component | Medium |
| 4 | Add map to DeveloperDetail page | Low |
| 5 | Enhance PropertyMap filters | Medium |

## Technical Details

### Developer Feature Image Update SQL

```sql
-- Run this to auto-fill feature images from project covers
UPDATE developers d
SET feature_image_url = sub.cover_url,
    updated_at = NOW()
FROM (
  SELECT DISTINCT ON (p.developer_id) 
    p.developer_id,
    p.cover_image_url as cover_url
  FROM projects p
  WHERE p.cover_image_url IS NOT NULL
  ORDER BY p.developer_id, p.created_at DESC
) sub
WHERE d.id = sub.developer_id
AND d.feature_image_url IS NULL;
```

### DeveloperProjectsMap Component

```typescript
interface DeveloperProjectsMapProps {
  developerId: string;
  developerName: string;
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    latitude: number | null;
    longitude: number | null;
    price_from: number | null;
    cover_image_url: string | null;
  }>;
}
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/sync-developer-feature-images/index.ts` | Create |
| `src/components/developer/DeveloperProjectsMap.tsx` | Create |
| `src/pages/DeveloperDetail.tsx` | Modify - add map section |
| `src/pages/PropertyMap.tsx` | Modify - add developer filter |

## Expected Outcomes

After implementation:

1. **1,804 projects** fully synced with images, coordinates, all metadata
2. **554 developers** with logos and feature images
3. **Developer pages** showing map of all their projects
4. **Global map** with developer filtering capability
5. **Parity with Reelly** in data completeness

