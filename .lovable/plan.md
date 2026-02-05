
# Reelly API Integration - Complete Fix & Performance Overhaul

## Issues Identified

### Critical Issue 1: Edge Functions Not Deployed
**Root Cause:** The edge functions `reelly-api-sync` and `reelly-developers-sync` exist in the codebase but are NOT deployed to Supabase. Testing confirms both return HTTP 404 "Requested function was not found".

**Missing from `supabase/config.toml`:**
- `reelly-api-sync`
- `reelly-developers-sync`
- `reelly-areas-sync`

### Critical Issue 2: Test API Results Disappear
The `apiConnected` and `totalProjects` states are reset when clicking "Test API Connection" before the response returns, causing results to vanish.

### Critical Issue 3: Developer Sync Shows Count But Doesn't Extract
When clicking "Quick Sync" or "Full Sync" for developers, only the count is shown because:
1. Edge function not deployed (404 error)
2. Results UI section only appears for `mode !== "test"` but errors clear the result

### Critical Issue 4: Slow Admin Panel Scrolling
Multiple performance issues in ListingAdmin:
- No virtualization for large project lists
- No lazy loading for images
- Multiple inline map components
- Heavy re-renders on scroll

---

## Technical Implementation Plan

### Phase 1: Deploy Missing Edge Functions

**File:** `supabase/config.toml`

Add configuration for all Reelly functions:
```toml
[functions.reelly-api-sync]
verify_jwt = false

[functions.reelly-developers-sync]
verify_jwt = false

[functions.reelly-areas-sync]
verify_jwt = false
```

### Phase 2: Fix Developer Sync API Limit Issue

**File:** `supabase/functions/reelly-developers-sync/index.ts`

The current code limits to 1000 developers max but the API returns paginated results. Need to:
1. Implement proper pagination loop for full sync
2. Handle `next` cursor from API response
3. Process all 549 developers across multiple pages

Current (line 98):
```typescript
const limit = mode === "quick" ? 50 : mode === "full" ? 1000 : 20;
```

Fix:
```typescript
// For full sync, iterate through all pages
// API returns: { count, next, previous, results }
// Loop until next === null to get all developers
```

### Phase 3: Fix Test Results Persistence

**File:** `src/components/listing-admin/ReellyImportPanel.tsx`

Current problem (lines 419-421):
```typescript
const handleTestApiConnection = async () => {
  setIsTestingApi(true);
  setApiConnected(null);  // ← This clears the result prematurely
```

Fix:
```typescript
const handleTestApiConnection = async () => {
  setIsTestingApi(true);
  // Don't reset apiConnected here - only on failure
```

Also fix developer sync (lines 354-357):
```typescript
const handleSyncDevelopers = async (mode) => {
  setIsSyncingDevs(true);
  // Don't reset devSyncResult for test mode
  if (mode !== "test") setDevSyncResult(null);
```

### Phase 4: Persist Results in State

Add state persistence so results survive between sync operations:

```typescript
// Add localStorage persistence for key results
useEffect(() => {
  const cached = localStorage.getItem('reelly-api-cache');
  if (cached) {
    const { totalProjects, totalDevelopers, lastTested } = JSON.parse(cached);
    if (Date.now() - lastTested < 3600000) { // 1 hour cache
      setTotalProjects(totalProjects);
      setTotalDevelopers(totalDevelopers);
      setApiConnected(true);
    }
  }
}, []);

// Save on successful test
if (data?.success) {
  localStorage.setItem('reelly-api-cache', JSON.stringify({
    totalProjects: data.total_available,
    totalDevelopers: totalDevelopers,
    lastTested: Date.now()
  }));
}
```

### Phase 5: Performance Optimization

**File:** `src/components/listing-admin/ReellyImportPanel.tsx`

1. **Add virtual scrolling for results dialog:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
// Replace the simple map with virtualized list
```

2. **Lazy load sync result cards:**
```typescript
const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
// Only render detailed stats when expanded
```

3. **Debounce database count queries:**
```typescript
// In useSyncJobs.ts, add debounce to prevent rapid re-queries
const debouncedFetchCounts = useMemo(
  () => debounce(fetchLiveCounts, 1000),
  [fetchLiveCounts]
);
```

**File:** `src/pages/ListingAdmin.tsx`

1. **Virtual scroll for project grid:**
```typescript
// Use window virtualization for large project lists
const rowVirtualizer = useWindowVirtualizer({
  count: filteredProjects?.length || 0,
  estimateSize: () => 120,
  overscan: 5,
});
```

2. **Lazy image loading:**
```typescript
<img loading="lazy" src={project.thumbnail} />
```

3. **Memoize filtered projects:**
```typescript
const filteredProjects = useMemo(() => {
  return projects?.filter(p => /* filters */) || [];
}, [projects, searchQuery, filterDeveloper, filterEmirate]);
```

### Phase 6: Developer Full Sync with Pagination

**File:** `supabase/functions/reelly-developers-sync/index.ts`

Complete rewrite of sync logic:

```typescript
// Full sync: paginate through all developers
if (mode === "full") {
  let allDevelopers: ReellyDeveloper[] = [];
  let offset = 0;
  const pageSize = 100;
  
  while (true) {
    const apiUrl = `https://api-reelly.up.railway.app/api/v2/clients/developers?limit=${pageSize}&offset=${offset}`;
    const response = await fetch(apiUrl, { headers: { "X-API-Key": apiKey } });
    const data = await response.json();
    
    const devs = Array.isArray(data) ? data : data.results || [];
    allDevelopers = [...allDevelopers, ...devs];
    
    // Check if more pages
    if (!data.next || devs.length < pageSize) break;
    offset += pageSize;
    
    // Safety limit
    if (offset > 10000) break;
  }
  
  developers = allDevelopers;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add 3 missing function configurations |
| `supabase/functions/reelly-developers-sync/index.ts` | Implement pagination for full sync |
| `supabase/functions/reelly-api-sync/index.ts` | Minor error handling improvements |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Fix result persistence, add caching, optimize rendering |
| `src/hooks/useSyncJobs.ts` | Add debouncing for count queries |
| `src/pages/ListingAdmin.tsx` | Add virtual scrolling and memoization |

---

## Expected Outcomes

1. **Edge functions deployed:** All Reelly API calls will work (no more 404 errors)
2. **Developer sync works:** All 549 developers extracted with pagination
3. **Results persist:** Test API connection results stay visible
4. **Fast scrolling:** Virtual scrolling and lazy loading for smooth performance
5. **Cached state:** API totals cached for 1 hour to prevent redundant calls

---

## Deployment Steps

After code changes:
1. Edge functions will auto-deploy with updated config.toml
2. Verify deployment with test API call
3. Run full developer sync to extract all 549 developers
4. Run full project sync to extract all 1,803 projects
