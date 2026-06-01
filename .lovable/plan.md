# Consolidate Team, Academy & Broker pages

## 1. Team page — fully hidden, owner toggle only

- **Sidebar**: remove the `Team` entry from `GlobalVerticalNav.tsx` (line 214) and from the mega-menu group (line 392). Team never appears in the public sidebar/menus regardless of the toggle.
- **Routes**: delete `/team` and `/meet-the-team` routes from `src/routes/PublicRoutes.tsx` (lines 336–337) and the `MeetTheTeam` lazy import. Any visit to `/team`, `/meet-the-team`, `/brokers→/team` etc. falls through to `NotFound`.
- **In-page toggle bar**: remove `TeamVisibilityBar` usage from `MeetTheTeam.tsx` (the on-page toggle the user complained about).
- **Owner backend toggle**: keep `TeamPageVisibilityToggle` in `OwnerFounderSettings.tsx` and `TeamPageVisibilityContext` intact. When the owner flips it ON, the route and sidebar entry are re-mounted (gated by `useTeamVisibility()` — sidebar item and `<Route path="/team">` only render when `visible === true`). Default = hidden.
- **Clean references**:
  - `public/sitemap.xml` — drop `/team` entry.
  - `scripts/generate-sitemap.ts` — drop `/team` entry (line 58).
  - `public/llms.txt` — drop the Team line (line 26).
  - `About.tsx` "Our Team" CTA — relabel to "Contact Us" pointing at `/contact` (no broken link).
  - `SEOBreadcrumbs`, `MegaMenuMore`, `MegaMenuSearch`, `GlobalSearchModal`, `command-palette`, `Footer`, `Sitemap.tsx`, `OwnerAuditPage` — strip `/team` link entries.

## 2. Merge Academy Graduates into JBJ Academy

- Add a new **"Graduates"** tab/section inside `src/pages/JBJAcademy.tsx` that renders the directory + certificate-lookup UI lifted from `AcademyGraduates.tsx` (same Supabase query on `hr_certificates`).
- Delete `src/pages/AcademyGraduates.tsx`.
- `PublicRoutes.tsx`: remove `AcademyGraduates` lazy import + `/academy/graduates` route (lines 179, 416). No redirect — fully gone.
- `GlobalVerticalNav.tsx`: remove "Academy Graduates" from sidebar (line 202) and from mega-menu (line 452).
- Sitemap / llms / SEO breadcrumbs / global search index: drop `/academy/graduates`.

## 3. Merge Broker Resources into JBJ Academy; remove Broker Learning

- Add a **"Resources"** tab inside `JBJAcademy.tsx` rendering the content from `BrokerResources.tsx` (resource cards, downloadable materials).
- Delete `src/pages/BrokerResources.tsx` and `src/pages/BrokerEducation.tsx`.
- `PublicRoutes.tsx`: remove
  - `/broker-resources` route (line 404) + import (line 169)
  - `/broker-education` redirect (line 265) + `BrokerEducation` import (line 50)
  - `/broker/training` redirect (line 405)
- `BrokerPortalRoutes.tsx`: remove the `academy` Navigate (line 94) — no more `/broker/learning` references emitted by the portal.
- `GlobalVerticalNav.tsx`: remove "Broker Learning" (lines 159, 198, 363, 372, 450) and "Broker Resources" (lines 197, 454). Keep "JBJ Academy" as the single entry.
- Sitemap / llms / breadcrumbs / search index / Footer / MegaMenu* / `useBrokerEducation` callers: strip every `broker-learning`, `broker-resources`, `broker-education`, `broker/training`, `broker/learning` URL/word so nothing redirects there.
- `BrokerPartnerDashboard`, `BrokerHub`, `BrokerDashboard`, `QuickActions`, `MegaMenuBrokerHub`: any "Broker Learning" / "Broker Resources" links retargeted to `/jbj-academy` (or the new tab anchor `/jbj-academy?tab=resources`).

## 4. AI Broker Workspace — Portal only

- `GlobalVerticalNav.tsx`: remove "AI Broker Workspace" from the BROKER & ACADEMY section (lines 203, 455).
- `PublicRoutes.tsx`: remove the public `/ai-broker-workspace` route + lazy import (lines 173, 408). The workspace remains mounted inside `BrokerPortalRoutes.tsx` at `/broker/portal/ai` (line 86) — that's the single entry point.
- Ensure Broker Portal landing (`BrokerPortal.tsx`) surfaces an "AI Workspace" tile/link to `/broker/portal/ai` so it's discoverable.
- Strip `/ai-broker-workspace` from sitemap, llms.txt, SEO breadcrumbs, search index, mega-menus.

## 5. Validation (E2E, visual + technical)

After build:
1. Hit `/team`, `/meet-the-team`, `/academy/graduates`, `/broker-resources`, `/broker-education`, `/broker/training`, `/broker/learning`, `/ai-broker-workspace` → all must render `NotFound` (no redirect, no flash).
2. Open vertical sidebar → BROKER & ACADEMY contains only **Broker Portal** + **JBJ Academy** (+ any unrelated existing items). COMPANY section has no **Team** entry.
3. Owner flips Team toggle ON in `OwnerFounderSettings` → `/team` becomes reachable and sidebar entry re-appears; flip OFF → both disappear again.
4. `/jbj-academy` shows three tabs/sections: **Courses (existing)**, **Resources (from BrokerResources)**, **Graduates (from AcademyGraduates)** — all functional, certificate lookup works.
5. `/broker/portal/ai` loads the AI Broker Workspace inside the portal shell.
6. `rg -n "broker-learning|broker-resources|broker-education|/team\b|academy/graduates|ai-broker-workspace"` returns zero hits outside of the owner toggle context and historical redirects.
7. `public/sitemap.xml` and `public/llms.txt` contain none of the removed URLs.

## Technical notes

- Files deleted: `MeetTheTeam.tsx`*, `AcademyGraduates.tsx`, `BrokerResources.tsx`, `BrokerEducation.tsx`, `TeamVisibilityBar.tsx` usage (component file retained only if reused — otherwise deleted), `useBrokerEducation.ts` if no other consumers.  
  *`MeetTheTeam.tsx` stays in repo because owner-toggle re-enables it; only routes/sidebar are gated.
- `TeamPageVisibilityContext` + `useTeamVisibility` stay. Sidebar item and route both consume `useTeamVisibility()`.
- New JBJ Academy structure: top-level `<Tabs>` with `courses | resources | graduates`, deep-linkable via `?tab=`.
- No DB migrations needed — `hr_certificates` and broker-resource data already exist.
- Update `scripts/contrast/no-blue-allowlist.json` and `scripts/a11y/allowlist.json` to drop stale paths so CI stays green.
