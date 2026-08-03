# Complete Site Contrast, Layout, and Visual-Proof Recovery

## Goal

Fix the contrast and layout system at its shared roots, correct the header identity on dark and bright surfaces, and produce complete visual proof for every live page on laptop, iPad, and phone in three separate albums.

## Verified scope and current baseline

- The router currently declares **754 live/reachable route entries** after excluding the shadowed legacy Developer Hub tree.
- Those entries comprise **492 live static rendered pages**, **53 dynamic route templates**, and **209 aliases/redirects**. Redirects are tested for destination correctness but are not photographed as separate pages because they do not render a distinct screen.
- Dynamic templates will receive valid fixtures so each distinct rendered template is photographed; data-driven variants that share the same template will be listed in the manifest rather than falsely counted as separate page designs.
- The previous audit used 687 URLs at desktop and phone only. It produced 1,374 expected entries, but only 889 screenshot references; 487 entries errored, 80 were blank, and many URLs landed on repeated destinations. It did not test iPad and is retained only as failed baseline evidence.
- A live check of `/guides/dubai-rental-yield` confirmed the current failure: the header uses the light logo asset but the company wordmark computes as dark ink on a transparent/dark header. The current desktop capture also shows the site shell while the intended page body is not visibly painted.
- The hamburger is a fixed emerald/black/gold-shadow gradient opted out of surface contrast, so it cannot adapt between dark hero and bright champagne headers.
- Logo and wordmark state is split across inconsistent components and separate booleans. `BrandMonogram` also ignores its image `variant`, allowing a black monogram on dark surfaces.
- Global contrast is enforced through accumulated selector lists and `!important` exceptions rather than one semantic surface contract, leaving new and untagged components vulnerable to black-on-dark or white-on-bright regressions.

## Implementation phases

### 1. Build the canonical page inventory

- Generate the inventory directly from all active route modules rather than maintaining an unrelated handwritten list.
- Classify every route as public, auth/account, owner/backend, CRM, broker, developer, admin, AI/tool, standalone, dynamic template, redirect, or unreachable/shadowed.
- Resolve nested route paths correctly and attach a valid fixture to each dynamic content template.
- Record expected landed URL, shell, authentication requirement, role, and stable ready marker for every canonical page.
- Export a human-readable page-count report and machine-readable manifest before screenshots begin.

### 2. Replace the conflicting global contrast model

- Consolidate the accumulated global override stack into one semantic surface contract:
  - dark, black, image-overlay, and emerald surfaces use white foreground and icons;
  - white, champagne, gold, and other bright surfaces use black/ink foreground and icons;
  - nested surfaces establish their own boundary and do not inherit the parent’s foreground incorrectly.
- Make text, links, placeholders, Lucide icons, SVG strokes/fills, active states, hover states, focus states, selected states, open states, and disabled states consume the same surface foreground.
- Remove superseded broad descendant selectors and selector exception chains that currently repaint unrelated components or blank form backgrounds.
- Preserve multicolor logos, photography, illustrations, charts, and intentionally colored artwork.
- Add regression checks that reject new broad global `!important` contrast/layout overrides and untagged shared dark/bright surfaces.

### 3. Repair the global header identity and hamburger

- Use one canonical header surface state for the logo asset, company wordmark, tagline, navigation controls, and hamburger instead of independent booleans.
- On black/dark/emerald/image hero backgrounds, render the official white monogram and white company wordmark.
- On white/champagne/gold bright headers, render the official dark monogram and black/ink wordmark.
- Correct `BrandMonogram`, `JBJLogo`, and shared logo usage so the requested variant changes both text and image consistently; remove contradictory defaults where needed.
- Replace the muddy fixed-gradient hamburger with a clean, premium three-line mark that follows the header foreground: white on dark, emerald/ink on bright. Keep a stable 44×44 tap target and fixed bar dimensions on phone and iPad.
- Validate transparent, scrolled/solid, menu-open, and route-transition header states.

### 4. Repair shared layout primitives before individual pages

- Correct shared public shell, global vertical navigation, utility bar, mobile/tablet header, owner shell, CRM shell, booking shell, broker shell, developer shell, forms, cards, tabs, dialogs/sheets, cookie banner, and fixed support controls.
- Remove global rules that impose unsafe widths, nowrap, writing mode, grid tracks, positioning, transforms, or background removal on generic descendants.
- Fix each remaining failure at the narrowest shared component or surface boundary; do not add page-specific patches for a repeated global problem.
- Require no horizontal overflow, vertical one-character labels, clipped controls, overlapping fixed UI, blank main content, or duplicate shell chrome.

### 5. Create three separate visual-proof albums

- Produce persistent, clearly separated albums:

```text
JBJ-complete-visual-proof/
├── laptop/
│   ├── public/
│   ├── owner-backend/
│   ├── crm/
│   ├── broker/
│   ├── developer/
│   ├── admin/
│   ├── tools/
│   └── index.html
├── ipad/
│   └── same categories and index
├── phone/
│   └── same categories and index
├── page-inventory.csv
├── manifest.json
└── summary.html
```

- Use fixed viewports: laptop 1440×900, iPad portrait 820×1180, and phone 390×844.
- Capture one uniquely named screenshot for every canonical rendered page on every device after fonts, images, route data, authentication, lazy content, and loaders have settled.
- Keep redirects in the manifest with requested and landed URLs, but do not create duplicate photos of the same destination.
- For long pages, capture deterministic viewport segments or a stitched page proof without hiding failures below the fold; the manifest links all segments to one page entry.
- Create browsable HTML indexes for each device so screenshots are reviewed as albums rather than an undifferentiated bulk folder.

### 6. Enforce honest validation gates

- Fail a capture for blank content, unexpected redirect, login/main-gate substitution, persistent loader, 404/error boundary, console/runtime error, failed critical request, missing landmark, horizontal overflow, duplicate screenshot hash, or wrong role/session.
- Run pixel-aware contrast checks and inspect the winning CSS declaration for every failure.
- Exercise representative interaction states for every shared primitive: header scroll, hamburger/menu open, hover, keyboard focus, tabs, dropdowns, dialogs/sheets, accordions, forms, sidebars, and disabled actions.
- Test the cookie banner and fixed support controls separately on representative public and portal pages, then suppress them only in unobstructed layout captures.
- Do not claim completion while any manifest entry is failed, missing, blank, redirected unexpectedly, duplicated, or not manually reviewed.

## Deliverables

- Exact categorized page inventory with canonical pages, dynamic templates, aliases, redirects, fixtures, auth/role requirements, and final counts.
- Root-level contrast/header/layout repairs with focused regression tests.
- Separate laptop, iPad, and phone screenshot albums, each organized by site area.
- A final summary showing expected versus captured totals per device, failures remaining, duplicate detection, contrast results, overflow results, and manual review status.

## Completion criteria

- Official white monogram and white wordmark on every dark/black/emerald/image header; official dark monogram and ink wordmark on every bright/champagne/gold header.
- Hamburger is clean, visible, correctly colored for its surface, non-shrinking, and usable on phone and iPad.
- No black text/icons on dark or emerald surfaces and no white text/icons on bright, champagne, white, or gold surfaces, including interaction states.
- Every canonical rendered page has valid laptop, iPad, and phone proof in the correct album, with no missing, repeated, blank, gated, or wrongly redirected captures.
- Redirects and unreachable routes are reported honestly and never inflated into the photographed-page count.

## Technical scope

- Frontend only: route inventory tooling, semantic CSS/tokens, shared logo/header/navigation components, responsive shells, shared UI primitives, and visual QA tooling.
- No database, backend business logic, content, or unrelated feature changes.