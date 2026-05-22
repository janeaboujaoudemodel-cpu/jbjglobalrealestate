---
name: mode-driven-dashboard-view
description: Mode (investor/broker/developer) is the single source of truth for dashboard view, quick actions and mode-only tiles. Role is permissions only.
type: feature
---

LOCKED RULE — never violate.

- `/dashboard` and every Quick Actions surface render the view from
  `useUserModeContext().mode`. Never branch on `useUserRole()` for view.
- Role tables (`user_role_selections`, `broker_profiles`) are used only for
  permissions / RLS, never to decide which tiles or hubs render.
- On `setMode(newMode)` we mirror the mode into `user_role_selections`
  (investor→investor, broker→broker_partner, developer→no change), and call
  `queryClient.invalidateQueries()` so the page re-skins without reload.
- Owner verified always short-circuits to the owner cockpit.

## Shared vs mode-only matrix (canonical)

Shared (render in all 3 modes):
  Browse Properties, List Your Property, Resale Properties, AI Tools,
  Distribution Services, Insights & Guides, Books, Company & LinkedIn,
  Tools & Workspace.

Mode-only:
  investor  -> Investor Services, Compare Projects, Request Shortlist,
               Speak to Advisor.
  broker    -> Register Deal, Site Check-In, Broker Education, Broker
               Resources, Schedule Visit, Careers.
  developer -> Developer Center, Submit Project, My Projects, Request
               Briefing, Agreements, Careers.

Careers shows in broker + developer modes only (never investor).
Broker Education shows in broker mode only.

## Implementation map
- Router: `src/pages/Dashboard.tsx` (mode switch -> Investor/Broker/Developer).
- Quick Actions: `src/components/dashboard/QuickActions.tsx` (modeOnly + shared).
- Pages: `src/pages/InvestorDashboard.tsx`, `src/pages/BrokerDashboard.tsx`,
  `src/pages/DeveloperDashboard.tsx`.
- Sync: `src/contexts/UserModeContext.tsx` setMode mirrors role + invalidates queries.
