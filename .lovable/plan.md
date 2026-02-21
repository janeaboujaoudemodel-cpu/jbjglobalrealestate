

# Comprehensive Fix Plan -- Owner Command Center UI, Project Detail Gallery, Amenities, Floor Plans & Data Preservation

This plan addresses all reported issues in a single coordinated pass.

---

## 1. Owner Sidebar: Fix Scroll Position on Navigation

**Problem**: Clicking a nav item (e.g., "Research Users") causes the sidebar to scroll to the top, losing the user's position.

**Fix** (`src/components/owner-dashboard/OwnerSidebarNav.tsx`):
- After navigation, use a `useEffect` + `useRef` to scroll the active nav item into view (`scrollIntoView({ block: 'nearest' })`)
- Add `ref` to each nav button and on location change, find the active item and scroll it into view without disturbing the page

---

## 2. Owner Command Center: Full UI Audit & Layout Fixes

**Problem**: Content overflows cards, boxes look vertically compressed, text breaks out of containers across all owner sections.

**Files to fix**:

| Page/Component | Issue | Fix |
|---|---|---|
| `OwnerDashboardOverview.tsx` | Cards may overflow, KPI cards misaligned | Ensure all cards use `overflow-hidden`, text uses `truncate`/`break-words`, grid uses responsive `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
| `CRMLeadDetail.tsx` | Already fixed to 3-column, but verify no overflow | Add `overflow-hidden` and `min-w-0` to all grid children |
| `QuickActionsGrid.tsx` | Buttons may overflow their containers | Add `overflow-hidden truncate` to labels, ensure consistent card heights |
| `DepartmentShortcuts.tsx` | Cards may stack vertically | Ensure horizontal grid layout with `min-w-0` on children |
| `IntegrationWidgets.tsx` | Content may break out | Add `overflow-hidden` constraints |
| All `/owner/*` pages | Various overflow/layout issues | Add global overflow guards: `min-w-0 overflow-hidden` on all card content areas |

**Approach**: Create a reusable card wrapper pattern with `overflow-hidden min-w-0` and apply it consistently across all owner sub-pages. Each page will be reviewed and fixed for:
- Text truncation on long content
- Grid responsiveness (no vertical stacking on desktop)
- Card height consistency
- Button/action containment within cards

---

## 3. Page Refresh Redirect Fix (Global)

**Problem**: Refreshing the page redirects to the homepage instead of staying on the current page.

**Root cause**: The `RouteResume` component in `src/components/RouteResume.tsx` uses `sessionStorage` to persist routes, but it only restores if `location.pathname === "/"`. The issue is likely that on hard refresh, the browser correctly loads the URL but some auth guard or redirect kicks the user to `/`.

**Fix** (`src/components/RouteResume.tsx` + auth guards):
- Audit all auth-protected route guards to ensure they wait for auth session to settle before redirecting (the `authSettledRef` pattern from the memory)
- Ensure `RouteResume` correctly saves and restores deep links including `/owner/*` paths
- Verify that the Owner shell's auth check doesn't prematurely redirect during hydration

---

## 4. Project Detail: Gallery Lightbox Landscape Fix

**Problem**: Expanded/fullscreen gallery images open in vertical orientation with background content visible and moving.

**Fix** (`src/components/ImageCarousel.tsx`):
- Change fullscreen `DialogContent` to use `aspect-[16/9]` container with `object-contain` (not `object-cover`) so landscape images display correctly
- Add `backdrop-blur-xl bg-black/90` overlay to prevent background content from showing through
- Remove `object-cover` from fullscreen image (line 218) and replace with `object-contain` to preserve aspect ratio
- Add `DialogOverlay` with blur effect

---

## 5. Amenities: Fix Alignment & Broken Photos

**Problem**: Amenity cards are misaligned (some higher than others), and some show broken/fake photos.

**Fix** (`src/components/project-detail/AmenitiesWithPhotos.tsx`):
- Force all cards to have a fixed height image container (`h-24`) regardless of whether photo exists -- use a fallback icon-only card with the same height
- Replace the current variable-height layout (photo cards have `h-24` image + text, non-photo cards have `pt-4 pb-2` icon + text) with a uniform card height
- All cards will use the same structure: fixed-height top area (either photo or icon placeholder at same height) + fixed-height label area
- The existing Unsplash photo mapping is curated and accurate (pool, gym, spa, etc.) -- these are generic representative photos, not "fake" photos. They will remain as fallbacks.

---

## 6. Floor Plans, Videos & Documents: Data Extraction & Preservation

**Problem**: Floor plans are all empty arrays (`[]`), videos are all null, documents only have brochures. The Reelly API key will be deactivated soon.

**Current state** (from database analysis):
- 1,838 published projects with Reelly IDs
- 1,838 have detail_fetched_at (details were fetched)
- 0 have video_url populated
- 0 have non-empty floor_plan_types
- 13,118 images stored in project_images
- 669 documents (all brochures)

**Root cause**: The `extractFloorPlans` function works correctly, but the Reelly API may not return floor plan data for most projects (the `floor_plans` array in the API response is likely empty). Similarly, `extractVideos` looks for `video_reviews` which may not be populated.

**Fix**:
- Create a new edge function `reelly-emergency-full-extract` that:
  1. Fetches ALL fields from Reelly API for each project (including `typical_units`, `floor_plans`, `video_reviews`, `documents`, `brochures`, `marketing_brochure`)
  2. Saves raw API response JSON to a new `reelly_raw_data` JSONB column on projects table for permanent preservation
  3. Mirrors all floor plan images/PDFs to local storage
  4. Mirrors all video URLs
  5. Mirrors all documents (brochures, payment plans, fact sheets)
  6. Processes in batches with progress tracking
- Add a `reelly_raw_data` JSONB column to the `projects` table to store the complete API response
- Also add `video_urls` JSONB column if not present
- Run this extraction before the API key is deactivated

---

## 7. Project Detail: Show Floor Plans & Payment Plans Premium UI

**Problem**: Floor plans and payment plans are not displaying even when data exists.

**Fix** (`src/components/project-detail/ProjectDetailLayout.tsx`):
- The floor plans section already renders when `floorPlanDocs.length > 0 || floor_plan_types?.length > 0` -- once data is populated via the extraction (step 6), these will appear
- For payment plans: Verify `PaymentPlanVisualization` renders with the existing `payment_breakdown` and `payment_plan` data
- Add a "Request Floor Plans" CTA when no floor plans are available, with the existing email/WhatsApp contact methods

---

## 8. Project Detail: Loading Speed

**Problem**: Project pages take too long to load.

**Fix** (`src/pages/ProjectDetail.tsx`):
- The `useProject` hook fetches from local DB which should be fast
- The `useReellyProjectBySlug` is only used as fallback when DB project is missing
- Add `staleTime: 10 * 60 * 1000` to the project query for aggressive caching
- Ensure images use `loading="lazy"` for below-fold content

---

## Technical Summary

| File | Changes |
|---|---|
| `src/components/owner-dashboard/OwnerSidebarNav.tsx` | Auto-scroll active nav item into view on route change |
| `src/pages/OwnerDashboardOverview.tsx` | Overflow guards, card layout fixes, responsive grids |
| `src/components/owner-dashboard/QuickActionsGrid.tsx` | Text truncation, overflow containment |
| `src/components/owner-dashboard/DepartmentShortcuts.tsx` | Horizontal layout enforcement |
| `src/components/owner-dashboard/IntegrationWidgets.tsx` | Overflow containment |
| `src/pages/CRMLeadDetail.tsx` | min-w-0 overflow guards on grid children |
| `src/components/RouteResume.tsx` | Improved route persistence for owner paths |
| `src/components/ImageCarousel.tsx` | Landscape fullscreen with blur backdrop, object-contain |
| `src/components/project-detail/AmenitiesWithPhotos.tsx` | Uniform card heights, aligned layout |
| `supabase/functions/reelly-emergency-full-extract/index.ts` | NEW -- Full API data extraction and local storage preservation |
| `src/pages/ProjectDetail.tsx` | Aggressive query caching for faster loads |
| Database migration | Add `reelly_raw_data` JSONB column to projects table |

