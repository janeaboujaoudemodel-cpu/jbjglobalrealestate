## What I found

**1. The "two databases" issue is real data, not a bug.**
Your test broker (`infoo.jane@gmail.com`) has **2 active grants** in `crm_database_grants`:

| Granted | Database | Permission |
|---|---|---|
| May 19 | `al reef 1 (5) bed villas updated` | edit |
| May 17 | `MAMSHA MERGED (1)` | edit |

Neither has `revoked_at` set, so both correctly appear. The new grant did not auto-revoke the previous one — that's the gap to close.

**2. The broker workspace is a minimal 3-tab page.**
Today `/broker/crm` shows only: My Databases · My Leads · Activity (empty). No calendar, no inbox, no tasks, no notes, no projects, and the database view is read-only (list of names, not editable cells).

---

## Plan

### A. Fix the "extra database" leak (owner-side)

1. **One-database-at-a-time grant flow** — In `BrokerGrantsManagerDialog`, when you grant a new database, add a default-on checkbox **"Revoke all other databases for this broker"**. When ticked, the grant edge function sets `revoked_at = now()` on every other active grant for that broker in the same transaction.
2. **Active grants chip on the picker** — Show a small badge next to the broker's name in the manager dialog: "2 active databases · click to review" so you can never lose track again.
3. **Bulk-revoke action** — Add a "Revoke all other grants" button on each grant row so you can clean up `MAMSHA MERGED` for Jane in one click right now.
4. Every revoke writes a `broker_grant_revoked` audit row (already wired).

### B. Build the full broker suite at `/broker/crm`

Replace the current 3-tab page with an L-shaped workspace (same 88px header + sidebar standard as the owner panel) and these sections:

| Tab | Source | Behaviour |
|---|---|---|
| **Dashboard** | aggregated | KPIs: assigned DBs, leads in scope, open tasks, unread notes |
| **Databases** | `vw_crm_database_access` | Each granted DB opens as an **Excel-style editable grid** (see C) |
| **Leads** | `useBrokerScopedLeads` | Flat sortable/filterable table, status pill editor |
| **Calendar** | new `broker_calendar_events` (broker_user_id scoped) | Month + agenda view, create/edit own events |
| **Inbox** | reuse `email_inbox_items` filtered by `assigned_broker_user_id` | Read & reply, never sees owner's private threads |
| **Tasks** | new `broker_tasks` (broker_user_id scoped) | Kanban: Todo / Doing / Done, due dates |
| **Notes** | new `broker_notes` (broker_user_id scoped, optional `lead_id`) | Markdown notes, private to broker; owner sees all via RLS bypass |
| **Projects** | `vw_projects_public` (read-only) | Full front-end project browser, same as visitor sees |
| **Training** | existing `BrokerTraining` page | Linked from sidebar |

Front-end of the public site (`/`, `/projects`, etc.) stays fully open to brokers — they already pass `AuthRequiredRoute`. The only thing gated is the **CRM workspace**, which is broker-private.

### C. Excel-style editable database grid

`/broker/crm/database/:id` becomes a full spreadsheet:

- TanStack Table + virtualised rows (handles 10k+ leads)
- Inline cell edit (text, select for status, date picker, phone)
- Column sort, multi-column filter, search box, frozen first column
- Status dropdown is fully editable (writes through `crm_leads.status`)
- Only fields exposed by `permission_level = 'edit'` are editable; otherwise read-only with a lock icon
- Every cell save writes to `crm_lead_field_history` for audit
- Bulk select → "Mark contacted / Add note / Export to CSV"
- "Add Note" pinned button on every row → drops into `broker_notes` linked to that lead

### D. Privacy guarantees (RLS)

- `broker_notes`, `broker_tasks`, `broker_calendar_events`: row-level policies — `broker_user_id = auth.uid()` for the broker; owner sees all via `is_owner()`.
- Brokers **never** read `crm_leads` they don't have a grant for; the existing `vw_crm_database_access` + RLS on `crm_leads` already enforces this — confirmed.
- Owner's own CRM tables (`crm_audit_logs`, `crm_security_events`, all owner-only views) stay invisible to brokers.

### E. Sidebar/nav

Add a left rail inside `/broker/*` with: Dashboard · Databases · Leads · Calendar · Inbox · Tasks · Notes · Projects · Training · Settings. Matches the champagne L-shape used in `/owner`.

---

## Technical notes (for reference)

- New tables via migration: `broker_calendar_events`, `broker_tasks`, `broker_notes` (each: `id`, `broker_user_id`, `created_at`, `updated_at`, plus domain fields; RLS by `auth.uid() = broker_user_id OR is_owner()`).
- New edge function: `crm-broker-grant-replace` — atomic "grant DB X and revoke all others for this broker".
- New hooks: `useBrokerNotes`, `useBrokerTasks`, `useBrokerCalendar`, `useBrokerInbox`.
- New component: `BrokerSpreadsheet.tsx` (TanStack Table) reused on `/broker/crm/database/:id`.
- New layout: `BrokerWorkspaceShell.tsx` with the L-shape rail (88px header, sidebar).
- Routes: keep `/broker/crm` and `/broker/crm/database/:id`; add `/broker/crm/calendar`, `/inbox`, `/tasks`, `/notes`, `/projects`.
- All wrapped in existing `BrokerGuard` — no change to auth model.

---

## What I will NOT touch

- Public front-end (brokers already have full access via `AuthRequiredRoute`)
- Owner CRM at `/owner/crm` — unchanged
- Existing grant data — I'll only add the bulk-revoke action; I won't auto-revoke Jane's `MAMSHA MERGED` grant without your one-click confirmation

---

## Quick win first?

Before I build the full suite, do you want me to **revoke Jane's `MAMSHA MERGED` grant right now** so she only sees `al reef 1` on her next refresh? That's a 1-line data fix and lets you verify the scoping immediately while I build the rest.