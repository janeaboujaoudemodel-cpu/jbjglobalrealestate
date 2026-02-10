
# Fix All Enrichment & Backfill Functions

## Root Cause Analysis

After testing the actual API endpoints and database, here are the real issues:

### Problem 1: Backfill finds "0 projects needing backfill"
The `reelly-backfill-details` function filters for `detail_fetched_at IS NULL`, but ALL 1,802 projects already have this timestamp set from a previous run. The previous backfill stamped the timestamp but the Reelly API returned empty arrays, so data was never actually populated.

**Fix:** Change the query to look for projects with EMPTY data (empty amenities, no floor plans, no documents) regardless of `detail_fetched_at`. Also add a `force` mode to re-fetch even if previously attempted.

### Problem 2: Reelly API returns 0 amenities/floor plans/documents
Direct testing confirms the Reelly detail endpoint returns 0 amenities, 0 floor plans, 0 documents for every project tested. The API simply does not include this data in its current response. The `fetchReellyProject` function in `enrich-project-test` does `data?.data || data` which may also incorrectly unwrap nested responses.

**Fix:** Log the raw API response to diagnose the exact structure. Also check if there's a different API version or endpoint that includes this data (e.g., `/api/v2/clients/projects/{id}/details` or query parameters like `?include=amenities,floor_plans`).

### Problem 3: Batch enrichment query misses all projects
The batch mode in `enrich-project-test` uses `amenities.is.null` but the column is `text[]` type and stores `{}` (empty array) not NULL. So the filter matches nothing.

**Fix:** Change the filter to check for both NULL and empty arrays: use a raw filter or `.or("amenities.is.null,amenities.eq.{}")`.

### Problem 4: Provident slug matching fails for most projects
Project slugs like `riviera-59-azizi-331` don't match Provident URLs. The `generateSlugVariants` function tries limited variants but misses Provident's naming conventions (e.g., Provident might list it as `azizi-riviera-59` or just `riviera-59`).

**Fix:** Improve slug generation to try more variants: reverse developer-project order, try project name only without numbers, try developer-name prefix pattern.

## Changes

### File 1: `supabase/functions/reelly-backfill-details/index.ts`

**Change the query logic (lines 40-46):**
- Remove `.is("detail_fetched_at", null)` filter
- Instead, find projects where amenities is NULL or empty, AND floor_plan_types is NULL or empty
- Add ability to force re-fetch by accepting `force: true` in the request body
- When updating, only set `detail_fetched_at` if data was ACTUALLY populated (not empty)

```text
Before:
  .not("reelly_id", "is", null)
  .is("detail_fetched_at", null)

After:
  .not("reelly_id", "is", null)
  // Find projects with missing data, not just missing timestamp
  // amenities is text[] so empty = '{}'
  .or("amenities.is.null,amenities.eq.{}")
```

**Also fix the update logic (lines 90-92):**
- Only set `detail_fetched_at` if at least ONE field was actually populated with data
- Log the raw API response structure for the first project to diagnose

### File 2: `supabase/functions/enrich-project-test/index.ts`

**Fix batch query filter (lines 66-70):**
- Change `amenities.is.null` to also check for empty arrays
- The `amenities` column is `text[]`, not jsonb, so empty = `{}`
- Similarly check other fields that might be empty vs null

```text
Before:
  .or("amenities.is.null,faqs.is.null,floor_plan_types.is.null,description.is.null,usp_bullets.is.null")

After:
  .or("amenities.is.null,amenities.eq.{},floor_plan_types.is.null,floor_plan_types.eq.[],description.is.null,faqs.is.null,faqs.eq.[]")
```

**Fix Reelly API response parsing (line 22):**
- Add logging of raw response keys to understand actual API structure
- Try accessing nested data paths like `data.amenities`, `data.project.amenities`

**Improve Provident slug variants (lines 26-42):**
- Add developer-first pattern: `{developer}-{project}` (e.g., `azizi-riviera-59`)
- Add project name without trailing numbers
- Add name without developer reference
- Try just the first word(s) of the project name

### File 3: `supabase/functions/provident-batch-extract/index.ts`

**Add more slug variations (lines 27-51):**
- Try developer-name prefix: `{developer}-{project-name}`
- Try just the project name without developer
- Try name with common suffixes like `-by-{developer}`

### File 4: `supabase/functions/_shared/reelly-types.ts`

**Add debug logging in extract functions:**
- Log the top-level keys of the Reelly project response in `extractAmenities` to see what fields actually exist in the API response
- This will reveal the correct field names for amenities, floor plans, etc.

## Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Backfill = 0 projects | `detail_fetched_at IS NULL` but all timestamps set | Query by empty data, not missing timestamp |
| Reelly = 0 amenities | API may not include these fields, or response is wrapped differently | Log raw response, try alternate data paths |
| Batch enrichment = 0 | `amenities.is.null` but column has `{}` (empty array) | Check for both NULL and empty |
| Provident = 0 matches | Slug variants too limited | Add more slug patterns (dev-first, name-only) |
| "1300 updated" but 0 real updates | Timestamp set even when no data found | Only mark done when data populated |
