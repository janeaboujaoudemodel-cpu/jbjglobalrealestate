
## Goal

Four distinct improvements bundled into one plan. Each is independently shippable.

---

### 1. ElevenLabs widget — visible status

Today the widget swallows errors into a generic toast. Replace with an inline status pill on the widget itself.

States:
- `Initializing…` — while requesting the conversation token / connecting
- `Connected` — live call (green dot, mic icon)
- `Unavailable` — token fetch failed, API key missing, quota exceeded, or `onError` fired. Shows a `Try again` button.
- `Idle` — default (current "Speak with us" CTA)

Keep the existing silent console.warn for me. Only show the generic toast on first failure; subsequent retries update the pill in place.

Files: `src/components/VoiceConciergeWidget.tsx`.

---

### 2. Database folders assignable to a broker (drag & drop)

In `/owner/crm?entity=databases` the sidebar already lists "Databases" but has no folder concept and no broker assignment.

Add:
- **"+ New folder"** button in `CRMListSidebar` (horizontal bar + vertical rail).
- Each folder shows the assigned broker's name + colored chip (e.g. "Jessica").
- Folder row has an **Assign broker** action (popover with `BrokerCombobox` — existing search-enabled picker).
- Each database (list) row in the main grid becomes draggable; dropping it on a folder reparents it.
- Auto-tag every lead inside that database with `assigned_broker_id = folder.broker_id` (and apply to future uploads into the folder).

Schema (migration):
- New table `crm_database_folders` (name, color, assigned_broker_id, owner_user_id).
- New column `crm_lead_lists.folder_id` (nullable, FK).
- Trigger: when a lead is inserted with a `source_database_id` whose list belongs to a folder with `assigned_broker_id`, set `assigned_broker_id` on the lead if null.
- RLS: owner full access; brokers can read folders where they are assigned.

Files: `useCRMLists.ts` (extend), new `useCRMFolders.ts`, `CRMListSidebar.tsx`, `BrokersRegistry.tsx` / `UnifiedCRM.tsx` (drag handles), new `FolderAssignBrokerPopover.tsx`.

---

### 3. CRM Leads page — inline "Add Lead" & "Add Broker"

On `/owner/crm` (leads view) add a primary action group in the page header:
- **+ Add Lead** → opens existing `CRMLeadModal` in create mode; includes an inline `BrokerCombobox` ("Assign to broker") with a "+ Add new broker" option that opens a quick `AddBrokerInlineDialog` (name, email, phone, languages, nationality — reuses the pickers built earlier). On save, broker is created in `crm_brokers` and immediately assigned to the lead.
- **+ Add Broker** → opens `AddBrokerInlineDialog` directly.

Files: `src/pages/owner/crm/UnifiedCRM.tsx` (header actions), new `src/components/crm/AddBrokerInlineDialog.tsx`, reuse `CRMLeadModal`.

---

### 4. New sidebar section: **Broker Accounts** (admin)

A dedicated owner-only area to provision and supervise broker CRM logins.

Sidebar entry: under existing "CRM" group, add **Accounts** → `/owner/crm/accounts`.

Page sections:
1. **Provision account** — form: email, full name, assigned databases/folders, permission level. On submit, edge function `provision-broker-account`:
   - Calls `admin.createUser` with a random password
   - Inserts row into `crm_brokers` linked to that auth user
   - Sets `user_roles` row = `broker`
   - Sets `must_change_password = true` flag
   - Emails the broker a welcome message (Resend) with their temp password + login link
2. **Login gate** — middleware that forces `/auth/change-password` when `must_change_password = true`. Once changed, flag is cleared.
3. **Accounts table** — list every broker account with: last login, status (active/suspended), # leads, # calls, # edits last 7d, assigned folders. Row actions: suspend, reset password, revoke, view activity.
4. **Activity timeline per broker** — drawer showing every audited action (lead added, lead edited, lead marked junk, call logged, login, export). Pulled from `crm_audit_log` (extend if needed).
5. **Export** — per-broker CSV/XLSX export of all leads they own or touched.

Schema (migration):
- `crm_brokers.auth_user_id` (uuid, FK auth.users) — if not present.
- `crm_brokers.must_change_password` (bool, default false).
- `crm_audit_log` table if missing: actor_user_id, entity_type, entity_id, action, before jsonb, after jsonb, created_at.
- Trigger on `crm_leads` insert/update to write into `crm_audit_log` (delete already forbidden — they can only mark junk per existing rule).
- RLS: brokers see their own audit rows; owner sees all.

Edge functions:
- `provision-broker-account` (admin createUser + email)
- `reset-broker-password` (admin resetPasswordForEmail)
- `suspend-broker-account` (ban_duration)

Files: `src/pages/owner/crm/BrokerAccounts.tsx` (new), `src/components/crm/ProvisionBrokerDialog.tsx` (new), `src/components/crm/BrokerActivityDrawer.tsx` (new), `src/pages/auth/ChangePassword.tsx` (new), router entry, sidebar nav entry, three new edge functions.

---

## Order of execution

1. ElevenLabs status pill (smallest, isolated)
2. Add Lead / Add Broker inline on CRM page (frontend only)
3. Database folders + broker assignment + drag-drop (migration + UI)
4. Broker Accounts section (migration + edge functions + new page + force-password-change flow)

## Out of scope

- Call recording / dialer telemetry beyond what the existing audit log captures (calls counted only if already logged via existing channels).
- Real-time presence ("see brokers live") — only "last seen" + activity log unless you confirm you want a presence feed too.
