
# Build Strong Reelly API Connectivity: Complete Audit & Enhancement Plan

## Current State Assessment

After a thorough audit of all Reelly-related edge functions and the official API documentation at `docs.reelly.ai`, here is what is working and what is missing:

### What Works Well
- `reelly-api-sync`: Full project list sync with cursor-based pagination and resume capability
- `reelly-backfill-projects` / `reelly-backfill-details`: Fetching detail data per project (`/projects/{id}`)
- `reelly-developers-sync`: Developer sync from `/developers` endpoint
- `reelly-areas-sync`: Area extraction from project location data
- `reelly-bulk-enrich`: Enriching project images, documents, amenities
- `_shared/reelly-types.ts`: Shared types and extractors are solid
- Authentication: Correctly uses `X-API-Key` header (per official docs)

### What Is Missing / Broken

**1. Unused Official Endpoints (never called anywhere)**
- `GET /projects/markers` — Lightweight map markers (should replace heavy project loads for the map view)
- `GET /projects/statuses` — Dynamic construction status dictionary
- `GET /projects/sale-statuses` — Dynamic sale status dictionary  
- `GET /units/types` — Unit type dictionary (Apartment, Villa, Studio, etc.)
- `GET /locations` — Official structured location list with coordinates
- `GET /regions` — Official region list
- `GET /countries` — Countries where projects exist
- `GET /developers/logos` — Lightweight developer + logo list (faster than full `/developers` for logo sync)
- `GET /developers/{id}/logo` — Individual developer logo fetch

**2. Authentication Issue in `reelly-projects` function**
The frontend-facing `reelly-projects` edge function only sends `X-API-Key` but NOT the `Authorization: Bearer` header, while the official docs and all other functions use both. This inconsistency may cause intermittent auth failures.

**3. `reelly-projects` Function: Slow, No DB Cache**
This is the most-called function (every page load of the property listings). It hits the live Reelly API on every request with no caching. Given ~1,804 projects in DB, it should serve from the local `projects` table for speed, and only call the live API for the markers map view.

**4. Filter Parameter Mismatch**
The `reelly-projects` function uses `offset`-based pagination (our custom format) but the frontend hook (`useReellyProjects.ts`) also uses offset. However, the Reelly API returns `next` URL (cursor), not offset. The `reelly-projects` function translates this correctly, but when filters are applied and the API returns 0 results, it falls through silently. The `Authorization: Bearer` header is also missing.

**5. Missing Rate Limit Handling (429)**
None of the sync functions handle HTTP 429 (Too Many Requests) with exponential backoff, except `reelly-developers-sync`. The `reelly-api-sync` will hard-fail on rate limits.

**6. No `/projects/markers` Integration**
The map view loads full project objects. The API has a dedicated `/projects/markers` endpoint that returns only `id, name, developer, location, cover_image, sale_status, min_price, status` — a fraction of the data. This would make maps load 5-10x faster.

**7. No Dictionary Sync**
Sale statuses and construction statuses are hardcoded strings. If Reelly adds new statuses, the mapping breaks silently.

---

## Implementation Plan

### Step 1: Create a New `reelly-dictionary-sync` Edge Function

This new function will call all the metadata/dictionary endpoints and cache results in the database:
- `GET /projects/statuses` → store in `site_settings` or a new `reelly_dictionaries` table
- `GET /projects/sale-statuses` → same
- `GET /units/types` → same
- `GET /regions` → update `areas` table region names
- `GET /countries` → awareness of active countries
- `GET /developers/logos` → fast bulk logo refresh for `developers` table

This runs once on demand and as part of the daily auto-sync.

### Step 2: Create `reelly-markers-sync` Edge Function

New function that calls `GET /projects/markers` and stores lightweight marker data (lat, lng, name, price, status) in a new `project_markers` table or updates existing `projects` table coordinates. This enables the map page to load instantly from the database instead of doing a heavy API call.

### Step 3: Fix `reelly-projects` Edge Function (Critical)

**Problem**: It calls the live Reelly API on every frontend request. This is slow (500ms+) and burns API rate limits.

**Fix**: Rewrite the function to serve from the local `projects` table (same as `PropertiesReelly.tsx` already does for the listing). Keep the live Reelly API call as a fallback only when explicitly requested via a `?source=live` param.

Add the missing `Authorization: Bearer` header to the live API call.

### Step 4: Add Rate Limit Handling to `reelly-api-sync`

Add 429 detection with exponential backoff (5s → 10s → 20s → 40s) matching the pattern already in `reelly-developers-sync`. Cap retry at 4 attempts.

### Step 5: Enhance `_shared/reelly-types.ts`

Add:
- Official filter parameter names as constants (`REELLY_FILTERS`) so all functions use the same parameter names
- `REELLY_API_ENDPOINTS` constant map for all endpoints (markers, dictionaries, etc.)
- `fetchReellyWithRetry()` shared helper (currently duplicated across 3+ functions)
- Proper `REELLY_API_DEVELOPERS_BASE` constant

### Step 6: Add `reelly-developer-logos-fast-sync` capability

Use `GET /developers/logos` to do a fast bulk logo refresh. This endpoint returns just `id, name, logo` for all developers — much faster than paginating through the full `/developers` endpoint. Update the daily auto-sync to use this for logo refreshes.

### Step 7: Wire Dictionary Sync into Daily Auto-Sync

Add Step 6 to `daily-reelly-auto-sync` to call `reelly-dictionary-sync` so statuses stay fresh.

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/reelly-dictionary-sync/index.ts` | Fetch all metadata endpoints, cache in DB |
| `supabase/functions/reelly-markers-sync/index.ts` | Fetch `/projects/markers`, update project coords |

## Files to Edit

| File | Changes |
|------|---------|
| `supabase/functions/_shared/reelly-types.ts` | Add `REELLY_API_ENDPOINTS`, `fetchReellyWithRetry()`, developer base URL constants |
| `supabase/functions/reelly-projects/index.ts` | Fix auth header, serve from DB by default, use live API only as fallback |
| `supabase/functions/reelly-api-sync/index.ts` | Add 429 rate limit handling with exponential backoff |
| `supabase/functions/daily-reelly-auto-sync/index.ts` | Add dictionary sync step |

## Database Changes

A new migration to create `reelly_dictionaries` table:

```sql
CREATE TABLE IF NOT EXISTS public.reelly_dictionaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dict_type text NOT NULL,  -- 'sale_statuses', 'construction_statuses', 'unit_types', 'regions'
  key text NOT NULL,
  label text NOT NULL,
  metadata jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(dict_type, key)
);
```

This table caches all dynamic Reelly lookup values so the app always has fresh, accurate status labels.

---

## Technical Summary

### Why Serve Property Listings from Local DB?

The `projects` table already has ~1,804 published records synced from Reelly. Serving from DB means:
- Response time: 50-100ms vs 500-800ms (live API)
- No rate limit risk on browsing
- Filters work even if Reelly API is down
- The live API is used only for sync jobs (scheduled, admin-triggered)

### Authentication Clarification (from official docs)

Per `docs.reelly.ai`, **only `X-API-Key` is required**. The `Authorization: Bearer` header is an extra safety measure we added per the architecture spec. We keep both headers since existing syncs rely on this pattern and it causes no harm.

### Rate Limits

The API enforces 300-600 requests/minute. With `batchSize=100` and 1-page sync operations, we are well within limits. The new 429 handling prevents crash on burst usage.
