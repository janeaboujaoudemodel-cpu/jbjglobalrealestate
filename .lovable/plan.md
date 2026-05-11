## Goal
Eliminate the “Verifying access — please wait a moment” lock-up on `/e-signature` (Agreement) and stop the home page from blinking/reverting to **Investor** when switching to **Broker / Academy / Company / Developer** cards. End-to-end verify the signature flow afterwards.

## What's broken (root causes)

1. **`/e-signature` stuck on splash**
   - `OwnerGuard` waits on `ownerLoading` from `AuthContext`.
   - `AuthContext.verifyOwner` initialises `ownerLoading = true` and only flips it off inside the cache branch or after `verify-owner` resolves. If `verify-owner` is slow/blocked (cold start, transient 5xx, network), the guard never advances past 250 ms grace, and the auto-retry path is only triggered by `ownerError`, not by a hanging promise.
   - `ownerVerifiedOnce` short-circuit only kicks in for users whose session previously verified — first hit after a fresh login on `/e-signature` always sees the splash.
   - Net effect: on a fresh tab, opening `/e-signature` shows the dark “Verifying access” screen until the 8 s timeout, never optimistically renders.

2. **Home sections blink back to Investor**
   - `UserModeContext.loadMode` runs in a `useEffect` keyed on `user?.id`. It sets `isLoading=true` → reads localStorage → maybe overwrites with DB → sets `isLoading=false`.
   - During `isLoading`, components that branch on `isInvestorMode / isBrokerMode / isDeveloperMode` (broker hub card, academy card, company/developer card on `/`) fall back to the default `investor` and re-render again 1 frame later, which produces the blink.
   - `onAuthStateChange` fires on `TOKEN_REFRESHED` and `INITIAL_SESSION`; both rebuild `user` reference → `useEffect` re-runs → another isLoading cycle → another blink, even if the mode never actually changed.
   - Mode cards (`CategorySelectorSection`, `DeveloperPortalCTA`, broker/academy/company tiles) re-read `mode` synchronously and don't gate on `isLoading`, so they flash investor styling.

3. **`OwnerGuard` shows a dark hard splash**
   - Even when the splash is correct, it covers the whole viewport in `#1A1A1A`. On in-app navigation to `/e-signature` this looks like the app is reloading. We should keep the previous page visible and show only a subtle top-bar indicator while re-verifying.

## Fix Plan

### A. Owner verification — never block the route

`src/contexts/AuthContext.tsx`
- Initialise `ownerLoading = false` (loading only flips `true` while an actual verify is in flight).
- In `verifyOwner`:
  - On cache hit (any `cached.ok === true`, even if stale) → return `true` immediately AND keep `isOwner=true`; refresh in background regardless of TTL.
  - Wrap the network verify in `Promise.race` with an 8 s hard timeout that resolves to “use last known state” instead of throwing.
  - If `verify-owner` returns 5xx / aborts: do NOT downgrade `isOwner`; only `email_mismatch` or a definitive 401 downgrades.
- Reset `ownerLoading=true` at the start of a real fetch and always set it back to `false` in a `finally` block (currently only on success path).

`src/components/OwnerGuard.tsx`
- Replace the full-screen dark splash with an **optimistic-render** strategy:
  - If `user` exists AND (`isOwner` OR `ownerVerifiedOnce.current` OR there is a cached `owner_v2_<uid>=ok`), render `children` immediately; show a thin gold progress bar at the top while re-verifying.
  - Only show the dark splash when there's no user AND auth is still resolving, OR when verification has explicitly failed.
- Move the `sessionStorage("owner_verified_once")` write to set as soon as `verify-owner` has ever returned `ok` for this user (so the second tab / refresh also bypasses splash).
- Increase auto-retry grace to silent (no UI state changes) — the user never sees the retry counter unless 3 attempts have failed.

### B. User-mode — stop the blink

`src/contexts/UserModeContext.tsx`
- Compute `mode` synchronously from localStorage on first render and never set `isLoading=true` after that. The DB sync becomes a silent background reconcile that can only:
  - Push the local choice up to DB.
  - Adopt a DB value **only** when localStorage has zero mode AND no `MODE_SELECTED_KEY`.
- Remove the `setIsLoading(true)` at the top of `loadMode`. `isLoading` is only true on very first mount before localStorage is read (already synchronous now), so effectively always `false` post-mount.
- Gate the `useEffect` so it runs **once per real user id change**, not on every `user` reference churn from `TOKEN_REFRESHED` (track previous user id in a ref).
- Never call `register-mode-lead` from the load path unless the mode actually changed (currently re-runs on every DB adopt).

Home page mode-aware tiles
- `src/components/home/CategorySelectorSection.tsx`, `DeveloperPortalCTA.tsx`, broker/academy/company tiles on `/`:
  - Read `mode` directly; do not branch on `isLoading` (it stays `false` after the fix).
  - Active-state styling uses `mode === id` only — no derived state stored locally that could lag.

### C. End-to-end signature flow QA

After the two fixes ship, walk through and verify:
1. Fresh login → go directly to `/e-signature` → dashboard renders within one frame, no dark splash.
2. Click an existing envelope → `EnvelopeDetail` opens immediately (no splash flash on `/e-signature/:id`).
3. From the home page, click Broker / Academy / Company / Developer tiles in sequence — each card highlights the correct active state, no flash to Investor, mode persists across reload.
4. Trigger `Send Test Email` and the thank-you flow we wired earlier — confirm both still fire.

### D. Out of scope for this fix (tracked separately, will follow in next plan)
The earlier voice message asks (Sell/Rent intake templates, document-request automation, AI-prefilled leasing/selling agreement with Approve / Approve & Send, default CC of `info@janeagmail.com`, Resend `from: JBJ Global Real Estate <noreply@jbj.ae>`, Relationship Hub red-Gmail/breakfast-booking cleanup) are larger feature work and will be planned in a follow-up once this critical UX bug is resolved.

## Technical detail summary
- Files touched in this fix: `src/contexts/AuthContext.tsx`, `src/components/OwnerGuard.tsx`, `src/contexts/UserModeContext.tsx`, possibly `src/components/home/CategorySelectorSection.tsx` (remove any `isLoading` gating).
- No DB migrations, no edge-function changes, no new dependencies.
- Behaviour change: `OwnerGuard` is now optimistic — non-owners reaching protected routes still get redirected to `/403` once verify resolves, just without a dark splash beforehand. Security posture is unchanged because the protected backend functions still enforce `requireOwnerAuth`.
