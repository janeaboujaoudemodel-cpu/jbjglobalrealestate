# Contract Vault, Auto-Developer, Agency Activity & Brokers Registry

Four connected fixes in the Owner area.

## 1. Contract Vault — replace "All Emirates" with Developer filter

File: `src/pages/owner/contracts/ContractVault.tsx`

- Remove the `emirate` state + `<select>` "All emirates".
- Replace with the existing `DeveloperSelectDropdown` (`src/components/developer-portal/DeveloperSelectDropdown.tsx`) showing every developer from the `developers` table — including ones auto-created from uploaded contracts (#2). Default value `""` ⇒ "All developers".
- Filtering rule:
  - Signed contracts (`signed_contracts_index`): match by `developer_name` (case-insensitive) against the chosen developer.
  - Developer Agreements card: also filter by `developer_id` / `developer_name_raw`.
- Keep the search input. Keep the count badge.
- Reason "All Emirates is empty": current `emirates` array is built only from `signed_contracts_index.emirate`, which is null for every uploaded agreement → no options. Replacing with developers (which we always have) fixes the empty state.

## 2. Auto-create developer when uploading a contract

File: `src/components/owner/contracts/AgreementUploadDrawer.tsx` + new edge function helper.

When the user confirms an agreement and `developerId` is null but `extracted.developer_name` exists:

- Before insert, run a case-insensitive lookup: `developers.select('id,name').ilike('name', name)`.
- If no row, insert a new `developers` row with:
  - `name = extracted.developer_name`
  - `is_active = true`, `created_via = 'contract_vault'`
  - minimum required columns (slug derived from name).
- Use returned `id` as `developerId`, set `external_agreements.status = 'filed'`.
- Invalidate React-Query keys: `["developers"]`, `["external_agreements"]`, `["all-developers"]` so:
  - Contract Vault developer dropdown updates.
  - Global property filters (`useDevelopers`) get the new entry.
  - Any other dropdown using the `developers` table refreshes on next focus.

Add a small toast: "New developer 'X' added to your directory."

## 3. Agency Activity Log — fix "showing zero"

File: `src/pages/owner/crm/AgencyActivityLog.tsx`

`crm_brokerage_actions` is genuinely empty in DB (verified: `count = 0`). Two real causes:

a. Other CRM features (Remind, Note, Calendar from Relationships list) write to other tables (`crm_communications`, `crm_reminders`, `crm_notes`, `crm_communication_log`). The Activity Log only reads `crm_brokerage_actions`, so it always shows 0.

Fix: make the page a unified feed by also querying:
- `crm_communications` (action_type = 'message_sent' | 'outreach_sent')
- `crm_reminders` (action_type = 'reminder', map `remind_at` → `due_at`)
- `crm_notes` (action_type = 'note')
- `crm_communication_log` (calls / emails)

Merge results in-memory, sort by `created_at` desc, keep existing UI cards. Resolve `brokerage_name` from `crm_brokerages` for any row carrying `brokerage_id`; for rows tied only to a lead, look up `crm_leads.full_name` instead and label as "Lead: X".

b. Add a "Live refresh" subscription via `supabase.channel('agency-activity').on('postgres_changes', …)` so newly logged Reminds appear without manual refresh.

## 4. New page: Brokers Registry

Route: `/owner/crm/brokers` (added to `src/routes/OwnerRoutes.tsx`).
File: new `src/pages/owner/crm/BrokersRegistry.tsx`.
Quick-action tile: add to `src/components/owner-dashboard/QuickActionsGrid.tsx` (icon `Users`, tone `gold`).

Page layout (champagne theme, Inter only):
- Header: "Brokers Registry — every broker, every company they ever worked for."
- KPI tiles: Total brokers, Active this month, Pending verification, Companies represented.
- Tabs: **Registered** (rows with `user_id`) | **External / CRM-only** (rows from `crm_brokers` without a profile) | **All**.
- Table columns: Broker (avatar + display_name), Email, Phone, Current company, Tier, RERA #, Last active, Actions (View profile, Add note, Move to company).
- Search across name / email / phone / company.
- Filter by company (multi-select from distinct `current_company` + `broker_company_history.company_name`).
- Click a broker → drawer with full profile + "Companies worked for" timeline pulled from `broker_company_history` (already exists).
- Data sources:
  - `broker_profiles` joined to `auth.users` via `user_id` for verified registered brokers.
  - `crm_brokers` for self-added external brokers (no Lovable account).
  - `broker_company_history` for the timeline.
- Add an "Add broker manually" button → minimal form inserting into `crm_brokers` (full_name, email, phone, current_company, rera_license, notes).

## Technical notes

- No schema changes required — all needed tables already exist (`developers`, `external_agreements`, `crm_brokers`, `broker_profiles`, `broker_company_history`, `crm_brokerage_actions`, `crm_communications`, `crm_reminders`, `crm_notes`).
- All new UI follows champagne palette (`#FDFBF7`, `#F7F2EA`, `#EFE6D6`), gold hairline (`#B89555`), ink text `#1A1A1A`. No solid gold fills, no faded gold text.
- Use `<IconTile />` for all icons.
- React-Query invalidation list to wire from drawer:
  ```text
  ["developers"], ["all-developers"], ["external_agreements"],
  ["projects-developers"], ["uae-registry","developer"]
  ```
- File touched count: 4 edited (ContractVault, AgreementUploadDrawer, AgencyActivityLog, OwnerRoutes, QuickActionsGrid) + 1 new (BrokersRegistry).
