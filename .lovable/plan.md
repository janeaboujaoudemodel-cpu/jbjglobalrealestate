# Root-Level Responsive, Contrast, Route, and Visual-Proof Recovery

## Objective
Repair the platform from shared contracts rather than adding more page-specific overrides. A route is complete only when it is usable and visually approved on phone, iPad, and laptop; generating a screenshot alone is not validation.

## 1. Freeze the evidence and build a canonical route inventory
- Treat the uploaded screenshots and the existing failed audit report as regression evidence.
- Generate one authoritative manifest from the active router, classifying each entry as canonical, dynamic-template, intentional redirect, role-gated, hidden/unreleased, or retired/orphaned.
- Report the exact canonical page count by public, broker, developer, owner/admin, and tool areas.
- Exclude redirects and retired paths from screenshot albums while testing redirects separately for the correct destination.
- Remove navigation references to retired/orphaned pages. Do not delete data or source files without explicit approval; retire unwanted routes safely by removing exposure and routing them to an approved canonical destination.

## 2. Replace the CSS specificity war with one surface contract
- Trace each screenshot defect to its computed winning rule and record the stylesheet, selector, property, and specificity before editing.
- Consolidate the repeated late `PASS` blocks in `index.css`; remove broad descendant rules that repaint arbitrary sections, descendants, controls, or layouts.
- Establish a small semantic contract: champagne/light uses black ink; emerald/dark/black uses white; nested controls declare and own their surface.
- Keep the contract low-specificity and token-based; prohibit new page-specific `!important` patches except documented third-party boundaries.
- Add regression checks preventing broad color/layout selectors and new uncontrolled `!important` growth.

## 3. Rebuild the global header and responsive shell
- Make every header state explicit from the background the header actually paints, not from route transparency alone.
- Champagne header: dark monogram, black wordmark, black 28px hamburger bars, and a 44px tap target.
- Dark/transparent-over-dark header: white monogram, white wordmark, and white hamburger.
- Use one shared horizontal gutter token for header, hero, and content at phone, iPad, and laptop widths.
- Remove hero edge crowding and ensure the hero touches the intended viewport/header boundary without stray bands.
- Fix sticky portal headers so Developer Hub and other shells reserve their own height and content never scrolls underneath them.

## 4. Repair shared mobile composition, not isolated screenshots
- Rebuild the owner/CRM mobile shell into deliberate stacked regions: compact top bar, scrollable or wrapped action groups, stable tabs, and full-width content panels.
- Apply shared responsive primitives to document tools, e-signature, certificate verification, registration forms, creative/video tools, and portal pages so labels never collapse into vertical letters.
- Remove the unapproved brown palette from Upload & Sign/founder surfaces and map them to champagne, emerald, black, and semantic tokens.
- Fix certificate-verification identity spacing so the monogram cannot collide with the title.
- Keep the cookie banner in the consent audit flow, but make it compact and non-destructive on phone; proof captures will validate both consent-open and consent-dismissed states rather than allowing it to hide the page under test.

## 5. Hide unfinished tools and retire unapproved utility pages
- Enforce tool visibility at the route boundary as well as in the AI hub, search, menus, and shortcuts. Hidden or owner-only tools must not remain publicly/directly reachable.
- Default unfinished creative/video/document experiences to hidden until their individual user flows pass responsive and functional QA.
- Remove Sync Conflicts from owner navigation and normal route inventory; retain underlying code/data without deletion until explicit approval determines permanent removal.
- Audit every utility/owner page for provenance and purpose; unknown or obsolete pages are quarantined from navigation rather than silently kept in production.

## 6. Correct confirmed outcomes through shared primitives
- Rental Yield Guide: correct mobile gutters and preserve white-on-dark hero semantics.
- QR Generator: black heading/body copy on champagne and white copy only on genuinely dark controls.
- Listings filters: readable control labels/icons in every active and inactive state.
- Founder settings/cards: white content on emerald cards and black content on champagne cards.
- Developer registration/header, CRM, document designer, upload/sign, video suite, and certificate verification inherit the repaired shared shell and surface primitives.

## 7. Make visual proof a blocking test
- Rewrite the proof runner so a screenshot enters an album only when it lands on the expected non-404 route, hydrates, is nonblank and nonduplicate, and has no overflow, vertical-letter collapse, header overlap, undersized primary tap target, contrast failure, critical request failure, or uncaught console error.
- Control and record cookie state for every capture.
- Capture the complete canonical manifest in separate `phone`, `ipad`, and `laptop` albums.
- Add interaction coverage for navigation/hamburgers, sticky shells, filters, tabs, dialogs, forms, document upload, and representative CRM workflows.
- Produce a machine-readable report and human review index with pass/fail thumbnails, final URL, route category, winning CSS rule, and defect reason.
- Visually inspect every failed or suspicious capture, repair by root-cause cluster, rerun affected routes, then run the complete three-device sweep again.

## Acceptance criteria
- Exact canonical page count and route classification are documented.
- Zero unintended 404, blank, duplicate, or wrong-destination screenshots.
- Zero dark-on-dark or light-on-light foreground violations in admitted proof.
- Zero horizontal overflow, vertical text collapse, sticky-header overlap, or hero gutter failures on all three devices.
- Hidden/unreleased tools cannot be opened through direct URLs, menus, search, or shortcuts by unauthorized users.
- Every canonical page has one approved screenshot in each device album; redirects have a separate destination report.

## Technical notes
- Primary files include route modules, `MainLayout`, `GlobalHeader`, portal/CRM shells, tool visibility gates, semantic UI primitives, `index.css`, and `scripts/contrast/sitewide-sweep.py`.
- Existing data, database objects, and source files will not be deleted as part of this repair.
- Validation uses authenticated role-aware sessions where available and records any route that cannot be exercised under the available role.