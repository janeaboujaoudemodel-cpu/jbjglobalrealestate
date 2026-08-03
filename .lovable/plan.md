# Root contrast and route-integrity repair

## Scope lock

- Change only global contrast infrastructure, route/link integrity, and the validation tooling required to prove those fixes.
- Do not delete pages, routes, or files in this pass.
- Produce a duplicate-page/route decision list for approval before any later deletion or consolidation.
- Preserve all content, business logic, spacing, and features outside confirmed contrast or routing defects.

## Confirmed current-state findings

- The terminal surface rule in `src/index.css` forces `color` and `-webkit-text-fill-color` with `!important` across every descendant of a declared surface. A nested light box can therefore inherit white from a dark parent unless it declares its own surface boundary.
- Additional broad, high-specificity contrast passes exist earlier in the same 37k-line stylesheet, so source order and `!important` still create competing “winning” rules.
- The current sweep discovers only absolute static paths. It misses nested relative routes and dynamic routes, stops at 500 visible candidates, examines only the initial viewport, and treats intentional canonical redirects as failures.
- The router contains 742 route declarations and a catch-all Not Found route. It also contains confirmed overlapping declarations, including `/contract-forms` with two different destinations and the `/developer-hub-admin*` legacy redirects declared in two route groups.
- Several retired URLs are intentionally allowed to fall through to the 404 page even though nearby canonical destinations may exist. These need route-by-route reconciliation rather than blanket deletion.

## Phase 1 — Build the authoritative route ledger

- Parse every route group with its parent path so relative child routes resolve to complete URLs.
- Inventory every internal `Link`, `NavLink`, navigation configuration, redirect, canonical URL, sitemap entry, and hard-coded internal href.
- Classify each discovered URL as:
  1. canonical rendered page,
  2. intentional alias/redirect,
  3. dynamic route requiring a representative real identifier,
  4. protected route,
  5. stale internal link,
  6. genuine unknown/404.
- Resolve each stale or 404 URL to an already-existing canonical page when the destination is unambiguous; use a redirect rather than creating a duplicate page.
- Remove conflicting duplicate route declarations only when they are duplicate wiring for the same destination. Do not delete any page component.
- Keep genuine unknown URLs on the branded 404 page.

## Phase 2 — Report duplicates for owner decision

- Generate a concise report separating:
  - duplicate route declarations,
  - multiple aliases that intentionally lead to one canonical page,
  - separate page components with overlapping purpose/content,
  - stale page files no active route imports.
- Include the canonical candidate, current inbound links, and risk of consolidation for each item.
- Do not remove or merge any duplicate page/component until the owner gives a specific instruction.

## Phase 3 — Replace the contrast specificity war at the root

- Trace reported violations to their actual winning selectors and group them by root rule rather than patching individual pages.
- Refactor the terminal semantic surface contract so the nearest declared surface owns foreground color and nested light surfaces reliably reset to ink, including text, placeholders, icons, and SVG strokes.
- Narrow or retire only the broad legacy selectors that conflict with that contract; retain deliberately scoped component/state rules such as open FAQ rows and branded campaign controls.
- Cover semantic light surfaces, native fields, cards, dialogs, popovers, menus, sheets, tables, disabled states, hover/focus states, and portal overlays without repainting backgrounds or changing layout.
- Add static regression checks for dangerous broad descendant selectors and white text inside known light surfaces.

## Phase 4 — Complete rendered validation

- Upgrade the route runner to use the authoritative ledger, distinguish expected redirects from broken redirects, restore the authenticated session for protected pages, and use representative real records for dynamic routes.
- Audit laptop, iPad, and phone for every canonical page and separately verify every alias/redirect and every internal link target.
- Scroll each page through all viewport-height sections, opening representative menus, dialogs, tabs, accordions, forms, and hover/focus states so hidden white-on-white states are included.
- Remove the 500-element ceiling or process candidates in batches; check text fill, placeholder color, SVG/icon strokes, overflow, blank renders, runtime errors, unexpected auth redirects, and Not Found markers.
- Capture screenshots for every audited page/device segment. Failed captures remain quarantined and are never presented as proof.
- Review every screenshot set before completion. Re-run the affected route cluster after each root fix, then run the full ledger again.

## Acceptance criteria

- No internal navigation target renders the Not Found component unless it is intentionally documented as an unknown URL.
- Every intentional alias lands on its declared canonical page without loops or conflicting route matches.
- Zero detected white-on-light, dark-on-dark, low-ratio, blank-page, horizontal-overflow, or unexpected-redirect failures across the complete canonical ledger on all three viewports.
- Light/white/champagne/gold boxes render ink text and icons; emerald/dark boxes render white text and icons, including nested surfaces and interaction states.
- The duplicate report is delivered for owner instruction, with no unapproved page or file deletion.

## Technical files likely involved

- Global surface and cascade rules in `src/index.css` and any conflicting component stylesheets.
- Route groups under `src/routes/`, navigation/link configuration, sitemap/canonical sources, and redirect helpers.
- `scripts/contrast/sitewide-sweep.py` plus focused route-integrity and contrast regression tests.