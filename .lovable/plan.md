

## Plan: Zero Trust Architecture Hardening (Security Layer 4A)

### Critical Findings

**CRITICAL — Unprotected destructive functions (no auth at all):**
- `wipe-and-rebuild`: Anyone can POST and delete all projects. No auth header check.
- `bulk-approve-imports`: Rate limited but no auth. Anyone can approve imports into live data.
- `send-admin-message`: Rate limited but no auth. Anyone can send branded emails as JBJ.

**High — Missing authorization on admin-scoped functions:**
- Multiple functions check `getUser()` (authentication) but do not verify the user is the Owner or has an admin role before executing privileged operations.

**Medium — Inconsistencies:**
- Only 5 edge functions use `getClaims()`, 71 use `getUser()`. Both work, but `getClaims` is cheaper. Not a security gap, just efficiency.
- `sessionStorage` cache for owner verification is convenience-only (background re-verify runs). Acceptable.

### Implementation

#### 1. Shared Auth Middleware: `requireOwnerAuth`

**New: `supabase/functions/_shared/owner-auth-middleware.ts`**

A reusable function that edge functions call to verify the caller is the Owner:

```typescript
export async function requireOwnerAuth(req, corsHeaders): Promise<{
  response: Response | null;  // non-null = denied, return immediately
  userId: string;
  email: string;
}>
```

Logic:
1. Extract `Authorization` header → 401 if missing
2. `getUser(token)` → 401 if invalid
3. Check `user_roles` for `owner` or `admin` role → 403 if not found
4. Fallback: check `app_settings.owner_email` match → 403 if not found
5. Log denied attempts to `api_security_events`

#### 2. Harden Critical Edge Functions

Apply `requireOwnerAuth` to these functions (add auth check at top of handler):

| Function | Current Auth | Risk |
|----------|-------------|------|
| `wipe-and-rebuild` | **NONE** | **CRITICAL** — can wipe DB |
| `bulk-approve-imports` | **NONE** | **CRITICAL** — can publish projects |
| `send-admin-message` | **NONE** | **HIGH** — can send branded emails |
| `repair-live-projects-batch` | NONE | HIGH — can modify live projects |
| `provident-areas-sync` | NONE | MEDIUM — data sync |
| `provident-enrich-projects` | NONE | MEDIUM — data enrichment |
| `reelly-auto-enrich` | NONE | MEDIUM — data enrichment |
| `sync-developer-data` | NONE | MEDIUM — data sync |
| `handover-alerts` | NONE | LOW — sends notifications |

For each: insert `requireOwnerAuth()` call at top, return 401/403 if denied.

#### 3. Re-authentication for Destructive Actions

**Update `wipe-and-rebuild`**: Require a `confirmationToken` parameter — a short-lived token generated via a new `generate-destructive-action-token` function that:
- Verifies owner identity
- Issues a single-use token (stored in DB, expires in 5 minutes)
- Must be passed alongside `confirm: true`

This adds a two-step verification for the most dangerous operation.

#### 4. Permission Matrix (Static Reference + Runtime Enforcement)

**New: `src/config/permissionMatrix.ts`**

Static permission matrix defining access rules for every module:

```text
Module                    | Public | Auth'd | Broker | Developer | Owner
--------------------------|--------|--------|--------|-----------|------
Home / Properties         |   R    |   R    |   R    |     R     |  RW
AI Hub / Tools            |   -    |   R*   |   R    |     -     |  RW
CRM                       |   -    |   -    |   -    |     -     |  RW
Listing Admin             |   -    |   -    |   -    |     -     |  RW
Developer Portal          |   -    |   R    |   -    |    RW†    |  RW
Moderation Queue          |   -    |   -    |   -    |     -     |  RW
API Security Dashboard    |   -    |   -    |   -    |     -     |  RW
Incident Readiness        |   -    |   -    |   -    |     -     |  RW
wipe-and-rebuild          |   -    |   -    |   -    |     -     | RW‡
bulk-approve-imports      |   -    |   -    |   -    |     -     |  RW
generate-crm-report       |   -    |   -    |   -    |     -     |  RW
send-admin-message        |   -    |   -    |   -    |     -     |  RW

R = Read, W = Write, * = Action-gated, † = Sandboxed submissions only
‡ = Requires re-authentication token
```

#### 5. Session Validity Enforcement

**Update: `supabase/functions/_shared/owner-auth-middleware.ts`**

Add token expiry check: reject tokens with `exp` claim < current time. This prevents reuse of stale/expired JWTs that `getUser` might still accept during a grace period.

#### 6. Privilege Escalation Prevention

**New: Database migration** — Add RLS policy on `user_roles`:
- Users cannot INSERT/UPDATE/DELETE their own roles
- Only service-role (backend) can modify `user_roles`
- Prevents direct-URL manipulation of role assignments

Check if this already exists; if not, add:
```sql
CREATE POLICY "No self-role-modification" ON public.user_roles
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);
```
(Service role bypasses RLS, so backend operations still work.)

#### 7. Owner-Only Dashboard: Zero Trust Audit View

**New: `src/pages/owner/ZeroTrustAuditPanel.tsx`** at `/owner/zero-trust-audit`

Sections:
- **Permission Matrix**: Visual table of all modules × roles
- **Unprotected Functions**: List of edge functions and their auth status
- **Recent Denied Requests**: From `api_security_events` where `event_type` = `auth_failure` or `privilege_escalation`
- **Session Health**: Active sessions, stale token warnings
- **Role Integrity**: Current `user_roles` entries with last-modified timestamps

### Files Summary

| File | Change |
|------|--------|
| **New**: `supabase/functions/_shared/owner-auth-middleware.ts` | Shared owner verification for edge functions |
| **New**: `src/config/permissionMatrix.ts` | Static permission matrix |
| **New**: `src/pages/owner/ZeroTrustAuditPanel.tsx` | Audit dashboard |
| **Update**: `wipe-and-rebuild/index.ts` | Add owner auth + re-auth token |
| **Update**: `bulk-approve-imports/index.ts` | Add owner auth |
| **Update**: `send-admin-message/index.ts` | Add owner auth |
| **Update**: `repair-live-projects-batch/index.ts` | Add owner auth |
| **Update**: 4 sync/enrich functions | Add owner auth |
| **Update**: `src/routes/OwnerRoutes.tsx` | Add route |
| **Migration**: Lock down `user_roles` RLS |

### Implementation Order
1. `owner-auth-middleware.ts` shared utility
2. Database migration (user_roles lockdown)
3. Harden critical functions (wipe, bulk-approve, send-admin-message)
4. Harden remaining unprotected admin functions
5. Permission matrix config
6. Zero Trust Audit Panel + route

