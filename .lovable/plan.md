## Goal

Stop OTP/session QA. Fix the foundation so every invited broker is a real, queryable entity wired into the CRM, every uploaded database shows who has access, and the broker-side CRM workspace actually opens with strict scoping. No duplicate systems — extend `crm_brokers`, `crm_database_grants`, `crm_source_databases`, `crm_leads`.

## Findings from the current schema

- `crm_brokers` already has `user_id`, `invitation_status`, `otp_hash`, `activated_at`, `blocked_at`, `invited_by_user_id`. Good — invitations live here. No second table needed.
- `crm_database_grants` already has `source_database_id`, `broker_user_id`, `permission_level`, `granted_by`, `granted_at`, `revoked_at`, `suspended_at`, `visibility_direction`, `date_window_*`, `lead_ids`, `status_filter`. Good — access logic lives here.
- `crm_leads` has `assigned_broker_id`, `assigned_to_user_id`, `source_database_id`. Good — ownership lives here.
- **Missing piece #1:** `BrokerActivate` redirects to `/broker/crm`, but **no such route exists**. Brokers land on a 404 after activation.
- **Missing piece #2:** Owner's `DatabasesHub` lists databases but doesn't surface grantee summary (who/when/status) on the row.
- **Missing piece #3:** No deterministic link from `auth.users.id` (broker login) → `crm_brokers` row when the broker first signs in. Activation sets `user_id`, but legacy/manually-created brokers can drift.
- **Missing piece #4:** RLS on `crm_leads` / `crm_source_databases` / `crm_source_database_rows` for the broker role needs to be re-checked against `crm_database_grants` (active, not revoked, not suspended, within date window, lead_ids/status filter respected).

## Plan

### 1. Schema repair (single additive migration)
- Add `crm_brokers.is_active_broker boolean default false` (true once `activated_at IS NOT NULL AND blocked_at IS NULL`) + trigger to maintain it.
- Add unique partial index `crm_brokers(user_id) WHERE user_id IS NOT NULL` to guarantee one broker entity per auth user.
- Add view `vw_crm_database_access` =
  `crm_source_databases` ⋈ `crm_database_grants` (not revoked) ⋈ `crm_brokers` (by `broker_user_id = user_id`)
  exposing: `database_id, database_name, broker_id, broker_user_id, broker_name, broker_email, permission_level, granted_at, granted_by_name, status (active|suspended|expired|revoked), visibility_direction, date_window, lead_count_in_scope`.
- Add view `vw_crm_broker_overview` per broker: assigned databases count, assigned leads count, last activity, invitation status, session count, blocked flag.
- Helper SQL function `broker_has_database_access(_user uuid, _db uuid) returns boolean` (security definer, checks active grant, not suspended, not expired) — used in RLS.
- RLS rewrite for broker role on:
  - `crm_source_databases` SELECT: owner OR `broker_has_database_access(auth.uid(), id)`.
  - `crm_source_database_rows` SELECT: same, via parent db.
  - `crm_leads` SELECT/UPDATE: owner OR (`assigned_broker_id` mapped to broker whose `user_id = auth.uid()`) OR (lead's `source_database_id` granted to broker AND respects `lead_ids`/`status_filter`/`date_window`).
  - Explicit DENY for broker role on `crm_developer_registry`, `crm_relationship_*`, other brokers' rows, owner-only tables.

### 2. Activation → real entity link
- Patch `crm-broker-activate` edge function to (a) set `crm_brokers.user_id = auth.uid()`, `activated_at = now()`, `invitation_status='activated'`, `must_reset_password=false`; (b) upsert a minimal `broker_profiles` row keyed off `user_id` for portal compatibility; (c) write `crm_audit_logs`.
- Add idempotent `link-broker-entity` RPC called on first sign-in by `BrokerGuard` to self-heal any broker whose `user_id` is null but `email_lower` matches `auth.email()`.

### 3. Broker CRM workspace (fix the 404)
- New route `/broker/crm` → `src/pages/broker/BrokerCRM.tsx`, wrapped in `BrokerGuard` (already exists).
- Sections (broker-scoped only, no developer/relationships/other-brokers):
  - **My Databases** — list from `vw_crm_database_access` filtered by `broker_user_id = auth.uid()`. Each row → opens scoped database viewer.
  - **My Leads** — `crm_leads` filtered via RLS (assigned + granted databases, respecting window/status filters).
  - **Activity** — read-only stream from `crm_audit_logs` scoped to broker's own actions.
- Scoped database viewer at `/broker/crm/database/:id` reusing the existing leads grid component with `mode="broker"` (hides owner-only columns/actions, respects `crm_field_permissions`).

### 4. Owner-side visibility upgrade (no removals)
- `DatabasesHub` row: append compact grantee badges — `N brokers · last granted Xd ago` — clickable to open existing `BrokerGrantsManagerDialog` (already wired).
- `BrokerGrantsManagerDialog`: pull data from `vw_crm_database_access` so it always shows assigned date, granted_by name, status (active/suspended/expired/revoked), visibility direction, date window, lead scope. Keep existing resend/revoke/block/session controls.
- New owner sub-section under `/owner/crm?entity=brokers` → **JBJ Brokers Registry** card per broker showing: profile, invitation status, assigned databases (from view), assigned leads count, latest updates, activity log, last seen, sessions, permissions. Reuses `BrokersRegistry.tsx`.
- Cross-link: clicking a database row → opens dialog; clicking a broker → drills into their assigned databases + leads.

### 5. Broker permission hardening (UI layer mirrors RLS)
- `BrokerGuard` blocks `/owner/*`, `/admin/*`, `/internal/*`, `/jbj-*`, `/developer/*` for any session whose `crm_brokers.user_id = auth.uid()` and is not the owner email.
- Sidebar/nav for broker role renders only: My Databases, My Leads, Activity, Profile.

### 6. CRM synchronization
- Trigger on `crm_leads` UPDATE: bump `last_active_at` on the assigned broker, write `crm_audit_logs` with diff. Already partially present — verify and extend so owner sees broker edits in realtime via the existing `useCRMLiveSync` channel.
- Trigger on `crm_database_grants` insert/update/revoke: write `crm_audit_logs` + `crm_security_events` (audit only, no new table).

### 7. Verification before resuming OTP/session QA
- Seed one `qa_` broker end-to-end: invite → activate → confirm `user_id` linked → confirm row appears in `vw_crm_database_access` after grant → confirm `/broker/crm` loads → confirm scoped database opens → confirm owner sees broker under database row and broker registry → confirm broker cannot hit `/owner/*` or other brokers' data (403).
- Only after all checks pass: resume Batch 2 (OTP attempts, session revoke, device block, suspicious login).

## Technical section

- Migration file: `supabase/migrations/<ts>_broker_foundation_repair.sql` (additive only, no drops).
- Edge functions touched: `crm-broker-activate` (link user_id + profile upsert), no new functions.
- New files:
  - `src/pages/broker/BrokerCRM.tsx`
  - `src/pages/broker/BrokerDatabaseView.tsx`
  - `src/hooks/useBrokerScopedDatabases.ts` (queries `vw_crm_database_access`)
  - `src/hooks/useBrokerScopedLeads.ts`
- Modified:
  - `src/routes/StandaloneRoutes.tsx` — add `/broker/crm` and `/broker/crm/database/:id` under `BrokerGuard`.
  - `src/components/crm/DatabasesHub.tsx` — grantee summary badge per row.
  - `src/components/crm/BrokerGrantsManagerDialog.tsx` — read from `vw_crm_database_access`.
  - `src/components/BrokerGuard.tsx` — block owner/admin/developer routes for broker sessions.
  - `src/pages/owner/crm/BrokersRegistry.tsx` — use `vw_crm_broker_overview`.
  - `supabase/functions/crm-broker-activate/index.ts` — entity link + profile upsert.
- No table dropped, no existing column changed in a breaking way, no new session/security table (reuses `crm_broker_sessions`, `crm_security_events`, `crm_audit_logs`).
- Rollback: migration is additive (new view, new function, new column with default, new policies); revert by dropping view/function/column/policies in reverse order.

## Out of scope (resume after foundation passes QA)

- Resume OTP rate-limit testing, activation flow QA, session tracking, device block, suspicious login alerts, remote logout — exactly the Batch 2 items already drafted.
