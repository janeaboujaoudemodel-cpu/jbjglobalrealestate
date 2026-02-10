

# Daily Provident Auto-Sync + Sync History Log + Error Fix

## 1. Fix: `daily-reelly-auto-sync` crashes on insert (missing column)

The existing edge function tries to insert into `sync_jobs` with a `results` column that does not exist. The table has `error_log` (jsonb) and `stats_*` integer columns instead.

**File:** `supabase/functions/daily-reelly-auto-sync/index.ts`

Fix the insert to use actual columns:
- `error_log` instead of `results`
- `stats_created`, `stats_updated`, `stats_errors` for step counts
- `source: "reelly"` to tag the job

## 2. New: Daily Provident Auto-Sync edge function

**New file:** `supabase/functions/daily-provident-auto-sync/index.ts`

An orchestrator that runs daily and:
1. Calls `discover-all-projects` (Gatsby page-data discovery -- no Firecrawl needed) to find new Provident listings
2. Calls `provident-areas-sync` to discover new areas
3. Calls `extract-developers-provident` to discover new developers and logos
4. Calls `bulk-approve-imports` to auto-approve all pending Provident imports

Logs results to `sync_jobs` with `job_type: "daily-provident-auto-sync"`.

**Database:** Add a new cron job at 3:30 AM UTC (7:30 AM UAE) to call this function daily, right after the existing `daily-provident-sync` at 3 AM.

## 3. New: Sync History Log panel in Listing Admin

**New file:** `src/components/listing-admin/SyncHistoryLog.tsx`

A new component that shows a table of recent `sync_jobs` entries filtered to auto-sync job types (`daily-reelly-auto-sync`, `daily-provident-auto-sync`). Displays:
- Date/time of each run
- Job type (Reelly or Provident)
- Status (completed / partial / failed)
- Stats: projects synced, developers found, areas found, errors
- Expandable error details

This component will be added as a new tab or card inside the existing `SyncDashboard.tsx`.

## 4. Fix: `reelly-projects` 500 error (already applied)

The last diff already fixed this by returning empty results instead of propagating upstream 500s. No further changes needed.

## Technical Summary

| File | Change |
|------|--------|
| `supabase/functions/daily-reelly-auto-sync/index.ts` | Fix sync_jobs insert to use actual column names |
| `supabase/functions/daily-provident-auto-sync/index.ts` | NEW - daily Provident discovery + auto-approve orchestrator |
| `src/components/listing-admin/SyncHistoryLog.tsx` | NEW - shows daily sync run history with stats |
| `src/components/listing-admin/SyncDashboard.tsx` | Add SyncHistoryLog component as a visible section |
| Database (cron) | Add `daily-provident-auto-sync` cron job at 3:30 AM UTC |

