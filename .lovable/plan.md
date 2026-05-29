# Broker Portal — Repair & Redesign Plan

The audit confirmed: `/broker/portal` already exists with a full route shell, sidebar, layout, and 18+ pages. We do **not** build a new portal. We fix auth, harden role gating, then rebuild the **landing dashboard** + tighten the sidebar.

---

## Phase 1 — Kill the auth redirect loop (highest priority)

**Root cause (from audit):**
- `AuthRequiredRoute` writes `?returnTo=…` — `Auth.tsx` reads it correctly.
- `BrokerGuard` writes `?redirect=…` — `Auth.tsx` ignores it → user lands on `/`.
- `OwnerRedirectGuard` bounces owners visiting `/broker/portal` to `/owner` unless `?preview=1` is set — this can loop when an owner is the test user.
- `signInWithGoogle` has no explicit `redirectTo`, so OAuth strips `returnTo`.

**Fixes:**
1. `Auth.tsx`: accept both `?returnTo` and `?redirect` (alias). Fallback order: `returnTo` → `redirect` → `sessionStorage["jbj_post_login_redirect"]` → `/`.
2. `AuthRequiredRoute` + `BrokerGuard`: standardize on `?returnTo=`, additionally stash the intended path in `sessionStorage` before navigating to `/auth` (OAuth-safe).
3. `signInWithGoogle(returnTo?)`: pass `redirectTo: ${origin}/auth/callback?returnTo=…` so the loop survives the Google round-trip.
4. `OwnerRedirectGuard`: when the user is owner **and** the source CTA was the public homepage broker card, auto-append `?preview=1` instead of forcing `/owner`. Add a one-line "Viewing as broker preview · Switch to Owner" banner.
5. `DeveloperPortalCTA` broker CTA: if already authenticated AND `isBrokerMode`, render the CTA as a direct `<Link to="/broker/portal">` with no gate; if unauthenticated, navigate to `/auth?returnTo=/broker/portal&preselect=broker`.
6. Verify the loop is dead via the full flow: Home → CTA → /auth → sign-in → /broker/portal (no homepage bounce), and refresh on /broker/portal stays put.

---

## Phase 2 — Sidebar & route hygiene (no new routes)

Existing sidebar already has 10 items. Reconcile against the user's required list:

| Required item        | Status                    | Action                                |
| -------------------- | ------------------------- | ------------------------------------- |
| Dashboard            | ✅ `/broker/portal`        | keep                                  |
| My Leads             | ✅ `/broker/leads`         | promote in sidebar                    |
| CRM Pipeline         | ✅ `/broker/crm`           | keep                                  |
| Assigned Databases   | ✅ `/broker/databases`     | add to sidebar (currently routed only)|
| Listings             | ✅ `/broker/listings`      | keep                                  |
| Calendar             | ✅ `/broker/calendar`      | keep                                  |
| Tasks                | ✅ `/broker/tasks`         | keep                                  |
| Deals                | ✅ `/broker/deals`         | split from "Deals & Commissions"      |
| Commissions          | ✅ `/broker/commissions`   | split                                 |
| Documents            | ✅ `/broker/documents`     | keep                                  |
| Forms & Agreements   | ⚠️ `/broker/forms` is `OwnerOnlyRoute` | repurpose as broker-readable agreements list; owner-only admin moves to `/owner/forms` |
| JBJ Academy          | ✅ `/broker/learning`      | keep                                  |
| Marketing Toolkit    | ⚠️ redirects to portal    | wire to `BrokerToolkit` page          |
| AI Sales Assistant   | ✅ `/broker/ai`            | keep                                  |
| Notifications        | ✅ `/broker/notifications` | keep                                  |
| Settings             | ✅ `/broker/settings`      | keep                                  |

Remove owner-footer button from `BrokerPortalSidebar` for non-owners (already conditional; verify). Hide every owner/admin/relationships/dev/agency path per the existing `BrokerGuard` blocklist.

---

## Phase 3 — Rebuild `BrokerDashboardLanding` (the actual UI work)

The current landing is the "empty white" page the user is complaining about. Replace its body with a real workspace, using the project's champagne/gold/ink system + `<PremiumSectionCard>` + `<IconTile>` (no new design tokens):

1. **Welcome row** — broker name, brokerage, tier badge, avatar, mode chip. Data from `useBrokerProfile` + `useUserRole`.
2. **KPI strip (6 cards)** — Total Leads, Active Deals, Meetings Today, New Assignments, Commission Pipeline, Pending Follow-ups. Data via new read-only hook `useBrokerKpis()` querying:
   - `crm_leads` count where `assigned_broker_id = auth.uid()`
   - `crm_deals` count where stage ∈ active set
   - `crm_meetings` where date = today
   - `vw_crm_database_access` rows newer than 7d
   - sum of `crm_deals.commission_pending`
   - `crm_leads` where `next_followup_at <= now()`
   (All scoped server-side by RLS; no new tables.)
3. **Activity feed** — read from existing `admin_edit_log` + `crm_lead_events` filtered to the broker's `assigned_broker_id`. Reuses existing query patterns.
4. **My Databases preview** — top 4 cards from `useBrokerScopedDatabases`, "View all" → `/broker/databases`.
5. **Today panel** — upcoming meetings + due tasks (existing hooks).
6. **Smart features row** — AI lead suggestions, freshness indicator, next-action chips. Backed by `ai-broker-suggestions` edge function (already exists per repo grep — if not, wire a stub that surfaces top-3 stale leads from `crm_leads` without inventing data).

Skeletons + empty states + onboarding state (when broker has 0 assigned leads) for every section. No fake placeholder data.

---

## Phase 4 — Role-gated data access (verify, don't rebuild)

- `useBrokerScopedLeads` and `useBrokerScopedDatabases` already filter by `auth.uid()`. Confirm RLS on `crm_leads`, `crm_deals`, `crm_meetings`, `vw_crm_database_access` denies cross-broker reads. No migrations expected; if a missing policy is found, add the minimum scoped policy in a single migration.
- Confirm three role-detection systems agree (`UserModeContext`, `useUserRole`, `BrokerGuard`). Consolidate the dashboard on `useUserRole` (the most accurate) and stop reading `localStorage` for gating.

---

## Phase 5 — Verification (end-to-end manual run before sign-off)

Walk and screenshot:
1. Anonymous → Home → "Visit Your Broker Portal" → `/auth?returnTo=/broker/portal` → sign in → lands on `/broker/portal` (no homepage bounce).
2. Refresh on `/broker/portal` → stays put.
3. Sign out → sign in again → lands on `/broker/portal` directly.
4. Owner visits `/broker/portal` → sees preview banner, not `/owner` redirect loop.
5. Broker navigates Dashboard → CRM → Database → Lead → Logout.
6. Owner-only routes (`/owner/*`, `/admin/*`) hidden in sidebar; direct URL blocked.

---

## Out of scope (explicitly not doing)

- No new CRM, no new portal, no new sidebar primitive.
- No design-system tokens added; reusing champagne/gold/ink + navy CTA.
- No homepage CTA copy/wording change beyond making it work.
- No edge function rewrites unless an existing one is broken on the dashboard query path.

---

## Technical notes

- Auth fallback chain implemented in `Auth.tsx` post-`signInWithPassword` block (lines 226–268) and in the already-signed-in early-return (lines 433–442).
- OAuth round-trip: persist `returnTo` to `sessionStorage` before `signInWithOAuth`; `/auth/callback` route (or the existing Auth-page mount) reads it on `SIGNED_IN` event.
- `BrokerDashboardLanding` keeps the `BrokerPortalLayout` shell — only the inner page body is replaced.
- All new queries gated behind `useAuthReady`-style pattern (don't fire before `getSession()` resolves) to prevent the "loading spinner hanging forever" symptom.

Please confirm this plan, or tell me which phases to drop / re-order, and I'll implement.
