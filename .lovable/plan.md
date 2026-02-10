

# Fix: Search Not Finding Projects (Hybrid Search: Reelly API + Local Database)

## Root Cause

The search works correctly -- the keyword "Sunset Bay Grand" IS being sent to the Reelly API. However, the **Reelly API returns 0 results** for this project name. The project does exist in the **local database** (it was synced previously), but the `/properties` page only queries the live Reelly API and never checks the local `projects` table.

This means any project that the Reelly API search can't find will appear missing, even though the data is already stored locally.

## Fix: Add Local Database Fallback Search

When the Reelly API returns few or no results for a search query, also search the local `projects` table and merge the results together. This ensures all synced projects are always findable.

### Changes

**1. Create a new hook: `useLocalProjectSearch`** (in `src/hooks/useLocalProjectSearch.ts`)
- Uses Supabase to query the local `projects` table with `ilike` on the project name
- Only triggers when a search keyword is present
- Returns projects in the same `ReellyProject` shape so they can be merged seamlessly

**2. Update `src/pages/PropertiesReelly.tsx`**
- Import and call `useLocalProjectSearch` with the debounced search term
- Merge local results with Reelly API results, deduplicating by project name (case-insensitive)
- Local results appear at the end of the list (Reelly results take priority)
- Update the total count to reflect merged results

**3. Update the edge function `reelly-projects/index.ts`** (no changes needed -- it already passes search correctly)

### How Deduplication Works

```text
User searches "Sunset Bay Grand"
    |
    +--> Reelly API: 0 results
    |
    +--> Local DB: 1 result (Sunset Bay Grand)
    |
    +--> Merged: 1 result shown
```

If both sources return the same project, deduplicate by matching slugs so no duplicates appear.

### Technical Details

- The local search query: `SELECT * FROM projects WHERE name ILIKE '%search_term%' LIMIT 20`
- Map local `projects` table columns to the `ReellyProject` interface shape (name, slug, price_from, thumbnail, etc.)
- The local fallback only activates when a search keyword exists (not for general browsing)

### Files Changed

- **New file:** `src/hooks/useLocalProjectSearch.ts` -- Hook to search local projects table
- **Modified:** `src/pages/PropertiesReelly.tsx` -- Merge local search results with Reelly API results

