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

| Before | After |
|--------|-------|
| INSERT policy `WITH CHECK (true)` | `WITH CHECK (user_id = auth.uid())` |
| Policies granted to `{public}` role | All policies scoped to `{authenticated}` only |
| `anon` had full table privileges | `REVOKE ALL FROM anon` executed |
| `relforcerowsecurity = false` | `FORCE ROW LEVEL SECURITY` enabled |
| `user_id` nullable | `user_id NOT NULL` enforced |

**Migration**: `20260206195549_d1f2e3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a.sql`

### Fix #2: `video_studio_assets`

**Status**: Already hardened (no changes required)

Pre-audit confirmed:
- `user_id NOT NULL` ✅
- `relrowsecurity = true`, `relforcerowsecurity = true` ✅
- All policies scoped to `authenticated` role ✅
- `anon` role excluded from `relacl` ✅

### Fix #3: `video_studio_jobs`

| Before | After |
|--------|-------|
| INSERT policy `WITH CHECK (true)` | `WITH CHECK (user_id = auth.uid())` |
| SELECT/UPDATE/DELETE policies granted to `{public}` | All policies scoped to `{authenticated}` only |
| `anon` had full table privileges | `REVOKE ALL FROM anon` executed |
| `relforcerowsecurity = false` | `FORCE ROW LEVEL SECURITY` enabled |
| `user_id` nullable | `user_id NOT NULL` enforced |

**Session-based access logic preserved**: `(user_id = auth.uid() OR session_id = current_setting('request.headers'::text)::json->>'x-session-id')`

**Migration**: `20260206203029_795a4a65-06b6-419d-96fe-91ca38e46169.sql`

---

## C) Verification (Proof Functions)

| Table | Edge Function | Result |
|-------|---------------|--------|
| `studio_projects` | `rls-proof-anon-studio-projects` | ✅ All tests passed |
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

These are marked as **"intentional/ignored"** in security findings.

---

## E) Artifacts

| Migration File | Purpose |
|----------------|---------|
| `20260206195549_*.sql` | studio_projects: Policy + privilege hardening |
| `20260206203029_*.sql` | video_studio_jobs: Policy + privilege hardening |

| Edge Function | Purpose |
|---------------|---------|
| `rls-proof-anon-studio-projects` | Proof: studio_projects isolation |
| `rls-proof-anon-video-assets` | Proof: video_studio_assets isolation |
| `rls-proof-anon-video-studio-jobs` | Proof: video_studio_jobs isolation |

---

## F) Status

**Phase 4 Complete** — All P0 "Always True" RLS findings resolved.

- 3 tables hardened (2 required changes, 1 pre-hardened)
- 3 visitor tracking exceptions marked intentional
- All proof functions executed successfully
