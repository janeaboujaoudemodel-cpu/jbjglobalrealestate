
## Goals (what “fixed” means)
1) Clicking the account icon → switching **Investor / Broker / Investor+Broker** does not break the UI and visibly switches what the user sees.
2) Clicking **My Dashboard** always opens a working dashboard page (no broken UI).
3) Listing Admin page is no longer “too wide” and matches the premium dashboard shell width.
4) Homepage Hero Search Bar:
   - “Search” button has rounded corners on both sides (no sharp square on the left edge)
   - Currency dropdown is scrollable (dropdown scrolls, not the page)
   - Buy / Currency / sqft popovers open upward like the other controls
   - “Filters” behaves like the Reelly filters experience (same UI/logic, not a separate inconsistent filter)

---

## What I found (root causes)
### A) Mode switcher does not actually control the dashboard experience
- The **Account Mode Switcher** (`src/components/ModeSwitcher.tsx`) is the only place that reads/writes `user_preferences.selected_mode`.
- Nothing else consumes that mode (`useUserMode()` is only used in ModeSwitcher), so switching mode does not re-route or change the dashboard content. This is perceived as “bug/crash”.

### B) “My Dashboard” vs “Investor Dashboard” routing is inconsistent
- “My Dashboard” link exists and points to `/my-dashboard` (good).
- The “Investor Hub” mega menu (`src/components/header/MegaMenuInvestorHub.tsx`) routes “Investor Dashboard” and CTA buttons to `/my-account` (not `/my-dashboard`).
- `/my-account` is currently wired to `BrokerAccount` (`src/App.tsx`), which can show broker/training UI and query broker tables. That can look like the wrong dashboard or broken for the selected mode.

### C) Visitor tracking is spamming errors (and can make pages feel broken)
`src/components/GlobalVisitorTracking.tsx` calls:
- `POST /visitor_sessions?on_conflict=session_id` with `prefer: resolution=merge-duplicates`
But the response is:
- `42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification`

Meaning: `visitor_sessions.session_id` is not unique in the database, so upsert fails. This floods the console and can degrade perceived stability.

### D) Homepage Hero currency popover is not scroll-contained and opens downward
`src/components/home/HeroSearchBar.tsx`:
- Currency popover has no `max-height`/`overflow-y-auto`, so it expands and the page scrolls instead of the dropdown content.
- Purpose/Currency/Area Unit popovers are configured with `side="bottom"` even though they are long lists and the user wants “open up”.

### E) “Search” button left edge is intentionally square today
Hero Search button uses:
- `rounded-none rounded-r-xl`
So the left edge is square. User wants it rounded like the right edge.

### F) Hero “Filters” is a separate system from Reelly filters
- Home hero “Filters” opens its own dialog in `HeroSearchBar.tsx`
- Reelly filters live in `/properties` page (`src/pages/PropertiesReelly.tsx`) with its own “Filters” dialog and UI.
This creates mismatch.

---

## Implementation plan (sequenced to stop breakage first)

### Phase 1 — Make Mode Switcher actually switch the dashboard (no more “bug/crash” perception)
**1.1 Add a single “source of truth” for mode-aware navigation**
Create a small utility (or function colocated in ModeSwitcher) that maps mode → dashboard route:
- investor → `/my-dashboard` (default entry)
- broker → `/my-dashboard` (same entry; dashboard content changes)
- investor_broker → `/my-dashboard`

Rationale: the “/my-dashboard” route already exists and is meant to be the unified entry point (per your requirements). We will make it mode-aware.

**1.2 Update `ModeSwitcher` to do 3 things on change**
File: `src/components/ModeSwitcher.tsx`
- After `await setMode(newMode)`:
  - close dropdown
  - navigate to `/my-dashboard` (replace: true)
  - emit a global event so pages can respond immediately without reload (ex: `window.dispatchEvent(new CustomEvent('userModeChange', {detail: newMode}))`)

This makes the switcher feel instant and prevents “I clicked investor mode and it broke / did nothing.”

**1.3 Make `/my-dashboard` mode-aware (minimal but real changes)**
File: `src/pages/MyDashboard.tsx`
- Read mode via `useUserModeContext()` (already provided at App root).
- Adjust “Quick Actions” and visible modules:
  - investor: show investor actions and hide broker-only actions
  - broker: show broker actions (Listing Admin, Broker Toolkit, etc.)
  - investor_broker: show both grouped (Investor section + Broker section)

Keep all cards wrapped in `DashboardCardErrorBoundary` so one card never blanks the whole dashboard.

**1.4 Fix the account menu + investor hub links to stop routing to `/my-account` for dashboards**
Files:
- `src/components/header/MegaMenuInvestorHub.tsx`
- `src/components/GlobalHeader.tsx` (investorHubLinks)
Change:
- Any “Investor Dashboard / Go to Dashboard” links should go to `/my-dashboard` (not `/my-account`)
Keep `/my-account` for “Profile/Settings” only.

Result: user always lands in the unified dashboard that respects mode.

**Verification (Phase 1)**
- Open account icon → switch Investor → lands on `/my-dashboard` and shows investor section
- Switch Broker → lands on `/my-dashboard` and shows broker section
- Switch Investor+Broker → shows both sections
- Click account icon → “My Dashboard” → works with no broken UI

---

### Phase 2 — Remove tracking errors that flood dashboards (stability hardening)
**2.1 Fix `visitor_sessions` upsert properly**
We have two safe options; we will choose based on existing data:

Option A (preferred): Add a UNIQUE constraint/index in the backend:
- `visitor_sessions(session_id)` unique

But first we must check for duplicates; if duplicates exist, we must dedupe before adding the constraint.

Option B: Stop using `upsert(... onConflict: 'session_id')` and switch to:
- `insert` on first load, then `update` afterwards

**2.2 Remove/replace `sendBeacon` direct REST call**
File: `src/components/GlobalVisitorTracking.tsx`
- The current `sendBeacon` hits REST directly and has CORS/auth edge cases.
- Replace with:
  - a best-effort `supabase.from('visitor_sessions').update(...)` (no beacon), OR
  - a lightweight backend function “track-session-exit” that accepts session_id + totals and updates server-side (more reliable).

**Verification (Phase 2)**
- Reload `/my-dashboard` and `/my-account`:
  - No more `42P10` errors in console
  - No repeated visitor_sessions failures

---

### Phase 3 — Listing Admin width + premium shell alignment (stop “wide UI” issue)
File: `src/pages/ListingAdmin.tsx`
**3.1 Apply the same dashboard shell pattern used in `/my-dashboard`**
- outer page: `bg-black`
- inner shell: `mx-3 md:mx-4 lg:mx-6 my-6 rounded-2xl border ... champagne gradient`
- content max width: `max-w-[1200px] mx-auto` (matches your design system)

**3.2 Ensure each view respects max width**
- Header wrapper: move `px-4 py-4` into a max-width container
- Views (`data-sources`, `sync`, `reelly`, `projects`, `editor`):
  - keep `container` but also clamp with `max-w-[1200px]`

**Verification (Phase 3)**
- Open `/listing-admin` on large desktop: content no longer stretches too wide
- Tabs/header align with the max width shell
- No horizontal overflow

---

### Phase 4 — Homepage Hero Search Bar: rounding + dropdown scroll/up behavior + “Filters like Reelly”
File: `src/components/home/HeroSearchBar.tsx`

**4.1 Fix the “Search” button left edge rounding**
- Change button classes from `rounded-none rounded-r-xl` to a fully rounded look:
  - Use `rounded-xl` (both sides)
  - Add a small gap between the bar and button (or a wrapper) so the rounded-left edge is visible and doesn’t look “cut” by the bar.

**4.2 Make Currency (and other top controls) open upward + scroll inside dropdown**
For Purpose/Currency/Area Unit Popovers:
- Set `side="top"` and `avoidCollisions={false}` (consistent with your dropdown standards)
- Add a scroll container:
  - `max-h-64 overflow-y-auto overscroll-contain`
- Add `onWheelCapture={(e) => e.stopPropagation()}` to prevent the page from scrolling while the dropdown is open.

**4.3 Apply the same up-opening behavior to Beds/Price popovers (main bar)**
- Change their PopoverContent to `side="top"` as well to avoid dropdowns extending down the page on shorter viewports.

**4.4 Make Hero “Filters” match Reelly filters (avoid duplication)**
Most stable approach:
- When user clicks “Filters” on the homepage hero:
  - navigate to `/properties?...` with the current selections
  - include `openFilters=1`
- In `src/pages/PropertiesReelly.tsx`:
  - on mount, if `openFilters=1`, open the Reelly “Advanced Filters” dialog automatically, then remove that param.

This guarantees the homepage uses the exact same Reelly filters UI and logic.

**Verification (Phase 4)**
- On homepage:
  - Search button has rounded left + right
  - Currency dropdown scrolls inside the dropdown (page does not scroll)
  - Popovers open upward
  - Clicking Filters brings you to /properties with the Reelly filters dialog open

---

## Files involved (expected edits)
- Dashboard/mode:
  - `src/components/ModeSwitcher.tsx`
  - `src/pages/MyDashboard.tsx`
  - `src/components/header/MegaMenuInvestorHub.tsx`
  - `src/components/GlobalHeader.tsx`
- Tracking stability:
  - `src/components/GlobalVisitorTracking.tsx`
  - Backend migration for `visitor_sessions` uniqueness (and optional backend function for session exit)
- Listing Admin width:
  - `src/pages/ListingAdmin.tsx`
- Hero search/dropdowns/filters:
  - `src/components/home/HeroSearchBar.tsx`
  - `src/pages/PropertiesReelly.tsx` (auto-open filters via param)

---

## Regression checklist (to prevent “fix 1 thing, break 1 thing”)
1) Account icon:
   - Switch mode (Investor/Broker/Both) → no broken UI, lands on /my-dashboard
2) My Dashboard:
   - Loads with all cards; missing data does not break the page
3) Listing Admin:
   - Max width clamped; no horizontal scroll
4) Homepage Hero:
   - Search button rounded both sides
   - Currency dropdown scroll contained
   - Dropdowns open upward
   - Filters opens Reelly filters experience
5) Ensure Support Ticket submit still works (no regressions from global changes)

