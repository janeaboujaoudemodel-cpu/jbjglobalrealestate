# Global Button Contrast Root Repair

## Goal
Eliminate white text/icons on white or light buttons across the entire site and prevent the same defect from returning on future components.

## Confirmed causes
- `src/index.css` still contains multiple older, broad descendant rules that force white foregrounds through nested elements. Examples include the emerald descendant contracts around lines 21866–21867 and 30556–30560. They use `!important`, so the newer boundary-only semantic contract at lines 37097–37145 cannot reliably restore a nested light control.
- The shared `Button` component also writes white foreground inline for primary aliases (`src/components/ui/button.tsx`, lines 133–166). This is safe only when the same component is guaranteed to paint an opaque dark surface; a background override can currently separate the foreground from its intended surface.
- Existing automated proof is incomplete. The sweep caps candidates at 500, checks only elements fully inside the initial viewport, skips dynamic routes, and does not open menus/dialogs or test hover/focus/selected states (`scripts/contrast/sitewide-sweep.py`, lines 45–117 and 168–197).
- The existing smoke report already proves rendered failures, including a white icon on a light surface at `/403` and inherited white text on a champagne section at `/academy`. It also shows that several routes were not validly audited because their layout did not satisfy the current hydration heuristic.

## Implementation
1. **Create one authoritative surface contract**
   - Remove or narrowly scope the legacy global descendant-paint rules that cross surface boundaries.
   - Keep foreground ownership on the element that paints the background.
   - Make nested `light/champagne/pearl` and `emerald/dark/ink` surfaces reset both text and SVG foreground at their own boundary.
   - Preserve only genuinely component-specific exceptions such as FAQ open state and checked controls.

2. **Make shared controls atomic**
   - Update the shared Button variants so every variant declares a matched, opaque background/foreground pair through semantic surface metadata.
   - Remove the inline white foreground workaround and let the variant’s semantic surface own text and icons.
   - Ensure raw icon controls and shared Radix/shadcn controls use the same surface contract rather than `allow-white` inheritance.

3. **Repair confirmed rendered offenders**
   - Recheck each failure found by the global audit and correct any component whose declared surface does not match its actual painted background.
   - Limit component edits to genuine semantic misclassification; do not redesign layouts, spacing, copy, or unrelated colors.

4. **Upgrade the global regression guard**
   - Discover route files recursively and support a curated fixture list for dynamic routes.
   - Audit the whole rendered page in viewport-sized scroll steps instead of only the first screen.
   - Remove the 500-element truncation or process candidates in batches.
   - Capture default, hover, keyboard-focus, active/selected, opened menu, dialog, popover, and mobile navigation states.
   - Measure text plus SVG stroke/fill against actual composited pixels and report the winning foreground and background rules.
   - Replace the layout-specific hydration assumption with route-ready and stable-DOM checks so standalone/auth/error pages are not silently excluded.

5. **Add architecture enforcement**
   - Extend the static contrast check to fail when a global surface selector paints generic descendants, when foreground is forced without an owned background, or when more than one terminal contrast contract exists.
   - Add focused regression coverage for a dark parent containing a light button and a light parent containing an emerald button, including nested icons and hover/focus states.

## Verification
- Run the architecture guard and focused contrast tests.
- Run the rendered sweep across public, authenticated, error, tool, portal, and representative dynamic routes at laptop, tablet, and phone sizes.
- Visually inspect Playwright screenshots for every changed component family and every previously failing route.
- Completion requires zero white-on-light or dark-on-dark button/text/icon findings, no unaudited hydration timeouts, and no unrelated visual changes.