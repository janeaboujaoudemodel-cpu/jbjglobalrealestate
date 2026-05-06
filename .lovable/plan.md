## Phase 2 — Wire CRM list management into the three CRM surfaces

Phase 1 created the plumbing (`crm_lead_lists` table, `list_id` / `is_junk` / `deleted_at` columns, `useCRMLists` hook, `CRMListSidebar`, `CRMBulkActionsBar`, list-aware `BulkUploadDialog`). This phase plugs those pieces into the actual screens and updates query keys + export.

### 1. `src/pages/CRMRelationships.tsx` — Brokerages tab (`BrokeragesTab`)

- Add state `listView: CRMListView` (default `{ kind: "active", listId: null }`).
- Wrap the existing tab body in a flex row: left = `<CRMListSidebar kind="brokerages" value={listView} onChange={setListView} counts={…} />`, right = current content (unchanged width-wise on ≥md, sidebar collapses above the content on small screens).
- Extend the brokerages query (`useBrokerages` / `refetch` source — found around the `indexed`/`filtered` memo, ~line 540–605) to include:
  - `listView.kind === "active"` → `.is("deleted_at", null).is("is_junk", false)`
  - `kind === "list"` → same + `.eq("list_id", listView.listId)`
  - `kind === "junk"` → `.is("deleted_at", null).eq("is_junk", true)`
  - `kind === "trash"` → `.not("deleted_at", "is", null)`
- Add `listView` to the React Query key so caches don't bleed across views.
- Compute counts (active / junk / trash / per-list) via a small parallel `count: "exact", head: true` query in a `useQuery(["crm_brokerages_counts"])` and pass to the sidebar.
- Below the table, render `<CRMBulkActionsBar table="crm_brokerages" ids={[...bulkSel]} view={listView.kind} onClear={() => setBulkSel(new Set())} onChanged={refetch} onExport={() => setExportOpen(true)} />`.
- Bulk-upload button already opens `BulkUploadDialog`; pass `defaultListId={listView.kind === "list" ? listView.listId : undefined}` so the dialog defaults to "append to current database".

### 2. `src/pages/CRMRelationships.tsx` — `DeveloperRegistryTab` (~line 1620+)

Same treatment, mirrored:
- New `listView` state, `<CRMListSidebar kind="developers" …>`.
- Extend the developer-registry query to apply the same `list_id / is_junk / deleted_at` filters and add `listView` to its query key.
- `<CRMBulkActionsBar table="crm_developer_registry" ids={selectedDevIds} view={listView.kind} … />`.
- `BulkUploadDialog` already has `kind="developer"` — add `defaultListId` plumbing identical to brokerages.

### 3. `src/pages/CRMLeadsInbox.tsx` + `src/pages/useCRMLeadsInbox.ts`

- In the hook:
  - Add `listView` state (replace existing `activeView: "active" | "deleted"` — keep backward-compatible by mapping `"deleted"` to `{ kind: "trash" }`).
  - Update the query key to `["crm-leads-inbox", debouncedSearch, statusFilter, sourceFilter, dateStart, dateEnd, page, listView.kind, listView.listId]`.
  - Apply filters in the query:
    - active → `is("deleted_at", null).is("is_junk", false)`
    - list → above + `eq("list_id", listView.listId)`
    - junk → `is("deleted_at", null).eq("is_junk", true)`
    - trash → `not("deleted_at", "is", null)`
  - Expose `listView`, `setListView`, plus `selectedIds`/`setSelectedIds` for bulk operations.
  - Same filters applied inside `handleExport`.
- In `CRMLeadsInbox.tsx`:
  - Render `<CRMListSidebar kind="leads" value={listView} onChange={setListView} counts={counts} />` to the left of the table.
  - Add `<CRMBulkActionsBar table="crm_leads" ids={selectedIds} view={listView.kind} onClear={…} onChanged={refetch} onExport={openExport} />`.
  - Leads `BulkUploadDialog` (if present on this page; else the entry button already in the toolbar) gets `defaultListId` like the other tabs.

### 4. `src/components/crm/ExportConfigurator.tsx` — status filter chips

Add an optional `statusFilters?: { key: string; label: string }[]` and `selectedStatuses: string[] / setSelectedStatuses` prop driven by callers. When provided:
- Render a row of chips above the Columns block: "Active", "Junk", "Trash", plus pipeline statuses for the leads caller (e.g. `new`, `contacted`, `interested`, `closed_won`, `closed_lost`).
- Pass `statuses` through `onExport({ format, scope, columns, statuses })`.
- Update the three export handlers (`handleExportConfigured` for brokerages, the developer equivalent, and `handleExport` in leads) to apply the chosen status filters before generating the file.

### 5. Query-key & cache invalidation hygiene

After any bulk action, `CRMBulkActionsBar.onChanged` already triggers a refetch callback. Ensure each page's `onChanged` invalidates:
- `["crm-leads-inbox"]` (leads page)
- `["crm_brokerages"]` and `["crm_brokerages_counts"]`
- `["crm_developer_registry"]` and its counts

…so the sidebar badges stay in sync.

### Files touched

- `src/pages/CRMRelationships.tsx` — Brokerages + Developers tab wiring (~250 lines diff, mostly additive).
- `src/pages/CRMLeadsInbox.tsx` — sidebar + bulk bar + export status chips wiring (~80 lines).
- `src/pages/useCRMLeadsInbox.ts` — listView state, query-key + filter updates, selection state (~60 lines).
- `src/components/crm/ExportConfigurator.tsx` — optional `statusFilters` prop + chip UI (~40 lines).

No DB migrations, no edge-function changes, no new files. Pure frontend wiring on top of phase-1 primitives.

### Out of scope for this PR

- Email-template work (already shipped).
- New list management screens (rename/archive UI for lists) — covered by `useCRMLists` mutations but a dedicated dialog can ship in a later pass.
- Leads junk-bin cron / purge automation (already in place from phase 1).
