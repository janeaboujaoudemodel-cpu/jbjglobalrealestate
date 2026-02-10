
# JBJ GLOBAL REAL ESTATE -- Full Task Audit and Redo Protocol

## Protocol Acceptance

I accept this Zero-Excuses Protocol in full. I will not mark any task as "completed" without providing verifiable proof. Any task I cannot verify will be marked as "Partial" or "BLOCKED" with exact reasoning.

## Access and Constraints

- I have full read/write access to the codebase, database, edge functions, and browser testing tools
- I can take screenshots on desktop and mobile viewports via the browser tool
- I can read console logs and network requests for debugging
- BLOCKED items: I cannot access external services (Google Lighthouse, Google Search Console, third-party analytics dashboards). For those I will provide what I can and note what you must verify externally.

## Batch 1 Delivery Timeframe

Batch 1 will be delivered in this working session (immediately upon approval). Each task will include before/after screenshots and verification steps.

---

## A) MASTER TASK REGISTER

### Batch 1 -- Critical Blockers

| Task ID | Source | Category | Requirement | Current Status | Verification Steps |
|---------|--------|----------|-------------|----------------|-------------------|
| JBJ-001 | "Website speed / slow loading (10-15s)" | Performance | Fix root causes: heavy sections, render-blocking video, image optimization, lazy loading, script bloat | Partial | Memory confirms lazy loading + caching headers are implemented. Video defers after 2s. Bundle splits into 5 chunks. Remaining: audit actual load waterfall, check for render-blocking resources, verify LCP < 2.5s |
| JBJ-002 | "Homepage hero search bar not working" | Bugs | Hero search bar must execute search and navigate to /properties with correct filters | Partial | HeroSearchBar.tsx has full search logic with navigate(). Need to verify end-to-end: type query, click search, confirm /properties loads with params |
| JBJ-003 | "Header search icon dropdown too small + must show shortcut suggestions" | UI | Desktop search icon hover dropdown must show shortcuts, services, quick links, and be properly sized | Partial | GlobalHeader line 1506 renders GlobalSearchModal in a 500px container embedded mode. MegaMenuSearch exists but is NOT used (comment says "removed"). Need to verify if the current embedded search panel has proper shortcuts and sizing |
| JBJ-004 | "Videos not loading on phone/laptop in multiple places" | Bugs | All videos across the site must load and play on mobile and desktop | Partial | Hero video uses deferred loading with fallback image. /card video uses preload=none. Need to test actual playback on mobile viewport |
| JBJ-005 | "jbj.ae/card not showing reliably" | Bugs | /card route must always render the digital business card page | Partial | DigitalCard.tsx exists with full implementation (817 lines). Route likely configured in App.tsx. Need to verify it renders on both desktop and mobile |
| JBJ-006 | "Account icon mode selector bug - closes automatically" | Bugs | Investor/Broker mode selector must be clickable and not auto-close when selecting | Partial | ModeSwitcher.tsx uses DropdownMenu with modal=false, event.stopPropagation() on multiple handlers. ModeSelectionModal uses Dialog. Need to test actual click behavior |

### Batch 2 -- Major UI Issues

| Task ID | Source | Category | Requirement | Current Status |
|---------|--------|----------|-------------|----------------|
| JBJ-007 | "Developer logos -- gold border, full-fit, no white border" (repeated ~6 times) | UI | ALL developer logos across all pages must have gold borders, object-contain, no white/zinc borders | Partial -- recently fixed in ProjectCard, ReellyProjectCard, DeveloperSearchModal, AreaDevelopersBar, PropertiesReelly, PropertySearchBar |
| JBJ-008 | "Developer marquee strip broken logos / missing names / not scrolling" | UI | Homepage developer marquee must scroll smoothly with all logos visible | Partial -- recently rebuilt with CSS animation, image load tracking, error fallbacks. Verified working on desktop + mobile |
| JBJ-009 | "Long descriptions -- proper formatting and layout" | UI | Project, area, developer descriptions must have expand/collapse with markdown formatting | Partial -- recently implemented in ProjectDetailLayout, AreaAboutSection, DeveloperDetail, DeveloperInfoCard |
| JBJ-010 | "Premium black/gold/champagne standard -- no white backgrounds or white-on-white text" | UI | All UI must follow premium contrast standard with champagne-gold gradients | Partial -- mega menu cards, borders, and backgrounds updated. Need full-site audit |
| JBJ-011 | "Developer Detail page -- logo object-fill to object-contain" | UI | DeveloperDetail.tsx logo must use object-contain p-2 with gold border | Completed -- fixed in recent session (line 160 changed to object-contain p-2) |
| JBJ-012 | "Header locked to 7 items: Buy, Sell, Rent, Projects, Areas, Developers, Insights" | UI | Desktop nav pill must show exactly these 7 items | Completed -- GlobalHeader lines 1281-1383 show exactly these 7 buttons |

### Batch 3 -- SEO / Content / Structure

| Task ID | Source | Category | Requirement | Current Status |
|---------|--------|----------|-------------|----------------|
| JBJ-013 | "SEO page-specific Title/Meta/H1" | SEO | Every public page must have proper SEO meta tags via SEOHead component | Partial -- SEOHead component exists, pagesSEO config exists. Need to audit coverage |
| JBJ-014 | "robots.txt and sitemap" | SEO | robots.txt must block admin/internal routes, sitemap must be accessible | Completed -- robots.txt is comprehensive with honeypot traps. Sitemap reference at jbj.ae/sitemap.xml |
| JBJ-015 | "/card noindex, nofollow" | SEO | Digital card page must not be indexed by search engines | Completed -- DigitalCard.tsx sets noindex meta tags + _headers has X-Robots-Tag + robots.txt Disallows /card |
| JBJ-016 | "Content-Security-Policy headers" | Security | CSP headers must be properly configured | Completed -- _headers file has comprehensive CSP |

### Batch 4 -- Integrations

| Task ID | Source | Category | Requirement | Current Status |
|---------|--------|----------|-------------|----------------|
| JBJ-017 | "Reelly API integration for projects" | Integrations | Projects data from Reelly must render correctly with proper field mapping | Partial -- projects table exists, formatReellyDescription utility exists, data mapping rules documented in memory |
| JBJ-018 | "Video processing hybrid engine" | Integrations | Client-side FFmpeg for <100MB, edge functions for heavy processing | Partial -- architecture documented, ffmpegService.ts exists |

### Batch 5 -- Polish and QA

| Task ID | Source | Category | Requirement | Current Status |
|---------|--------|----------|-------------|----------------|
| JBJ-019 | "Mode selection -- first-time users prompted" | UI | ModeSelectionModal must appear for first-time users with guidance toast | Partial -- component exists with popup coordinator integration |
| JBJ-020 | "Navigation reliability -- Back/Up/Down always clickable" | UI | PageNavigation.tsx must be absolutely clickable with z-[11000] | Partial -- component exists per memory |
| JBJ-021 | "Mobile hamburger menu must not show logo monogram" | UI | No logo monogram overlap in mobile menu | Completed -- SheetContent header shows text only ("JBJ Global Real Estate"), no monogram |
| JBJ-022 | "CombinedContactNewsletter rendered centrally in MainLayout" | UI | Contact + Newsletter section must appear on all public pages via MainLayout | Completed -- MainLayout.tsx renders CombinedContactNewsletter for non-back-office routes |
| JBJ-023 | "Performance: LCP < 2.5s, CLS < 0.1, INP < 200ms" | Performance | Core Web Vitals targets | Needs verification -- BLOCKED on external Lighthouse. Can verify load behavior via browser tool |
| JBJ-024 | "Lazy loading for 200+ page components" | Performance | All pages use React.lazy with Suspense and PageLoader | Partial -- App.tsx confirmed to use this pattern per memory |
| JBJ-025 | "Asset caching -- immutable for static assets" | Performance | _headers file must set long-term cache for /assets/* | Completed -- _headers has max-age=31536000, immutable for /assets/* |

---

## B) BATCH EXECUTION PLAN

### Batch 1 (6 tasks -- Critical Blockers) -- IMMEDIATE
JBJ-001, JBJ-002, JBJ-003, JBJ-004, JBJ-005, JBJ-006

For each task:
1. Open browser at relevant page
2. Take "before" screenshot
3. Identify root cause via console logs / network requests / code review
4. Implement fix
5. Take "after" screenshot on desktop + mobile
6. Document file changes

### Batch 2 (6 tasks -- Major UI) -- After Batch 1
JBJ-007, JBJ-008, JBJ-009, JBJ-010, JBJ-011, JBJ-012

Most of these were recently addressed. I will verify each with screenshots and mark as Completed with proof or identify remaining gaps.

### Batch 3 (4 tasks -- SEO/Content) -- After Batch 2
JBJ-013, JBJ-014, JBJ-015, JBJ-016

### Batch 4 (2 tasks -- Integrations) -- After Batch 3
JBJ-017, JBJ-018

### Batch 5 (7 tasks -- Polish/QA) -- After Batch 4
JBJ-019 through JBJ-025

---

## C) PROOF PACK COMMITMENT

For every task marked "Completed" I will provide:
- Before screenshot (if applicable -- for already-existing features, current state screenshot)
- After screenshot on desktop (1920x1080)
- After screenshot on mobile (390x844)
- Live URL where visible
- File names edited with change description
- Steps to reproduce / verify

For performance tasks (JBJ-001, JBJ-023):
- Browser load timing via network requests
- Console error check
- BLOCKED: External Lighthouse report requires you to run at https://pagespeed.web.dev -- I will provide the URL

For tasks I cannot fully verify:
- Status: "BLOCKED" with exact reason and what I need from you

---

## Working Session Plan

1. **Batch 1** -- Starting immediately upon approval. Estimated: 1-2 hours for all 6 critical blockers including proof screenshots.
2. **Batch 2-5** -- Sequential after Batch 1. Each batch includes a status report with completed/remaining task IDs and proof pack links.

All proof will be delivered inline with each batch completion message.
