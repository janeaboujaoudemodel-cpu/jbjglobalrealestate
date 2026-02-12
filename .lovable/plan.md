

## Fix: Show Database Projects When API is Unavailable

### Root Cause

`PropertiesReelly.tsx` fetches projects exclusively from the live Reelly API edge function. When the API key expires (currently returning `401 Token inactive`), it returns zero projects -- even though **2,410 projects are already saved in the database**.

The existing `useLocalProjectSearch` hook only queries the database when the user types a search term (2+ characters). There is no fallback to load ALL database projects when the API returns nothing.

### Solution

Switch the Properties page to use the **database as the primary data source** via the existing `useProjectsListing()` hook (which already loads up to 2,500 projects from the `projects` table). The Reelly API becomes a secondary enrichment layer that runs in the background -- when available, it merges fresh data; when unavailable, the database projects display normally.

### Technical Changes

#### 1. Update `src/pages/PropertiesReelly.tsx`

- Import `useProjectsListing` from `@/hooks/useProjects`
- Add a call to `useProjectsListing()` to fetch all database projects
- Use the existing `mapDbProjectToReellyProject` helper (from `useLocalProjectSearch.ts`) to convert database projects to the `ReellyProject` format -- but extract it to a shared utility so both files can use it
- Change the data flow:
  - **Primary**: Database projects (always available, 2,410 records)
  - **Merge**: When Reelly API returns data, merge/override with fresher API data (matched by slug)
  - **Result**: Users always see projects, even when the API key expires
- Update `totalCount` to reflect database count when API returns zero
- Client-side filtering (emirate, developer, sale status, construction status, search) applied to the merged dataset

#### 2. Create `src/utils/mapDbToReellyProject.ts`

Extract the `mapDbProjectToReellyProject` function from `useLocalProjectSearch.ts` into a shared utility so both files can use it without duplication.

#### 3. Update `src/hooks/useLocalProjectSearch.ts`

Import the mapping function from the new shared utility instead of defining it inline.

### Data Flow (After Fix)

```text
Database (2,410 projects) ──> Primary data source ──> Always shows
                                      │
Reelly API (live) ─────────> Merge if available ────> Enriches/overrides
                                      │
                               Client-side filters ──> Final display
```

### What Changes for the User

- Properties page will immediately show 2,410+ projects from the database
- If the Reelly API key is renewed later, fresh data merges seamlessly
- Filters (emirate, developer, status) work on database projects via client-side filtering
- Project count shows the real number instead of zero
- No dependency on external API availability for basic browsing

### Files to Create

| File | Purpose |
|------|---------|
| `src/utils/mapDbToReellyProject.ts` | Shared DB-to-ReellyProject mapping utility |

### Files to Edit

| File | Change |
|------|---------|
| `src/pages/PropertiesReelly.tsx` | Add `useProjectsListing` as primary source, merge with API data, client-side filtering |
| `src/hooks/useLocalProjectSearch.ts` | Import shared mapping utility |

