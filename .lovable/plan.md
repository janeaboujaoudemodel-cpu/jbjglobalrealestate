
Goal: make Owner access consistent everywhere so clicking “Admin Panel” (and any Owner-only feature) never shows “You don’t have Owner access” when you are logged in with the Owner email. Fix must be systemic, not per-page.

What I found (root causes of “it depends” behavior)
1) Multiple, conflicting ways to decide “Owner”
   - AuthContext: `isOwner` is computed via backend function `verify-owner` (good).
   - OwnerGuard: does its own separate `verify-owner` call via `useOwnerVerification` (duplicate network call; can disagree with AuthContext if one call fails/times out).
   - Several “access gates” (ListingAdminGuard, ExecutiveAccessGate, VideoBuilderAccessGate, BrokerCRMAccessGate, ListingAdmin page) rely on `has_role('owner'|'admin')` (role-table-based) instead of the email-verified Owner. If the roles table doesn’t contain those rows for you, those areas will deny/hide features even though you are the Owner.
   - `src/lib/aiToolClient.ts` still uses `VITE_OWNER_EMAIL` (build-time env) to decide Owner (inconsistent with the server-verified model).

2) A race/timeout bug in AuthContext can temporarily mark you as “not Owner”
   - `AuthContext.tsx` has a “safety timeout” that can force `loading=false` before the async owner verification finishes.
   - Pages like `Admin.tsx` / `AdminLeads.tsx` have their own redirect logic: if they see `loading=false` + `user=true` + `isOwner=false` (even for a moment), they toast “You don’t have Owner access” and kick you out.
   - Result: sometimes you get denied depending on timing/network speed.

3) Duplicate route definition for `/admin/crm`
   - `src/App.tsx` defines `/admin/crm` twice: once as a redirect to `/owner`, and later as the actual AdminCRM page behind OwnerGuard.
   - Duplicate identical paths can lead to unpredictable behavior and broken navigation/audits.

Design principles for the fix
- Single source of truth for Owner in the frontend: `useAuth().isOwner`, derived only from server-verified `verify-owner`.
- No Owner privilege decisions based on localStorage, build-time env vars, or `user_metadata`.
- All “gates” must have an Owner override: if `isOwner===true`, allow access (even if role tables are empty/misconfigured).
- Fail closed for security, but do not “mislabel” you as not Owner due to timeouts; show a “verification unavailable / retry” state instead of redirecting you away.

Implementation plan (code changes)

A) Make AuthContext provide a robust Owner status (and eliminate the “false not-owner” window)
Files: `src/contexts/AuthContext.tsx`
1. Split state into:
   - `authLoading` (session being determined)
   - `ownerLoading` (owner verification running)
   - `ownerError` (verification failed / timed out)
   - `isOwner` (true/false, only set after verification completes or a controlled timeout)
2. Replace the current “force loading false after 5 seconds” behavior:
   - Remove the timeout that blindly sets `loading=false`.
   - Instead, apply a timeout specifically to the owner verification request, and set `ownerError="timeout"` when it happens.
3. Make owner verification deterministic by sending the access token explicitly:
   - Invoke `verify-owner` with an `Authorization: Bearer ${session.access_token}` header (prevents intermittent “no auth header” races).
4. Expose a `refreshOwnerVerification()` method in context so any screen can “Retry verification” without page reload.

Acceptance result: `isOwner` will never be evaluated as false simply because the verification was still in progress.

B) Remove duplicate owner checks; make OwnerGuard use AuthContext only
Files: 
- `src/hooks/useOwnerVerification.ts`
- `src/components/OwnerGuard.tsx`
1. Change `useOwnerVerification` to be a thin wrapper over AuthContext:
   - Return `{ isOwner, isLoading: ownerLoading, error: ownerError }` from context.
   - Do not call `verify-owner` again from this hook.
2. Update OwnerGuard:
   - Show loading spinner when `authLoading || ownerLoading`.
   - If `ownerError` exists: show a dedicated “Owner verification temporarily unavailable” screen with:
     - Retry button (calls `refreshOwnerVerification()`)
     - Sign out button
   - Only redirect to `/403` when owner verification completed successfully and determined `isOwner=false`.

Acceptance result: all Owner-only routing uses the same Owner verdict, consistently.

C) Remove page-level redirects that fight the route guard (these currently cause the toast + kick-out)
Files:
- `src/pages/Admin.tsx`
- `src/pages/AdminLeads.tsx`
- (and any other OwnerGuard-wrapped page with internal “not owner” redirects)
1. Delete the `useEffect` blocks that check `!isOwner` and redirect.
2. Assume: if the component rendered, OwnerGuard already granted access.
3. Optionally keep a defensive UI fallback (render a simple message) but do not navigate away based on transient state.

Acceptance result: you will not be kicked out of `/admin` due to a momentary `isOwner=false` while verification is still running.

D) Add Owner override to all other “access gates” that rely on roles tables
Files (minimum set found):
- `src/components/ListingAdminGuard.tsx`
- `src/pages/ListingAdmin.tsx`
- `src/components/executive/ExecutiveAccessGate.tsx`
- `src/components/video-builder/VideoBuilderAccessGate.tsx`
- `src/components/broker-toolkit/BrokerCRMAccessGate.tsx`
- `src/components/header/MegaMenuAccount.tsx` (listing admin access query)
Approach:
1. Wherever the code checks `has_role('owner')` or `has_role('admin')` as a proxy for Owner:
   - Import `useAuth()` and short-circuit: if `isOwner===true`, allow.
2. Keep role-table checks for non-owner staff access if you still want them, but Owner should not depend on them.
3. In `ListingAdmin.tsx`, remove the redundant `has_role('owner')` check and use `useAuth().isOwner` (you already have `isOwnerEmail` in that file).

Acceptance result: Owner always sees Owner tools even if role-table rows are missing.

E) Remove remaining build-time env Owner checks
Files:
- `src/lib/aiToolClient.ts`
- `src/pages/AccessDenied.tsx`
1. `aiToolClient.checkBrokerAccess()`:
   - Replace `VITE_OWNER_EMAIL` email comparison with a server check (call `verify-owner`) or accept `isOwner` from caller when used inside React.
2. `AccessDenied.tsx`:
   - Remove the “VITE_OWNER_EMAIL not configured” warning (Owner config is now server-side via secret).
   - Optionally display:
     - “You are signed in as X”
     - “Owner verification failed or you are not the Owner”
     - A Retry button that triggers `refreshOwnerVerification()`

Acceptance result: no mismatched logic between build-time env and server-verified Owner.

F) Fix duplicate routes that can break navigation and audits
File: `src/App.tsx`
1. Remove the earlier redirect route:
   - Delete `<Route path="/admin/crm" element={<Navigate to="/owner" replace />} />`
   - Keep the real guarded route: `<Route path="/admin/crm" element={<OwnerGuard><AdminCRM /></OwnerGuard>} />`
2. Re-check for any other duplicate `path="..."` entries and remove duplicates.

Acceptance result: `/admin/crm` behaves consistently and matches the Owner Audit inventory.

G) Add an Owner Access Diagnostics panel (so you can self-verify instantly)
File candidates:
- `src/pages/owner/OwnerAuditPage.tsx` (best place)
- or a small new Owner-only page under `/owner/audit` tabs
Features:
- Displays current:
  - Logged-in email
  - `isOwner`, `ownerLoading`, `ownerError`
  - last verification time
- Button: “Re-check Owner access” (calls `refreshOwnerVerification()`)
- Optional “Direct backend check” button to run `verify-owner` once and display the returned reason code (no secrets leaked).

Acceptance result: you can see exactly why something is blocked without guessing.

Validation / test checklist (end-to-end)
1. Log in as Owner, immediately click “Admin Panel” from the My Account dropdown:
   - Should open `/admin` every time (no toast denial).
2. Hard refresh on `/admin` while logged in:
   - Should load with spinner until owner check completes; never redirect incorrectly.
3. Check key Owner-only areas:
   - `/owner`, `/owner/audit`, `/crm`, `/listing-admin`, `/admin/leads`, `/admin/crm`
4. Non-owner test (any other account):
   - Must be redirected to `/403` for Owner-only routes.
5. Slow network simulation (practical):
   - Repeat steps on mobile data; confirm no false “not Owner” behavior. If verification fails, you should see the “verification unavailable” screen with Retry (not a misleading “you are not owner”).

Deliverable summary
- Owner access becomes consistent because:
  - only one Owner verdict exists (AuthContext),
  - no other component re-checks or uses unrelated role sources,
  - no premature redirects happen before verification completes,
  - all role-table-based gates include an Owner override,
  - duplicate routing is removed.

Files likely touched
- `src/contexts/AuthContext.tsx`
- `src/hooks/useOwnerVerification.ts`
- `src/components/OwnerGuard.tsx`
- `src/pages/Admin.tsx`
- `src/pages/AdminLeads.tsx`
- `src/components/ListingAdminGuard.tsx`
- `src/pages/ListingAdmin.tsx`
- `src/components/executive/ExecutiveAccessGate.tsx`
- `src/components/video-builder/VideoBuilderAccessGate.tsx`
- `src/components/broker-toolkit/BrokerCRMAccessGate.tsx`
- `src/components/header/MegaMenuAccount.tsx`
- `src/lib/aiToolClient.ts`
- `src/pages/AccessDenied.tsx`
- `src/App.tsx`
- (optional) `src/pages/owner/OwnerAuditPage.tsx` for diagnostics
