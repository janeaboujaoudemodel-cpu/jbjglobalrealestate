
# Fix Backfill Data Pipeline, Persist Results, and Enrich Sunset Bay Grand

## Critical Bugs Found

### 1. Column Name Mismatches -- Why Images and Documents Are Not Being Saved

Both backfill functions have **wrong column names** that cause silent insert failures:

**`project_images` table actual columns**: `image_url`, `alt_text`, `display_order`, `data_source`

| Function | Uses (WRONG) | Should Be |
|----------|-------------|-----------|
| `reelly-backfill-details` | `url`, `alt` | `image_url`, `alt_text` |
| `reelly-backfill-projects` | `image_url`, `alt_text` | Correct |

**`project_documents` table actual columns**: `file_url`, `file_name`, `document_type`, `data_source`

| Function | Uses (WRONG) | Should Be |
|----------|-------------|-----------|
| `reelly-backfill-details` | `url`, `name`, `type` | `file_url`, `file_name`, `document_type` |
| `reelly-backfill-projects` | `url`, `name`, `type` | `file_url`, `file_name`, `document_type` |

This is the root cause of zero images and zero documents being saved for all 1,500+ backfilled projects.

### 2. Backfill Results Not Persisting Across Refreshes

The backfill stats and results are stored in React `useState` only -- they reset on page refresh. The `sync_jobs` table exists but the UI never reads from it on mount.

### 3. Backfill Results Not Clickable

The processed/updated/failed counts are plain text divs -- not clickable to see which projects were affected.

### 4. Sunset Bay Grand Missing All Data

The project has `detail_fetched_at` set but zero images and zero documents due to the column mismatch bug above. It also needs the previously uploaded brochure data restored.

## Plan

### Step 1: Fix Column Names in Both Backfill Functions

**File: `supabase/functions/reelly-backfill-details/index.ts`**

Fix image insert (lines 143-148):
```
// FROM: { project_id, url: img.url, alt: img.alt, display_order }
// TO:   { project_id, image_url: img.url, alt_text: img.alt, display_order }
```

Fix document insert (lines 162-167):
```
// FROM: { project_id, type: doc.type, url: doc.url, name: doc.name }
// TO:   { project_id, document_type: doc.type, file_url: doc.url, file_name: doc.name }
```

**File: `supabase/functions/reelly-backfill-projects/index.ts`**

Fix document upsert (lines 478-491):
```
// FROM: { project_id, url: doc.url, name: doc.name, type: doc.type, data_source }
// TO:   { project_id, file_url: doc.url, file_name: doc.name, document_type: doc.type, data_source }
```

Also fix the `onConflict` from `"project_id,url"` to `"project_id,file_url"`.

### Step 2: Re-Run Backfill for Already-Fetched Projects

Since 1,501 projects were "backfilled" but their images/documents silently failed, we need to:
- Reset `detail_fetched_at` to NULL for projects that have 0 images so the backfill can re-process them
- OR add a "Force Re-Backfill" button that passes `force_refresh: true`

Database fix:
```sql
UPDATE projects SET detail_fetched_at = NULL 
WHERE reelly_id IS NOT NULL 
AND detail_fetched_at IS NOT NULL
AND id NOT IN (SELECT DISTINCT project_id FROM project_images);
```

### Step 3: Persist Backfill Results in `sync_jobs` Table

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**

- On component mount, query `sync_jobs` for the latest `reelly_backfill` job to restore previous results
- After each backfill batch, save cumulative results to `sync_jobs`
- Show persisted results when returning to the page
- Add a "Clear Results" button to reset

### Step 4: Make Backfill Results Clickable

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**

- Store the list of processed project names/IDs in the backfill result
- Make the "Processed", "Updated", "Failed" count cards clickable
- On click, show a scrollable list/modal of the project names with links to their detail pages

### Step 5: Restore Sunset Bay Grand Data

Query the database for any previously uploaded brochure/document data. If not found in the database, the project needs manual re-enrichment. Reset its `detail_fetched_at` to NULL so the fixed backfill can re-fetch from Reelly with correct column names.

```sql
UPDATE projects SET detail_fetched_at = NULL WHERE id = 'f0483cf4-716d-4d96-9bd9-15b04c61e1fd';
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/reelly-backfill-details/index.ts` | Fix `url`->`image_url`, `alt`->`alt_text`, `type`->`document_type`, `name`->`file_name` |
| `supabase/functions/reelly-backfill-projects/index.ts` | Fix document columns: `url`->`file_url`, `name`->`file_name`, `type`->`document_type` |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Persist backfill results in sync_jobs; load on mount; make counts clickable with project list |
| Database | Reset `detail_fetched_at` for projects with 0 images; reset Sunset Bay Grand specifically |
