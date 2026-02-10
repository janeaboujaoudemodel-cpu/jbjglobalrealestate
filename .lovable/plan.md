

# Mobile and Tablet Responsiveness Fix Plan

This is a large-scale project with 200+ pages. Rather than attempting to fix everything in one pass (which would be extremely risky and could introduce regressions), this plan targets the **highest-impact public-facing pages** that real visitors use most.

---

## Scope: Priority Pages (Phase 1)

The following pages will be audited and fixed for phone (390px), tablet (768-834px), and small laptop (1024px) layouts:

1. **Homepage** (`/`) -- Hero, 11-card grid, featured listings, services, footer
2. **Properties** (`/properties`) -- Filters, property card grid, sticky header overlap
3. **Project Detail** (`/project/:slug`) -- Hero, tabs, brochure, payment plan, gallery
4. **Areas** (`/areas`) and Area Detail (`/area/:slug`)
5. **Developers** (`/developers`) and Developer Detail
6. **Services** (`/services`) and sub-pages
7. **About** (`/about`), Team, Founder
8. **Contact** (`/contact`)
9. **Digital Card** (`/card`)
10. **Footer** and **CombinedContactNewsletter** (global, all pages)

---

## Issues Identified and Fixes

### 1. Global Layout (MainLayout.tsx)
- Header top-padding values (`pt-24 sm:pt-28 lg:pt-32`) may not account for tablet header heights correctly, causing content to sit under the header on iPad
- Fix: Audit and adjust padding breakpoints to include `md:` (768px) values

### 2. Homepage - 11-Card Entry Point Grid
- `grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11` causes cards to appear cramped on phone with tiny text
- Fix: Use `grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11` for better breathing room on tablet

### 3. Homepage - Featured Listings Cards
- Cards may overflow or have inconsistent heights on narrow screens
- Fix: Ensure card image and content heights scale properly with responsive `min-h` values

### 4. Properties Page - Filter Section
- Sticky filter bar may overlap header or clip dropdowns on iPad
- Filter controls (Select, Popover) already had touch-action fixes applied; ensure dropdowns render above sticky bar with proper z-index
- Fix: Add `md:` breakpoint for filter grid layout (currently jumps from mobile to desktop)

### 5. Properties Page - Property Card Grid
- Verify cards display in 1-col on phone, 2-col on tablet, 3-col on desktop
- Fix any card content overflow or image ratio issues

### 6. Project Detail Page
- Payment plan timeline, unit type tables, and brochure section may overflow on narrow screens
- Fix: Add horizontal scroll wrappers for tables, constrain timeline to viewport width

### 7. Footer (1169 lines)
- Collapsible sections on mobile are already implemented but may have padding/margin issues
- Contact cards grid (`sm:grid-cols-3`) needs verification on small phones
- Fix: Ensure all collapsible sections have proper tap targets (min 44px)

### 8. CombinedContactNewsletter
- Contact card grid uses `grid-cols-1 sm:grid-cols-3` which may look odd on small tablets
- Fix: Add `md:grid-cols-3` breakpoint, keep `sm:grid-cols-1`

### 9. Digital Card Page
- Profile photo and video sections need proper mobile stacking
- Fix: Ensure video player is 100% width on mobile with proper aspect ratio

### 10. Global Text Overflow
- Multiple pages have text that can overflow containers on narrow screens
- Fix: Add `break-words` and `min-w-0` to flex containers where text truncation is needed

---

## Technical Approach

### Files to modify:
- `src/components/MainLayout.tsx` -- Responsive padding adjustments
- `src/pages/Index.tsx` -- Entry card grid breakpoints, hero section mobile text sizing
- `src/components/home/FeaturedListings.tsx` -- Card grid responsiveness
- `src/pages/Properties.tsx` -- Filter layout tablet breakpoints
- `src/pages/PropertiesReelly.tsx` -- Same filter fixes
- `src/components/Footer.tsx` -- Mobile tap targets, spacing
- `src/components/CombinedContactNewsletter.tsx` -- Grid breakpoints
- `src/pages/DigitalCard.tsx` -- Video/photo mobile layout
- `src/components/project-detail/ProjectDetailLayout.tsx` -- Tab content overflow
- `src/components/GlobalHeader.tsx` -- Tablet header height consistency

### Key CSS patterns to apply globally:
- Replace jumps from `sm:` to `lg:` with intermediate `md:` breakpoints
- Add `min-w-0` to all flex children containing text (prevents overflow)
- Ensure all interactive elements have minimum 44px touch targets
- Add `overflow-x-auto` to data tables on mobile
- Use `text-sm` or `text-xs` on mobile for long labels

---

## What This Plan Does NOT Cover (Phase 2, future)

- Internal broker dashboard pages
- Owner Command Center
- AI tool pages (100+ pages)
- Admin/CRM pages
- These are internal tools used on desktop and are lower priority

