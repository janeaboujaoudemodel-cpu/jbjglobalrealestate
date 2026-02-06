# Security Phase 4 Changelog

---

## A) Scope

| Field | Value |
|-------|-------|
| **Phase** | 4 |
| **Level** | P0 - "Always True" RLS Hardening |
| **Tables** | `studio_projects`, `video_studio_assets`, `video_studio_jobs` |
| **Note** | Frozen after proof verification. |

---

## B) Changes Applied

### Fix #1: `studio_projects`

**Migration**: `20260206200623_906d0db7-7210-402c-89a1-608debef077e.sql`

**Policy Deltas:**
- **INSERT**: Changed from `WITH CHECK (true)` → `WITH CHECK (user_id = auth.uid())`
- **Roles**: All policies changed from `{public}` → `{authenticated}` only
- **FORCE RLS**: Enabled via `ALTER TABLE public.studio_projects FORCE ROW LEVEL SECURITY`
- **Privileges**: `REVOKE ALL ON TABLE public.studio_projects FROM anon; REVOKE ALL FROM public;`
- **user_id**: Set `NOT NULL` (table was empty, safe to alter)

**Final relacl**: `{postgres=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}` (anon/public removed)

---

### Fix #2: `video_studio_assets`

**Status**: No migration executed for `video_studio_assets` in Phase 4; table already met requirements.

**Pre-audit confirmed:**
- Policies: All scoped to `{authenticated}` role only ✅
- FORCE RLS: `relforcerowsecurity = true` ✅
- user_id: `NOT NULL` constraint present ✅
- Privileges: `anon` role excluded from `relacl` ✅

**Final relacl**: `{postgres=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}` (anon/public removed)

**Verification**: Edge function `rls-proof-anon-video-assets` confirmed 42501 permission denied for anon access and cross-user isolation.

---

### Fix #3: `video_studio_jobs`

**Migration**: `20260206203029_795a4a65-06b6-419d-96fe-91ca38e46169.sql`

**Policy Deltas:**
- **INSERT**: Changed from `WITH CHECK (true)` → `WITH CHECK (user_id = auth.uid())`
- **Roles**: SELECT/UPDATE/DELETE policies changed from `{public}` → `{authenticated}` only
- **FORCE RLS**: Enabled via `ALTER TABLE public.video_studio_jobs FORCE ROW LEVEL SECURITY`
- **Privileges**: `REVOKE ALL ON TABLE public.video_studio_jobs FROM anon; REVOKE ALL FROM public;`
- **user_id**: Set `NOT NULL` (table was empty, safe to alter)

**Session-based access logic preserved**: `(user_id = auth.uid() OR session_id = current_setting('request.headers'::text)::json->>'x-session-id')`

**Final relacl**: `{postgres=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}` (anon/public removed)

---

## C) Verification (Proof Functions)

| Table | Edge Function | Result |
|-------|---------------|--------|
| `studio_projects` | `security-proof-studio-projects` | ✅ All tests passed |
| `video_studio_assets` | `rls-proof-anon-video-assets` | ✅ All tests passed |
| `video_studio_jobs` | `rls-proof-anon-video-studio-jobs` | ✅ All tests passed |

### Test Coverage (per function)

1. **Anon SELECT** → `42501 permission denied` ✅
2. **Anon INSERT** → `42501 permission denied` ✅
3. **User A INSERT (own data)** → Success ✅
4. **User A SELECT (own data)** → Returns 1 row ✅
5. **User B SELECT** → Returns `[]` (0 rows) ✅
6. **User B UPDATE (A's data)** → Blocked (`PGRST116`) ✅
7. **User B DELETE (A's data)** → Blocked (`PGRST116`) ✅

---

## D) Intentional Exceptions (Out of Scope)

The following RLS warnings are **intentional anonymous analytics** and remain unchanged:

| Table | Policy | Reason |
|-------|--------|--------|
| `visitor_events` | `allow_visitor_event_insert` | Anonymous page view/event tracking |
| `visitor_sessions` | `allow_visitor_session_insert` | Anonymous session creation |
| `visitor_sessions` | `allow_visitor_session_update` | Anonymous session updates (time spent) |

**Ignore artifact reference**: Security finding `SUPA_rls_policy_always_true` (internal_id: `SUPA_rls_policy_always_true`) with `ignore: true` and `ignore_reason`: "These are service_role policies ... plus visitor_events and visitor_sessions for anonymous analytics tracking. All are intentional by design."

---

## E) Artifacts

| Migration File | Purpose |
|----------------|---------|
| `20260206200623_906d0db7-7210-402c-89a1-608debef077e.sql` | studio_projects: Policy + privilege hardening |
| `20260206203029_795a4a65-06b6-419d-96fe-91ca38e46169.sql` | video_studio_jobs: Policy + privilege hardening |

| Edge Function | Purpose |
|---------------|---------|
| `security-proof-studio-projects` | Proof: studio_projects isolation |
| `rls-proof-anon-video-assets` | Proof: video_studio_assets isolation |
| `rls-proof-anon-video-studio-jobs` | Proof: video_studio_jobs isolation |

---

## F) Status

**Phase 4 Complete** — Resolved for user-owned tables; visitor tracking warnings remain intentionally permissive and are ignored.

- 3 tables audited (2 required migrations, 1 pre-hardened)
- 3 visitor tracking exceptions marked intentional (finding ID: `SUPA_rls_policy_always_true`)
- All proof functions executed successfully

---

## G) Remaining Active Findings (Post-Phase 4)

Per `security--get_security_scan_results` (2026-02-06T21:12:31Z):

| Scanner | Finding ID | internal_id | Severity | Object | Status |
|---------|------------|-------------|----------|--------|--------|
| supabase | `SUPA_function_search_path_mutable` | `SUPA_function_search_path_mutable` | warn | Functions without `SET search_path` | Active |
| supabase_lov | `EXPOSED_SENSITIVE_DATA` | `hr_candidates_personal_data` | error | `hr_candidates` table | Active |
| supabase_lov | `MISSING_RLS_PROTECTION` | `chat_conversations_admin_only` | warn | `chat_conversations` table | Active |

**Ignored findings (intentional):**
- `SUPA_rls_policy_always_true` — visitor_events/visitor_sessions analytics
- `leads_table_public_exposure` — rate-limited lead capture form
