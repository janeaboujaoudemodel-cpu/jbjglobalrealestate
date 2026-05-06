## Goals

Add three new capabilities to **Relationships → Brokerages** and **Relationships → Developers**:

1. **Exclusion Filters** — searchable multi-select to exclude specific agencies/developers, with named saved filter sets.
2. **Premium Excel-style Export** — colored XLSX (and matching PDF) with status-driven cell colors, frozen header, banded rows, and brand styling.
3. **Excel View** — in-app spreadsheet-like grid with inline status labeling and color coding that matches the export.

---

## 1. Exclusion Filters (saved)

**Schema** — new table `crm_saved_filters`:
- `id`, `user_id` (auth.uid), `scope` (`'brokerage' | 'developer'`), `name`, `excluded_ids uuid[]`, `excluded_names text[]`, `created_at`, `updated_at`
- RLS: owner-only (using `requireOwnerAuth` pattern + `auth.uid()` policies).

**UI** — new component `src/components/crm/ExcludeFilterPopover.tsx`:
- Trigger button "Exclude" next to Export.
- Searchable list of all current rows with checkboxes.
- Footer: `Reset`, `Save as…`, `Done`.
- Dropdown to load any saved filter for the current scope.
- Selected-state badge (e.g. "12 excluded · Tier-1 list") on the trigger button.

Wire into both Brokerages and Developers tabs in `src/pages/CRMRelationships.tsx`. The active exclusion is applied to `filtered` BEFORE rendering, before Export, and before the new Excel View.

---

## 2. Premium Colored Export

Rewrite `src/utils/exportBrokerages.ts` (and add `src/utils/exportDevelopers.ts`) using **`exceljs`** (richer styling than `xlsx`).

XLSX styling:
- **Header row**: champagne fill `#EFE6D6`, ink `#1A1A1A`, bold, gold bottom border `#B89555`, frozen.
- **Banded rows**: alternating `#FFFFFF` / `#FAF6EE`.
- **Status column**: solid fill by status —
  - `not_answering` / `rejected` → red `#FCA5A5` fg, dark red `#7F1D1D` text
  - `interested` / `meeting_booked` → emerald `#A7F3D0` / `#065F46`
  - `documents_required` → amber `#FDE68A` / `#92400E`
  - `registered` / `contract_signed` → blue `#BFDBFE` / `#1E3A8A`
  - `not_started` → champagne `#EFE6D6` / `#1A1A1A`
- **Number columns**: right-aligned, `#,##0` format.
- **Title block** (rows 1–3): merged "JBJ GLOBAL REAL ESTATE — UAE Brokerage Tracker" with date and total count.
- Auto-filter on data range, column widths from existing `COLUMNS`.

PDF: keep `jspdf-autotable` but add the same status fills and the brand letterhead.

CSV stays plain.

---

## 3. Excel View tab

New component `src/components/crm/ExcelGridView.tsx` — virtualized grid (built on `@tanstack/react-table` + plain CSS grid; no new heavy dep needed).

- Toggle pill in section header: `Cards | Excel View`.
- Sticky header, sticky first column (Agency / Developer name).
- Status cell is an inline dropdown (`not_answering`, `rejected`, `interested`, `documents_required`, `registered`, `contract_signed`, `meeting_booked`, `not_started`). Selecting a status:
  - calls existing update mutation (`brokerages.crm_status` / equivalent on developers),
  - immediately repaints the cell with the same color used in the export.
- Notes cell becomes editable inline (debounced save).
- "Export" from inside Excel View uses the same colored XLSX → 1-to-1 visual parity.

Excluded rows from filter #1 are hidden here too.

---

## Technical Details

- Add dep: `exceljs`. Remove direct use of `xlsx` for styled output (keep it only if other modules use it).
- Status palette centralised in `src/utils/crmStatusPalette.ts` and consumed by `ExcelGridView`, `exportBrokerages`, `exportDevelopers`, and the existing card badges so colors stay consistent everywhere.
- Saved filters are scoped per user; `OwnerGuard` already protects `/owner/crm/relationships`.
- Migration for `crm_saved_filters` + RLS policies (`select/insert/update/delete` where `user_id = auth.uid()`).

---

## Files

**New**
- `supabase/migrations/<ts>_crm_saved_filters.sql`
- `src/components/crm/ExcludeFilterPopover.tsx`
- `src/components/crm/ExcelGridView.tsx`
- `src/utils/crmStatusPalette.ts`
- `src/utils/exportDevelopers.ts`

**Edited**
- `src/pages/CRMRelationships.tsx` — wire Exclude button, Cards/Excel toggle, pass excluded set into Export and grid.
- `src/utils/exportBrokerages.ts` — switch to `exceljs`, add colored title + status fills + banding + frozen header + autofilter.
- `package.json` — add `exceljs`.

---

## Out of Scope (for this round)

- No changes to email templates, breakfast booking page, or developer/brokerage classification (those are tracked separately).
