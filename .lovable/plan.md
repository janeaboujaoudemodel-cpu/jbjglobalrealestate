

## Plan: Security Operations + Backup + Recovery + Incident Readiness

### Current State

**Already exists:**
- `db-health-check` edge function — monitors DB latency, connection count, active locks
- `ai_tool_versions` table — versioned AI tool history with restore capability
- `project_change_requests` — before/after tracking for listing/project changes
- `global_audit_events` — immutable audit log (Session 12)
- `api_security_events` — rate limit hits, auth failures (Session 14)
- `OwnerSafetyPage` — kill switches for AI features (local state only)
- Multiple repair/restore edge functions exist (repair-project-images, restore-developer-logos, etc.)

**What's missing:**
- No backup tracking or snapshot system
- No restore test framework
- No incident readiness dashboard consolidating health + security + backup status
- No deployment rollback tracking
- No automated security checklist engine
- No recovery point management for templates/permissions

### Implementation

#### 1. Database Migration

**New table: `system_backup_records`** — Track backup/snapshot events:
```
id (uuid PK), backup_type (text: database/storage/config/template/audit_log/tool_version),
status (text: pending/completed/failed/verified),
source_module (text), snapshot_data (jsonb nullable),
file_path (text nullable), size_bytes (bigint nullable),
restore_tested (bool default false), restore_tested_at (timestamptz),
restore_test_result (text), notes (text),
created_by (uuid), created_at (timestamptz default now())
```
Owner-only RLS. No DELETE.

**New table: `security_checklist_runs`** — Periodic security checklist results:
```
id (uuid PK), run_type (text: scheduled/manual),
checks (jsonb), -- array of {name, status, severity, details}
passed_count (int), failed_count (int), warning_count (int),
overall_status (text: healthy/warning/critical),
created_at (timestamptz default now())
```
Owner-only RLS. No UPDATE/DELETE.

**New table: `deployment_records`** — Track releases and rollback points:
```
id (uuid PK), version_label (text), deployed_at (timestamptz default now()),
is_stable (bool default false), notes (text),
impacted_modules (text[]), rollback_available (bool default true),
rolled_back (bool default false), rolled_back_at (timestamptz),
created_by (uuid)
```
Owner-only RLS.

#### 2. Edge Function: `run-security-checklist`

Automated checks:
- DB connectivity (reuse db-health-check logic)
- RLS policy count on critical tables (ensure not dropped)
- Rate limit table health (stale entries)
- IP blocklist status
- Recent audit log anomalies (>100 events/hour from single user)
- Failed edge function invocations (from api_security_events)
- Backup freshness (last backup age)
- Webhook replay log cleanup status

Returns structured checklist result, inserts into `security_checklist_runs`.

#### 3. Edge Function: `create-config-snapshot`

Creates point-in-time snapshots of:
- App settings (`app_settings` table dump)
- AI tool versions (current published versions)
- Template configurations (document templates metadata)
- Permission/role assignments (`user_roles` snapshot)

Stores as JSON in `system_backup_records` with `backup_type: 'config'`.

#### 4. Owner Incident Readiness Dashboard

**New: `src/pages/owner/IncidentReadinessPanel.tsx`** — at `/owner/incident-readiness`

**4 sections:**

| Section | Content |
|---------|---------|
| **System Health** | DB latency, edge function status, last health check result, active locks count |
| **Backup Status** | Latest backup per type, restore test results, backup freshness indicators (green/amber/red) |
| **Security Checklist** | Latest checklist run with pass/fail/warning breakdown, "Run Now" button, history |
| **Incident & Recovery** | Deployment history, stable release indicator, rollback guidance, unresolved security alerts from `api_security_events` and `suspicious_admin_alerts` |

**Key features:**
- "Create Snapshot" button — calls `create-config-snapshot`
- "Run Security Check" button — calls `run-security-checklist`
- "Test Restore" button — loads a snapshot and validates its structure, marks `restore_tested = true`
- Deployment timeline showing stable/unstable releases
- Rollback guidance panel with impacted modules list

#### 5. Restore Testing

The "Test Restore" flow:
1. Select a backup record from `system_backup_records`
2. Parse `snapshot_data` JSON, validate all expected keys exist
3. For config snapshots: compare current app_settings against snapshot to show drift
4. For AI tool versions: verify referenced tool IDs still exist
5. Mark record as `restore_tested = true` with timestamp and result
6. This is a **read-only validation** — no actual data overwrite

#### 6. Route Registration

Add to `OwnerRoutes.tsx`:
```tsx
<Route path="incident-readiness" element={<IncidentReadinessPanel />} />
```

### Files Summary

| File | Change |
|------|--------|
| **Migration** | Create `system_backup_records`, `security_checklist_runs`, `deployment_records` with owner-only RLS |
| **New**: `supabase/functions/run-security-checklist/index.ts` | Automated security health checks |
| **New**: `supabase/functions/create-config-snapshot/index.ts` | Config/template/permission snapshots |
| **New**: `src/pages/owner/IncidentReadinessPanel.tsx` | Unified incident readiness dashboard |
| **New**: `src/hooks/useIncidentReadiness.ts` | Data fetching for backup records, checklist runs, deployments |
| **Update**: `src/routes/OwnerRoutes.tsx` | Add route |

### Implementation Order
1. Database migration (3 tables)
2. `create-config-snapshot` edge function
3. `run-security-checklist` edge function
4. `useIncidentReadiness` hook
5. `IncidentReadinessPanel` dashboard
6. Route registration

