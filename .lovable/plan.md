# Restructure "My Shortcuts" in the vertical sidebar

Single source of truth: `src/config/shortcutsConfig.ts` (consumed by `GlobalVerticalNav`, `GlobalHeader`, `GlobalSearchModal` — so this change is automatically global across desktop, tablet, and mobile).

## New group structure

Replace the current 10 groups with these (in order):

### 1. Quick Access — everyone (authenticated)
- My Tasks → `/my-dashboard#tasks`
- Notifications (merged with Alerts) → `/my-dashboard#notifications`
- Inbox → `/owner/inbox` for owner, otherwise `/my-dashboard#inbox`
- My Calendar → `/ai-calendar`
- Books → `/education-hub`
- Favorites → `/favorites`
- Shortlisted → `/favorites?tab=shortlist`
- Saved Filters → `/favorites?tab=saved-filters`
- Compare → `/compare`
- Activity Log → `/my-dashboard#activity`
- AI Home Finder → `/quiz`

Removes the duplicate "Quick Access" group entirely (no more Properties / Mortgage Calculator / Search duplicates — those stay in the main mega-menu / header).

### 2. CRM — owner + broker only
- CRM Dashboard → `/crm`

(Remove Leads Inbox, CRM Tasks, CRM Calendar, CRM Notes, CRM Reminders, Agency Activity, Employees, Customer Happiness — all already exist inside the CRM page.)

### 3. My Dashboard — single entry, role-aware
One item labeled **My Dashboard** that routes by mode:
- owner → `/owner`
- broker → `/broker-dashboard`
- investor → `/investor-dashboard`
- developer → `/developer-portal`
- default → `/my-dashboard`

(Replaces the entire "Dashboards" group with its 4 items.)

### 4. Owner Command Center — owner only
Kept as-is (it is the owner's admin hub, not in scope of the cleanup).

### 5. Settings — everyone (authenticated)
- Settings → `/profile?tab=settings`

(Replaces the "Account" group. My Profile, Favorites, Shortlist, Compare, Support Tickets are reachable from inside Settings / already in Quick Access.)

## Removed entirely
- "My Tasks" group label (renamed/merged into Quick Access)
- Old public "Quick Access" duplicate group
- "AI & Tools" group (all 15 items)
- "Dashboards" group (replaced by single My Dashboard)
- "Listings" group
- "Productivity" group
- "Creative & Marketing" group
- "Account" group (replaced by Settings-only)

## Technical changes

**File: `src/config/shortcutsConfig.ts`**
- Rewrite `SHORTCUT_GROUPS` to the 5 groups above.
- Add a small helper `getDashboardHref(mode)` exported alongside, OR resolve the dashboard href inline inside `filterShortcutGroups` by accepting a `mode` opt and rewriting the My Dashboard item's `href`.
- Extend `filterShortcutGroups` signature with `mode?: 'owner'|'broker'|'investor'|'developer'|null` so the My Dashboard item href is rewritten per role. Also rewrite the Inbox item href for owner.

**File: `src/components/navigation/GlobalVerticalNav.tsx`**
- Pass `mode` into the existing `filterShortcutGroups(...)` call (mode is already available via `useUserModeContext`). No UI/markup changes needed — the accordion renders whatever `SHORTCUT_GROUPS` contains, so the result is automatically responsive on mobile, tablet, and desktop.

**Files: `src/components/navigation/GlobalHeader.tsx` and `src/components/search/GlobalSearchModal.tsx` (if they call `filterShortcutGroups`)**
- Pass the same `mode` arg through so all three surfaces stay in sync.

No other files, no schema, no backend. This is purely the shortcuts config + the call sites that consume it.

## Out of scope
- Mega-menu items (Buy/Sell/Rent/Developers/etc.) — untouched
- Owner Command Center contents — untouched
- Sidebar collapse / gold styling — already handled in previous turn
