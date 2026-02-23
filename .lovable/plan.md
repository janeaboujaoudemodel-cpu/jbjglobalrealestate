

# Fix: Data Loading Resilience and Recovery

## Problem
The entire website is showing empty/broken because all database requests are failing with connection timeouts (`net::ERR_FAILED`). The root cause is a temporary database connectivity issue, but the app has **zero resilience** -- no retries, no cached fallbacks, no error recovery. When the database hiccups, the entire site goes blank.

## Solution
Add retry logic, aggressive caching, and graceful error states so the site stays functional even during database slowdowns.

---

## Changes

### 1. QueryClient Configuration (src/App.tsx)
Replace `new QueryClient()` with proper defaults:
- **retry: 3** with exponential backoff -- auto-retries failed requests
- **staleTime: 5 minutes** globally -- prevents unnecessary refetches
- **gcTime: 30 minutes** -- keeps cached data available longer
- **refetchOnWindowFocus: false** -- stops aggressive refetching when users tab back

### 2. Add staleTime/gcTime to all hooks missing them
These hooks currently have NO caching config and refetch on every mount:
- `useDevelopers()` in useProjects.ts -- add staleTime: 10min, gcTime: 30min
- `useCommunities()` in useProjects.ts -- add staleTime: 10min, gcTime: 30min
- `useAreas()` in useAreas.ts (the main one) -- already has 5min, increase to 10min
- `useTrendingAreas()` in useProjects.ts -- add staleTime: 10min
- `useAreas()` in useProjects.ts (the lightweight one) -- add staleTime: 10min

### 3. Mega Menu Video Loading
The MegaMenuAreas video (`dubaiDowntownVideo`) is imported as a static asset. The video and areas data both fail when the database is down. The areas data should have retry logic (covered by step 1). The video itself is a local asset so it should load independently of the database.

### 4. Developers Page Empty State
The Developers page already shows "No Developers Found" when data is empty. With retry logic, it will auto-recover. Add a manual "Retry" button to the empty state for user-triggered recovery.

### 5. Properties/Projects Page
Same pattern -- add retry button to the loading/empty state so users can manually retry when auto-retries are exhausted.

---

## Technical Details

**QueryClient config:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Hook updates (example):**
```typescript
export function useDevelopers(includeHidden = false) {
  return useQuery({
    queryKey: ["developers", includeHidden],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => { ... },
  });
}
```

## Files to modify
1. `src/App.tsx` -- QueryClient with retry/cache defaults
2. `src/hooks/useProjects.ts` -- Add staleTime/gcTime to useDevelopers, useCommunities, useTrendingAreas, useAreas
3. `src/hooks/useAreas.ts` -- Increase staleTime on useAreas
4. `src/pages/Developers.tsx` -- Add retry button to empty state
5. `src/pages/PropertiesReelly.tsx` -- Add retry button to empty/error state

