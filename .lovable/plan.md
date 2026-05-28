## Goal

Make Employee Performance Overview a true live operational console: every employee row shows real activity from across the CRM, can be filtered by department, drilled into for full lead history, and bulk-managed (status changes, employment type, delete).

## 1. Schema additions (one migration)

Add to `public.crm_users_profile`:

- `employment_type text` — `'full_time' | 'part_time' | 'freelancer' | 'referral' | 'intern' | 'contractor'`, nullable.
- `employment_status text default 'active'` — `'active' | 'on_leave' | 'left_company' | 'terminated' | 'inactive'`.
- `left_at timestamptz` — set when status flips away from active.
- `left_reason text` — free-text note.

No new tables. All employment metadata lives on the single canonical employee row.

## 2. Real activity aggregation (one view + one RPC)

Create `public.vw_employee_activity_30d` (security_invoker) aggregating per `user_id` from existing tables:

- calls → `broker_call_logs`
- chats → `broker_chat_logs`, `employee_chat_messages`
- emails → `employee_emails`
- leads contacted / updated / by status → `crm_leads` (`assigned_to` + `crm_lead_status_history`)
- tasks → `crm_tasks` where `assignee_id = user_id`
- meetings → `crm_calendar_events`
- pipeline buckets → counts of `crm_leads` per stage (new/contacted/interested/not_interested/junk/won/lost) for the user

Plus `get_employee_lead_breakdown(_user_id uuid)` RPC returning every lead the employee owns with id, name, stage, last_contact_at, value, notes — used by the drill-down profile and the CSV export.

## 3. Employee Performance Overview UI (`EmployeePerformanceDashboard.tsx`)

- Replace the parallel queries with a single read of `vw_employee_activity_30d` + `crm_users_profile`.
- Add a sticky toolbar above the list:
  - Department filter (Brokers / Property Consultants / Marketing / All / …) driven by distinct `crm_users_profile.department`.
  - Employment-type filter chips.
  - Status filter (Active / Left / All).
  - Search box.
  - Bulk action bar (appears when ≥1 row selected): **Mark as left**, **Change employment type**, **Delete**, **Export CSV**.
- Each row gets a checkbox + an "Open profile" button (replaces the current expand-only behavior; expand still works for the quick KPI strip).
- Row metrics now show: Calls / Chats / Emails / Leads / Pipeline (interested / not-interested / junk count chips) / Tasks / Score. Numbers come straight from the view — no fallback "0" placeholders unless truly zero.
- Employees with `employment_status != 'active'` render in a dimmed strip with a "Left" badge; can be hidden via the status filter.

## 4. Employee drill-down profile (new page)

Route: `/owner/hr/employee/:userId`

- Header card: photo, name, job title, department, employment type chip, status, start date, joined date, tenure.
- Activity tab: full 30/90/365-day KPI grid (reuses the view).
- Leads tab: paginated table of every lead owned by the employee with stage, value, last contact, notes preview, status pill, and a CSV export button. Owner can edit stage, reassign, or delete inline.
- Calls / Chats / Emails tabs: time-ordered list from the respective log tables.
- Owner-only "Danger zone" panel: change employment type, mark as left (with reason), reassign all open leads to another employee, delete account.

Reached via the row's "Open profile" button and from CareersPortal department drill-down.

## 5. Bulk actions backend

Single edge function `hr-bulk-employee-action` (verify_jwt + `requireOwnerAuth`) taking:

```
{ action: 'set_status' | 'set_employment_type' | 'delete', user_ids: uuid[], payload: {...} }
```

- `set_status` updates `crm_users_profile` (employment_status + left_at + left_reason) and flips `is_active` when leaving.
- `set_employment_type` updates the new column.
- `delete` soft-deletes (`is_active=false`, `employment_status='terminated'`) — never hard delete (FK integrity for leads/calls/etc.).
- Every action writes an `admin_edit_log` row for audit.

## 6. Employment-type sync at intake

When a new joiner is approved (existing `NewJoinerApplicationForm` → IT task → CRM account creation), persist the chosen employment_type so it appears in the dashboard immediately. Add the field to `NewJoinerApplicationForm` (radio: Full-time / Part-time / Freelancer / Referral / Intern / Contractor).

## 7. CareersPortal integration

The CareersPortal "Overview" section already mounts `EmployeePerformanceDashboard`. After the refactor:

- KPI cards show 30-day totals across the whole company from the view (no more zero-padded fallback).
- Clicking a department chip in the toolbar deep-links to the same dashboard pre-filtered.

## Technical notes

- Activity numbers come from existing tables only — no new write paths needed for calls/chats/leads, the data is already there.
- All policies on the new view inherit via `security_invoker=on`; owners & HR admins keep full read; employees see only their own row (existing `has_role` / `is_hr_manager` patterns).
- The drill-down profile and bulk actions live behind `OwnerGuard` per the Owner Restricted Routes standard.
- No removal of existing features per the No-Removal policy — the current expand strip stays; profile button is additive.

## Out of scope (call out explicitly)

- Re-architecting how calls/chats are written (we read what's already logged).
- Multi-tenant role redesign — the existing `crm_role`, `app_role`, `is_hr_*` functions continue to gate access.
- Real-time websocket push for the dashboard — initial pass is a 30-second polling refetch; can promote to Supabase realtime later.
