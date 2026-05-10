## Plan — CRM unification + investor flag + tasks shortcut + employees hub

Five focused changes, all inside `/owner/crm`. No new pages, no DB destructive changes.

---

### 1. CompanyHub-style detail view for every CRM entity

The brokerage/developer screen with **Overview · People · Campaigns · Events · Follow-ups · Cards · Notes · Emails · Comms** lives in `src/components/crm/CompanyHub.tsx` and is shown via `CompanyHubDrawer` (side sheet) + `CompanyHubPage` (full view).

We will reuse exactly the same shell — drawer that opens on row click + "Open full view" link — for every directory:

- **Brokerage Agencies** — already wired (`BrokerageAgenciesDirectory.tsx` → `CompanyHubDrawer type="brokerage"`). ✓
- **Developers** — already wired (`DevelopersDirectory.tsx` → `CompanyHubDrawer type="developer"`). ✓
- **Brokers** (`BrokersRegistry.tsx`) — replace the current minimal `Sheet` (lines 388–434) with a new `PersonHubDrawer` (broker profile + scanned cards + agencies-worked-for + deals-closed + breakfasts/training attended + warning letters + payroll + leads-assigned + leads-closed + suspend action). Restores the richer pre-existing detail.
- **Dev Sales Reps** (`DevSalesRepsDirectory.tsx`) — wrap rows with the same `PersonHubDrawer` (sales-rep variant: parent developer + deals + assigned leads + cards).
- **Investors** (`InvestorsDirectory.tsx`) and **Leads** (`CRMLeadsTableV2`) — open the same `PersonHubDrawer` (lead variant).
- **Employees** — open `PersonHubDrawer` (employee variant: CV, warning letters, payroll, attendance, leave, performance, suspend).

#### New shared primitive: `src/components/crm/PersonHubDrawer.tsx`
- Same look/behavior as `CompanyHubDrawer` (right side sheet on `#FDFBF7`, gold hairline, "Open full view" link in header).
- Internally renders a new `PersonHub` component with tab bar matching CompanyHub style:
  - **Overview** — identity, role, company, quick KPIs.
  - **Activity** — timeline (notes/emails/calls/follow-ups/campaigns) — pulled from existing `PersonDetailDrawer` logic.
  - **Cards** — scanned business cards.
  - **Deals / Leads** — leads assigned + leads closed (broker/sales-rep variants only).
  - **Training / Breakfasts** — attendance rows (broker variant).
  - **Documents** — CV, warning letters (employee + broker).
  - **Payroll** — salary/bonus rows (employee + broker).
  - **Comms / Notes / Follow-ups** — same panels CompanyHub already exposes, parameterized by `personId` instead of `companyName`.
- A `variant` prop drives which tabs are visible: `"lead" | "investor" | "broker" | "sales-rep" | "employee"`. No tab is removed for any variant — variants just hide tabs that don't apply.
- Companion route `/owner/crm/person/:variant/:id` (new file `src/pages/owner/crm/PersonHubPage.tsx`) for "Open full view".

This restores the rich broker detail the user remembers and standardizes the experience across all CRM directories.

---

### 2. Tasks shortcut must open inside the CRM shell, not navigate away

Today `IntegrationWidgets.tsx` (line 125) navigates to `/crm/tasks?action=new`, which leaves the shell and lacks the "Add new task" affordance.

- Repoint **all** task shortcuts (`IntegrationWidgets.tsx`, any `DepartmentShortcuts.tsx`/`QuickActionsGrid.tsx` task tile, command-palette task action) to `/owner/crm?entity=leads&view=tasks&action=new`.
- `UnifiedCRM.tsx` already embeds `<CRMTasks />` for that view — extend it to read `?action=new` and forward to `CRMTasks` so it auto-opens the existing "Add task" dialog.
- This reuses the existing `src/pages/CRMTasks.tsx` (with its 30-day bin / restore behavior) inside the CRM shell — no new tasks page is created.

---

### 3. Investor flag inside Leads (non-destructive duplicate-style)

The user wants leads to be markable as Investor without disappearing from Leads, plus surface in the Investors directory and be filterable out by status.

#### Schema (one tiny migration):
- Add `crm_leads.is_investor BOOLEAN DEFAULT false` (no enum change, no destructive).
- Index `idx_crm_leads_is_investor` partial on `WHERE is_investor = true`.
- RLS unchanged (existing policies already cover the row).

#### UI:
- **Lead row action** — add "Mark as Investor" / "Unmark" toggle in `LeadQuickActions.tsx` and the row context menu in `CRMLeadsTableV2`.
- **Visual highlight** — when `is_investor = true`, badge the row with a small `Crown` chip + champagne accent ring; row stays in Leads.
- **Investors directory** — `InvestorsDirectory.tsx` query becomes `crm_leads where is_investor = true OR contact_type = 'investor'` so a flagged lead appears there too (read-only mirror, single source of truth in `crm_leads`).
- **Status filter rebuild** — replace the current "Stages" filter on the Leads table with a **Status filter** popover that:
  - Lists every distinct value of `pipeline_stage` plus virtual statuses `Investor`, `VIP`, `Flagged`, `Deleted`.
  - Has a search input at the top of the dropdown (live-filters the option list as you type — applies to every filter dropdown across the CRM, not just this one — implemented as a shared `<SearchableMultiSelect>` primitive in `src/components/ui/searchable-multiselect.tsx`).
  - Supports **Select all** / **Unselect all** + per-row tick.
  - URL-encodes selection so the filter survives reload.
- Concrete user flow this enables: tick all, untick "Investor", and the Leads table excludes investors so bulk outreach never reaches them — the user can then send a different campaign to the Investors directory.

---

### 4. "Currently in lead section, can't see leads" — render fix

`UnifiedCRM.tsx` lines 237–252 maps `entity=leads view=all` → `<CRMLeadsTableV2 filterType="all" />`. The recent CRM blank-screen patch left the `leads/all` branch behind a `Suspense` that doesn't render when `viewParam` is missing.

Fix: when `entity=leads` and no `view` is provided, force `view = "all"` (currently it falls back to first VIEWS entry which is "all" but is being overridden by stale `?view=overview` left in the URL). Also drop the empty-state guard so the `CRMLeadsTableV2` renders even before counts resolve.

This is a one-liner fallback in `UnifiedCRM.tsx` (`defaultView` for leads) plus a defensive `view ||= "all"` before the switch.

---

### 5. Employees hub upgrades + global directory bulk-delete + 30-day bin

Inside `EmployeesHub.tsx` (rendered for `entity=employees`) and **mirrored on every CRM directory** (Leads, Investors, Brokers, Agencies, Developers, Sales Reps, Employees):

- **Filter & search by Position** — multi-select with the same searchable dropdown from §3.
- **Bulk-select / unselect all** — checkbox column + header checkbox + sticky bulk action bar (uses existing `CRMBulkActionsBar.tsx` pattern).
- **Soft delete with 30-day bin** — set `deleted_at = now()`. A new `Bin` sub-tab on every directory shows rows where `deleted_at` is within the last 30 days, with **Restore selected**, **Restore all**, and **Delete permanently** actions. After 30 days a daily edge function (`process-soft-deletes`, mirrors the existing `process-meeting-reminders` pattern) hard-deletes.
- **Position management** — surface the existing positions table on the Employees page sidebar (CRUD + soft delete + bin), reusing the same component pattern.
- **Per-employee/broker hub** integrates (via `PersonHubDrawer` from §1):
  - CV upload + viewer
  - Warning letters (existing `useHRWarnings` hook)
  - Payroll (existing `useEmployeeSalaries` hook)
  - Leads assigned / leads closed (query `crm_leads` by `assigned_user_id`)
  - Suspend toggle (sets `is_active = false` + audit log)
  - Attendance / training / breakfast (broker variant)

#### Migration for soft-delete coverage
Add `deleted_at TIMESTAMPTZ` to any directory table missing it: `crm_brokerages`, `crm_developer_registry`, `developer_sales_reps`, `crm_employees`, `crm_positions`. RLS policies updated to filter `deleted_at IS NULL` from default selects and expose a `*_bin` view (or `?include_deleted=1` parameter) for the bin tabs. `crm_leads.deleted_at` already exists.

---

### Out of scope
- No redesign of CompanyHub itself — we reuse it.
- No new "Tasks" page — the existing `CRMTasks` is wired into the CRM shell.
- No removal of any existing CRM feature ("No Removal" policy).

### Technical summary

```text
src/components/crm/
  PersonHubDrawer.tsx          NEW — sheet wrapper (mirrors CompanyHubDrawer)
  PersonHub.tsx                NEW — tabbed body (Overview/Activity/Cards/Deals/...)
  ui/searchable-multiselect.tsx NEW — shared filter primitive (search inside dropdown)
src/pages/owner/crm/
  PersonHubPage.tsx            NEW — full-view route /owner/crm/person/:variant/:id
  UnifiedCRM.tsx               MODIFY — leads default view + ?action=new passthrough
  BrokersRegistry.tsx          MODIFY — replace minimal Sheet with PersonHubDrawer
src/components/crm/
  CRMLeadsTableV2.tsx          MODIFY — investor toggle, status filter, bin sub-tab
  InvestorsDirectory.tsx       MODIFY — include is_investor=true rows
  EmployeesHub.tsx             MODIFY — position filter, bulk delete, bin
  entity/DevSalesRepsDirectory MODIFY — open PersonHubDrawer on row click
  LeadQuickActions.tsx         MODIFY — Mark as Investor toggle
src/components/owner-dashboard/
  IntegrationWidgets.tsx       MODIFY — task tile → /owner/crm?entity=leads&view=tasks&action=new
supabase/migrations/
  *_crm_unification.sql        NEW — is_investor column + deleted_at on directories + bin view
supabase/functions/
  process-soft-deletes/        NEW — daily purge of >30-day bin rows
```
