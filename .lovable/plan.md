
# Complete Reelly API Extraction - Full Data Sync

## Overview

Implement a comprehensive extraction system that captures **all 1,805 projects, 549 developers, and all associated assets** from the Reelly API with the exact same layout, content, photos, videos, documents, and data structure as shown in Reelly.

---

## Current State Analysis

### What's Already Working
- **Edge Functions Deployed**: `reelly-api-sync`, `reelly-developers-sync`, `reelly-areas-sync` are functional
- **API Connection**: Successfully connects to Reelly API (1,805 projects, 549 developers confirmed)
- **Basic Sync**: Projects and developers can be synced to pending queue

### What's Missing for Complete Extraction
1. **Gallery Images**: Only extracting `cover_image`, missing full gallery
2. **Video URLs**: `video_reviews` array exists but not fully extracted
3. **Documents/Brochures**: No dedicated document extraction from API
4. **Detailed Project Endpoint**: Not using `/projects/{id}` for complete data
5. **Unit Types**: `unit_types` with pricing not extracted
6. **Amenities**: Not pulling amenities list from API
7. **Floor Plans**: Not extracting floor plan data

---

## Technical Implementation Plan

### Phase 1: Enhance Reelly API Project Sync

**File:** `supabase/functions/reelly-api-sync/index.ts`

#### 1.1 Add Detailed Project Fetch

The Reelly API has a detail endpoint `/projects/{id}` that returns more data than the list endpoint. We'll fetch detailed data for each project:

```text
Current: GET /api/v2/clients/projects?limit=100 (list only)
Enhanced: GET /api/v2/clients/projects/{id} (full details per project)
```

**New Data Fields to Extract:**
- `images` - Full gallery array (not just cover_image)
- `video_reviews` - Array of video URLs with thumbnails
- `documents` - Brochures, floor plans, payment plans
- `units` - Unit types with sizes and pricing
- `amenities` - Full amenities list
- `floor_plans` - Floor plan images and PDFs

#### 1.2 Update Interface Definitions

```typescript
interface ReellyProjectDetail extends ReellyProject {
  images: Array<{
    url: string;
    alt_text?: string;
    type?: string;
  }>;
  floor_plans: Array<{
    type: string;
    url: string;
    label?: string;
  }>;
  documents: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  amenities: string[];
  units: Array<{
    type: string;
    bedrooms: number;
    size_min: number;
    size_max: number;
    price_from: number;
    price_to: number;
    available: number;
  }>;
}
```

#### 1.3 Add Gallery Extraction Function

```typescript
async function fetchProjectDetails(apiKey: string, projectId: number): Promise<ReellyProjectDetail> {
  const url = `https://api-reelly.up.railway.app/api/v2/clients/projects/${projectId}`;
  const response = await fetch(url, {
    headers: { "X-API-Key": apiKey }
  });
  return await response.json();
}
```

#### 1.4 Update Mapping Function

Enhance `mapReellyToImport` to include:
- All gallery images (not just cover)
- Video URLs from video_reviews
- Unit types with pricing
- Amenities list
- Floor plan data
- Documents/brochures

---

### Phase 2: Create Batch Detail Fetcher

**New Function:** `supabase/functions/reelly-fetch-details/index.ts`

For projects already synced but missing details, create a batch fetcher:

```typescript
// Fetch projects in pending queue missing gallery/documents
const { data: incomplete } = await supabase
  .from("pending_project_imports")
  .select("id, source_url")
  .is("images", null)
  .like("source_url", "%reelly%")
  .limit(50);

// For each, fetch full details and update
for (const imp of incomplete) {
  const reellyId = extractReellyId(imp.source_url);
  const details = await fetchProjectDetails(apiKey, reellyId);
  await updatePendingImport(imp.id, details);
}
```

---

### Phase 3: Enhanced Developer Sync

**File:** `supabase/functions/reelly-developers-sync/index.ts`

Already paginating correctly. Enhancements:
- Extract `offices` data fully (address, city, region)
- Extract `social_links` (website, social media)
- Extract `working_hours` for display
- Store `project_count` per developer

---

### Phase 4: Images Storage Strategy

**Approach 1: Store URLs Only (Recommended)**
- Store all image URLs in `images` JSONB column
- No re-hosting (uses Reelly CDN)
- Fast sync, minimal storage

**Approach 2: Mirror to Supabase Storage (Optional)**
- Download images to Supabase Storage
- Provides CDN independence
- Requires `SUPABASE_STORAGE_BUCKET` setup
- Slower sync but more reliable long-term

For initial implementation, use Approach 1 (URLs only) as it matches the "same layout, same content" requirement.

---

### Phase 5: Sync UI Enhancements

**File:** `src/components/listing-admin/ReellyImportPanel.tsx`

Add new sync options:

```text
Current Sync Options:
┌─────────────────────────────────────────────┐
│ [Test API] [Quick Sync] [Full Sync]         │
└─────────────────────────────────────────────┘

Enhanced Sync Options:
┌─────────────────────────────────────────────┐
│ [Test API]                                  │
│                                             │
│ Step 1: [Sync All Projects]   1,805 avail   │
│ Step 2: [Sync All Developers] 549 avail     │
│ Step 3: [Fetch Missing Details] batch 50    │
│ Step 4: [Extract Areas]                     │
│                                             │
│ Or: [FULL EXTRACTION] (All steps)           │
└─────────────────────────────────────────────┘
```

---

### Phase 6: Data Mapping Table

| Reelly API Field | Database Column | Notes |
|------------------|-----------------|-------|
| `id` | `reelly_id` | Integer |
| `name` | `name` | String |
| `developer` | `developer_name` | String (also links developer_id) |
| `cover_image.url` | `cover_image_url` | Primary image |
| `images[]` | `images` (JSONB) | Full gallery |
| `video_reviews[]` | `video_url`, `highlights` | Video content |
| `construction_status` | `construction_status` | Normalized |
| `sale_status` | `sale_status` | Normalized |
| `overview` | `description` | Markdown content |
| `short_description` | `short_description` | Brief text |
| `completion_date` | `expected_completion` | Display format |
| `completion_datetime` | `handover_date` | ISO date |
| `location.district` | `area_name` | Area/district |
| `location.region` | `emirate` | Emirate |
| `location.latitude` | `latitude` | Decimal |
| `location.longitude` | `longitude` | Decimal |
| `min_price` | `price_from` | Number |
| `max_price` | `price_to` | Number |
| `min_size` | `size_min` | sqft |
| `max_size` | `size_max` | sqft |
| `units_count` | `total_units` | Integer |
| `building_count` | `building_count` | Integer |
| `video_reviews[].url` | `video_url` | First video |
| `amenities[]` | `amenities` | Array |
| `floor_plans[]` | `floor_plan_types` | JSONB |
| `documents[]` | `documents` | JSONB |
| `units[]` | `unit_types` | JSONB with pricing |

---

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/reelly-api-sync/index.ts` | **Modify** | Add detailed project fetch, gallery extraction |
| `supabase/functions/reelly-fetch-details/index.ts` | **Create** | Batch fetch missing details |
| `supabase/functions/reelly-developers-sync/index.ts` | **Modify** | Extract full developer data |
| `src/components/listing-admin/ReellyImportPanel.tsx` | **Modify** | Add "Fetch Details" button, progress tracking |
| `src/types/reellyApi.ts` | **Modify** | Add detailed interfaces |
| `supabase/config.toml` | **Modify** | Register new function |

---

## Expected Extraction Results

After full implementation:

| Entity | Count | Data Completeness |
|--------|-------|-------------------|
| Projects | 1,805 | Full (all fields) |
| Developers | 549 | Full (logo, description, offices) |
| Areas | 65+ | Auto-extracted from projects |
| Images per Project | 5-20 | Gallery + cover |
| Documents per Project | 0-3 | Brochures, floor plans |

---

## Execution Order

1. **Update reelly-api-sync** - Enhanced mapping with all fields
2. **Create reelly-fetch-details** - Batch detail fetcher for gallery/docs
3. **Update reelly-developers-sync** - Full developer data
4. **Update ReellyImportPanel** - New UI controls
5. **Deploy all functions**
6. **Run Full Extraction**:
   - Test API Connection
   - Sync All Projects (1,805)
   - Sync All Developers (549)
   - Fetch Missing Details (batch)
   - Extract Areas
7. **Verify in Approval Queue** - All projects with complete data

---

## Performance Considerations

- **Batch Size**: 100 projects per page (optimal for API limits)
- **Detail Fetch**: Parallel fetch 5 at a time with 500ms delays
- **Total Time Estimate**: 
  - Projects sync: ~2-3 minutes
  - Developer sync: ~30 seconds
  - Detail fetch: ~15-20 minutes (if needed)
  - Areas extraction: ~10 seconds

---

## Verification Checklist

After extraction, verify each project has:
- [ ] Name and slug
- [ ] Developer linked
- [ ] Cover image URL
- [ ] Gallery images (if available)
- [ ] Video URL (if available)
- [ ] Location/coordinates
- [ ] Price range
- [ ] Size range
- [ ] Handover date
- [ ] Construction status
- [ ] Sale status
- [ ] Description
