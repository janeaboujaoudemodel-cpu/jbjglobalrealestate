

## Plan: Full Provident Extraction — Complete First-Time Mirror, No Fix/Repair

### Problem
- 1,334 projects with `source='provident'` exist in the database
- **281** missing description, **353** missing price, **1,325** missing handover date
- The `daily-provident-auto-sync` Step 2 only filters for `description.is.null OR amenities.is.null OR size_min.is.null` — misses price, handover, cover image, bedrooms
- Limited to 50 projects per run — far too few for 1,334 projects
- The initial sync (`provident-full-sync` → `developer_projects`) only gets basic listing-page data, not full project-page data

### Solution: Fix the pipeline so every project gets fully extracted on first pass

#### 1. Rewrite `daily-provident-auto-sync` Step 2 filter

**File: `supabase/functions/daily-provident-auto-sync/index.ts`**

Current filter (lines 121-133) checks only 3 fields and limits to 50. Change to:
- Filter for ANY missing critical field: description, price_from, handover_date, amenities, size_min, cover_image_url, bedrooms_min
- Remove the 50-project limit (process ALL incomplete projects)
- Add a batch approach: process in groups of 20 with 2s delay between each to avoid timeouts
- If total exceeds edge function timeout (~300s), process the first 100 and log remaining for next run

#### 2. Make `provident-full-sync` `developer_projects` step trigger deep scrape inline

**File: `supabase/functions/provident-full-sync/index.ts`**

After upserting each project in the `developer_projects` step (lines 315-400), immediately call `provident-scrape-project` for the project page URL — so the FIRST time a project enters the DB, it already has full data. No separate "fix" pass needed.

This means lines 346-361 (the existing upsert) will be followed by an immediate deep scrape call using the project's `source_url`.

#### 3. Update admin UI — show source filter for Provident in backend only

**File: `src/components/listing-admin/SyncDashboard.tsx`**

- The "Run Daily Sync Now" button already calls `startFixAllRunner` which invokes `daily-provident-auto-sync`
- Update the inventory summary to show Provident-specific counts (no_desc, no_price, no_handover) as a breakdown
- Remove all "repair" / "fix" terminology from remaining stats display (lines 1808-1818 still say "repaired")

#### 4. Deploy all edge functions

Functions to deploy:
- `daily-provident-auto-sync` (updated filter + no limit)
- `provident-full-sync` (inline deep scrape)
- `provident-scrape-project` (already upgraded, ensure deployed)

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/daily-provident-auto-sync/index.ts` | Widen Step 2 filter to ALL critical fields, remove 50-project limit, batch processing |
| `supabase/functions/provident-full-sync/index.ts` | After upserting each project in `developer_projects`, immediately call `provident-scrape-project` for full extraction |
| `src/components/listing-admin/SyncDashboard.tsx` | Replace "repaired" with "synced", add Provident field-completeness breakdown |

