# Site-wide Layout and Contrast Recovery

## Goal

Replace the accumulated CSS override stack with one reliable responsive layout system and one semantic contrast contract, then validate every reachable page with honest screenshot evidence.

## Confirmed failures

- The supplied screenshots show collapsed mobile controls, labels wrapping one character per line, overlapping cookie/WhatsApp UI, dark text and icons on emerald controls, and blank page captures.
- `src/index.css` is 37,202 lines with 11,055 `!important` declarations. It contains hundreds of sequential PASS/final/hard-lock patches that independently override layout, wrapping, backgrounds, text, and icons.
- A global backend rule gives buttons, links, and tabs `min-width: max-content` and `white-space: nowrap`; other global rules repeatedly force widths, wrapping, writing mode, and grid columns. These broad rules can break responsive component layouts.
- Contrast is split across repeated class lists, `data-surface` rules, hardcoded colors, inline styles, and multiple escape attributes. Later declarations can still defeat earlier emerald/champagne rules.
- The current evidence is incomplete: 877 screenshots exist for a 1,374-capture target, 89 are under 20 KB, and the browser session is signed out. Protected-route captures therefore do not prove the real owner/admin layouts.
- The sweep currently treats any body with more than 40 characters as ready, does not fail redirected protected routes, and does not exercise interactive states. It can report success for the wrong or partially painted screen.

## Implementation phases

### 1. Establish a trustworthy baseline

- Preserve the current screenshots/report as failed baseline evidence; do not present them as proof of completion.
- Generate the route inventory reproducibly from the actual route modules, resolve dynamic routes with fixtures, and classify public, owner, admin, broker, and developer routes.
- Record the expected destination and stable ready marker for each route so redirects, blank shells, loaders, and wrong-role pages fail explicitly.

### 2. Remove global layout corruption

- Inventory and remove superseded global rules that impose widths, `min-width: max-content`, nowrap, writing mode, grid tracks, overflow, positioning, or transforms on generic buttons, links, tabs, cards, fields, and backend descendants.
- Restore layout ownership to page shells and shared responsive primitives instead of global descendant selectors.
- Standardize mobile shell behavior: single-column content where required, horizontal labels, bounded controls, no page overflow, and safe spacing for fixed cookie/WhatsApp UI.
- Keep intentional component-specific layout rules only when narrowly scoped and documented.

### 3. Rebuild the contrast contract

- Define one semantic surface boundary for dark/emerald/image-overlay surfaces and one for light/champagne/white surfaces.
- Make text, placeholders, control labels, Lucide icons, SVG strokes, and all interaction states inherit the surface foreground.
- Respect nested surface boundaries so a light card inside an emerald section uses ink, while an emerald CTA inside a light card uses white.
- Remove duplicate PASS/final/nuclear contrast blocks, broad class-name detection, and routine escape attributes rather than adding another override.
- Migrate shared Button, tabs, badges, cards, fields, dropdowns, sidebar rows, icon tiles, cookie banner, and floating controls to the contract; preserve multicolor logos and intentional artwork.

### 4. Repair shared responsive primitives

- Correct the shared headers, sidebars, mobile navigation, portal shells, tab bars, action groups, cards, forms, dialogs/sheets, cookie banner, and floating action controls first.
- Use failures grouped by winning CSS declaration to repair the shared source once, not patch individual screenshots.
- Verify that button labels remain horizontal and readable without forcing controls wider than the mobile viewport.

### 5. Harden validation

- Make the sweep reject blank pages, unexpected redirects, persistent loaders, console/runtime failures, horizontal overflow, missing expected landmarks, and protected routes captured without authentication.
- Capture desktop, tablet, and mobile after fonts, images, auth guards, and route data have settled.
- Add interaction coverage for hover, keyboard focus, selected/active tabs, expanded sidebars and mobile menus, dropdowns, dialogs/sheets, accordions/FAQs, forms, and disabled states.
- Suppress the cookie banner only for unobstructed page-layout evidence, then test it separately on representative public and portal pages for viewport fit and control overlap.

### 6. Full proof and regression lock

- Run the complete inventory with an authenticated managed session for protected pages; signed-out redirects are reported separately and never counted as route validation.
- Re-run every failed route after root-level repairs and manually inspect representative screenshots from every shell and failure cluster.
- Produce a durable manifest containing requested route, landed route, auth state, viewport, readiness marker, screenshot, overflow, contrast failures, winning declarations, and interaction states tested.
- Add CI guards that reject new broad global layout/contrast overrides, hardcoded foreground bypasses in shared components, blank screenshots, and untested protected redirects.

## Completion criteria

- No one-character vertical labels, collapsed grids, incoherent overlaps, clipped controls, or horizontal page overflow at supported viewports.
- Dark and emerald surfaces use white text/icons; bright and champagne surfaces use ink text/icons, including hover, focus, active, open, selected, and disabled states.
- Every inventory route has valid evidence for desktop, tablet, and mobile, or is explicitly marked blocked with the exact reason; protected routes are never certified from login redirects.
- Zero unexplained blank captures and no completion claim until the report, screenshots, and manual visual inspection agree.

## Technical scope

- Primary: `src/index.css`, global theme styles, shared UI primitives, responsive portal/page shells, and fixed overlay components.
- Validation: canonical route inventory, authenticated Playwright sweep, pixel contrast checks, interaction-state tests, overflow/readiness assertions, and screenshot manifest.
- Excluded: business logic, database changes, content changes, and unrelated feature work.