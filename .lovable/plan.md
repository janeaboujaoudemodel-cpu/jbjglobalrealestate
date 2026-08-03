# Complete Site Visual Proof Recovery

## Inventory
- Generate one canonical route manifest and classify canonical, dynamic-template, and redirect routes.
- Record the exact page count in the proof report.

## Root visual contracts
- Use explicit semantic surface state for headers, logos, text, icons, and controls.
- Bright surfaces use dark ink; dark emerald/black surfaces use white.
- Remove broad layout-affecting global overrides rather than patching individual pages.

## Responsive layout
- Validate shell geometry and content hydration at laptop, iPad, and phone widths.
- Treat overflow, collapsed content, overlaps, and undersized controls as failures.

## Proof albums
- Capture every canonical route after its lazy route content has hydrated.
- Store screenshots in separate `laptop`, `ipad`, and `phone` folders.
- Produce a machine-readable report with redirects, blank pages, overflow, console errors, and contrast failures.

## Remediation loop
- Rank failures by the winning CSS rule, repair shared root causes, and rerun affected routes.
- Complete only when all canonical routes have a valid screenshot in all three device albums.