# Homepage hero cleanup + role-gated actions + Users analytics hub

Three connected changes:

1. Clean the homepage hero (mobile especially).
2. Make every "big action" on the site require a logged-in user **with a chosen mode** (Investor / Broker / Developer), Reelly-style.
3. Build an Owner → **Users** page that shows everyone segmented by category, with full activity insights.

---

## 1. Homepage hero changes (`src/pages/Index.tsx`)

**Remove completely (all devices):**
- The inline "I'm a… Investor / Broker / Developer" pill row (lines ~267–300) and its spotlight rotation state. The dedicated `CategorySelectorSection` ("Tell us who you are — Get started in 30 seconds") already does this job, so removing the pills eliminates duplication.

**Three pillar cards** (Premium Marketplace / AI-Powered Tools / Brokerage Services):
- **Mobile (< 640px):** hidden entirely.
- **Tablet (640–1024px):** shown, compact — smaller padding, smaller icons, smaller text, tighter grid.
- **Desktop (≥ 1024px):** shown at current size, slightly refined.

Implemented with Tailwind responsive classes (`hidden sm:grid`, responsive `p-*`, `text-*`, `gap-*`, `max-w-*`) — no JS breakpoint logic.

Everything else in the hero (headline, eyebrow, quick-action pills, "Book a Free Consultation") stays.

---

## 2. Role/mode gating for "big actions" (Reelly-style)

**Concept:** browsing is free; any meaningful action funnels the user through the existing `CategorySelectorSection` so we capture their category before they can proceed.

**Definition of "big action":** Save / Favorite, Contact agent, Request brochure, Book viewing, Export data, Submit a listing, Open broker/developer tools, Start a deal, Sign documents, Download reports.

**How:**
- Extend the existing `ActionGateContext` / `ActionGateModal` to be a single source of truth: `requireUserAndMode(action, callback)`.
  - If not signed in → redirect to `/auth?next=…`.
  - If signed in but no mode set → scroll to / open `CategorySelectorSection` on `/` and pause the action; resume after mode is chosen.
  - If signed in **with** mode → run the action.
- Sweep the codebase and wrap all "big action" buttons (favorite, contact, export, etc.) with this gate. The favorite + contact paths already use `ActionGateModal`, so this is mostly extending coverage, not rewriting.
- No duplication: the modal/section is reused, not re-created.

The category chosen in `CategorySelectorSection` is persisted to the user profile (`profiles.mode` or equivalent — wired through `UserModeContext`, which already exists) and to a new normalized field used by the Users page (see §3).

---

## 3. New "Users" hub for the Owner

**Route:** `/owner/users` (added to `OwnerSidebarNav` between "Research Users" and the next item, labelled **Users**).

**Top of page — segment summary cards:**
```text
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Investors    │ Brokers      │ Developers   │ Unassigned   │
│   1,284      │    312       │     47       │     96       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```
Clicking a card filters the table below.

**Users table** — columns:
- Name + avatar
- Email (masked unless owner clicks "reveal" — respects existing privacy rule)
- Category badge (Investor / Broker / Developer / Unassigned)
- Registered on
- Last seen
- Total sessions
- Total time on site
- Days active (last 30d)
- Country / device

Row → opens a **User Detail drawer**:
- Profile (name, email, phone, country, registered date, source)
- Category history (if they changed mode)
- **Activity timeline**: every session with start, end, duration, device, IP-country, pages visited
- **Insights panel**:
  - Sessions per day (sparkline, last 90d)
  - Hours per day average
  - Most-visited pages
  - Last 50 events (favorites, searches, contact submits, downloads, etc.)
  - Engagement score

**Data sources (already exist — no new tables needed):**
- `user_sessions` + `user_activity_sessions` — session start/end, device, IP
- `user_daily_activity` — per-day aggregate (visits, minutes)
- `user_events` — granular events (clicks, page views, action gate triggers)
- `user_activity_log` — auditable actions
- `profiles` — identity + chosen mode

The Users page reads via a Supabase **edge function** (`owner-users-analytics`) protected by `requireOwnerAuth`, which:
- joins the tables above,
- returns paginated rows + per-user aggregates,
- supports filter by category, search by name/email, sort by last seen / sessions / minutes.

A second edge function (`owner-user-detail`) returns the full timeline + insights for a single user.

**Tracking gap fill (if needed):** if any of the "big actions" aren't already pushed into `user_events`, a thin client helper `trackUserEvent(type, payload)` is added and called from the same wrappers used in §2. No duplicate trackers — `GlobalVisitorTracking` keeps owning anonymous visitor analytics; this adds **authenticated-user** events on top.

**Always wired live:** the page uses Supabase realtime on `user_sessions` so counts update as users come online.

---

## E2E / verification

After implementation:
- Deploy the two edge functions.
- Hit each endpoint with `curl_edge_functions` as owner and as non-owner (must 403).
- Run an E2E pass:
  1. Sign in as investor → favorite a property → verify event lands in `user_events` and shows in `/owner/users` detail drawer.
  2. Sign in as broker → open broker toolkit → verify category badge is "Broker" and session is recorded.
  3. Sign in as developer → submit a project → same checks.
  4. Anonymous user clicks "Contact agent" → confirms gate → after mode chosen, action resumes and is logged.
- Confirm the homepage hero on **mobile** has no pillar cards and no "I'm a…" pills, on **tablet** has the compact pillar cards, on **desktop** has the full-size cards.

---

## Out of scope (kept as-is)

- `CategorySelectorSection` content/design — only its role as the single funnel changes.
- All other homepage sections (Developer Partners, Featured Listings, Resale, etc.).
- Public anonymous browsing of properties, the team page, guides, news, etc.
- The cookie banner and floating-widget fixes from earlier prompts.

---

## Technical notes (for reference)

- Files most touched: `src/pages/Index.tsx`, `src/contexts/ActionGateContext.tsx`, `src/components/ActionGateModal.tsx`, `src/components/owner-dashboard/OwnerSidebarNav.tsx`, new `src/pages/owner/OwnerUsers.tsx` + drawer, new `supabase/functions/owner-users-analytics/index.ts` and `supabase/functions/owner-user-detail/index.ts`.
- No new DB tables; only a possible view (`vw_owner_users_overview`) for the summary cards.
- RLS unchanged; both edge functions enforce `requireOwnerAuth`.
- Tracking helper added to `src/lib/userEvents.ts` (one canonical helper, no duplicates).
