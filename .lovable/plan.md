## Audit Summary (what exists today)

- Unified CRM already lives at `/owner/crm` (`src/pages/owner/crm/UnifiedCRM.tsx`) and is backed by canonical `crm_*` tables — must not be duplicated (see memory: Unified Relational CRM Standard, Unified Owner CRM Hub).
- `crm_lead_lists` (kind = leads/brokerages/developers) already groups uploaded leads under a name + `source_filename` + owner. `crm_leads.list_id` already references it. `useCRMLists` hook exists.
- Existing import surfaces: `CRMImportModalV3.tsx`, `BulkUploadDialog.tsx`, `BrokerBulkUploadDialog.tsx`, plus tables `crm_imports`, `crm_import_batches`, `crm_import_batch_errors`, `crm_broker_import_staging`. These are the canonical pipes — Phase 1 extends them, does not replace them.
- Broker access: `BrokerGuard`, `BrokerCRMAccessGate`, `useBrokerCRMTier`, `useAccessControl`, plus tables `crm_brokers`, `broker_profiles`, `hr_user_roles`, `crm_field_permissions`, `crm_lead_assignments`, `crm_lead_shares`, `crm_lead_access_logs`. Owner-only routes are governed by OwnerGuard (memory: Owner Restricted Routes).
- Realtime infra is available via Supabase channels (already used elsewhere) — Phase 3 reuses it; no new transport.

## Guardrails (apply to every phase)

- No new CRM module, no new "leads" table, no second broker system. All work extends `crm_*` + existing hooks/components.
- All access via RLS + `has_role` / owner-verification edge functions. Never trust client claims.
- Follow champagne design tokens, IconTile, no gold fills, Inter only, single H1 per page.
- Each phase ships with: implementation → migration (if any) → manual test script → screenshots → sign-off before next phase starts.

---

## Phase 1 — Database Upload System (extend, don't rebuild)

Scope: add a first-class "Databases" surface inside `/owner/crm` that wraps the existing importer so every upload is stored as an immutable, downloadable source, optionally merged into `crm_leads`.

Backend (one migration):
- New table `crm_source_databases` { id, owner_user_id, name, original_filename, file_storage_path, mime_type, row_count, column_headers jsonb (ordered, verbatim), uploaded_by, uploaded_at, status (separate|merged|both), notes, list_id fk → crm_lead_lists }.
- New table `crm_source_database_rows` { id, source_database_id fk, row_index int, raw jsonb } — stores every original row verbatim (no renaming/coercion). Indexed by source_database_id, row_index.
- Add `source_database_id uuid` + `source_row_index int` to `crm_leads` (nullable; already has `raw_import`, `import_batch_id` — reuse where possible, add only what's missing).
- Storage bucket `crm-source-databases` (private) for the raw CSV/XLSX file.
- RLS: owner/admin full; brokers can SELECT only databases granted via `crm_lead_assignments` (Phase 2).

Frontend:
- New `UploadDatabaseButton` + `UploadDatabaseDialog` mounted in `UnifiedCRM` toolbar.
- Parser: CSV via `papaparse`, XLSX via `xlsx` (already a likely dep — verify, else add). Preserve header order in `column_headers`, store each row as `{ [header]: cellValue }` with original casing.
- Post-parse dialog with three actions: **Save as Separate Database**, **Merge with CRM**, **Cancel**. Merge path reuses existing `CRMImportModalV3` mapping engine but injects `source_database_id` so the link is permanent.
- New "Databases" sub-tab inside CRM (subheader section, per Unified Owner CRM Hub) listing all `crm_source_databases` with filters: Source Database, Upload Date, Uploaded By, Broker Owner, Merged/Separate. Each row → Download original file, Preview rows, Rename, Archive, Merge later.
- Add lead-list filters in `CRMLeadsTableV2`: filter by `source_database_id`, show "Source Database" column.

Test matrix (must pass before Phase 2):
- 5 fixtures: pure CSV, XLSX multi-sheet, file with duplicate header names, file with empty cells, file with Arabic + emoji + commas in fields.
- Large file (≥ 10k rows) — chunked insert.
- Verify: `column_headers` order matches file; `crm_source_database_rows.raw` is byte-identical to source cell; merged leads carry `source_database_id`; original file re-downloadable and hash-matches upload.
- Screenshots: upload dialog, post-upload choice modal, Databases tab list, filter by source, original file download.

---

## Phase 2 — Database Ownership & Broker Access

Backend:
- Extend `crm_source_databases`: `broker_owner_user_id`, `broker_scope` enum(internal|external), `notes`.
- New table `crm_database_grants` { id, source_database_id fk, broker_user_id fk, permissions jsonb (view, edit, add, export, assign, upload), granted_by, granted_at, revoked_at }.
- Reuse `crm_field_permissions` for column-level masking; reuse `crm_lead_assignments` for lead-level assignment.
- RLS update on `crm_leads`, `crm_source_database_rows`, `crm_source_databases`: broker sees row iff (a) `assigned_to_user_id = auth.uid()` OR (b) `created_by_user_id = auth.uid()` OR (c) lead's `source_database_id` ∈ active grants for that broker.
- Edge function `crm-grant-broker-access`: creates/links auth user (existing pattern in `hr_*` flows), generates temp password, writes `broker_profiles`/`hr_user_roles` (role=broker_member), inserts `crm_database_grants`, optionally emails invite via existing Resend pipeline (respect Resend Quota Standard + Single-Agency Email Rule).

Frontend:
- "Give Broker Access" button on each database row → modal with name/email/role/scope/permissions checkboxes + generated password (copy-to-clipboard, never logged).
- Broker-side CRM view: reuse existing `BrokerCRMAccessGate` + `useBrokerCRMTier`; hide Owner-only subheader sections (Relationships, Employees, Campaigns, Founder hubs) by gating on `isOwner`. No new route — same `/owner/crm` page renders broker-scoped data via RLS.
- Permissions matrix UI in database detail drawer.

Tests:
- Create broker via modal → login as broker → verify only assigned databases + assigned/own leads visible; Owner sections return 403; export/edit/add buttons hidden when permission false.
- Attempt direct REST call to other broker's lead → expect 0 rows (RLS proof).

---

## Phase 3 — Live CRM Synchronization

- Add `last_updated_at` (already exists as `updated_at`) + `last_updated_by uuid` to `crm_leads`; trigger sets both on every UPDATE.
- Insert into existing `crm_audit_logs` / `crm_action_logs` on every field change (jsonb diff). Brokers' edits already route through the same tables — confirm and add missing fields (status, stage, follow-up, deal_value).
- Owner CRM subscribes via Supabase Realtime (`postgres_changes` on `crm_leads` + `crm_action_logs`) and patches the React Query cache (`queryClient.setQueryData`) — no full refetch.
- Conflict handling: optimistic concurrency via `updated_at` check in update RPC; on mismatch, surface toast "Lead was just updated by X — refresh".
- Broker performance widget: aggregate query over `crm_action_logs` per `broker_user_id` (leads assigned, contacted, meetings, deals closed, avg response time, last_active_at).

Tests: two browser sessions (owner + broker), edit stage from broker → owner row animates updated within 2s; simultaneous edits → conflict toast on loser; load test with 5k leads.

---

## Phase 4 — JBJ Broker Directory

- Reuse `crm_brokers` + `broker_profiles` (do not create a new table). Add missing optional columns only if absent: nationality, languages[], visa_status, driving_license, specialty, employment_type (full|part), join_date, notes.
- Auto-insert/update `crm_brokers` row inside the `crm-grant-broker-access` edge function.
- "JBJ Brokers" sub-tab under CRM Employees section (already exists per Unified Owner CRM Hub) — extend it instead of adding a new page.
- Stats dashboard powered by a single view `vw_crm_broker_stats` (deals closed, leads assigned, conversion rate, top performers).
- Assign-Lead dropdown + CRM filters source from the same view → automatic sync.

---

## Phase 5 — QA & Cleanup

- Inventory and remove/redirect duplicates: any `BulkUploadDialog` / `BrokerBulkUploadDialog` / `CRMImportModalV3` paths that now overlap with the new flow are consolidated behind `UploadDatabaseDialog` (keep one mapping engine). Delete dead components only after grep confirms zero imports.
- Confirm single source of truth: `crm_leads` (leads), `crm_brokers`+`broker_profiles` (brokers), `crm_source_databases` (uploads), `crm_database_grants` (access). Document in `mem://features/crm/unified-relational-crm-standard`.
- Run end-to-end script (upload → save → merge → grant broker → broker login → broker edit → owner realtime update → filter by database → export → assign new leads → broker stats).
- Deliverables: screenshots per phase, permissions matrix table, realtime video, RLS proof queries, updated memory file.

## Technical Notes

- Libraries: `papaparse` (CSV), `xlsx` (SheetJS) — confirm presence in `package.json` before Phase 1 starts.
- Storage: private bucket with signed-URL downloads through existing `download-file` edge proxy (avoids Chrome `lovableproject.com` blocks per prior fix).
- All new RLS uses `has_role()` security-definer pattern (no recursive policies).
- No edits to `auth/storage/realtime` schemas. No CHECK constraints with `now()` — use validation triggers.
- Every migration is additive; no destructive drops in Phases 1–4. Cleanup deletions land only in Phase 5 after grep + tests.

## Phase Gate

I will stop and request your sign-off (with screenshots) at the end of each phase before starting the next.
