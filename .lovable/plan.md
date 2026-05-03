# Fix: Media Ingestion Hub PDF upload silently failing

## Root cause (confirmed)

The table `public.material_ingestion_jobs` has:
- `source_url TEXT NOT NULL`
- `source_type TEXT NOT NULL DEFAULT 'web'`

But the upload flow in `useMediaIngestion.uploadFiles` inserts a row **without** `source_url` (uploads only have a file, not a URL). Every PDF "Choose Files" insert is rejected by the NOT NULL constraint, so no row ever reaches the queue. The DB confirms `material_ingestion_jobs` is currently empty even after upload attempts.

Storage bucket `ingestion-staging`, MIME allowlist (includes `application/pdf`), 500 MB limit, and RLS policies for owner/admin/listing_admin are all fine — not the cause.

## Fix

### 1. Migration — relax NOT NULL on source-side columns

```sql
ALTER TABLE public.material_ingestion_jobs
  ALTER COLUMN source_url DROP NOT NULL;

-- Either source_url (link mode) or file_path (upload mode) must be present
ALTER TABLE public.material_ingestion_jobs
  ADD CONSTRAINT mij_source_or_file_required
  CHECK (source_url IS NOT NULL OR file_path IS NOT NULL OR status = 'pending');
```

(Keep `source_type NOT NULL` — the hook already sets it to `"video"`, `"pdf"`, `"file"`, or `"link"`.)

### 2. Hook hardening — `src/hooks/useMediaIngestion.ts`

- Surface insert errors to the user with the actual Postgres message (currently the toast says "insert failed" with no detail for PDF specifically).
- After upload, also re-trigger classify on rows whose `file_path` was just patched (no logic change, just confirm sequence).
- Add a small guard: if `file.size > 500 * 1024 * 1024`, reject client-side with a clear toast before inserting.

### 3. Verify end-to-end

After migration + redeploy:
1. Upload a PDF via "Choose files".
2. Confirm a row appears in `material_ingestion_jobs` with `source_kind='upload'`, `source_type='pdf'`, `file_path` populated.
3. Confirm `media-ingestion-classify` runs (check edge function logs).
4. Confirm card renders in the Staging Queue tab.

## Files touched

- `supabase/migrations/<new>.sql` — drop NOT NULL on `source_url`, add presence check.
- `src/hooks/useMediaIngestion.ts` — better error surfacing + size guard.

No UI/layout changes; the centering and tab styling are already correct from the previous pass.
