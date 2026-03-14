

## Plan: Owner Global Audit System & Admin Change History

### Current State

The platform already has **7 separate audit tables** scattered across modules:
- `audit_logs` — General admin actions (CRUD, login, export, block)
- `crm_audit_logs` — CRM-specific changes with old/new values
- `admin_edit_log` — Project/developer field-level edits with changed_fields
- `project_audit_logs` — Project status changes
- `compliance_audit_logs` — Compliance checks
- `executive_audit_logs` — Executive action tracking
- `hr_audit_logs` — HR admin actions
- `payout_audit_logs` — Payout operations

There's also an existing `AuditLogDashboard` component that only reads from `audit_logs`. The Owner Audit Page (`OwnerAuditPage.tsx`) is a route/AI-tools inventory — not an actual change history audit.

**What's missing:** A unified view across all audit sources, before/after diff visualization, suspicious activity detection, and immutable audit hardening.

### Approach

Rather than creating yet another audit table, build a **unified Global Audit Dashboard** that aggregates all existing audit tables into one owner-only view with diff, filtering, alerts, and immutability controls.

### Database Migration

**1. Create `global_audit_events` table** — Unified audit sink for cross-platform change tracking:
```sql
id (uuid PK), source_table (text), source_id (uuid/text),
user_id (uuid), user_email (text), user_role (text),
action (text), entity_type (text), entity_id (text), entity_name (text),
module (text), -- e.g. 'crm', 'listing-admin', 'hr', 'ai-tools'
route (text), -- e.g. '/owner/crm'
old_values (jsonb), new_values (jsonb),
changed_fields (text[]),
criticality (text: 'low'|'medium'|'high'|'critical'),
approval_state (text: null|'pending'|'approved'|'rejected'),
submitted_by (uuid), reviewed_by (uuid), approved_by (uuid),
description (text),
metadata (jsonb),
created_at (timestamptz default now())
```

**2. RLS — Immutable design (Task 6):**
- Owner-only SELECT (via `has_role(auth.uid(), 'owner')`)
- Authenticated INSERT (own user_id only)
- **No UPDATE policy** — records cannot be modified after creation
- **No DELETE policy** — records cannot be deleted by any role
- Only service_role can INSERT (for triggers/edge functions)

**3. Create DB trigger function `fn_global_audit_sink()`:**
- Attach AFTER INSERT triggers on `audit_logs`, `crm_audit_logs`, `admin_edit_log`, `project_audit_logs` to auto-copy new entries into `global_audit_events` with normalized fields.
- Maps source-specific columns to the unified schema.

**4. Create `suspicious_admin_alerts` table (Task 4):**
```sql
id (uuid PK), alert_type (text), severity (text),
user_id (uuid), user_email (text),
description (text), details (jsonb),
acknowledged (bool default false), acknowledged_by (uuid),
created_at (timestamptz)
```
Owner-only SELECT. No UPDATE/DELETE for non-owners.

**5. Create DB function `check_suspicious_patterns()`:**
- Called by a periodic trigger or on-demand from dashboard
- Detects: repeated permission changes (>5 in 1hr), publish/revert cycles (>3 in 1hr), mass edits (>20 in 10min), unusual exports (>5/day), odd hours (outside 6AM-11PM UAE), multiple deletions (>10 in 1hr), repeated failures (>10 in 30min)
- Inserts flagged events into `suspicious_admin_alerts`

### Frontend

**New: `src/pages/owner/GlobalAuditDashboard.tsx`** — Owner-only page at `/owner/global-audit`

**Layout — 4 tabs:**

| Tab | Content |
|-----|---------|
| **Change History** | Unified log from `global_audit_events`. Each row expandable to show before/after JSON diff. Columns: timestamp, user, module, action, entity, criticality badge, approval state. (Tasks 1, 2) |
| **Filters & Search** | Filter by: module (CRM/Listing/HR/AI/Payout), user, date range, entity type, action type, criticality, role. Full-text search on description. (Task 3) |
| **Suspicious Activity** | Cards showing flagged alerts from `suspicious_admin_alerts`. Each shows: alert type, user, timestamp, pattern details, acknowledge button. Stats: total alerts, unacknowledged, by severity. (Task 4) |
| **Approval Trail** | Filtered view of events with approval_state != null. Shows: submitter, reviewer, approver, what changed, final result. (Task 5) |

**New: `src/components/audit/AuditDiffViewer.tsx`**
- Side-by-side JSON diff component
- Highlights added (green), removed (red), changed (amber) fields
- Used in expanded rows of the Change History tab

**New: `src/hooks/useGlobalAudit.ts`**
- `logGlobalAudit(params)` — Insert into `global_audit_events` from frontend actions
- `useAuditFilters()` — Manages filter state, pagination, date ranges
- `useSuspiciousAlerts()` — Fetches and manages alert acknowledgment

### Integration Points

Update these files to also log to `global_audit_events`:
- `src/pages/CRM.tsx` — Export actions
- `src/components/listing-admin/ChangeRequestsQueue.tsx` — Approval actions
- `src/hooks/useAdminEditLog.ts` — Add dual-write to global audit on every `logAdminEdit`
- `src/hooks/useAuditLog.ts` — Add dual-write on every `logAction`

### Route Registration

Add to `src/routes/OwnerRoutes.tsx`:
```tsx
<Route path="global-audit" element={<GlobalAuditDashboard />} />
```

### Files Summary

| File | Change |
|------|--------|
| **Migration** | Create `global_audit_events` (immutable RLS), `suspicious_admin_alerts`, trigger function to sync from existing audit tables, suspicious pattern detection function |
| **New**: `src/pages/owner/GlobalAuditDashboard.tsx` | Unified audit dashboard (4 tabs) |
| **New**: `src/components/audit/AuditDiffViewer.tsx` | Before/after JSON diff component |
| **New**: `src/hooks/useGlobalAudit.ts` | Global audit logging + filter hooks |
| **Update**: `src/hooks/useAdminEditLog.ts` | Dual-write to global audit |
| **Update**: `src/hooks/useAuditLog.ts` | Dual-write to global audit |
| **Update**: `src/routes/OwnerRoutes.tsx` | Add route |

### Implementation Order
1. Database migration (tables, triggers, RLS, suspicious detection function)
2. `useGlobalAudit` hook
3. `AuditDiffViewer` component
4. `GlobalAuditDashboard` page (all 4 tabs)
5. Dual-write integration in existing audit hooks
6. Route registration

