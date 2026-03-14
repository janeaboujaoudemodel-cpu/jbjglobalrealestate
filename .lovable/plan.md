

## Security Layer 4J — Recovery / Disaster / Last-Stable Security Fallback

### Current State Audit

**Infrastructure that EXISTS and is WORKING:**

| Component | Status | Evidence |
|-----------|--------|----------|
| `system_backup_records` table | EXISTS | 13 columns including `snapshot_data`, `restore_tested`, `restore_test_result` |
| `security_checklist_runs` table | EXISTS | Stores check results with pass/fail/warning counts |
| `deployment_records` table | EXISTS | Has `is_stable`, `rolled_back`, `rollback_available`, `security_sign_off` columns |
| `deployment_gate_runs` table | EXISTS | Stores gate checks with blocked_reasons |
| RLS on all 4 tables | VERIFIED | Owner-only SELECT via `has_role(auth.uid(), 'admin')`, service_role INSERT |
| `create-config-snapshot` edge function | EXISTS | Captures `app_settings`, `ai_tool_versions`, `user_roles`, `feature_flags` |
| `run-security-checklist` edge function | EXISTS | 11 checks (DB health, RLS, rate limits, blocklist, anomalies, backup freshness, auth audit) |
| `run-deployment-gate` edge function | EXISTS | 8 checks (auth, env vars, RLS, checklist, API probes, alerts, backup freshness) |
| `useTestRestore` hook | EXISTS | Validates snapshot structure for required keys |
| `IncidentReadinessPanel.tsx` (557 lines) | EXISTS | Full UI at `/owner/incident-readiness` behind OwnerGuard |
| `useCanMarkStable` hook | EXISTS | Returns whether last gate run passed |

**GAPS — What is NOT implemented:**

| # | Gap | Impact |
|---|-----|--------|
| G1 | Snapshot does NOT capture **core templates** (broker_email_templates, marketing_templates, executive_response_templates, owner_comm_templates, design_templates) | Cannot restore templates after a bad deployment |
| G2 | Snapshot does NOT capture **critical config** (marketing_config, points_config, activity_points_config) | Config restore incomplete |
| G3 | No **"Mark as Stable"** button in UI | `useCanMarkStable` hook exists but no button wired |
| G4 | No **"Rollback"** button in UI | `rolled_back` column exists but no action to trigger it |
| G5 | No **"Create Deployment Record"** UI action | `deployment_records` table is empty — no way to register a deployment |
| G6 | **All tables are empty** — no snapshots, no checklist runs, no gate runs, no deployments | The system has never been exercised |
| G7 | Restore test only validates 2 keys (`app_settings`, `user_roles`) — should validate all snapshot categories | Incomplete restore verification |
| G8 | No **"Current Stable Baseline"** summary card showing the owner exactly what version is stable and what it contains | Owner cannot see stable baseline at a glance |

---

### Implementation Plan

#### 1. Expand Snapshot Coverage (edge function update)
**File:** `supabase/functions/create-config-snapshot/index.ts`

Add to the snapshot:
- `broker_email_templates` (id, name, subject, category)
- `marketing_templates` (id, name, type, status)
- `executive_response_templates` (id, name, category)
- `owner_comm_templates` (id, name, type)
- `design_templates` (id, name, category)
- `marketing_config` (full rows)
- `points_config` (full rows)
- `activity_points_config` (full rows)

This ensures AI tools, permissions, core templates, and critical config all have restore points.

#### 2. Expand Restore Test Validation
**File:** `src/hooks/useIncidentReadiness.ts` — `useTestRestore`

Update `requiredKeys` from `["app_settings", "user_roles"]` to include all snapshot categories: `app_settings`, `user_roles`, `ai_tool_versions`, `feature_flags`, `broker_email_templates`, `marketing_templates`, `executive_response_templates`, `marketing_config`, `points_config`.

#### 3. Add Mark Stable / Rollback / Create Deployment Actions
**File:** `src/hooks/useIncidentReadiness.ts`

Add three new mutations:
- `useCreateDeployment` — inserts a deployment record with version label, impacted modules, notes
- `useMarkStable` — sets `is_stable = true` on a deployment record (only if last gate run passed)
- `useRollbackDeployment` — sets `rolled_back = true, rolled_back_at = now()` on a deployment and creates a new record marking the previous stable as current

#### 4. Add "Current Stable Baseline" Card + Action Buttons to UI
**File:** `src/pages/owner/IncidentReadinessPanel.tsx`

- Add a prominent "Current Stable Baseline" card at the top showing: version label, deployed date, snapshot contents summary, gate status, security sign-off status
- Add "Register Deployment" button (opens inline form for version label + impacted modules)
- Add "Mark Stable" button on each deployment row (disabled unless gate passed)
- Add "Rollback" button on stable deployments
- Update the deployment timeline to show these actions

#### 5. Run Live Tests and Populate Data
After deploying the updated edge functions:
1. Call `create-config-snapshot` → creates first real snapshot with expanded data
2. Call `run-security-checklist` → creates first checklist run with 11 checks
3. Call `run-deployment-gate` → creates first gate run with 8 checks
4. Call `useTestRestore` on the snapshot → validates all keys present
5. Create a deployment record and mark it stable

This populates the system with real data and proves the recovery pipeline works end-to-end.

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/create-config-snapshot/index.ts` | Expand snapshot to include templates + config tables |
| `src/hooks/useIncidentReadiness.ts` | Add `useCreateDeployment`, `useMarkStable`, `useRollbackDeployment`; expand restore test validation |
| `src/pages/owner/IncidentReadinessPanel.tsx` | Add Stable Baseline card, Register Deployment form, Mark Stable/Rollback buttons |

### Proof Deliverables
After implementation, I will:
1. **Rollback proof:** Call the edge functions via curl to create a snapshot, run checklist, run gate, and show the results
2. **Stable version proof:** Create a deployment record, mark it stable, and show the stable baseline
3. **Restore testing proof:** Run restore test on the snapshot and show all keys validated

