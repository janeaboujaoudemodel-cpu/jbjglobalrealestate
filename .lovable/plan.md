
Goal (locked): Provident Portal becomes the primary and isolated workflow. Clicking Provident must show only Provident-related extraction/enrichment/approvals, with clear split between new vs existing-enriched items, accurate counts, before/after evidence, and no Reelly noise unless explicitly switched.

Current verified blockers from code/data:
1) `SourceCountsPanel` labels are now correct, but source selection is mostly visual and not driving tab isolation.
2) `ListingAdmin` still defaults `dataOpsTab="reelly"` and includes duplicated concepts: `approvals` + `updates`.
3) `PendingImportPreview`/back links still navigate to `/listing-admin...` (legacy path), losing owner-context filters.
4) Provident enrichment stats currently use `projects.status='active'` (shows 610), while published inventory is based on `is_published=true` (2778), causing false totals.
5) Queue truth: `pending_project_imports` currently has 0 pending and 1819 approved (all Reelly); this mismatch is why cards can look misleading.
6) Visibility tab likely feels broken due layout/compression and raw alphanumeric developer names rendering first in sorted list.

Execution plan (continue Batches 3→8, strict order)

Batch 3 — Provident-first source lock (8 tasks)
- Make Provident the default source mode in URL + state (`source=provident`) and persist it.
- Wire `SourceCountsPanel` clicks to parent-controlled source mode (not local-only UI state).
- When source=provident: hide Reelly-specific sections/log banners/actions by default.
- Reorder data-ops first tab to Provident hub (not Reelly).
- Keep Reelly card visible but minimized and disabled (admin toggle state).
- Remove/replace “Mirror” top tab from main rail as requested.
- Stretch tab rail edge-to-edge and close right border gap.
- Keep labels locked: “Provident Portal” (left/primary), “Reelly Portal” (right/disabled).

Batch 4 — Approvals vs Updates de-duplication (7 tasks)
- Replace duplicated “Approvals/Updates” top-level confusion with one Provident approval center.
- Add sub-queues: (A) New from Provident, (B) Existing listings enriched, (C) Draft updates.
- Use `is_new_project` + source + status to classify rows deterministically.
- Parse `source/status/type` query params in queue and apply on initial load.
- Keep review in-place + internal preview route action.
- Fix all “back” actions to preserve queue filter context.
- Keep legacy redirects but preserve preview id and return params.

Batch 5 — Accurate counts + before/after evidence (9 tasks)
- Fix Provident stats base query to published truth (`is_published=true`), not `status='active'`.
- Replace misleading “missing_any/complete” math with section checklist completeness scoring.
- Add per-project evidence card: before vs after (amenities, docs, images, FAQs, payment, floorplans, etc.).
- Add “source link” (Provident URL) on each enriched item for manual compare.
- Add click-through for “Complete” and “Missing” cards to filtered project lists.
- Remove “No API data” style messaging from Provident context.
- Standardize job result cards so processed/errors/updated never contradict each other.
- Show daily run timestamp (“last scraped at …”) in Provident header.
- Add clear “new vs enriched vs draft-updated” counters.

Batch 6 — Provident match-and-merge engine hardening (10 tasks)
- Update matching pipeline to avoid duplicates: exact slug → normalized name similarity → candidate match flow.
- If match found: create enrichment update item (no new project creation).
- If no match: create new pending project item.
- Add candidate-confidence band (e.g., 40–79%) with “Confirm match / Ignore”.
- Store match decision and reviewer for audit.
- Ensure approved enrichment updates do not auto-publish without review.
- Generate per-run enriched/new/pending summary report.
- Improve extraction function write-back so field updates/docs/images are reflected in queue cards.
- Add one-project test run mode for Provident (user-requested validation before full run).
- Expose checklist pass/fail per listing section.

Batch 7 — Developer submissions inside Provident portal (6 tasks)
- Add “Developer Submissions” lane under Provident center.
- Show uploader/updater identity, timestamps, change summary.
- Allow document/visibility edits from same workflow panel.
- Keep AI scoring/analyzer fields locked from developer edits.
- Route all developer-edited projects into owner approval queue (no overwrite publish).
- Add session summary artifact for owner review trail.

Batch 8 — Visibility tab/data quality + QA (6 tasks)
- Improve Developer Visibility card layout (prevent clipped names, show full name + metadata).
- Handle odd alphanumeric names cleanly (not appearing as broken labels).
- Add search normalization and fallback display for unknown names.
- Ensure right border closure and symmetric horizontal spacing in tabs/content container.
- Add regression checks for pending card images + developer deep links + internal draft view.
- Final validation pass across listing-admin/developers/areas fixed filters for sidebar/header overlap behavior.

Technical implementation map
Frontend:
- `src/pages/ListingAdmin.tsx` (source lock, tab model, rail spacing, duplicate-tab removal)
- `src/components/listing-admin/SourceCountsPanel.tsx` (controlled source mode)
- `src/components/listing-admin/ProjectApprovalQueue.tsx` (query-driven queue splits)
- `src/components/listing-admin/PendingUpdatesQueue.tsx` (merge into Provident approval center)
- `src/pages/listing-admin/PendingImportPreview.tsx` (owner-route return context)
- `src/components/listing-admin/EnrichmentCenter.tsx` (Provident-first + before/after UX)
- `src/components/listing-admin/ReellyImportPanel.tsx` (move Provident blocks out / suppress Reelly-first)
- `src/components/listing-admin/DeveloperVisibilityPanel.tsx` (name rendering/layout fixes)
- `src/routes/AdminRoutes.tsx` (preview redirect preservation)

Backend functions:
- `supabase/functions/provident-enrich-projects/index.ts`
- `supabase/functions/scheduled-extraction/index.ts`
- `supabase/functions/enrich-pending-imports/index.ts`
- optional summary/report function for run-level audits.

Data/model changes (migration needed):
- Add enrichment audit table for per-project before/after snapshots + matched source URL + confidence + reviewer.
- Optional queue classification fields for deterministic “new/enriched/draft-update” lanes.

Acceptance criteria before moving past Batch 3→8
- Provident click shows only Provident workflows by default.
- No Reelly API messaging/logs in Provident context.
- Approvals are not duplicated conceptually; queues are split by type clearly.
- Published totals and completeness cards are accurate and drill-down clickable.
- Each enriched listing shows before/after + Provident source link.
- Visibility tab shows readable developer names and fixed layout.
- Back navigation always returns to filtered approvals state in owner listing-admin.
