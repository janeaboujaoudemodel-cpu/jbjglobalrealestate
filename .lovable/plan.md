## Goal

Stop the auth loop, kill the empty/broken broker surfaces, and rebuild **one** canonical Broker Portal at `/broker/portal` (alias `/broker/workspace`) that wraps the existing broker pages in a premium workspace shell. No duplicate CRMs, no duplicate dashboards — repair and restructure what is already there.

## What's actually broken (verified)

1. **Auth loop.** `src/pages/Auth.tsx` (lines 220–261) discards `?returnTo` when the user hasn't already "selected" a mode and ships them to `/`. So: click CTA → `/auth?returnTo=/broker/...` → sign in → `/` → click CTA → same loop.
2. **Wrong CTA target.** `src/components/home/DeveloperPortalCTA.tsx:359` points "Visit Your Broker Portal" at `/broker/crm`, not the portal home. There is no portal home today.
3. **Three competing broker shells.** `src/pages/BrokerPortal.tsx` (`/broker-portal`), `src/pages/BrokerHub.tsx` (`/broker-hub`), `src/pages/BrokerDashboard.tsx` (`/broker-dashboard`), plus `AIBrokerWorkspace.tsx` — all live, none authoritative. The stub `src/pages/broker/BrokerDashboard.tsx` already implements the right idea (KPI tiles + assigned databases + tasks) but isn't routed.
4. **Dead links.** `src/pages/broker/BrokerDashboard.tsx` links to `/broker/crm/leads`, `/broker/crm/tasks`, `/broker/crm/notes`, `/broker/crm/calendar`, `/broker/crm/databases` — none of these exist in any router. The matching page files (`BrokerLeadsPage`, `BrokerTasks`, `BrokerNotes`, `BrokerCalendar`, `BrokerDatabasesList`, `BrokerSpreadsheet`, `BrokerInbox`) already exist in `src/pages/broker/`.
5. **No layout shell.** `/broker/crm` is mounted under `StandaloneRoutes` with no header, no sidebar, no nav — that's why the portal "looks unfinished and visually weak".

## Plan

### PHASE 1 — Auth loop fix (smallest possible surgical change)

**`src/pages/Auth.tsx`** — rewrite the post-`signin` block to honour `returnTo` unconditionally when it's a safe same-origin path:

```ts
const isSafeReturnTo = (p: string | null) =>
  !!p && p.startsWith("/") && !p.startsWith("//");

// after successful signIn():
if (isSafeReturnTo(returnTo)) {
  // If returnTo is a broker route and no mode yet, auto-set broker mode
  if (returnTo!.startsWith("/broker") && !modeSelected) {
    await setPlatformMode("broker");
  }
  navigate(returnTo!, { replace: true });
  return;
}
if (modeSelected) { navigate("/", { replace: true }); return; }
navigate("/", { replace: true });
```

Same `isSafeReturnTo` honoured for the OAuth callback path and the reactivation success branch. No other Auth.tsx behaviour changes (OTP, forgot, signup verification path stay intact).

**`src/components/AuthRequiredRoute.tsx`** — already correct, no change.

**`src/contexts/AuthContext.tsx`** — verify `onAuthStateChange` does not `await` Supabase calls inside the callback (per knowledge-base anti-pattern). If it does, hoist the awaited work into a `setTimeout(..., 0)` so the listener returns synchronously and refresh tokens are not blocked.

**Result:** Homepage → CTA → Auth → sign-in → land on `/broker/portal`. An already-authenticated user hitting the CTA never sees `/auth` because `AuthRequiredRoute` short-circuits with `user` present.

### PHASE 2 — One canonical Broker Portal route tree

**New file `src/routes/BrokerPortalRoutes.tsx`** — nested route tree under a single layout:

```text
/broker
├── portal              → BrokerDashboardLanding   (index)
├── workspace           → <Navigate to="/broker/portal" replace />
├── leads               → BrokerLeadsPage
├── crm                 → BrokerCRM               (existing)
├── crm/database/:id    → BrokerDatabaseView      (existing)
├── databases           → BrokerDatabasesList
├── listings            → BrokerProjectsRedirect  (existing)
├── calendar            → BrokerCalendar
├── tasks               → BrokerTasks
├── deals               → (stub uses existing CRM deals view; placeholder empty-state if absent)
├── commissions         → (empty-state shell — wired to existing commissions hook if present)
├── documents           → existing Documents Studio entry (read-only deep link)
├── forms               → existing Forms hub entry
├── academy             → <Navigate to="/broker/learning" replace />
├── marketing           → existing Broker marketing toolkit entry
├── ai                  → AIBrokerWorkspace       (existing)
├── notifications       → BrokerInbox
└── settings            → BrokerAccount
```

All wrapped in `<AuthRequiredRoute><ModeRequiredRoute modes={['broker']}><BrokerPortalLayout/></ModeRequiredRoute></AuthRequiredRoute>` with `<Outlet/>`. This is the **only** broker shell going forward.

**Retire competing entries** (redirects, not deletions — No Removal Policy):

- `/broker-portal` → `<Navigate to="/broker/portal" replace />`
- `/broker-hub` → `<Navigate to="/broker/portal" replace />`
- `/broker-dashboard` → `<Navigate to="/broker/portal" replace />`
- `/broker/crm` stays as the CRM tab inside the new shell (its existing standalone route is removed; the nested route under the layout takes over).
- `BrokerPortal.tsx`, `BrokerHub.tsx`, `BrokerDashboard.tsx` files stay on disk but are no longer routed — keeps history & avoids breaking deep imports.

### PHASE 3 — Premium workspace shell (the actual UI you saw missing)

**`src/components/broker-portal/BrokerPortalLayout.tsx`** (new). Three regions, fixed 88-px global header rule preserved:

```text
┌───────────────────────────────────────────────────────────┐
│  GlobalHeader (existing)                                  │
├──────────┬────────────────────────────────────────────────┤
│ Sidebar  │  Outlet (route content, max-w-[1600px])        │
│ 280px    │                                                │
│ collapse │                                                │
│  to 72px │                                                │
└──────────┴────────────────────────────────────────────────┘
```

- Built on the existing shadcn `Sidebar` primitive (`collapsible="icon"`), champagne surface, gold hairline, ink text — matches the brand memory exactly (no gray, no gold fills, 1px hairline only).
- Sidebar items match the user's spec, in this order: Dashboard, My Leads, CRM Pipeline, Assigned Databases, Listings, Calendar, Tasks, Deals, Commissions, Documents, Forms & Agreements, JBJ Academy, Marketing Toolkit, AI Sales Assistant, Notifications, Settings.
- **Owner-only items hidden.** Sidebar reads `useAuth().isOwner` and filters them out at render — no owner CRM, no relationships, no admin tools ever appear.
- Active route highlighted with cream `#EFE6D6` + 1px gold hairline (matches Sidebar Active Tab standard).
- Mobile: sidebar becomes off-canvas with `SidebarTrigger` in the header — keeps mobile workable without losing nav.

### PHASE 4 — Dashboard landing (`BrokerDashboardLanding`)

`src/pages/broker/BrokerDashboardLanding.tsx` (new — replaces the un-routed stub). Sections, top to bottom:

1. **Welcome strip.** "Welcome back, {first name}" + brokerage chip + `TierBadge` (reuses existing) + avatar from `useBrokerProfile`. Right side: "Quick add lead" + "Log a call" actions.
2. **KPI tiles row** (6 cards, equal width on desktop, 2-col on mobile): Total Leads · Active Deals · Meetings Today · New Assignments · Commission Pipeline · Pending Follow-ups. Each tile uses `<IconTile />` (per memory), ink number + faded gold caption. Data sourced from the existing `useBrokerScopedLeads`, `useBrokerScopedDatabases`, `useBrokerPersonalTasks`, `useBrokerPersonalCalendar` hooks already in the project; missing metrics (deals/commissions) start as zero with proper empty state — never a fake number.
3. **Two-column split:**
   - **Live activity feed** (left, 60%): new leads assigned, owner comments, status changes, new listings, calendar reminders. Backed by an existing notification/feed source if present; otherwise an empty-state with onboarding hint.
   - **Smart next actions** (right, 40%): AI suggestions card (uses existing AI lead suggestion endpoint if wired; otherwise renders a clean "AI assistant" CTA card). Below it: today's meetings.
4. **My Databases** strip: card grid of assigned databases (`useBrokerScopedDatabases`) — name, assigned date, assigned-by, lead count, last updated, access status (view/edit). Click → `/broker/crm/database/:id`.
5. **My Leads** preview: first 5 from `useBrokerScopedLeads` with name, phone, email, nationality, source, status, assigned-agent, updated-timestamp — "Open full CRM" link to `/broker/crm`.

All sections share the same premium card: `bg-[hsl(var(--champagne-2))]`, 1px brand-gold hairline, rounded-2xl, generous padding. No empty white voids — when a hook returns zero rows, the section renders a branded empty state with an action button, never a blank panel.

### PHASE 5 — Loading / empty / no-data states

- **Skeletons** on every section while hooks load (replaces today's hanging spinner / blank panel). Champagne shimmer, gold hairline border. No gray.
- **Empty state component** (`<BrokerEmptyState icon title description action />`) reused across Dashboard, Leads, Databases, Tasks, Calendar — same visual language everywhere.
- **Onboarding state** for first-login brokers (zero data everywhere): three-step checklist card (Complete profile → Sign agreement → Wait for first assignment) wired to real status from `useBrokerProfile`.

### PHASE 6 — Role-based access guardrail

`src/components/broker-portal/BrokerScopeGuard.tsx` — thin wrapper around `BrokerGuard` that additionally:

- Refuses to render owner CRM components (allowlists the broker-scoped hooks: `useBrokerScopedLeads`, `useBrokerScopedDatabases`, `useBrokerPersonal*`).
- Asserts on mount that `isOwner === false` for the sidebar render path — flips a dev-only warning if owner-only routes ever leak in.

No new RLS work needed; the existing `*_scoped` hooks already enforce broker-only data at the DB layer. This guard is the UI-side belt-and-braces.

### PHASE 7 — CTA + verification

- **`src/components/home/DeveloperPortalCTA.tsx`** — change `href="/broker/crm"` → `href="/broker/portal"`. CTA label unchanged.
- Manual smoke flow (documented in plan for build phase):
  1. Logged out: Home → CTA → `/auth?returnTo=/broker/portal` → sign in → `/broker/portal`.
  2. Logged in: Home → CTA → straight to `/broker/portal` (no auth detour).
  3. Sidebar click on every item → page renders with shell intact, no white voids.
  4. Database card click → `/broker/crm/database/:id` opens inside the shell.
  5. Sign out → CTA → back to `/auth?returnTo=/broker/portal` → sign in → lands on `/broker/portal` (loop is dead).
  6. Hard refresh on `/broker/portal/tasks` → session hydrates, route survives, no flicker to `/auth`.

## What stays untouched

- All existing broker hooks (`useBrokerProfile`, `useBrokerScopedLeads`, `useBrokerScopedDatabases`, `useBrokerPersonal*`) — reused as-is.
- All existing broker sub-pages (`BrokerCRM`, `BrokerDatabaseView`, `BrokerLeadsPage`, `BrokerCalendar`, `BrokerTasks`, `BrokerNotes`, `BrokerInbox`, `BrokerSpreadsheet`, `BrokerDatabasesList`, `BrokerProjectsRedirect`) — rendered inside the new layout, no code edits required for the route swap itself.
- `AuthContext`, `BrokerGuard`, `ModeRequiredRoute` semantics — unchanged except for the `onAuthStateChange` await-safety pass if needed.
- Owner/admin surfaces — fully untouched.

## Files touched

**New**
- `src/routes/BrokerPortalRoutes.tsx`
- `src/components/broker-portal/BrokerPortalLayout.tsx`
- `src/components/broker-portal/BrokerPortalSidebar.tsx`
- `src/components/broker-portal/BrokerEmptyState.tsx`
- `src/components/broker-portal/BrokerScopeGuard.tsx`
- `src/pages/broker/BrokerDashboardLanding.tsx`

**Edited**
- `src/pages/Auth.tsx` (post-signin redirect logic only)
- `src/contexts/AuthContext.tsx` (await-safety in `onAuthStateChange` if a violation is found)
- `src/components/home/DeveloperPortalCTA.tsx` (CTA href)
- `src/routes/PublicRoutes.tsx` (mount nested broker routes, add redirects for legacy paths)
- `src/routes/StandaloneRoutes.tsx` (move `/broker/crm` and `/broker/crm/database/:id` out of Standalone into the nested layout; keep `/broker/activate` and `/broker/agreement/:id` here since those intentionally have no shell)

**Untouched on disk (legacy, kept for history)**
- `src/pages/BrokerPortal.tsx`, `src/pages/BrokerHub.tsx`, `src/pages/BrokerDashboard.tsx`, `src/pages/broker/BrokerDashboard.tsx` (the 92-line stub is replaced by `BrokerDashboardLanding.tsx`; the stub file is kept and re-exports the new landing for back-compat).

## Out of scope

- Building new CRM tables, new lead schemas, new deal engines, or any owner-side CRM — the request explicitly forbids duplication.
- Visual rework of pages reached from the sidebar (CRM, Calendar, Tasks, etc.) — those keep their current internals and simply gain the shell. A second pass can polish each tab once the workspace shell is live.
- Mobile-app-style native gestures, real-time websockets for the activity feed (uses existing polling), or a brand-new AI assistant — the AI tab reuses `AIBrokerWorkspace`.
