## Goal
Fix the desktop layout globally so the website content is visually centered between the fixed left sidebar and the right side of the viewport, with equal left/right breathing room and no empty/off-center content area.

## Plan
1. **Replace the current mirrored main padding approach**
   - Remove the recent `main` right-padding mirror that creates a narrowed/empty-feeling content lane.
   - Treat the fixed sidebar as chrome, not as part of the content centering calculation.
   - Keep only the required left offset for the sidebar width: `48px` collapsed, `200px` expanded.

2. **Create one global desktop content grid contract**
   - Add layout tokens for:
     - sidebar offset
     - usable content viewport
     - centered content max width
     - symmetric page gutters
   - Make `.jj-content-track`, `.jj-project-shell`, `.jj-track`, `.jj-page`, and legacy centered containers align to the same center line.
   - Ensure the right-side Contact rail does not push visual centering off balance; it should be handled as an overlay/safe zone only where needed, not by shifting every content block.

3. **Fix full-bleed sections globally**
   - Update `.jj-band`, `.jj-project-band`, `.jj-project-hero`, and `.jj-fullbleed-band` breakout math so bands still span the intended viewport area without creating horizontal shifts.
   - Preserve all existing page content and sections; no removals.

4. **Audit page-specific wrappers only where they break the global contract**
   - Search for wrappers using `container mx-auto`, `max-w-7xl mx-auto`, `px-*`, and other legacy centering patterns.
   - Add global CSS normalization where possible instead of patching individual pages.
   - Only touch a component/page file if a hardcoded layout class bypasses the global shell and cannot be corrected through the global layout system.

5. **Validate with desktop screenshots and guides**
   - Use Playwright at desktop size with a temporary visual overlay/grid in the browser session only.
   - Capture proof screenshots for representative routes:
     - project detail page currently reported
     - home page
     - properties/listing page
     - area/detail or developers page
   - Measure DOM rectangles for sidebar, main, content track, and viewport center to confirm:
     - content is centered in the usable area
     - left/right spacing is symmetrical
     - no section is horizontally shifted
     - no large empty lane remains

## Files likely to change
- `src/components/MainLayout.tsx`
- `src/index.css`
- Possibly one or two layout primitive files only if needed after audit, such as `src/components/layout/PageShell.tsx`

## Validation output
After implementation I will report the measured alignment values and reference the screenshot proof captured during validation.