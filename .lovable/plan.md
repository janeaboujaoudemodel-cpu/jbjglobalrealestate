# Full-Site CSS Conflict Sweep + End-to-End Screenshot Proof

## Objective
Find and remove any remaining global CSS conflicts (not add more overrides), then walk every reachable frontend and backend screen with Playwright, capture screenshot proof, and report failures with the exact winning CSS rule.

## Confirmed current state
- `src/index.css` is 37,176 lines with 11,033 `!important` declarations and 2,166 `html body #root` selectors — the main conflict surface.
- Two other stylesheets add overrides: `src/styles/theme-tokens.css` (262 `!important`) and `src/styles/dev-before-overlay.css` (62 `!important`).
- Route definitions total 798 `path=` entries across nine route files (public 233, owner 253, admin 98, toolkit 45, broker 44, AI tools 29, developers portal 29, standalone 23, developer hub 11).
- The existing rendered-contrast sweep (`scripts/contrast/check-rendered.mjs`) covers only a hand-picked public route list, so backend/owner screens are effectively unverified.
- A managed authenticated session is available in this environment, so owner/admin/CRM/bookings screens can be visited for real.

## Phase 1 — Conflict inventory from the rendered cascade
- Build a route manifest programmatically from the nine route files, split into: public, standalone, tools, portals (broker/developer/client), owner shell, CRM, bookings, admin.
- Visit each canonical route at desktop and mobile, and for every visible text/icon/control element record the computed foreground, effective blended background, WCAG ratio, and the winning declaration (selector + stylesheet + line) via `CSSStyleSheet` inspection.
- Group failures by winning selector, not by page, so one fix clears a whole family.

## Phase 2 — Fix at the root
For each winning-selector family, apply one of:
- Delete the rule when it is a stale legacy guard superseded by the terminal surface contract.
- Scope it to the component/shell that owns it (`data-surface`, shell attribute) instead of generic `div`, `span`, `.card`, `article`, `[role]`.
- Convert it to the semantic token contract (`--jbj-surface-foreground`) so emerald/dark surfaces resolve white and champagne/light surfaces resolve ink, without new `!important` layers.
Locked standards preserved: emerald ombre brand, champagne ink, gold CTA, Cormorant Garamond headings, no-blue policy.

## Phase 3 — End-to-end flow tests with screenshot proof
Per route, at desktop (1440x900) and mobile (390x844):
- Screenshot the viewport, plus element screenshots for flagged controls.
- Assert: no console errors, no failed app requests, no blank shell, no horizontal overflow, no unexpected redirect.
- Exercise interaction states that hide contrast bugs: card hover, FAQ open, tabs, dropdowns/selects, dialogs and right-side sheets, search fields, form fields, pagination, empty states, disabled states.
- Backend flows specifically: owner shell sidebar destinations, JBJ CRM (Relationships Hub, branded emails panel, activity), JBJ Bookings (sidebar, profile switcher, appointment tabs, new appointment), documents, admin, developer management.
- Public flows specifically: home, properties/resale grids, project detail (`/project/agua` payment plan, callback form, handpicked strip), developer profile, areas/communities, map, tools, guides, `/card`, legal.
- Read-only: no destructive submits, no database mutations.

## Phase 4 — Report and regression gate
- Write an indexed artifact report (route → viewport → screenshot → failures → winning selector) under `/mnt/documents/`.
- Extend `scripts/contrast/check-rendered.mjs` to the generated manifest including authenticated routes, so new screens cannot silently skip coverage.
- Re-run the full sweep after fixes; state explicitly any route blocked by missing data or external tokens rather than passing it silently.

## Completion criteria
- Zero unresolved contrast/legibility failures across the captured routes and states.
- No broad global selector able to repaint a component-owned surface.
- Screenshot evidence for every canonical frontend and backend screen at both viewports.

## Technical notes
- Playwright (Python) with managed Supabase session restore for protected routes.
- Combine axe `color-contrast` with computed-style checks (axe misses icons, pseudo-elements, gradients, transparency, transient states).
- Given ~800 route patterns, run canonical representatives per route family first, then expand into parameterized instances with real records; this keeps the sweep tractable while still covering every distinct shell/surface contract.
