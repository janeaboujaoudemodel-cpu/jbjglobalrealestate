# Sitewide CSS Conflict and E2E Visual Audit

## Objective
Remove the root CSS conflicts that repaint cards, text, icons, controls, and form backgrounds across the public website and authenticated backend, then prove the result with automated contrast checks and screenshots across every canonical screen and meaningful UI state.

## Confirmed current state
- The project contains **765 concrete route patterns** across nine route groups, including public, standalone, portal, admin, toolkit, developer, CRM, bookings, and owner screens.
- The current rendered contrast sweep checks only **11 public routes** and explicitly excludes authenticated owner/backend routes (`scripts/contrast/check-rendered.mjs:23-38`).
- `src/index.css` is **37,177 lines** with **11,074 `!important` declarations** and **2,163 `html body #root` selectors**.
- Broad rules still repaint generic cards and descendants. For example, the Insights contract targets `.card`, `article`, and rounded bordered `div` elements and forces descendant text colors (`src/index.css:26950-26966`).
- Additional broad surface rules force descendant colors inside light/champagne surfaces (`src/index.css:19692-19713`). These selector families can override component-owned emerald surfaces unless every nested component carries an exception.
- The uploaded backend screenshots show the visible failure pattern: dark/low-contrast sidebar labels and faint controls in JBJ Bookings, plus inconsistent icon/control contrast in the owner CRM.

## Phase 1 — Build the complete audit inventory
- Generate a canonical route manifest from all route groups, separating:
  - public marketing, property, project, guide, FAQ, service, legal, and account screens;
  - standalone booking, digital card, auth, signing, and survey screens;
  - broker, developer, client, and other role portals;
  - owner shell, JBJ CRM, JBJ Bookings, documents, admin, developer management, creative tools, and analytics;
  - redirect/alias routes and parameterized routes.
- Resolve parameterized routes using valid test records and test redirects separately from canonical destinations.
- Record routes that require unavailable external tokens or empty-data prerequisites as explicit blocked cases rather than silently passing them.

## Phase 2 — Replace the conflicting global CSS architecture
- Trace the browser’s winning rule for every discovered contrast failure, including selector, source line, specificity, inherited color, and active pseudo/state.
- Remove generic descendant repainting based on `.card`, `article`, rounded `div`, broad `span/div`, or class-substring matching.
- Replace exception-heavy global guards with explicit semantic surface contracts:
  - light/champagne surface → ink foreground;
  - emerald/dark surface → white foreground;
  - form field → field background and field foreground;
  - component states own hover, focus, selected, disabled, open, and active colors.
- Keep contracts local to the owning shell/component and use semantic tokens instead of adding another global `!important` override layer.
- Preserve the locked emerald, champagne, gold, and typography standards.

## Phase 3 — Automated E2E visual and contrast coverage
- Expand Playwright coverage from the current 11-route public list to the generated canonical route manifest.
- Restore the authenticated session before owner/backend navigation and verify role-gated shells without redirecting to the wrong portal.
- Test desktop and mobile for every canonical route family; add tablet checks for dense backend shells.
- On every loaded screen:
  - capture a viewport screenshot;
  - run rendered WCAG AA contrast analysis;
  - detect white-on-light, black-on-emerald/dark, transparent field backgrounds, invisible icons, clipped text, overlap, horizontal overflow, blank screens, and unexpected redirects;
  - fail on console errors, uncaught exceptions, failed application requests, or route load errors relevant to the screen.
- Store an indexed artifact report linking each route/state to its screenshot and failures.

## Phase 4 — Interaction-state flow testing
- Exercise every visible navigation item in the public header/footer and each backend sidebar, confirming destination, shell continuity, selected state, and readable labels.
- Exercise representative controls per screen: cards, accordions, tabs, dropdowns, search, filters, forms, dialogs, drawers, pagination, hover/focus, selected/open states, disabled states, and empty/data states.
- Cover the screenshot-specific flows:
  - owner CRM dashboard cards and icon controls;
  - JBJ Bookings sidebar, profile switcher, appointment tabs, search, empty state, and new-appointment flow;
  - FAQ closed/open/hover states;
  - public forms and field backgrounds;
  - portal cards, side panels, and branded email surfaces.
- Re-run affected flows immediately after each CSS correction so fixes are proven against the actual winning rule.

## Phase 5 — Regression gates and final evidence
- Add route-manifest coverage checks so newly added canonical routes cannot be omitted silently.
- Keep focused component regression tests, but do not use them as a substitute for browser validation.
- Run the complete contrast, accessibility, and E2E suites after fixes.
- Deliver a final audit summary with:
  - routes and interaction states tested;
  - desktop/mobile/tablet screenshot counts;
  - failures fixed with original winning selectors;
  - blocked cases and exact reason;
  - zero unresolved contrast failures before completion is claimed.

## Technical implementation notes
- Use Playwright with authenticated localStorage/cookie session restoration for protected routes.
- Use axe `color-contrast` plus computed-style checks because axe alone can miss icons, pseudo-elements, gradients, transparency, and transient interaction states.
- Group aliases and redirects by canonical destination while still asserting every alias resolves correctly; do not take duplicate screenshots of identical redirect destinations.
- Avoid database or backend mutations during this visual audit. Form workflows will stop before destructive submission unless a safe test-only path already exists.

## Completion criteria
- Every canonical reachable screen has screenshot evidence at the required viewport(s).
- Every sidebar/header/footer destination and meaningful component state has an E2E assertion.
- No unexplained route load, console, network, overflow, blank-screen, or WCAG contrast failures remain.
- No broad global selector can override component-owned surface foreground/background states.