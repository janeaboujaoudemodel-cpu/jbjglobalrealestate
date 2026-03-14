

## Plan: Security Layer 4G — Application Security Testing + Deployment Gates

### Current State

**Already exists:**
- `run-security-checklist` edge function — 8 automated checks (DB connectivity, rate limits, IP blocklist, security events, backup freshness, audit anomalies)
- `IncidentReadinessPanel` — owner dashboard showing backups, checklists, deployments, alerts
- `deployment_records` table — tracks versions, stable releases, rollback status, impacted modules
- `security_checklist_runs` table — stores check results with pass/fail/warning
- `system_backup_records` table — snapshot history with restore testing
- Permission matrix (`permissionMatrix.ts`) defining access rules for all modules
- WAF middleware on AI/admin edge functions

**Gaps:**
- No **pre-deployment validation** — nothing checks auth, permissions, env vars, or API health before a release is marked stable
- No **deployment gate** that blocks marking a release as "stable" until checks pass
- No way to **record test evidence** for security-sensitive changes
- Security checklist doesn't verify **route protection**, **env var presence**, or **edge function auth coverage**
- No **staging verification workflow** — no structured "test then promote" flow

### Implementation

#### 1. Edge Function: `run-deployment-gate` (New)

Owner-only function that runs a comprehensive pre-publish validation suite:

**Checks performed:**
- **Auth system health** — verify Supabase auth responds, test token validation
- **Edge function auth coverage** — cross-reference `permissionMatrix.ts` function list against functions that have `requireOwnerAuth` or WAF middleware (report unprotected high-risk functions)
- **Critical env vars** — verify `OWNER_EMAIL`, `OPENAI_API_KEY` (or equivalent) are set via secrets
- **RLS policy presence** — query `pg_policies` to confirm sensitive tables have RLS enabled
- **Recent security checklist** — require a passing checklist run within the last 24h
- **API health probe** — ping 3-5 critical edge functions (verify-owner, run-security-checklist, waf-health-check) and confirm 200/401 responses (not 500)
- **Active critical alerts** — block if unresolved critical security events exist in last 6h
- **Backup freshness** — require a backup within the last 7 days

Returns: `{ gate_status: "pass" | "fail", checks: [...], blocked_reasons: [...] }`

Saves result to a new `deployment_gate_runs` table.

#### 2. Database: `deployment_gate_runs` Table

```sql
CREATE TABLE deployment_gate_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  triggered_by uuid REFERENCES auth.users(id),
  gate_status text NOT NULL CHECK (gate_status IN ('pass', 'fail')),
  checks jsonb NOT NULL DEFAULT '[]',
  blocked_reasons text[] DEFAULT '{}',
  deployment_record_id uuid REFERENCES deployment_records(id),
  notes text
);
ALTER TABLE deployment_gate_runs ENABLE ROW LEVEL SECURITY;
-- Owner-only read/insert
```

#### 3. Enhance `IncidentReadinessPanel.tsx`

Add a **"Deployment Gate"** card section between the overview cards and security checklist:

- "Run Pre-Publish Gate" button — invokes `run-deployment-gate`
- Shows last gate run result with pass/fail per check
- Blocked reasons displayed prominently in red
- Gate history (last 10 runs) with expandable details
- When gate fails: show actionable remediation steps per failed check

#### 4. Enhance `run-security-checklist` — Add 3 New Checks

Extend the existing checklist with:
- **Check 9: Owner Route Protection** — verify OwnerGuard routes from permission matrix are listed
- **Check 10: Edge Function Auth Audit** — count functions with/without auth middleware
- **Check 11: Exposed Public Routes** — flag any new routes not in the known public allowlist

#### 5. Test Evidence Recording

Add to `deployment_records`:
```sql
ALTER TABLE deployment_records 
  ADD COLUMN IF NOT EXISTS gate_run_id uuid REFERENCES deployment_gate_runs(id),
  ADD COLUMN IF NOT EXISTS test_evidence jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS security_sign_off boolean DEFAULT false;
```

When marking a deployment as stable, require:
- A passing gate run linked to the deployment
- Owner confirmation (security sign-off toggle)

#### 6. Hook: `useDeploymentGate`

New hook providing:
- `runGate()` — invoke the edge function
- `lastGateRun` — latest result
- `gateHistory` — last 10 runs
- `canMarkStable` — derived boolean (gate passed + no critical alerts)

### Files Summary

| File | Change |
|------|--------|
| **New**: `supabase/functions/run-deployment-gate/index.ts` | Pre-publish validation suite |
| **New**: `src/hooks/useDeploymentGate.ts` | Gate invocation + history hook |
| **Migration** | Create `deployment_gate_runs`, add columns to `deployment_records` |
| **Update**: `supabase/functions/run-security-checklist/index.ts` | Add 3 new checks (route protection, auth audit, public routes) |
| **Update**: `src/pages/owner/IncidentReadinessPanel.tsx` | Add Deployment Gate card with run/history/remediation UI |
| **Update**: `src/hooks/useIncidentReadiness.ts` | Add gate-related queries |
| **Update**: `supabase/config.toml` | Register `run-deployment-gate` |

### Implementation Order
1. Database migration (new table + columns)
2. Create `run-deployment-gate` edge function
3. Enhance `run-security-checklist` with 3 new checks
4. Create `useDeploymentGate` hook
5. Update `IncidentReadinessPanel` with gate UI

