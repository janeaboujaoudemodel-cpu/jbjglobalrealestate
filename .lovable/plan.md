# Site-wide CSS Contract Repair and Full Visual Validation

## Objective

Replace the accumulated contrast overrides with one predictable global system and validate every declared frontend, standalone, portal, owner, CRM, and booking page with technical checks plus screenshot proof.

The only global foreground rules will be:

1. **Emerald/dark surface → white text and icons**
2. **Champagne/light surface → black/ink text and emerald icons where applicable**

Gold remains an accent or border, never a third foreground contract.

## Phase 1 — Build the authoritative audit inventory

- Extract every route from all route modules mounted by `App.tsx`, including standalone, public, AI tools, admin, toolkit, owner, developer, and broker environments.
- Resolve aliases and redirects separately from unique rendered screens so both navigation correctness and every distinct page template are tested.
- Generate representative URLs for dynamic templates such as projects, areas, communities, profiles, booking pages, and document views using real available records.
- Create a section/state manifest for each page: header, navigation, hero, cards, forms, tables, maps, drawers, dialogs, dropdowns, tabs, hover, focus, selected, empty, loading, error, and mobile navigation states where present.

## Phase 2 — Remove the CSS conflict at its source

- Inventory every global selector that writes `color`, `-webkit-text-fill-color`, `fill`, `stroke`, or background using `!important`, broad element lists, utility-class substring matching, or generic descendants.
- Remove the legacy PASS/guard rules that infer foregrounds from incidental class names or repaint entire descendants.
- Consolidate surface behavior into one final semantic contract using explicit surface ownership rather than selectors such as `[class*="..."]`, `body *`, generic `div`, or generic button/tab rules.
- Ensure nested surfaces follow the nearest explicit owner: a champagne control inside an emerald panel remains ink-on-champagne, while an emerald control inside a light page remains white-on-emerald.
- Normalize icon behavior through `currentColor`; remove independent `fill`, `stroke`, and `-webkit-text-fill-color` declarations that can disagree with visible text.
- Replace raw component color exceptions involved in the conflict with existing semantic tokens and component variants.
- Keep page-specific CSS only for layout and intentional component states; it must not compete with the global surface contract.

## Phase 3 — Apply semantic surfaces across every shell and section

- Annotate each true own-surface in shared layouts and reusable components: public shell, owner shell, CRM shell, broker/developer portals, JBJ Bookings, maps, cards, forms, tables, overlays, drawers, dialogs, and menus.
- Repair the annotated JBJ Bookings states specifically:
  - workspace/avatar area remains legible within the emerald sidebar;
  - active navigation is a champagne surface with ink text/icons;
  - inactive and hover navigation uses white foregrounds on emerald;
  - topbar profile and icon buttons follow their actual light/emerald surface.
- Repair map controls and all other nested controls with the same nearest-surface rule rather than page-specific contrast patches.
- Check responsive and authenticated variants so no shell reintroduces global repainting.

## Phase 4 — Expand the E2E visual harness to full coverage

- Replace the current fixed 28-route list with a generated route manifest covering every declared route and every unique dynamic page template.
- Run at minimum desktop, tablet, and mobile viewports; preserve managed owner authentication for backend routes and verify public/auth redirect behavior separately.
- Add deterministic interaction scripts for every available state: open menus, tabs, accordions, dropdowns, dialogs, drawers, forms, booking sections, map modes, pagination, hover, keyboard focus, and selected/active controls.
- Capture named screenshots for every route, viewport, section, and interaction state in one organized proof directory.
- Record final URL, load errors, console errors, failed requests, overflow, overlap, clipped text, blank regions, contrast results, and screenshot path in a machine-readable report.
- Treat load errors, unexpected redirects, skipped pages, missing screenshots, or untested declared routes as failures—not passes.

## Phase 5 — Validate technically and manually

- Run WCAG AA rendered contrast checks after each route is fully loaded and after each interaction checkpoint.
- Add assertions for the two CSS contracts by comparing computed foreground/icon colors against the nearest semantic surface.
- Add static regression tests prohibiting new global descendant repaint rules, utility substring color inference, conflicting `-webkit-text-fill-color`, and unauthorized contrast `!important` declarations.
- Manually inspect every generated screenshot for visual defects automated tools miss: incoherent colors, unreadable icons, active-state inversion, overlap, clipping, bad spacing, broken imagery, and inconsistent nested surfaces.
- Re-run failed pages after each repair, then run the complete matrix from a clean browser context.

## Completion gate

The work is complete only when all of the following are true:

- every declared route is accounted for as rendered, redirected, or intentionally inaccessible;
- every unique page template and listed interaction state has screenshot proof on required viewports;
- frontend and authenticated backend shells have zero unexplained WCAG contrast failures;
- there are no load errors, unexpected redirects, console errors caused by the changed code, or missing proof artifacts;
- the global stylesheet contains one semantic two-surface foreground system, with no later rule able to override it globally;
- a final report lists every tested route/state and links it to its screenshots and result.

## Technical implementation notes

- Use semantic design tokens for ink, white, emerald, champagne, border, focus, and muted roles.
- Use explicit surface attributes/classes only on elements that paint their own background.
- Use component variants for interactive controls; do not solve component states with global tag selectors.
- Preserve application behavior and data; this work changes CSS architecture, semantic presentation markers, and test coverage only.