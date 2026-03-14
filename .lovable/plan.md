

## Plan: Database Policy Hardening + RLS Deep Review (Security Layer 4C)

### Audit Summary

**490 tables** audited. **50 findings** from security scanner. Key issues categorized below.

### CRITICAL Findings (3)

| Table | Issue | Current Policy |
|-------|-------|---------------|
| `resale_listings` | Investor PII (name, phone, email) readable by anon | SELECT on `{public}` with `USING (status = 'active')` |
| `open_positions` | Any auth user can create/modify/delete all job postings | ALL policy with `USING(true)` + `WITH CHECK(true)` on `{authenticated}` |
| `employee_notifications` | All auth users read every employee notification | SELECT `USING(true)` on `{authenticated}` |

### HIGH Findings (9)

| Table | Issue |
|-------|-------|
| `user_behavior_tracking` | Broad SELECT `USING(true)` overrides restrictive admin-only policies (OR logic) — exposes IP, GPS, nationality |
| `listing_uploads` | SELECT on `{public}` with `USING(true)` — exposes Drive/SharePoint URLs to anon |
| `book_downloads` | SELECT `USING(true)` — exposes downloader emails, device info |
| `payout_readiness_records` | SELECT `USING(true)` — exposes commission/financial data |
| `payout_audit_logs` | SELECT `USING(true)` — exposes payout history |
| `admin_edit_log` | SELECT `USING(true)` — exposes admin activity |
| `web_developer_tasks` | SELECT `USING(true)` — exposes internal dev work |
| `web_developer_versions` | SELECT `USING(true)` — exposes full config snapshots |
| `decision_records` | SELECT `USING(true)` — exposes business decisions |

### MEDIUM — Service-Role Policies on `{public}` Role (7)

These are intended for service-role-only use but are assigned to `{public}` (which includes anon). Should be restricted to `{service_role}`:

`db_health_logs`, `edge_function_locks`, `project_ai_cache`, `reelly_dictionaries`, `security_checklist_runs`, `system_backup_records`, `inbound_email_dead_letters`

### MEDIUM — Missing `FORCE ROW LEVEL SECURITY` (18 tables)

All targeted tables have `relforcerowsecurity = false`. This means the table owner (postgres) bypasses RLS. Should be forced on all sensitive tables.

### Intentional Exceptions (No Change)

| Table | Reason |
|-------|--------|
| `visitor_events` / `visitor_sessions` | Anonymous analytics tracking |
| `inquiries` / `meeting_requests` / `cookie_consents` | Public form submissions |
| `card_link_clicks` / `project_reports` | Anonymous event logging |
| `user_activity_log` / `user_events` / `user_sessions` | Anonymous behavioral tracking |
| `encryption_audit_log` / `esign_audit_log` / `esign_signed_documents` | Service-role only (correct) |
| `pending_developer_imports` | Service-role only (correct) |

---

### Implementation

#### 1. Database Migration — Policy Hardening

One migration addressing all critical and high findings:

**CRITICAL fixes:**

**`resale_listings`**: Replace public SELECT with a view-safe policy. Create `resale_listings_public` view excluding `investor_name`, `investor_phone`, `investor_email`. Restrict base table SELECT to owner only or listing owner (`investor_user_id = auth.uid()`). Anon/public reads go through the view.

**`open_positions`**: Drop the `ALL` policy. Replace with:
- SELECT: `{public}` WHERE `is_active = true` (keep existing)
- INSERT/UPDATE/DELETE: Owner/admin only via `has_role()`

**`employee_notifications`**: Drop `USING(true)` SELECT. Replace with `USING (employee_id = auth.uid()::text)` for self-access + owner/admin override.

**HIGH fixes (restrict SELECT to owner/admin):**

For `book_downloads`, `payout_readiness_records`, `payout_audit_logs`, `admin_edit_log`, `web_developer_tasks`, `web_developer_versions`, `decision_records`:
- Drop the broad `USING(true)` SELECT policy
- Replace with owner/admin-only SELECT using `has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin')`

**`user_behavior_tracking`**: Drop the overly broad `Authenticated users can view behavior data` policy (the restrictive admin-only policies remain).

**`listing_uploads`**: Drop the `{public}` SELECT. Replace with owner/admin SELECT + owner-of-upload SELECT (`user_id = auth.uid()`).

**Service-role policy fixes:**
For `db_health_logs`, `edge_function_locks`, `project_ai_cache`, `reelly_dictionaries`, `security_checklist_runs`, `system_backup_records`, `inbound_email_dead_letters`:
- Drop the `{public}` policy
- Recreate on `{service_role}` only

**`chat_conversations` self-update fix:**
- Drop the `USING(true)/WITH CHECK(true)` update policy on `{anon,authenticated}`
- Replace with scoped update: anon can update by session_id match, authenticated by user_id match

**FORCE RLS on all affected tables.**

**REVOKE anon privileges on sensitive tables.**

#### 2. Edge Function: `rls-hardening-proof` (Verification)

A proof function that tests:
1. Anon SELECT on `resale_listings` base table returns 403/empty
2. Anon SELECT on `open_positions` can only read active
3. Authenticated non-owner SELECT on `payout_readiness_records` returns empty
4. Authenticated non-owner INSERT on `open_positions` blocked
5. Authenticated user can only see own `employee_notifications`

#### 3. Secure View for Resale Listings

Create `resale_listings_public` view with `security_invoker = on`:
- Exposes: id, property details, price, status, created_at
- Excludes: `investor_name`, `investor_phone`, `investor_email`, `investor_user_id`
- Application code for public-facing pages should query the view

#### 4. Application Code Update

Update any frontend queries that read `resale_listings` publicly to use `resale_listings_public` view instead.

---

### Files Summary

| File | Change |
|------|--------|
| **Migration** | Single large migration: drop/recreate ~20 policies, FORCE RLS on 19 tables, REVOKE anon on sensitive tables, create `resale_listings_public` view |
| **New**: `supabase/functions/rls-hardening-proof/index.ts` | Verification edge function |
| **Update**: Frontend components querying `resale_listings` for public display | Point to view |

### Policy Matrix (Post-Fix)

```text
Table                      | Anon | Auth'd | Owner/Admin
---------------------------|------|--------|------------
resale_listings (base)     |  -   |  Own   |    RW
resale_listings_public     |  R*  |  R*    |    R
open_positions             |  R*  |  R*    |    RW
employee_notifications     |  -   |  Own   |    RW
user_behavior_tracking     |  -   |  -†    |    RW
listing_uploads            |  -   |  Own   |    RW
book_downloads             |  -   |  -     |    R
payout_readiness_records   |  -   |  -     |    RW
payout_audit_logs          |  -   |  -     |    R
admin_edit_log             |  -   |  -     |    R
web_developer_tasks        |  -   |  -     |    RW
web_developer_versions     |  -   |  -     |    R
decision_records           |  -   |  -     |    RW
db_health_logs             |  -   |  -     |    svc
project_ai_cache           |  -   |  -     |    svc
chat_conversations         | Scoped| Own   |    RW

R* = filtered (active only), Own = own records, svc = service_role only
† = CRM admin/owner via existing restrictive policies
```

### Implementation Order
1. Database migration (all policy fixes + FORCE RLS + view)
2. `rls-hardening-proof` edge function
3. Frontend code updates for resale_listings view
4. Run proof function and document results

