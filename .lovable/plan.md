## Batch 1 — Deploy + Server-Side QA Harness

### Step 1: Deploy `crm-broker-grant-manage`
Deploy the edge function so all grant lifecycle actions (create / suspend / reactivate / revoke / restore) are live and writing audit rows.

### Step 2: Build a SQL QA harness (single migration, idempotent, test-schema isolated)
Create `qa_batch1` schema with a `run_qa_batch1()` function that:

1. Seeds 2 test brokers (`brokerA`, `brokerB`) + 1 owner context
2. Seeds 2 databases (`dbX`, `dbY`) and ~10 leads across both, owner-created
3. Seeds 2 broker-created leads (one per broker)
4. Calls `crm-broker-grant-manage` end-to-end (via `pg_net` → edge URL) for each lifecycle action
5. Asserts each invariant and returns a `(check, expected, actual, pass)` result table

### Invariants asserted

| # | Check | Method |
|---|---|---|
| 1 | Owner sees all leads | `SELECT count(*) FROM crm_leads` as owner JWT == total |
| 2 | Broker sees only assigned dbs | `vw_crm_database_access` filtered by `broker_user_id` |
| 3 | Owner-created leads hidden by default | brokerA query before grant → 0 of dbX leads |
| 4 | Grant makes them visible | after grant → matches `lead_ids` / window / status filters |
| 5 | Broker-created leads visible to owner | owner query returns brokerA's lead |
| 6 | Suspend hides leads live | status=suspended → broker sees 0 |
| 7 | Reactivate restores visibility | status=active → broker sees N again |
| 8 | Revoke + restore round-trip | terminal state + restore creates new grant row |
| 9 | Date window enforced | leads outside window excluded |
| 10 | Status filter enforced | leads not in `status_filter` excluded |
| 11 | `lead_ids` subset enforced | only listed leads visible |
| 12 | Audit row per action | `crm_audit_logs` count == actions performed |
| 13 | Broker isolation | brokerB cannot see brokerA's grants/leads |

### Step 3: Run + capture proof
Execute `SELECT * FROM qa_batch1.run_qa_batch1()` and paste the full pass/fail table into the chat. Capture owner-side UI screenshots of the Grant Manager (create / suspend / revoke / restore states) via the preview browser.

### Step 4: Gap report
If any assertion fails, list the gap with the exact RLS predicate or function path responsible. Do not advance until all 13 pass.

### Step 5: Cleanup
`DROP SCHEMA qa_batch1 CASCADE` after proof captured — no test data left in prod tables (test rows are tagged with `source='qa_batch1'` and deleted).

---

## Batch 2 — Branded Broker Onboarding (only after Batch 1 green)

### 2.1 Branded invitation email
- New edge function `crm-broker-invite-send` (champagne/gold template, JBJ wordmark, single CTA)
- Generates one-time 8-char activation token (`crm_broker_invites` table: `token_hash`, `broker_id`, `expires_at`, `consumed_at`)
- Sends via Resend, respects single-agency rule + Resend quota guard

### 2.2 OTP verification
- 6-digit code, 10-min TTL, stored hashed in `crm_broker_otps`
- Edge function `crm-broker-otp-verify` with rate limit (5/min/IP)

### 2.3 Activation page `/broker/activate?token=...`
- Verifies token → prompts OTP → on success creates `auth.users` row (admin API) + links to `crm_brokers.user_id`
- Forces password set (min 12 chars, HIBP check on)

### 2.4 First-login password reset enforcement
- `crm_brokers.must_reset_password` flag set true on activation
- `BrokerGuard` redirects to `/broker/password-reset` while flag is true

### 2.5 Session / device tracking
- New table `crm_broker_sessions` (`broker_id`, `device_fingerprint`, `ip`, `user_agent`, `last_seen`, `revoked_at`)
- Extend existing `useBrokerSessionTracking` hook to upsert on heartbeat
- Owner UI: "Active sessions" panel per broker with revoke button → edge fn `crm-broker-session-revoke` (signs out by deleting refresh tokens via admin API)

---

## Files touched

**Batch 1:** 1 migration (QA harness), deploy `crm-broker-grant-manage`. Zero app code changes.

**Batch 2 (preview):**
- Migrations: `crm_broker_invites`, `crm_broker_otps`, `crm_broker_sessions`, `must_reset_password` column
- Edge functions: `crm-broker-invite-send`, `crm-broker-otp-verify`, `crm-broker-activate`, `crm-broker-session-revoke`
- Pages: `/broker/activate`, `/broker/password-reset`
- Owner panel: sessions table in existing broker detail view
- `BrokerGuard.tsx`: password-reset gate
