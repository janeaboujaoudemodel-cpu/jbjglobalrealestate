
# Server-Side Reelly API Sync Implementation Plan

## Current State Analysis

### What Exists
1. **`reelly-api-sync` edge function** - Already syncs projects to `pending_project_imports` table for manual approval
2. **`REELLY_API_KEY` secret** - Already configured with the JWT token
3. **Frontend fetches ALL projects at once** - `useProjects()` hook queries the entire `projects` table
4. **No pagination on frontend** - The `/properties` page loads all projects client-side, then filters/sorts in memory

### Current Problems
1. **No server-side pagination** - Loading 1800+ projects at once is inefficient
2. **No direct Reelly API proxy** - Frontend cannot request fresh data on-demand
3. **Images only include cover_image** - Gallery images are not fetched from Reelly API
4. **No lazy-loading infrastructure** - All project cards load images immediately

---

## Implementation Plan

### Phase 1: Create Server-Side Reelly Projects Endpoint

**New Edge Function: `reelly-projects`**

This function will:
- Proxy requests to Reelly API with proper authentication
- Support pagination (`limit`, `offset` parameters)
- Return properly mapped project data for frontend consumption
- Cache results briefly to reduce API calls

```text
┌─────────────────┐     ┌────────────────────┐     ┌─────────────────────┐
│   Frontend      │────▶│  reelly-projects   │────▶│   Reelly API        │
│   (24/page)     │◀────│   Edge Function    │◀────│   (1800+ projects)  │
└─────────────────┘     └────────────────────┘     └─────────────────────┘
        │                        │
        │                        ▼
        │              ┌────────────────────┐
        │              │  Transform Data    │
        │              │  • Map fields      │
        │              │  • Format images   │
        │              │  • Normalize status│
        └──────────────┴────────────────────┘
```

**Request Format:**
```typescript
GET /reelly-projects?limit=24&offset=0
```

**Response Format:**
```typescript
{
  success: true,
  data: {
    projects: ReellyProject[],
    pagination: {
      total: 1804,
      limit: 24,
      offset: 0,
      hasMore: true
    }
  }
}
```

---

### Phase 2: Frontend Hook with Pagination

**New Hook: `useReellyProjects`**

Located at: `src/hooks/useReellyProjects.ts`

Features:
- Fetches 24 projects per page
- Uses `useInfiniteQuery` for seamless "Load More" behavior
- Caches pages to prevent refetching
- Returns loading/error states

```typescript
export function useReellyProjects(filters?: FilterParams) {
  return useInfiniteQuery({
    queryKey: ['reelly-projects', filters],
    queryFn: ({ pageParam = 0 }) => 
      fetchReellyProjects({ limit: 24, offset: pageParam, ...filters }),
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasMore 
        ? lastPage.pagination.offset + lastPage.pagination.limit 
        : undefined,
    initialPageParam: 0,
  });
}
```

---

### Phase 3: Image Mapping (Thumbnail + Gallery)

**Reelly API Image Structure:**

According to the existing types, Reelly provides:
- `cover_image.url` - Main thumbnail
- `video_reviews[].thumbnail_url` - Video thumbnails (can be used as gallery)

**Enhanced Image Extraction:**

The edge function will:
1. Use `cover_image.url` as the primary thumbnail
2. Extract any additional images from the full project detail endpoint (if available)
3. Map images to the `ProjectImage` structure:

```typescript
{
  thumbnail: string,      // cover_image.url
  gallery: string[],      // Additional images
  alt: string            // Project name
}
```

---

### Phase 4: Update Properties Page

**Modify: `src/pages/Properties.tsx`**

Changes:
1. Replace `useProjects()` with `useReellyProjects()`
2. Add "Load More" button or infinite scroll trigger
3. Implement lazy-loading for images (already using `loading="lazy"`)
4. Show loading skeleton while fetching next page

**Pagination UI:**
```typescript
// At bottom of project grid
{hasNextPage && (
  <Button 
    onClick={() => fetchNextPage()} 
    disabled={isFetchingNextPage}
  >
    {isFetchingNextPage ? 'Loading...' : 'Load More Projects'}
  </Button>
)}
```

---

### Phase 5: ProjectCard Lazy Loading Enhancement

**Modify: `src/components/ProjectCard.tsx`**

The component already uses:
- `loading="lazy"` via `SafeImage` / `VerifiedMedia`
- Image carousel for multiple images

Enhancements:
1. Add placeholder skeleton while image loads
2. Use `IntersectionObserver` for true lazy-loading
3. Preload next image in carousel on hover

---

## Technical Details

### Edge Function: `reelly-projects/index.ts`

```typescript
// Key implementation points:

1. Read REELLY_API_KEY from environment
2. Build Reelly API URL with pagination params
3. Fetch from Reelly API with X-API-Key header
4. Transform response:
   - Map project fields to frontend schema
   - Format images (thumbnail + gallery)
   - Normalize status labels
5. Return paginated response with total count
```

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/reelly-projects/index.ts` | Server-side Reelly API proxy |
| `src/hooks/useReellyProjects.ts` | Paginated data fetching hook |

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add `[functions.reelly-projects]` config |
| `src/pages/Properties.tsx` | Use new hook, add pagination UI |
| `src/components/ProjectCard.tsx` | Enhanced lazy loading |

---

## API Response Mapping

### Reelly API → Frontend

```typescript
// Reelly API fields → Our frontend fields
{
  id → id
  name → name
  developer → developer_name
  location.district → location
  location.region → emirate
  min_price → price_from
  max_price → price_to
  min_size → size_min
  max_size → size_max
  cover_image.url → thumbnail
  sale_status → status_label
  completion_date → handover_date
  construction_status → construction_status
}
```

---

## Performance Considerations

1. **Page Size: 24 items** - Optimal for 3-column grid (8 rows)
2. **Lazy Loading Images** - Only load visible images
3. **Query Caching** - Cache pages for 5 minutes
4. **Skeleton Loading** - Show placeholders while fetching
5. **Prefetch Next Page** - Load next page in background when user scrolls near bottom

---

## Security

1. **API Key Storage** - `REELLY_API_KEY` stored as Supabase secret (already done)
2. **Rate Limiting** - Reelly API rate limits respected by server-side caching
3. **No Direct API Exposure** - Frontend cannot access Reelly API directly
4. **CORS Headers** - Proper CORS configuration for edge function

---

## Migration Strategy

The implementation will:
1. **NOT delete existing sync** - `reelly-api-sync` continues to populate `pending_project_imports`
2. **Add parallel data source** - New endpoint fetches directly from Reelly for live data
3. **Optional hybrid mode** - Can show database projects OR live Reelly data based on toggle

This allows both:
- Real-time Reelly data for browsing
- Persisted data for approved/curated projects
