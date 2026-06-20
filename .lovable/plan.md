# Global Padding & Layout Normalization

## Problem
On the project detail page (and other pages like Market Intelligence, Reports, Guides), content is cropped at the right edge, filter chips overflow horizontally, sections sit too close to the viewport edges, and vertical gaps between sections are inconsistent (sometimes too tight, sometimes huge). The fixed 88px left sidebar + Contact Us rail on the right are eating into content without the page reserving safe horizontal padding.

## Goal
One global page-shell standard for horizontal + vertical rhythm, applied everywhere — no per-page one-offs.

## Changes

### 1. Page shell tokens (`src/index.css`)
Add CSS custom properties so every page reads from one source:
- `--page-px-mobile: 16px`
- `--page-px-tablet: 24px`
- `--page-px-desktop: 32px`
- `--page-max-w: 1440px`
- `--section-gap-y: clamp(32px, 5vw, 64px)` (replaces today's mix of py-6 / py-12 / py-24)
- Right-side safe area for the Contact Us rail: `--rail-safe-right: 56px` (desktop only)

### 2. Shared primitive: `<PageShell>` / `.jj-page`
- Single utility class `.jj-page` = `mx-auto w-full max-w-[var(--page-max-w)] px-[var(--page-px-mobile)] md:px-[var(--page-px-tablet)] lg:px-[var(--page-px-desktop)] lg:pr-[calc(var(--page-px-desktop)+var(--rail-safe-right))]`
- Section wrapper `.jj-section` = vertical padding `py-[var(--section-gap-y)]` (no horizontal padding — that's the page's job)
- Update `.jj-band` to inherit the same inner gutter via an inner `.jj-page` child, so full-bleed bands still align content to the safe area

### 3. Apply to top-level routes
Wrap (or replace existing wrappers on) these page roots with `.jj-page`:
- `src/pages/ProjectDetail.tsx` (current cropping report)
- `src/pages/MarketIntelligence.tsx` + all `src/pages/market-intelligence/*`
- `src/pages/MarketReports.tsx`, `src/pages/Guides.tsx` + all guide subpages
- `src/pages/News.tsx`, `src/pages/FAQ.tsx` + subpages
- `src/pages/AreaGuides.tsx`, `src/pages/InvestorEducation.tsx`, `src/pages/GoldenVisaGuide.tsx`

### 4. Filter bar overflow
On ProjectDetail's sticky filter row (Price / Payments / Handover / Property Type / Bedrooms / Status / Construction…): wrap in a horizontally-scrollable container with `overflow-x-auto` + `scrollbar-none` + edge fade, so chips no longer get clipped under the right rail.

### 5. Section gap normalization
- Delete ad-hoc `py-24`, `py-20`, `py-6`, `mt-16` on section roots inside the pages listed above
- Replace with `.jj-section`
- Adjacent same-tone bands collapse to a single `--section-gap-y` instead of doubling

### 6. Validation (visual, as a user)
After build, navigate with the browser tool to and screenshot:
- `/project/vindera-emaar-properties-the-valley` at 1920, 1366, 992, 414
- `/market-intelligence`, `/market-intelligence/overview`, `/market-intelligence/area-intelligence`, `/market-intelligence/reports` at 1366 + 414
- `/guides`, `/news`, `/faq` at 1366
Check: no horizontal clipping, filter row scrolls cleanly, equal gutters left/right, no content under the Contact Us rail, consistent vertical rhythm between sections.

### 7. Memory
Add `mem://ui-ux/visual-standards/page-shell-and-section-rhythm-standard` documenting the tokens + `.jj-page` / `.jj-section` rule, and reference it in `mem://index.md` Core.

## Out of scope
- No changes to colors, typography, components, or business logic.
- No removal of any section or feature.
