

# Plan: Auto-Run Migration & Enrichment, Fix Approval Queue Zero Count, Fix URL Label

## Summary of Issues Found

1. **1,616 pending updates** in `listing_pending_updates` need migration — user wants these processed automatically without manual intervention
2. **Project Approval Queue shows 0** because all manual uploads are already approved, and the only pending record is Provident-sourced (quarantined by the `.not("source_url", "ilike", "%provident%")` filter)
3. **"Project Website URL" label** in the Listing Generator is misleading — it should say "Source URL to scrape" and the AI must NEVER use it as a project website

## Changes

### 1. Create Auto-Migration Cron Job
Schedule `enrich-pending-imports` to run every 15 minutes automatically, processing batches of 20. This drains the 1,616 pending `listing_pending_updates` records into `pending_project_imports` with full Provident enrichment.

**Action**: Add a `pg_cron` job via SQL insert:
```sql
SELECT cron.schedule(
  'auto-migrate-enrich-pending',
  '*/15 * * * *',
  $$ SELECT net.http_post(
    url := 'https://mdafrewypkkrildjgtey.supabase.co/functions/v1/enrich-pending-imports',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := '{"action":"migrate","batch_size":20}'::jsonb
  ) AS request_id; $$
);
```

### 2. Fix Approval Queue Showing Zero — Remove Provident Quarantine
**Problem**: Lines 156-157, 204-205 in `ProjectApprovalQueue.tsx` exclude ALL provident-sourced records. Once the migration cron creates fully enriched records from Provident, they need to appear in the approval queue for the user to review.

**File**: `src/components/listing-admin/ProjectApprovalQueue.tsx`
- Remove the provident quarantine filters (lines 156-157 for stats, line 204-205 for main query)
- Migrated+enriched Provident records will now appear in "All Sources" and under a new "Auto-Imported" filter
- Change `sourceFilter` options: `"all" | "reelly" | "manual" | "provident"` — add a "Provident" tab so the user can segment them
- Also add the source filter UI buttons for this new option

### 3. Rename URL Field and Enforce Manual-Only Website URL
**File**: `src/components/listing-admin/ListingGenerator.tsx` (line 793-796)
- Change label from "Project Website URL (optional)" to "Source URL to Scrape (optional)"
- Change placeholder to "Paste a listing URL to scrape project data from"
- Remove the helper text about "multiple projects" from the URL context

**File**: `supabase/functions/generate-listing/index.ts` (line 253)
- Strengthen: "The source_url field is ONLY for internal tracking of where data was scraped from. It is NOT a project website. NEVER output any websiteUrl, projectUrl, or website field."

### 4. Ensure Strict Manual Approval Gate
The approval flow already requires manual approval (`approveImportInDb` must be called). No changes needed — the cron only creates records in `pending_project_imports` with `status: "pending"`, which requires explicit user approval via the UI.

## Files to Modify
1. `src/components/listing-admin/ProjectApprovalQueue.tsx` — remove provident quarantine, add provident source filter tab
2. `src/components/listing-admin/ListingGenerator.tsx` — rename URL label
3. `supabase/functions/generate-listing/index.ts` — strengthen no-website-URL rule

## Database Action
- Insert cron job for auto-migration (SQL insert, not migration)

