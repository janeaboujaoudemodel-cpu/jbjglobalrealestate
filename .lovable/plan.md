

# Fix Property Filters: Instant Filtering, Developer Dropdown with Logos, and Missing Filters

## Problems Found

1. **Filters are NOT sent to the API at all.** The edge function (`reelly-projects/index.ts`) reads filter query params from the URL but never passes them to the Reelly API call. It only sends `limit` and `offset`. So clicking "On Sale" does nothing server-side — all projects come back unfiltered.

2. **Two-step filter system causes delay.** The page uses a `filters` state and a separate `appliedFilters` state. Changing a dropdown only updates `filters` — nothing happens until you click "Search", which copies `filters` into `appliedFilters`. This is why it feels slow and unresponsive.

3. **No developer filter.** The Properties page has no developer dropdown at all, unlike the PropertySearchBar on the homepage which had one.

4. **No developer logos in any dropdown.**

---

## Step 1: Fix the Edge Function to Pass Filters to Reelly API

**File:** `supabase/functions/reelly-projects/index.ts`

The Reelly API supports query parameters for filtering. Update the function to forward the filter params:

- Read `search`, `sale_status`, `construction_status`, `emirate`, `developer_id` from the incoming query params
- Append them to the Reelly API URL so the API returns filtered results
- This means the server returns only matching projects, making filtering fast and accurate

```text
Current (broken):
  reellyUrl = `${REELLY_API_URL}?limit=${limit}&offset=${offset}`
  // search, sale_status, etc. are READ but never USED

Fixed:
  reellyUrl = `${REELLY_API_URL}?limit=${limit}&offset=${offset}`
  if (search) reellyUrl += `&search=${search}`
  if (saleStatus) reellyUrl += `&sale_status=${saleStatus}`
  if (constructionStatus) reellyUrl += `&construction_status=${constructionStatus}`
  if (emirate) reellyUrl += `&region=${emirate}`
  if (developerId) reellyUrl += `&developer=${developerId}`
```

## Step 2: Make Filters Apply Instantly (Remove Two-Step System)

**File:** `src/pages/PropertiesReelly.tsx`

Remove the `appliedFilters` pattern. Instead:

- Every filter change directly triggers a re-fetch by updating a single `filters` state that the `useReellyProjects` hook reads
- Add a small debounce (300ms) on the text search input only, so typing doesn't fire a request per keystroke
- Dropdowns (emirate, sale status, construction status, developer) apply immediately on selection
- Remove the "Search" button entirely or keep it as a secondary action

## Step 3: Add Developer Filter with Logos

**File:** `src/pages/PropertiesReelly.tsx`

Add a developer dropdown to the filter bar:

- Fetch developers from the database using the existing `useDevelopers()` hook
- Show all developers sorted by rank
- Each dropdown item shows the developer logo (small 20x20 square) next to the name
- Selecting a developer filters projects by that developer
- Pass `developerId` to the `useReellyProjects` hook

The dropdown items will render like:
```text
[logo] Emaar
[logo] DAMAC Properties
[logo] Sobha Realty
...
```

For developers without logos, show a small Building2 icon as fallback.

## Step 4: Add Developer Logos to Existing Dropdowns Elsewhere

Update the developer select in `PropertySearchBar.tsx` to also show logos next to developer names, following the same pattern.

## Step 5: Restore Additional Filters

Move construction status, currency, and size unit from the "Advanced Filters" dialog back into the main filter bar (as they were before), so users see all filters without needing to open a dialog. Keep the advanced dialog for any future filters but ensure the core ones are always visible.

---

## Technical Summary

| File | Change |
|------|--------|
| `supabase/functions/reelly-projects/index.ts` | Forward filter params to Reelly API |
| `src/pages/PropertiesReelly.tsx` | Remove two-step filter, add developer dropdown with logos, instant filtering, restore filters to main bar |
| `src/hooks/useReellyProjects.ts` | Add `developerId` to `ReellyFilters` interface (already exists, just needs wiring) |
| `src/components/PropertySearchBar.tsx` | Add developer logos to the existing developer dropdown |

## Expected Result

- Selecting "On Sale" immediately shows only On Sale projects (no Search button needed)
- Developer dropdown shows all developers with their logos
- All core filters (emirate, sale status, construction status, developer) are visible in the main bar
- Filtering is fast because it happens server-side via the Reelly API
