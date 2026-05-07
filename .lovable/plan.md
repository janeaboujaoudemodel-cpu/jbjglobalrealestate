
# Brokerage CRM Workspace — Rebuild Plan

Goal: turn the brokerage Excel view + agency editor into a real enterprise CRM (Airtable/Monday-grade), fix the registration/contract/attendance data model, and add an AI bulk-attendance flow.

---

## 1. Data model (single migration)

New / changed tables:

- **`crm_brokerage_events`** — one row per briefing or breakfast hosted for an agency.
  Fields: `id`, `brokerage_id` (FK), `event_type` (`briefing` | `breakfast`), `event_date`, `title`, `notes`, `created_by`, timestamps. Owner-only RLS.
- **`crm_brokerage_event_attendees`** — one row per broker who attended an event.
  Fields: `id`, `event_id` (FK cascade), `agent_id` (nullable FK → `crm_brokerage_agents`), `name`, `phone`, `email`, `matched_via` (`manual` | `ai_paste` | `bulk`), timestamps.
- **`crm_brokerages`** — add columns:
  - `contract_status` text (enum-checked: `none` | `draft_sent` | `awaiting_signature` | `signed` | `expired` | `terminated`)
  - `contract_signed_at` timestamptz, `contract_expires_at` date, `contract_document_url` text
  - **drop usage of** `pending_documents_notes` from the grid (column kept in DB for back-compat; just hidden in UI per request).

DB-side counters (computed via views, no triggers needed):
- **`v_brokerage_attendance_counts`** view exposing `briefing_count`, `breakfast_count`, `total_attendance` per `brokerage_id`, derived live from `crm_brokerage_events` + attendees.
- **`v_broker_attendance_counts`** view exposing the same per `agent_id`.

Counts in the grid will read from these views (always accurate, no manual cell editing of count fields).

---

## 2. Spreadsheet engine — replace `ExcelGridView`

Build a new **`CrmDataGrid`** component (keep old one for developer tab) with:

- Sticky header **and** sticky first 2 columns (checkbox + agency name).
- Multi-select checkboxes, shift-click range select, "select all on page".
- **Toolbar**: search, column filters (chips), sort by any column, page size (50/100/250), freeze-columns toggle, **Add row**, **Duplicate**, **Delete selected**, **Undo last change**, **Export** (CSV/XLSX/PDF reusing existing `ExportMenu`).
- **Inline editing** on every cell (text/number/date/select). Esc cancels, Enter commits, blur commits, Cmd-Z triggers undo via a 20-step in-memory mutation log.
- **Column resize** by dragging header edge; **column reorder** via header drag handle; widths persisted to `localStorage` per user.
- **No truncation** by default: cells wrap to 2 lines with ellipsis-on-overflow + tooltip; row height auto-grows; uniform 44 px min-height.
- **Champagne styling**: white rows, `#FAF6EE` band, `#B89555` 1 px hairlines, ink `#1A1A1A` text, `#EFE6D6` headers, no blue anywhere.
- **Dropdown cells** use shadcn `<Select>` (not native `<select>`), with status-colored pill trigger and champagne menu surface. Eliminates the blue OS dropdown.
- Pagination footer (already added) kept.

---

## 3. Brokerage Excel-view columns (final order)

```
☐  Agency  |  Country  |  Emirate  |  Office
Registration Status  |  Contract Status  |  Attendance  |  Agency Status
Active brokers  |  Admin name  |  Admin phone  |  Phone  |  Email
Briefings attended  |  Breakfasts attended  |  Total attendance  |  Last briefing  |  Last breakfast
Last contact  |  Deals  |  Inquiries  |  Notes
```

- The 4 priority status pills (Registration, Contract, Attendance, Agency) sit **side-by-side** as required.
- "Pending documents" column **removed** — pending state is one of the registration values (`pending_documents`, `documents_pending_review`).
- Attendance-count columns are **read-only** (sourced from views) and update live.
- Country column uses an autocomplete with deduplicated values pulled from `SELECT DISTINCT country` — no duplicate options.

Registration values shown (matches request): Not registered · Pending Registration · Waiting for Documents · Under Review · Registered · Approved · Rejected. We extend `BROKERAGE_REGISTRATION_STATUS_OPTIONS` to include `pending_registration`, `under_review`, `approved` (UI synonyms map to existing DB values where possible).

---

## 4. Agency drawer — Active Brokers & Attendance

The agency edit drawer (`BrokerageAgentsEditor` host) gets a new toolbar:

```
[+ Add Broker]  [+ Add Admin]  [+ Add Manager]  [+ Add Attendee]
[+ Add Briefing]  [+ Add Breakfast]  [+ Add Contract]  [+ Add Registration Note]
```

- **Add Broker / Admin / Manager** → adds a row to `crm_brokerage_agents` with the chosen `role`.
- **Add Briefing / Breakfast** → opens an inline panel that creates a `crm_brokerage_events` row, then lets you add attendees (single or bulk) without closing.
- **Add Contract** → opens contract sub-panel: type, signed date, expiry, upload URL → writes `contract_status` + related fields on `crm_brokerages`.
- **Add Registration Note** → free text appended to `notes` with timestamp prefix.
- Each broker row shows their personal attendance counts from `v_broker_attendance_counts`.

Bulk operations on the brokers sub-table: multi-select, delete, duplicate, drag-reorder (persists `display_order`).

---

## 5. AI bulk attendance import

New edge function **`crm-attendance-ai-match`** (Lovable AI, `google/gemini-3-flash-preview`, structured tool call):

Input: `{ event_id, raw_text, brokerage_id }`
The function:
1. Splits the pasted text into candidate names / phones / emails.
2. Loads existing `crm_brokerage_agents` for that brokerage.
3. Asks the model to match each line to an existing agent (by fuzzy name/phone/email) or mark `create_new`.
4. Returns `{ matched: [...], created: [...], ambiguous: [...] }`.
5. Inserts attendees into `crm_brokerage_event_attendees`; auto-creates missing brokers in `crm_brokerage_agents`.

Frontend: inside the briefing/breakfast panel, a **"Register with AI"** button opens a textarea + a result preview where the user confirms ambiguous matches before commit. Counts in the grid update via React Query invalidation.

---

## 6. Analytics strip

A compact stat strip above the grid (champagne tiles, ink text, gold hairlines):

```
Total agencies · Total brokers · Registered · Pending · Total attendance
Avg attendance / agency · Avg attendance / country · Top countries (chips)
```

All values come from a single `useBrokerageAnalytics` hook backed by `v_brokerage_attendance_counts` + simple aggregates.

---

## 7. Registration status sync

Bug: 10,558 agencies all show `not_registered` because nothing writes the value when an agency signs an outreach reply or a contract.
Fix:
- When `contract_status` flips to `signed`, a DB trigger sets `registration_status = 'registered'` if currently `not_registered`.
- When the outreach pipeline marks an agency `nda_signed` or `active_partner`, the same trigger sets `registration_status = 'registered'`.
- The new Registered badge is rendered in: agency card, Excel grid, registry list, outreach send dialog, contract panel — driven from one selector `useAgencyStatusBadges(brokerage)`.

---

## 8. Country deduplication

- Country column reads from a memoized `Set<string>` built from current rows; the dropdown options are sorted unique.
- A migration normalises legacy rows (`UAE` → `United Arab Emirates`, trim/case) once.
- Filter chip shows each country once with a count badge (e.g., `United Arab Emirates · 9,824`).

---

## 9. Files

New:
- `src/components/crm/grid/CrmDataGrid.tsx` (engine)
- `src/components/crm/grid/CrmGridToolbar.tsx`
- `src/components/crm/grid/CrmStatusCell.tsx` (shadcn Select pill)
- `src/components/crm/AgencyAttendancePanel.tsx`
- `src/components/crm/AgencyContractPanel.tsx`
- `src/components/crm/AIAttendanceImportDialog.tsx`
- `src/components/crm/BrokerageAnalyticsStrip.tsx`
- `src/hooks/useBrokerageEvents.ts`
- `src/hooks/useBrokerageAnalytics.ts`
- `supabase/functions/crm-attendance-ai-match/index.ts`
- One migration for tables + views + triggers + status normalisation.

Edited:
- `src/pages/CRMRelationships.tsx` — swap `ExcelGridView` (brokerage tab only) for `CrmDataGrid`, mount analytics strip, drop "Pending documents" column, add Contract column.
- `src/components/crm/BrokerageAgentsEditor.tsx` — wire the new Add buttons + per-broker attendance counts.
- `src/utils/crmStatusPalette.ts` — extend registration enum, add `CONTRACT_STATUS_OPTIONS` and `ATTENDANCE_STATUS_OPTIONS` (none/low/active/champion based on count thresholds).

Developer Excel tab keeps the existing `ExcelGridView` (out of scope) so this change is contained.

---

## 10. Acceptance walkthrough (delivered after build)

After implementation the user will get a short tour pointing to:
- Where to add brokers → agency drawer → "+ Add Broker"
- Where to add attendance → agency drawer → "+ Add Briefing/Breakfast" → attendees panel
- AI bulk import → that panel → "Register with AI"
- Analytics strip → top of brokerage tab
- Registration + Contract pills → columns 5–6 of the grid, plus agency drawer header
- Auto counts → Briefings/Breakfasts/Total columns (read-only, live)
- Country dedup → country dropdown + filter chip
- Editable mode → every non-count cell is double-click editable; toolbar handles add/delete/duplicate/undo/export

