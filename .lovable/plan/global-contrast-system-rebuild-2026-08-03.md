# Global Contrast System Rebuild

## Goal

Replace the accumulated contrast overrides with one platform-wide rule:

- Dark, emerald, ink, and image-overlay surfaces use pure white text and matching white icons.
- White, champagne, pearl, cream, gold, and other bright surfaces use ink-black text and matching ink-black icons.
- The rule applies to current pages, authenticated portals, interactive states, and future components through shared primitives and semantic surface tokens.

## Confirmed current state

- `src/index.css` is 37,180 lines and contains 11,055 `!important` declarations.
- It contains many competing “final”, “nuclear”, “terminal”, and numbered contrast passes; several repaint whole descendant trees and later rules override earlier rules.
- Surface semantics are already partially present (`data-surface` appears 730 times), but 982 contrast-guard bypasses and many component/inline color exceptions weaken the contract.
- Additional competing contrast locks exist in `crmShell.css` and `theme-tokens.css`.
- The existing visual sweep has an inventory of 687 routes and can restore an authenticated session, but it currently tests only the initial rendered viewport; it does not systematically exercise hover, focus, expanded menus, tabs, dialogs, dropdowns, accordions, or scrolled content.

## Implementation phases

### 1. Establish one semantic surface contract

- Define canonical foreground tokens for dark and light surface families.
- Make text, Lucide icons, SVG strokes, form labels, placeholders, and control glyphs inherit the surface foreground by default.
- Preserve intentional media/logo colors and filled SVG artwork without globally recoloring images, canvases, or every SVG path.
- Encode hover, focus, active, selected, checked, disabled, and open states in the same contract so interaction cannot flip contrast.

### 2. Remove the conflicting cascade at its source

- Delete superseded global contrast passes from `index.css` rather than appending another override.
- Remove broad selectors that repaint arbitrary descendants such as `div`, `*`, every SVG path, or every Tailwind green class.
- Consolidate duplicate emerald, bright-surface, sidebar, form, dropdown, FAQ, and button contrast blocks into the canonical contract.
- Reduce or remove `!important` where semantic inheritance and controlled cascade order are sufficient.
- Reconcile `crmShell.css` and `theme-tokens.css` so they style layout and component appearance without redefining the global foreground contract.

### 3. Standardize shared primitives for future pages

- Make shared Button, card/surface, sidebar item, badge, tab, dropdown, form-control, and icon-tile primitives declare the correct semantic surface automatically.
- Replace contrast bypasses used as routine styling with explicit surface semantics; retain narrowly documented exceptions only for genuine media/artwork cases.
- Remove inline foreground locks that contradict their parent surface.
- Add development/test guards that reject new broad contrast overrides and flag dark/light components without valid surface semantics.

### 4. Rendered audit and root-cause repair

- Generate the route inventory from the actual route modules, including public, account, broker, developer, owner, CRM, bookings, admin, and standalone shells; provide valid fixtures for dynamic routes.
- Run pixel-based contrast checks on desktop and mobile against the real rendered background, including gradients and overlays.
- Rank failures by the winning CSS declaration and repair the shared rule or primitive responsible—not the individual page.
- Cover scrolling and interactive states: hover, keyboard focus, active/selected/checked, expanded navigation, dropdowns, popovers, dialogs, tabs, accordions, and disabled controls.

### 5. Regression proof

- Add focused tests for white-on-dark and ink-on-light inheritance across text, icons, fields, and nested controls.
- Add tests ensuring later stylesheets cannot override the semantic foreground contract and prohibiting new “final/nuclear” global override blocks.
- Re-run the full 687-route inventory at desktop and mobile sizes after fixes, then re-run all failing interaction/state cases.
- Produce batch screenshot evidence for public frontend, account/portal flows, and owner/backend shells, plus a machine-readable report listing tested routes, redirects, blanks, errors, overflow, contrast failures, and winning declarations.

## Completion criteria

- No dark-on-dark or white-on-light failures remain in the validated route and interaction inventory, apart from reviewed non-text artwork that is explicitly excluded.
- Icons inherit the same foreground as adjacent text on every semantic surface.
- No later stylesheet defeats the contract.
- New components using shared primitives or `data-surface` receive correct contrast without page-specific CSS.
- Completion is reported only after screenshot inspection and the rendered audit both pass.

## Technical scope

- Primary: `src/index.css`, semantic design tokens, and shared UI primitives.
- Secondary: conflicting global rules in `crmShell.css` and `theme-tokens.css`, plus proven inline/bypass conflicts found by the rendered audit.
- Validation: the existing Playwright pixel sweep, expanded route discovery, interaction-state coverage, desktop/mobile screenshots, and targeted regression tests.
- No business logic, database, content, or unrelated layout changes.