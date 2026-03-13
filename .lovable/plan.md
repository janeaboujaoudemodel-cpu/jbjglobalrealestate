
Goal: stabilize Listing Admin + Developer/Project hubs so source sync, approvals, and enrichment are accurate, non-breaking, and fully reviewable before publish.

Scope confirmed from your answers:
- Duplicate handling: Stop and review (no auto-create)
- Approval preview: Internal draft page
- Source naming: Reelly / Provident

1) Immediate UX + navigation fixes (no more broken routing/overlay)
- `src/pages/ListingAdmin.tsx`
  - Fix header overlap under Founder & CEO bar by adjusting sticky offsets and content top padding in owner-shell context.
  - Make Sync tabs full-stretch edge-to-edge inside the panel (remove side gaps around tab rail and close right-side border visual gap).
  - Keep horizontal sync tabs but enforce non-breaking tab sizing and contained horizontal scrolling only in tab rail.
- `src/components/listing-admin/ProjectApprovalQueue.tsx`
  - Keep review in-place and add explicit “Open Internal Draft Page” action (not gallery-only flow).
  - Parse `source` and `status` from URL query so source cards and stat cards open the correct filtered section.
  - Fix “Back” behavior to return to approvals state (preserve search params).

2) Source panel + status behavior corrections
- `src/components/listing-admin/SourceCountsPanel.tsx`
  - Rename cards to Reelly and Provident (remove Source A/B labels).
  - Keep clickable stats wired to approvals with source/status query params.
  - Show true counts from live data hooks.
- `src/hooks/useSyncJobs.ts`
  - Keep count logic source-specific and align provident/reelly classification rules with queue filters.
- Reelly temporary OFF mode
  - Add integration state flag via `app_settings` (e.g. `reelly_sync_enabled=false`) and suppress noisy token-expired banners when disabled intentionally.
  - Show clear badge: Disabled by admin (not an error).

3) Fix root cause of “Found X, matched 0” and broken enrichment numbers
- `supabase/functions/scheduled-extraction/index.ts`
  - Fix existing listing select mapping (currently uses non-existent project fields for matching), which causes false zero matches.
  - Align matcher inputs with actual `projects` schema (`developer_name`, valid fields), then persist accurate `records_matched` / `records_pending`.
- `src/components/listing-admin/ExtractionJobsPanel.tsx`
  - Improve job row summaries to show found/matched/pending with clear statuses and non-misleading zero states.
- `src/components/listing-admin/ReellyImportPanel.tsx`
  - Move Provident extraction controls into a dedicated Provident section (not nested under Reelly test area).
  - Rework backfill “missing_any” criteria to be field-gap based (not only `detail_fetched_at`) so “0 needs backfill” is not falsely shown.

4) Duplicate-detection workflow at typing time (Add Project + Generator)
- New shared component: `src/components/listing-admin/ProjectDuplicateInspector.tsx`
  - Debounced lookup by name/slug against:
    - `projects` (published + drafts)
    - optionally `pending_project_imports` (pending/approved)
  - Show immediate match panel with:
    - Internal preview link
    - Public/live listing link (if published)
    - Actions: Merge / Replace / Stop
- Integrations:
  - `src/components/listing-admin/ListingGenerator.tsx` (project name and extracted result stage)
  - `src/pages/ListingAdmin.tsx` (manual Add Project form name input)
- Behavior:
  - If match exists, block “create new” until user chooses action.
  - Keep save path auditable (who merged/replaced).

5) Internal draft preview and broken image handling
- Route wiring:
  - `src/routes/OwnerRoutes.tsx` add `/owner/listing-admin/preview/:id` -> `PendingImportPreview`
  - `src/routes/AdminRoutes.tsx` redirect legacy `/listing-admin/preview/:id` to owner preview route (with id preserved).
- `src/pages/listing-admin/PendingImportPreview.tsx`
  - Use this as canonical internal preview page.
- `src/components/listing-admin/ProjectApprovalQueue.tsx`
  - Filter invalid/broken image URLs in modal with same validator used in cards.
  - Reset gallery index when selected item changes.
  - Add “View Internal Draft Page” + “View Live Project” (when available).

6) Project Hub + Developer Hub governance visibility
- `src/pages/ListingAdmin.tsx`
  - Add/rename “Projects” section as Project Hub with:
    - add/generate/edit/delete
    - source filter (Reelly/Provident/manual)
    - bulk visibility/document toggles
    - enrichment status per listing
- `src/pages/AdminDevelopers.tsx` + `src/components/admin/DeveloperOverviewTab.tsx`
  - Ensure every developer/project row shows:
    - developer name
    - last updated timestamp
    - updated by / created by (from audit + reviewer fields)
    - status chips + alert/suggestion coloring (green/red)
  - Keep only premium iconography (Lucide icons), no emoji text glyphs.

7) Publish safety + count integrity
- Stop accidental auto-publish in approval pipeline:
  - `src/components/listing-admin/ProjectApprovalQueue.tsx` and `supabase/functions/bulk-approve-imports/index.ts`
  - Approvals should create/update as draft unless explicit publish action is confirmed.
- Recompute dashboard counters from real publish state and queue state so totals align with portal reality.

8) Provident-first enrichment pipeline (current priority)
- Add dedicated Provident run action that:
  - matches against all existing projects (published + draft) by slug/name similarity
  - enriches existing records (merge mode, no duplicate creation)
  - creates pending imports only for truly new projects
- Show before/after enrichment snapshot per listing:
  - key changed sections (description, amenities, payment, docs, images, FAQs, floor plans)
  - visible in listing admin project detail/history.

Technical details (implementation map)
- Frontend files:
  - `src/pages/ListingAdmin.tsx`
  - `src/components/listing-admin/SourceCountsPanel.tsx`
  - `src/components/listing-admin/ProjectApprovalQueue.tsx`
  - `src/components/listing-admin/ReellyImportPanel.tsx`
  - `src/components/listing-admin/ExtractionJobsPanel.tsx`
  - `src/components/listing-admin/ListingGenerator.tsx`
  - `src/components/listing-admin/PendingImportCard.tsx` (links/preview entry consistency)
  - `src/pages/listing-admin/PendingImportPreview.tsx`
  - `src/pages/AdminDevelopers.tsx`
  - `src/components/admin/DeveloperOverviewTab.tsx`
  - `src/routes/OwnerRoutes.tsx`
  - `src/routes/AdminRoutes.tsx`
  - new `src/components/listing-admin/ProjectDuplicateInspector.tsx`
- Backend functions:
  - `supabase/functions/scheduled-extraction/index.ts` (match logic fix)
  - `supabase/functions/bulk-approve-imports/index.ts` (publish control + merge safety)
  - Provident enrichment orchestration in existing provident sync/enrich functions
- Data/config:
  - `app_settings` new key for reelly temporary disable flag
  - optional audit extensions for clearer created_by/updated_by attribution

Execution order
1. Stabilize navigation/layout/preview route (fast user-facing fix)
2. Source naming + card wiring + query-param filtering
3. Extraction match bug fix and count corrections
4. Duplicate inspector in Add Project + Generator
5. Project Hub/Developer Hub attribution and before/after enrichment tracking
6. Provident full rerun in safe merge mode, then validate pending/new split

Validation checklist
- No header overlap in listing admin under owner shell.
- Sync tabs are horizontal, fully contained, no accidental browser back on horizontal scroll.
- Source cards show Reelly/Provident names and correct counts.
- Clicking counts opens correct approvals subset.
- Pending item opens internal preview page (not redirected away).
- Broken first-image issue resolved in modal + preview.
- Duplicate detection appears while typing and blocks unsafe create.
- Reelly disabled state shows as intentional OFF (no repetitive error spam).
- Provident rerun produces non-zero matched where appropriate and only true new items become pending.
- Project/developer rows show last update + actor + status indicators.
