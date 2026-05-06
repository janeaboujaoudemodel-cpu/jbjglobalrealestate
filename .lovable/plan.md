# CRM Workspace Hardening — Lists, Junk Bin, Trash, Filtered Exports

Scope: `crm_leads`, `crm_brokerages`, `crm_developers` and their pages
(`CRMLeadsInbox`, `CRMRelationships` Brokerage + Developer tabs).

## 1. "Lead Database" / List concept

New table `crm_lead_lists`:
- `id, owner_user_id, name (unique per owner), source_filename, kind` (`leads` | `brokerages` | `developers`)
- `description, color, lead_count` (denormalized), `created_at, archived_at`
- RLS: owner/admin only; no anon read.

Add `list_id uuid` column to `crm_leads`, `crm_brokerages`, `crm_developers`
(nullable → "Main CRM"). Indexed `(list_id, deleted_at)`.

**Upload flow** (Clients, Brokerages, Developers — same UX in all 3):
- Existing `BulkUploadDialog` gains a step:
  1. Pick a file (auto-uses filename, stripped of extension, as default list name).
  2. Choose **Add to Main CRM** *or* **Create new list "<filename>"** *or* **Append to existing list…**.
- Edge functions (`crm-bulk-upload-brokerages`, `crm-bulk-upload-developers`,
  `crm-import-leads`) accept `list_id` / `list_name` and create the list on the fly.
- Sidebar in each tab: "📁 Lists" with counts; click filters table to that list.
- Same-list de-dup is preserved; cross-list duplicates show a warning chip.

## 2. Junk Bin (re-assignable)

- New `pipeline_stage = 'junk'` standardized + flag `is_junk` boolean (fast index).
- Bulk action: **Select → Send to Junk Bin** in Leads, Brokerages, Developers.
- Sidebar entry "🗑 Junk Bin" — shows all junk across lists.
- From Junk Bin: **Assign to broker** restores stage to `new` and routes lead.
- Stays forever until manually deleted. Auto-export "junk_bin.xlsx" snapshot
  available on demand (one-click).

## 3. Trash with 30-day retention + Restore

- Reuse `deleted_at` (already exists on leads). Add it to `crm_brokerages`,
  `crm_developers` (currently hard-deletes).
- "🗂 Trash" sidebar entry: lists rows where `deleted_at IS NOT NULL`.
- **Restore** button → sets `deleted_at = NULL`.
- Cron edge function `crm-purge-trash` (daily): hard-deletes rows where
  `deleted_at < now() - interval '30 days'`.
- `pg_cron` schedule entry added in migration.

## 4. Scoped Excel / CSV / PDF Exports

Reuse existing `ExportConfigurator`. Add **Status filter** chips inside dialog:
- **Clients (leads):** All · Interested · Not interested · Junk · Pending · Won · Lost · By list
- **Brokerages:** All · Registered · Pending · Closed-deal · Expired · Rejected · Contracts · Junk · By list
- **Developers:** All · Registered · Pending · Contracted · Expired · Rejected · Contracts · Junk · By list

Scope still toggles Visible / Selected / All / **Current list**. Filename includes
the chosen status (`leads-interested-2026-05-06.xlsx`).

## 5. Performance

- Add composite indexes:
  `(owner_user_id, list_id, deleted_at, pipeline_stage)` on `crm_leads`,
  same shape on brokerages/developers.
- Move bulk-upload classify to chunks of 500, single insert per chunk
  (`onConflict: dedupe_hash`), drop row-by-row fallback unless chunk fails.
- Pagination + virtual list (already partly in `CRMLeadsTableV2`) extended to
  brokerage/developer tabs.
- `react-query` keys include `list_id` / `view` (junk/trash/active) so switching
  lists is instant from cache.

## 6. Security hardening

- RLS audit pass on `crm_leads`, `crm_brokerages`, `crm_developers`,
  `crm_lead_lists`: only `owner`/`admin`/`is_crm_admin` or assigned user.
  Confirm no `anon` SELECT.
- Block public scrape: edge functions verify JWT + role; rate-limit
  `crm-bulk-upload-*` to 10 req/min/user; add `request_id` audit log entry per
  upload to `crm_audit_log`.
- Server-side validation (zod) for filename, content size (≤ 10 MB), content-type.
- Confirm storage buckets used for uploaded source files are **private**;
  signed URLs only, 1-hour TTL.
- Forbid `select *` from edge functions on PII columns; use views excluding
  `phone_encrypted`, `email_encrypted`, `notes_encrypted`.

## 7. UX touches

- Bulk bar ("Send to Junk", "Send to Trash", "Restore", "Export selected") shared
  by all three tabs via a new `<CRMBulkActionsBar />`.
- Sidebar groups: **Active · Lists · Junk Bin · Trash**.
- Toasts confirm counts: "82 leads moved to Trash · Undo".

---

## Technical notes

**New files**
- `supabase/migrations/<ts>_crm_lists_junk_trash.sql` — tables, columns, indexes, RLS, `pg_cron`.
- `supabase/functions/crm-purge-trash/index.ts` — daily purge.
- `src/components/crm/CRMListSidebar.tsx`
- `src/components/crm/CRMBulkActionsBar.tsx`
- `src/hooks/useCRMLists.ts`

**Edited files**
- `BulkUploadDialog.tsx` — list picker step.
- `crm-bulk-upload-brokerages/index.ts`, `crm-bulk-upload-developers/index.ts`,
  `crm-import-leads/index.ts` — accept `list_id`/`list_name`.
- `CRMLeadsInbox.tsx`, `CRMRelationships.tsx` — sidebar, junk/trash views, bulk bar.
- `ExportConfigurator.tsx` — status filter chips.
- `useCRMLeadsInbox.ts` and brokerage/developer hooks — `list_id` + `view` filters.

**Out of scope (ask if needed)**
- Per-broker list sharing (lists are private to owner for now).
- Soft-delete cascade rules for `crm_activities` etc. — left untouched.
