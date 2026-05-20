## Goal

In `/owner/crm?entity=databases`, each uploaded database currently shows only as a file row with Download/Manage actions. We need it to behave like a real CRM tab:

1. Click a database → it **expands in place** to a full leads grid you can scroll, edit, and bulk-act on.
2. Select rows → **"Assign to me"** links them to canonical leads (creating new ones only when needed), so the same person never gets re-worked.
3. Marking a row as **Junk** in the database view is the same fact everywhere — Leads tab, Investors, future databases — instantly.
4. Replace the blue native `<select>` "All statuses" with a gold/champagne dropdown so no blue hover survives anywhere on this screen.

## What you'll see

```text
Databases hub
─────────────────────────────────────────────────────────────────
[ search… ]  [ All statuses ▼ gold ]  [ Refresh ]  [ Upload ]
─────────────────────────────────────────────────────────────────
▸ Database "Cityscape leads – Oct"           4,210 rows · 3 brokers
▾ Database "DLD Q3 raw export"               12,907 rows · 0 brokers
     ┌─────────────────────────────────────────────────────────┐
     │ ☐  Name        Phone        Email     Status    Owner   │
     │ ☑  Ali K.      +9715…       ali@…    [JUNK]    —        │
     │ ☑  Sara T.     +9715…       sara@…   [NEW]     Me       │
     │ ☐  John D.     —            —        —         —        │  ← skipped on assign (no contact)
     │ …                                                       │
     │  [ Assign to me ]  [ Mark Junk ]  [ Set stage ▾ ]       │
     └─────────────────────────────────────────────────────────┘
▸ Database "Bayut scrape March"              865 rows · 1 broker
```

Junk badge, owner badge and pipeline stage are read directly off `crm_leads`, so flipping the status on this grid is identical to flipping it on the Leads tab.

## Implementation

### 1. New view: `vw_crm_database_row_status`
A read-only Postgres view joining `crm_source_database_rows` to `crm_leads` so the grid gets every row's canonical state in one query:

```sql
CREATE OR REPLACE VIEW public.vw_crm_database_row_status AS
SELECT
  r.id              AS row_id,
  r.source_database_id,
  r.row_index,
  r.raw,
  r.merged_lead_id,
  l.id              AS lead_id,
  l.full_name,
  l.email_lower,
  l.phone_e164,
  l.is_junk,
  l.pipeline_stage,
  l.assigned_to_user_id,
  l.vip,
  l.flagged
FROM public.crm_source_database_rows r
LEFT JOIN public.crm_leads l ON l.id = r.merged_lead_id;
```
RLS inherits from the underlying tables (already enforced via `has_database_grant` and owner policies).

### 2. New RPC: `assign_database_rows_to_me`
A single SECURITY DEFINER function that the front-end calls with `(row_ids uuid[])`. For each row:
- Normalize `email_lower` / `phone_e164` from `raw` if not already merged.
- If `merged_lead_id IS NULL` and (email OR phone) match an existing `crm_leads` row → set `merged_lead_id = matched.id`.
- Else if (email OR phone) present → INSERT a new `crm_leads` row (full_name, email_lower, phone_e164, source='database', database_source=<db name>) and set `merged_lead_id`.
- Else → skip and add to `skipped[]` (returned to caller).
- Set `assigned_to_user_id = auth.uid()` on the resolved lead.
- Return `{ linked: int, created: int, reused: int, skipped: uuid[] }`.

Dedup rule: **email OR phone** match (per your choice). No name fallback.

### 3. UI: `DatabasesHub.tsx` — expandable rows + inline leads grid
- Each card gets a chevron; clicking toggles `openIds: Set<string>`. Multiple can be open.
- When open, mount `<DatabaseRowsGrid databaseId={r.id} />` directly below the card.
- `DatabaseRowsGrid` is a new component:
  - Queries `vw_crm_database_row_status` paginated (200/page).
  - Renders `ExcelGridView`-style table: checkbox · Name · Phone · Email · Junk badge · Stage chip · Owner.
  - Junk badge uses semantic Red tone via `IconTile`; Owner = "Me" pill when `assigned_to_user_id === currentUserId`.
  - Sticky toolbar above the rows: **Assign to me**, **Mark Junk**, **Unmark Junk**, **Set stage ▾**, **Open in Lead Hub** (opens existing `PersonHub` for that lead_id).
  - "Assign to me" calls the RPC; on success shows toast `Linked X, created Y, skipped Z`. Skipped rows get a small "No contact" inline note.
  - "Mark Junk" updates `crm_leads.is_junk = true` for every selected row's `lead_id` (rows without a lead_id are auto-linked first via the same RPC, then flipped).
  - All mutations invalidate the leads query keys so the Leads tab reflects the change instantly.

### 4. Status sync
Because every grid (Databases, Leads, Investors, Flagged, VIP) reads from `crm_leads`, setting `is_junk = true` once propagates everywhere automatically. We additionally invalidate:
- `["crm-leads"]`, `["crm-section-counts"]`, `["vw_crm_database_row_status", databaseId]`.

A small "Junk" badge component is added to the shared lead row renderer so the Junk state is consistently visible across Databases, Leads, Investors.

### 5. Kill the blue dropdown
Replace the native `<select value={statusFilter}>` in `DatabasesHub.tsx` with the existing themed `<Select>` from `@/components/ui/select` (Radix + champagne tokens). This is the same primitive already used elsewhere — its hover/focus uses `bg-[#EFE6D6]` + gold hairline, never blue.

While we're there, audit this file for any other native `<select>` or default focus rings and switch them to the themed primitive so the page has zero blue accents.

### Out of scope

- No changes to upload flow, broker grants, or document download (Strict "No Removal" — Manage / Give Access / Download buttons stay exactly as they are).
- VIP/flagged/stage sync stays handled by existing edit paths (per your answer, only Junk needs to sync now).
- No new pipeline stages — uses whatever `crm_leads.pipeline_stage` already accepts.

## Verification

1. Open `/owner/crm?entity=databases` → click a database → grid expands inline, scrolls smoothly, shows 200 rows with paging.
2. Select 5 rows (mix of with/without contact) → click **Assign to me** → toast reports e.g. `Linked 2, created 2, skipped 1`; the 4 assigned rows now show "Me" pill.
3. Mark one row Junk → switch to Leads tab → same lead shows a Junk badge with no refresh.
4. Open the "All statuses" filter → hover options → background is cream/gold hairline, **never blue**.
5. Re-uploading the same row a week later → assigning again does **not** create a duplicate; it reuses the existing lead.
