

# Fix: Enrich-Before-Approve Pipeline + Provident Enrichment Tab

## Problem
1. The approval queue shows 50 pending projects with message "Will be enriched after approval" — user wants projects **fully enriched BEFORE** they land in the approval queue
2. No Provident enrichment option in the Enrichment Center — only Reelly exists
3. The `provident-enrich-projects` edge function already exists and works, but has no UI trigger

## Root Cause Analysis
- The Reelly sync pipeline (`reelly-api-sync`) writes raw data to `pending_project_imports` with `status: "pending"` — but does NOT run enrichment first
- The approval flow expects the admin to approve first, THEN the `bulk-approve-imports` function moves data to `projects` table, THEN enrichment runs
- User wants the reverse: **enrich first → show enriched data in queue → admin approves**

## Solution

### Change 1: Auto-Enrich Pending Imports Before Approval (Edge Function)
Create a new edge function `enrich-pending-imports` that:
- Queries `pending_project_imports` where `status = 'pending'` and `review_notes` is NOT `'ENRICHED'`
- For each pending import, uses the Reelly detail API (`reelly-fetch-details`) to pull full project data (images, docs, amenities, payment plans, floor plans, FAQs, USPs)
- Also tries Provident page-data enrichment via existing `_shared/provident/pagedata-detail.ts`
- Updates the `pending_project_imports` row with enriched data
- Marks `review_notes = 'ENRICHED'` so it's not re-processed
- Processes in batches of 10 with delays to avoid rate limits

### Change 2: Add "Enrich All Pending" Button to Approval Queue UI
In `ProjectApprovalQueue.tsx`:
- Add a prominent "Enrich All Pending" button that calls `enrich-pending-imports`
- Shows progress (batch count, images/docs added)
- After enrichment completes, auto-refreshes the queue

### Change 3: Add Provident Enrichment Section to Enrichment Center
In `EnrichmentCenter.tsx`:
- Add a second card below Reelly: "Provident Website Enrichment"
- Calls existing `provident-enrich-projects` edge function
- Same batch-processing UI pattern: Start/Stop, live log, stats
- Description: "Scans Provident website for matching projects and enriches missing amenities, payment plans, brochures, floor plans, FAQs, photos, and USPs"

### Change 4: Update Approval Queue Card Text
In `PendingImportCard.tsx` (or wherever "Will be enriched after approval" appears):
- Change the placeholder text to "No images yet — run Enrichment first" when unenriched
- Show "Enriched ✓" badge when `review_notes` contains `'ENRICHED'`

## Files to Create
1. `supabase/functions/enrich-pending-imports/index.ts` — New edge function that enriches pending imports using Reelly details API + Provident page-data before approval

## Files to Modify
1. `src/components/listing-admin/ProjectApprovalQueue.tsx` — Add "Enrich All Pending" button with progress UI
2. `src/components/listing-admin/EnrichmentCenter.tsx` — Add Provident enrichment section alongside Reelly
3. `src/components/listing-admin/PendingImportCard.tsx` — Update placeholder text and show enrichment status badge

## Technical Details

### `enrich-pending-imports` Edge Function Flow
```text
1. Query pending_project_imports WHERE status='pending' AND review_notes != 'ENRICHED'
2. For each import (batch of 10):
   a. If source_url contains 'reelly_<id>' → call reelly-fetch-details for full data
   b. Generate slug variants from name → try provident page-data endpoint
   c. Merge: images, documents, amenities, payment_plan, payment_breakdown, faqs, floor_plans, USPs
   d. Update the pending_project_imports row with enriched fields
   e. Set review_notes = 'ENRICHED'
3. Return summary stats
```

### Provident Enrichment Center UI
- Reuses existing `provident-enrich-projects` function (already fully implemented)
- Same Start/Stop/Log pattern as Reelly enrichment
- Stats: Total published projects, enriched count, remaining, images/docs added

