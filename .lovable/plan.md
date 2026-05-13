
# CRM Audit & Reorganisation Plan

## What's broken right now (from the screenshot at /owner/crm)

The Leads table renders correctly in code, but it's being squeezed into the right pane while the left sidebar/chat panel is open (~700 px usable). When the table goes below its natural width, three cells collapse badly:

1. **Email column** — `break-all` on `w-[240px]` forces character-by-character vertical wrap (`b / o / u / j / a / o / u / d / ...`).
2. **Assigned Broker column** — italic "Unassigned" + outlined "Assign" button sit in a `flex gap-2` with no `whitespace-nowrap`, so "Unassigned" breaks across 3 lines and the "Assign" pill is pushed out of its row.
3. **Status pill** — `InlineStatusSelect` puts a full rounded-pill `<LeadStatusBadge>` (with its own border + colored dot) **inside** a bordered `SelectTrigger` with a chevron. Result: pill-in-a-box, chevron overlapping the badge text, dot clipped on the left edge.

These three are the actual visible bugs in the screenshot. They are pure CSS/markup fixes.

## Phase A — Fix the visible bugs (immediate, ~1 file)

File: `src/components/crm/CRMLeadsTableV2.tsx`

**A1. Email cell**
- Replace `break-all` with `truncate` (single line, ellipsis) and add `title={lead.email_lower}` so the full address shows on hover.
- Widen the column to `min-w-[220px] max-w-[320px]` and let it truncate instead of wrap.
- Add `block w-full` to the button so truncation kicks in.

**A2. Assigned Broker cell**
- Add `whitespace-nowrap min-w-[180px]` to the cell.
- Wrap the label + button in a single `inline-flex items-center gap-2 whitespace-nowrap`.
- Truncate the assigned name with `max-w-[140px] truncate` so a long broker name doesn't push the Assign/Change button.

**A3. Status dropdown — flatten the trigger**
File: `src/components/crm/InlineStatusSelect.tsx`
- Remove the outer border/background from `SelectTrigger` (use `border-0 bg-transparent shadow-none p-0 h-auto focus:ring-0 [&>svg]:hidden`) so only the colored pill is visible — clicking the pill itself opens the menu.
- Keep the chevron only if it doesn't overlap; the cleaner pattern is hide chevron, and add a subtle hover ring on the pill via `LeadStatusBadge` `onClick` styling.
- Result: single clean status pill, no square frame, no clipped dot, no chevron collision.

**A4. Table horizontal overflow guard**
- Wrap `<Table>` in a `div` with `overflow-x-auto` and give the inner table `min-w-[1100px]` so when the side panels are open the table scrolls horizontally instead of crushing every cell. This alone prevents the vertical-email class of bug from ever returning.

## Phase B — Deep CRM audit findings & reorganisation

Inventory shows the CRM surface is large and partly duplicated:

```text
Pages:
  /owner/crm                  → UnifiedCRM.tsx          (hub, ?section=… subnav)
  /owner/crm/relationship-hub → CRMRelationships.tsx    (Devs/Reps/Brokerages/Brokers)
  /owner/crm/leads/:id        → CRMLeadDetail.tsx
  CRMCalendar / CRMTasks / CRMNotes / AdminCRM (legacy)

Tables / lists (overlap):
  CRMLeadsTableV2, KanbanPipeline, InvestorsDirectory,
  DevelopersDirectory, BrokerageAgenciesDirectory, DevSalesRepsDirectory,
  IndividualBrokersTab, CompanyHub, PersonHub, PersonDetailDrawer

Bulk dialogs (5):
  BulkUploadDialog, BulkSendDialog, BrokerBulkUploadDialog,
  BulkOutreachPanel, BulkEmailModal, BulkWhatsAppModal, BulkAssignModal
```

### B1. Standardise the leads table cell contract
Adopt one shared row pattern across CRMLeadsTableV2, InvestorsDirectory, IndividualBrokersTab, DevSalesRepsDirectory, BrokerageAgenciesDirectory, DevelopersDirectory:
- Container: `overflow-x-auto`, table `min-w-[1100px]`.
- Text cells: `truncate` + `title=`, never `break-all`.
- Action cells: `whitespace-nowrap`.
- Status: flat pill via the new `InlineStatusSelect` trigger style.
- Date: `tabular-nums whitespace-nowrap`.

### B2. Unify the status dropdown
Single primitive `<StatusPillSelect>` (extract from the fixed `InlineStatusSelect`) used in: leads table, Kanban card, Person/Company hub, lead detail. Removes 3 visual variants today.

### B3. Collapse duplicate bulk dialogs
Today there are 7 bulk modals with overlapping UX. Consolidate into 2:
- `BulkActionsModal` (Assign / Tag / Change Status / Delete / Export) — replaces BulkAssignModal + parts of CRMBulkActionsBar.
- `BulkOutreachModal` (Email / WhatsApp / Upload list) with channel tabs — replaces BulkEmailModal + BulkWhatsAppModal + BulkSendDialog + BulkUploadDialog + BrokerBulkUploadDialog.

### B4. Tighten the section subnav (Phase 6 already added URL sync)
- Persist last-used `?section=` per role in localStorage so reopening /owner/crm lands on the user's last view.
- Add a sticky compact toolbar (search · stage filter · source · assignee · clear) shared across all directory tabs — currently each tab reimplements its own filter row.

### B5. Layout density
- Switch the Leads table to a `compact` density toggle (h-9 rows, 12 px cell padding) for dense workflows; current default is too tall for >50-row screens.
- Freeze the first two columns (checkbox + name) when scrolling horizontally.

### B6. Empty/loading/error parity
- All directory tabs adopt the existing skeleton + "no results, clear filters" pattern from CRMLeadsTableV2 lines 642–671 (3 of the 4 directories don't have it).

### B7. Non-functional cleanups discovered
- `assignedNames` lookup runs per render; memoise with `useMemo` keyed on `leads.length`.
- `fetchLeads()` is called after every status/VIP/assign change → switch to optimistic update + react-query invalidation already in `InlineStatusSelect`.
- `CRMLeadsTableV2.tsx` is 909 lines — extract `<LeadRow />`, `<LeadsToolbar />`, `<AssignCell />` for maintainability.

## Suggested execution order

1. **Phase A (now)** — fixes the screenshot in one edit, ships in minutes.
2. **B1 + B2** — table contract + StatusPillSelect primitive (prevents regressions).
3. **B3** — dialog consolidation.
4. **B4 + B5 + B6** — toolbar, density, parity.
5. **B7** — refactor for maintainability.

## Out of scope
- No data model / RLS / edge function changes.
- No removal of features (per the No-Removal policy in memory).
- No new colours; everything stays within the champagne-gold tokens.

Reply **"go phase A"** to ship the visible fixes immediately, or **"go full plan"** to execute A → B7 in order.
