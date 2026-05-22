## Goal

When the user switches Mode (Investor / Broker / Developer), the **entire dashboard view** — header, quick actions, hubs, education, careers — re-skins instantly. No more "switched to investor but still seeing Broker Education". Shared modules stay shared; mode-only modules appear only in the right mode. Lock this as a permanent project rule.

## Root cause (what's broken today)

- `src/pages/Dashboard.tsx` routes by **role** (`useUserRole` → `user_role_selections`).
- The header Mode picker writes to **mode** (`UserModeContext` → `user_preferences.selected_mode`).
- These two stores never sync, so switching mode doesn't change the dashboard. `QuickActions` reads `role` (with a small `isDeveloperMode` override) → Broker Education still shows after switching to Investor.

## Fix — Mode is the single source of truth

### 1. Unified Mode → View contract (LOCKED rule)

```text
Mode = { investor | broker | developer }   ← chosen in header / picker / role card
View = everything visible on /dashboard and inside dashboard tiles
Rule: View is derived from Mode. Role is only used for permissions (RLS, owner, etc.).
```

Save to `mem://features/dashboard/mode-driven-view-standard.md` and add a one-liner to `mem://index.md` Core:
> Dashboard view (header, quick actions, hubs, education, careers, sidebar tiles) is derived from `useUserModeContext().mode`, never from role. Shared tiles render in all modes; mode-only tiles render in their mode only.

### 2. Shared vs mode-only matrix

| Tile / Module | Investor | Broker | Developer |
|---|:--:|:--:|:--:|
| Browse Properties | ✓ | ✓ | ✓ |
| List Your Property | ✓ | ✓ | ✓ |
| AI Tools | ✓ | ✓ | ✓ |
| Distribution Services | ✓ | ✓ | ✓ |
| Insights & Guides | ✓ | ✓ | ✓ |
| Books | ✓ | ✓ | ✓ |
| Company & LinkedIn | ✓ | ✓ | ✓ |
| Tools & Workspace | ✓ | ✓ | ✓ |
| Resale Properties | ✓ | ✓ | ✓ |
| **Careers** | — | ✓ | ✓ |
| **Broker Education** | — | ✓ | — |
| **Investor Services / Portfolio / Market Reports** | ✓ | — | — |
| **Developer Hub / Submit Project / Agreements** | — | — | ✓ |

### 3. Dashboard router (`src/pages/Dashboard.tsx`)

- Replace role switch with **mode** switch.
- Unauthenticated → `VisitorDashboard` (unchanged).
- Authenticated:
  - `mode === 'investor'` → render new `InvestorDashboard` (premium tier, see §4).
  - `mode === 'broker'`   → render `BrokerDashboard`.
  - `mode === 'developer'` → render `DeveloperDashboard` (new shell wrapping `DeveloperPortal` overview tiles).
  - Owner verified always wins (Owner cockpit unchanged).

### 4. Premium Investor Dashboard

Rebuild `src/pages/InvestorDashboard.tsx` to match the institutional tone the user asked for:
- Champagne header card (full-width, edge-to-edge — same pattern as the recently fixed Broker header) with display name, initials (JB-style), verified badge, mode chip.
- KPI strip: Watchlist • Shortlist • Viewings booked • Reports unlocked.
- "Your Investment Pipeline" (saved searches → matched listings).
- Shared tiles grid (Browse, AI Tools, Distribution, Insights, Books, Company/LinkedIn, Tools, Resale, List Property).
- Premium picks rail (curated by advisor).
- No Broker Education, no Careers, no broker register-deal tiles.

### 5. Broker Dashboard

Keep current premium header. Quick Actions = broker-only (Register Deal, Site Check-In, Broker Education, Resources, Schedule Visit) + the shared 9-tile grid + Careers tile.

### 6. Developer Dashboard

New thin wrapper that reuses `DeveloperPortal` overview but in dashboard chrome:
- Submit Project, My Projects, Briefing, Events, Agreements (mode-only)
- Shared tiles grid
- Careers tile

### 7. QuickActions rewrite (`src/components/dashboard/QuickActions.tsx`)

- Drop `getActionsForRole(...)`. New `getActionsForMode(mode)` returning `{ modeOnly: [], shared: [] }`.
- Render two grouped sections: "For [Mode]" then "Tools available to everyone".
- Owner verified still short-circuits to `ownerActions`.

### 8. Sync Mode ↔ supporting state

In `UserModeContext.setMode`:
- Already writes `user_preferences.selected_mode` + calls `register-mode-lead`.
- Additionally call `register-role-pick` with `source: 'mode_picker'` (already wired) so CRM lead + `signup_source_events` stay accurate.
- Mirror mode → `user_role_selections.selected_role` so legacy role-gated screens (broker resources, investor services) keep working — `investor`→`investor`, `broker`→`broker_partner` (unless already `broker_jbj`), `developer`→leave role untouched (developer is mode-only, no role table change).
- Invalidate `useUserRole` + react-query caches so the page re-skins instantly without reload.

### 9. Vertical sidebar tiles

`GlobalVerticalNav` already groups Dashboard / Profile / Settings. Filter the Dashboard group's tile list by mode using the same matrix in §2 (e.g. `Broker Education` only shown when `mode === 'broker'`, `Careers` hidden in investor mode).

### 10. Edge functions

- `register-mode-lead`: extend payload to also accept `role_mirror` and upsert `user_role_selections` server-side (avoids client race).
- `register-role-pick`: no change, already canonical for source tracking.
- Re-test both with `supabase--curl_edge_functions` for each of the 3 modes.

### 11. End-to-end smoke

Manual matrix to verify after build:
1. Switch mode investor → broker → developer from header chip → dashboard re-skins, no reload.
2. Switch from "I am a Buyer/Broker/Visitor" homepage card → same.
3. Switch from forced picker → same.
4. Investor mode shows no Broker Education / no Careers; Broker mode shows both; Developer mode shows Careers + Developer tiles only.
5. `signup_source_events` and `user_preferences` rows in DB match each switch.
6. Refresh page in each mode → view persists (mode is read from DB).

### 12. SEO + sitemap pass

- Update `<SEOHead>` title + description for `/investor-dashboard`, `/broker-dashboard`, `/developer-dashboard` (new), and `/dashboard` (mode-aware fallback).
- Add the 3 dashboard URLs to `scripts/generate-sitemap.ts` entries.
- Trigger `seo--trigger_scan` after deploy and address any new findings.

## Files touched

- `src/pages/Dashboard.tsx` (mode router)
- `src/pages/InvestorDashboard.tsx` (premium rebuild)
- `src/pages/BrokerDashboard.tsx` (mode-filter Quick Actions)
- New `src/pages/DeveloperDashboard.tsx`
- `src/components/dashboard/QuickActions.tsx` (mode-driven)
- `src/contexts/UserModeContext.tsx` (mirror to role, cache invalidation)
- `src/components/navigation/GlobalVerticalNav.tsx` (mode-filter tiles)
- `supabase/functions/register-mode-lead/index.ts` (optional role mirror)
- `scripts/generate-sitemap.ts`
- `mem://features/dashboard/mode-driven-view-standard.md` + `mem://index.md`

## Out of scope (won't touch)

- Owner cockpit, CRM, listing admin, RLS policies, auth.
- Existing role table semantics (kept for permissions only).
