

# Fix "No Resumable Job Found" Error

## Problem

There are 2 old sync jobs stuck with status "running" from February 1st, but their `next_cursor` is NULL. The UI detects them and shows the "interrupted at page 39" banner, but clicking Resume fails because there's no cursor to resume from. These jobs are stale and cannot be resumed -- they need to be cleaned up.

"Page 39" refers to page 39 of the Reelly API pagination (each page has ~100 projects, total ~89 pages / ~1,800 projects).

## Solution

### 1. Clean up the 2 stuck jobs (database)

Mark the 2 stuck "running" jobs as "completed" since they are over a week old and have no cursor:

```sql
UPDATE sync_jobs 
SET status = 'completed', completed_at = NOW()
WHERE id IN (
  'f082e987-19e5-4f44-8ad0-1c579f27d293',
  'bd482452-509c-4142-87d5-ef987b5ec4f4'
);
```

### 2. Fix the resume logic to prevent this in the future

**File:** `src/components/listing-admin/ReellyImportPanel.tsx`

Update `checkForResumableJob` to only show the resume banner when `next_cursor` is actually present. If a job is "running" or "paused" but has no cursor, it's stuck and should not be shown as resumable.

Current code (line 235):
```typescript
if (!error && data?.has_active_job && data.job) {
```

Change to:
```typescript
if (!error && data?.has_active_job && data.job?.next_cursor) {
```

### 3. Fix the edge function to also filter out stale jobs

**File:** `supabase/functions/reelly-api-sync/index.ts`

In the `check_resume` handler, add a condition: only return `has_active_job: true` if the job has a `next_cursor`. Otherwise, auto-mark it as completed and return `has_active_job: false`.

## Files to Modify

| File | Change |
|------|--------|
| Database (data operation) | Mark 2 stuck jobs as completed |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Only show resume banner when `next_cursor` exists |
| `supabase/functions/reelly-api-sync/index.ts` | Auto-complete stale jobs with no cursor in `check_resume` |
