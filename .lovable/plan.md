

## Issues Identified

### 1. Sarah extraction is extremely slow (5 links = timeout)
The edge function `extract-listing-from-link` processes URLs **sequentially** in a `for` loop (line 357). Each URL requires: Firecrawl scrape (~8s), Gemini Pro AI extraction (~5-10s), document download/storage, and geocoding. For 5 URLs, that's 60-90 seconds total -- well beyond edge function timeout limits (typically 60s).

### 2. Developer name missing on project detail pages
62 published projects have `developer_name` set (e.g., "Dar Global" for Trump International Resort) but `developer_id` is NULL, so the `developer:developers(...)` join returns nothing. The detail page only reads from the join result, ignoring the `developer_name` column entirely.

---

## Implementation Plan

### Fix 1: Parallel URL processing in edge function
Refactor the URL extraction loop from sequential `for` to parallel `Promise.allSettled`. This cuts 5-URL processing from ~90s to ~20s.

**File:** `supabase/functions/extract-listing-from-link/index.ts`
- Replace `for (const rawUrl of urlList)` (line 357) with `Promise.allSettled(urlList.map(async (rawUrl) => { ... }))`
- Each URL runs its own scrape + AI + storage pipeline concurrently
- Collect results from settled promises at the end

### Fix 2: Developer fallback in ProjectDetail
When `project.developer` (the join) is null but `project.developer_name` exists, create a fallback developer object using the name and a generated slug.

**File:** `src/pages/ProjectDetail.tsx` (lines 177-186)
- Change the developer mapping from:
  ```
  developer: project.developer ? { name: project.developer.name, ... } : null
  ```
  to:
  ```
  developer: project.developer 
    ? { name: project.developer.name, slug: project.developer.slug, ... } 
    : project.developer_name 
      ? { name: project.developer_name, slug: project.developer_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
      : null
  ```

### Fix 3: Backfill missing developer_id for 62 published projects
Run a database migration that matches existing `developer_name` values against the `developers` table and sets `developer_id` where possible.

**Migration SQL:**
```sql
UPDATE projects p
SET developer_id = d.id
FROM developers d
WHERE p.developer_id IS NULL
  AND p.developer_name IS NOT NULL
  AND LOWER(TRIM(p.developer_name)) = LOWER(TRIM(d.name));
```

For developers that don't exist in the `developers` table yet, auto-create them:
```sql
INSERT INTO developers (name, slug)
SELECT DISTINCT p.developer_name, 
  LOWER(REGEXP_REPLACE(TRIM(p.developer_name), '[^a-zA-Z0-9]+', '-', 'g'))
FROM projects p
LEFT JOIN developers d ON LOWER(TRIM(d.name)) = LOWER(TRIM(p.developer_name))
WHERE p.developer_id IS NULL
  AND p.developer_name IS NOT NULL
  AND d.id IS NULL
ON CONFLICT DO NOTHING;
```
Then re-run the UPDATE to link them.

---

## Files to change
- `supabase/functions/extract-listing-from-link/index.ts` -- parallelize URL processing
- `src/pages/ProjectDetail.tsx` -- developer_name fallback (lines 177-186)
- Database migration -- backfill developer_id

