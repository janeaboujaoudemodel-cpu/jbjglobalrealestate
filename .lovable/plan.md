
## What happened (root cause)
- **The Listing Admin page was not removed.** It still exists as `src/pages/ListingAdmin.tsx`, and the route still exists in `src/App.tsx`:
  - `/listing-admin` → `<ListingAdminGuard><ListingAdmin /></ListingAdminGuard>`
  - `/listing-admin/preview/:id` → also guarded
- You are being redirected to the homepage because **`ListingAdminGuard` currently denies access and hard-redirects to `/`**:
  - `src/components/ListingAdminGuard.tsx` only allows a single hard-coded email:
    - `const ADMIN_EMAIL = "janeaboujaoudenails@gmail.com";`
  - If you are **logged out** OR if your email is **no longer exactly that value** (very likely after the recent email-change flow), the guard returns:
    - `<Navigate to="/" replace />`
- So the redirect is not a “missing page” problem; it’s an **access gate mismatch** (email-based allowlist is now out of sync with your current authenticated email and/or session state).

## Fix goals (what will change)
1. **Restore Listing Admin access for you immediately** (robust to email changes).
2. Stop “silent” redirects to the homepage when you’re simply not logged in.
3. Keep Listing Admin strictly protected (no public exposure).

## Implementation plan (code changes)
### A) Fix `ListingAdminGuard` to be role-based (not hard-coded email)
**File:** `src/components/ListingAdminGuard.tsx`

Replace the single-email check with a layered access check:
1. **If no authenticated session** → redirect to login with redirect-back:
   - `Navigate to="/auth?redirect=/listing-admin"`
2. If authenticated, allow access if **any** of these are true:
   - Backend role check: `has_role(user_id, "owner")` is true
   - Backend role check: `has_role(user_id, "admin")` is true
   - User is an active listing admin: row exists in `listing_admins` with:
     - `user_id = session.user.id`
     - `is_active = true`

Notes:
- This aligns with patterns already used in your app (`ExecutiveAccessGate`, `BrokerCRMAccessGate`, etc.) where you already call `supabase.rpc("has_role", ...)`.
- This also preserves the existing “Listing Admin team” feature you already have (`listing_admins` table + `useListingAdmin` hook).
- Optional safety fallback (only if you want it): keep an allowlist of 1–2 “break glass” emails, but **the recommended primary method is Owner/Admin roles**, because emails can change.

### B) Make Listing Admin page’s *internal* access logic match the guard
Right now, even if the guard lets you in, `src/pages/ListingAdmin.tsx` also gates access via:
- `const hasAccess = isListingAdmin || isAdmin;`
This may still block an **Owner** user who is not “admin” and not in `listing_admins`.

**File:** `src/pages/ListingAdmin.tsx`

Update `hasAccess` to include Owner:
- Add a small check on mount to call `has_role(..., "owner")` (or reuse a small helper hook).
- Then:
  - `hasAccess = isListingAdmin || isAdmin || isOwner`

Also update the “Access denied” card styling to match the approved premium UI (right now it still uses `bg-white border-zinc-200` in that denied state).

### C) Ensure other guarded admin routes keep working
`src/App.tsx` also uses `ListingAdminGuard` for:
- `/admin/reelly-import-test`
- `/listing-admin/preview/:id`

Once the guard is fixed, these routes will automatically be restored too.

## Deep audit (to ensure nothing else was “removed” or silently blocked)
I will perform a targeted audit focused on “unexpected redirects / blocked access”:

1. **Route inventory check**
   - Confirm `/listing-admin` and `/listing-admin/preview/:id` still exist (they do).
   - Confirm Listing Admin entry points still exist (header/account menu links, admin dashboards).
2. **Search for other hard-coded access gates**
   - We already confirmed `ADMIN_EMAIL` only appears in `ListingAdminGuard.tsx`.
3. **Manual regression flows**
   - Logged out → open `/listing-admin` → should go to `/auth?redirect=/listing-admin` (not silently to `/`).
   - Logged in as Owner → open `/listing-admin` → should load admin UI.
   - Logged in as non-authorized user → should get a clear “Access denied” screen (or a safe redirect), but not break navigation.
4. **Record results**
   - Add a PASS/FAIL entry in `JBJ_GLOBAL_AUDIT_REGISTER.md` for:
     - Listing Admin access restored
     - Guard behavior correct (logged out vs unauthorized vs owner)

## Emergency restore option (if you want immediate rollback before the fix lands)
If you want to instantly revert the project to a previous “known working” state, you can use **History** to restore to the message/version before the Listing Admin guard changed. This is optional; the fix above should be clean and safer long-term.

## Files that will be changed
- `src/components/ListingAdminGuard.tsx` (core fix)
- `src/pages/ListingAdmin.tsx` (align internal access + premium denied UI)
- `JBJ_GLOBAL_AUDIT_REGISTER.md` (log verification)

## Expected result
- `/listing-admin` will no longer bounce you to the homepage due to a stale email allowlist.
- Owner access remains stable even after email changes.
- Unauthorized users remain blocked, with clearer behavior and no “silent damage.”
