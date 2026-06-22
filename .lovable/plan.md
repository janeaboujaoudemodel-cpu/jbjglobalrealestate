## PASS XX — Complete remaining implementation

### Pending requirements extracted

1. **One locked Emerald system everywhere**
   - Finish replacing badges, labels, status pills, notification badges, active tabs, active sidebar items, CTA buttons, AI badges, online dots, “Starter”, “Workspace”, “Live Roles”, “21 Open”, “Apply”, and “Meet Jessica” with the official Emerald gradient primitives.
   - Add a regression guard so raw random green / dark green / faded green / browser default styles cannot reappear.

2. **Remove the faded / disabled look**
   - Remove unintended `opacity-50/60/70`, `text-muted-foreground/60`, low-alpha card text, and faded empty-state styling from enabled UI.
   - Keep opacity only on true disabled states.
   - First targets: Pending Tasks popup, task cards, statistics, empty states, placeholder cards, backend cards.

3. **Rebuild News page to JBJ identity**
   - Remove `data-neon-page`, neon hero, ticker, blue/purple/cyan/fuchsia styling, and unnecessary labels like “DXB Interact” / “Daily Refresh”.
   - Rebuild `/news` and `/news/:id` using Champagne surfaces, Emerald active states, gold hairlines, premium cards, reliable image fallbacks, and real-estate-only editorial structure.
   - Keep only useful filters.

4. **Tighten News content pipeline**
   - Update the existing backend news collector to accept only Dubai/UAE real-estate topics: DLD, RERA, developers, launches, off-plan, investment, mortgages, visas, market reports, luxury, commercial, and economic updates affecting property.
   - Block unrelated articles such as traffic fines, general lifestyle, transport, generic government updates, unrelated business news.
   - Remove / block forbidden competitor sources already disallowed by project policy.
   - Add content validation before insert and before display so old unrelated articles do not surface.

5. **Fix broken cards and missing media states**
   - Replace blank thumbnails with a premium JBJ fallback tile.
   - Prevent empty titles/excerpts from rendering as broken cards.
   - Remove loading screenshots from final proof; loading states stay polished but final screenshots must be settled.

6. **Hero stability**
   - Ensure critical hero sections never disappear into blank/loading-only layouts.
   - Add stable fallback hero content for News and key portal dashboards.

7. **404 / dead-link audit**
   - Walk links from sitemap, sidebars, menus, and portal navigation.
   - Any linked route must either resolve to a real page or be removed/redirected.
   - Fix routes that currently point to placeholders or wrong portal surfaces where a real page exists.

8. **Fullscreen behavior**
   - Remove persisted / automatic fullscreen behavior.
   - Owner/backend sidebars must remain visible by default.
   - Keep fullscreen as an explicit icon-only action only; no page should auto-hide vertical navigation.

9. **Portal wiring parity**
   - Owner Panel, Broker Portal, Developer Portal, and Investor Portal must each open their own pages correctly.
   - Fix pages that only work in broker mode but are linked from Owner.
   - Add a proper vertical Developer Portal shell; current developer portal uses a horizontal top nav and violates the sidebar requirement.
   - Investor routes need a portal-style shell or canonical route set before screenshot verification.

10. **Navigation/header active-state sync**
   - Fix mismatches where sidebar item says one section but the rendered page header says another.
   - Derive page titles from the same route registry used by the sidebar where possible.

11. **Backend card restyle**
   - Restyle shared backend card primitives and empty states: No Database, No Activity, statistics, icons, Starter labels, Workspace badges, activity cards.
   - Make backend cards inherit the same Premium JBJ Champagne + Emerald system automatically.

12. **Global visual verification**
   - Validate desktop and mobile.
   - Walk every sidebar route across all 4 portals.
   - Screenshot only after pages are functional, wired, settled, and visually compliant.

---

## Implementation plan

### Phase 1 — Lock shared UI primitives

- Update shared primitives:
  - `src/components/ui/button.tsx`
  - `src/components/ui/badge.tsx`
  - `src/components/ui/tabs.tsx`
  - `src/components/ui/card.tsx`
  - `src/components/ui/premium-backend-layout.tsx`
  - `src/components/ui/emerald/*`
  - `src/index.css`
- Make active tabs and primary CTAs use the official Emerald gradient with white foreground.
- Make secondary CTAs Champagne with Emerald foreground.
- Make badges default to Emerald solid/soft/outline variants instead of black/template styling.
- Add CSS-level normalization for common backend status chips and card labels so pages inherit the system automatically.
- Remove broad faded text/card styling except for `[disabled]`, `[aria-disabled="true"]`, and explicit disabled classes.

### Phase 2 — News visual + content rebuild

- Rebuild `src/pages/News.tsx`:
  - remove neon wrapper and ticker;
  - remove blue/purple category palettes;
  - use a Champagne page shell, Emerald active filters, gold hairline borders, premium cards, and JBJ fallback image tiles;
  - hide irrelevant/untrusted articles at render time;
  - keep only real-estate filters.
- Rebuild `src/pages/NewsDetail.tsx`:
  - remove stock image fallbacks and dark/neon article shell;
  - use same Champagne/Emerald editorial style as News;
  - use safe fallback hero tile when image is missing/broken.
- Update existing backend news functions:
  - `supabase/functions/ai-news-collector/index.ts`
  - `supabase/functions/news-extract-from-link/index.ts` if needed for manual imports
  - `supabase/functions/import-provident-blog/index.ts`
- Add strict topic scoring/keyword allowlist and unrelated-topic blocklist before insert/update.
- Ensure old unrelated DB rows are filtered from the UI even before the next collection run.

### Phase 3 — Portal shells, fullscreen, and navigation wiring

- Owner:
  - `src/pages/OwnerDashboardShell.tsx`
  - `src/components/owner-dashboard/OwnerSidebarNav.tsx`
  - remove persisted auto-fullscreen from Owner shell;
  - keep sidebar visible by default;
  - align CRM query-based active states with page header/section.
- Broker:
  - `src/components/broker-portal/BrokerPortalLayout.tsx`
  - `src/components/broker-portal/BrokerPortalSidebar.tsx`
  - fix sidebar links that point outside the broker portal or cause mode/route mismatch.
- Developer:
  - `src/pages/developers-portal/PortalShell.tsx`
  - convert horizontal developer nav into a vertical sidebar shell with the same L-frame pattern.
  - replace placeholder-only pages with either real routed surfaces or remove/redirect their nav entries.
- Investor:
  - build or normalize canonical investor portal routes and shell around existing investor pages (`/investor-hub`, `/investor-dashboard`, reports/portfolio routes).
  - remove dark purple/fuchsia investor hub styling and align with JBJ Champagne/Emerald.
- Tool fullscreen:
  - `src/components/tools/FullscreenToolToggle.tsx`
  - `src/index.css`
  - ensure fullscreen only activates after user click and never persists/auto-starts.

### Phase 4 — Dead-link and 404 cleanup

- Create a route/navigation audit script that extracts links from:
  - owner sidebar
  - broker sidebar
  - developer portal nav
  - investor portal nav
  - sitemap/menu route registries
- For every linked path:
  - if the page exists: keep and verify;
  - if moved: redirect to canonical route;
  - if unfinished placeholder: remove from nav until real;
  - if portal-specific: route inside that portal, not another portal.

### Phase 5 — Backend card and empty-state sweep

- Restyle shared cards/empty states through primitives first, then targeted fixes only where needed.
- Replace template-looking labels/cards such as “No Database”, “No Activity”, “Starter”, “Workspace”, “Live Roles”, and count pills with Emerald/Champagne components.
- Use `IconTile` for icons per project standard.
- Remove raw blue/purple/gray/black template accents from backend dashboards.

### Phase 6 — Visual validation and screenshot proof

- Use Playwright against the live preview with restored auth session.
- Viewport set to `1280x1800` for desktop and a mobile viewport pass.
- Walk every sidebar route across:
  - Owner Panel
  - Broker Portal
  - Developer Portal
  - Investor Portal
- For every route:
  - wait for loading to settle;
  - assert no visible 404;
  - assert sidebar remains visible unless the user explicitly clicked fullscreen;
  - assert active sidebar item matches visible page section;
  - assert no raw random green/blue/purple/neon classes on visible core UI;
  - take screenshot to `/tmp/browser/pass-xx/...`.
- Report only final verified screenshots and a route-by-route pass/fail summary.

---

## Technical notes

- This will be implemented as a system pass, not isolated page patches.
- Backend changes will use the existing Lovable Cloud functions and database connection.
- No public emails/contact details will be exposed in screenshots or UI.
- No existing features will be removed unless they are dead links/placeholders explicitly causing broken navigation; moved functionality will be redirected to canonical routes.