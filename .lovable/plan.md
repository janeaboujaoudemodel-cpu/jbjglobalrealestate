
# Fix Routing, Card Links, Card Alignment, and 404 Page

## Issues Found

### Issue 1: Handpicked Cards Link to Wrong Route (CRITICAL)
`FeaturedListings.tsx` links to `/projects/${project.slug}` but the actual route is `/project/:slug` (no 's'). Every click on a Handpicked property goes to the 404 page. Same bug exists in `FeaturedProjectAd.tsx` and `ReellyImportPanel.tsx`.

The "View All Projects" button also links to `/projects` which doesn't exist -- should be `/properties`.

### Issue 2: Smart Popup Strategy Checks Wrong Path
`useSmartPopupStrategy.ts` checks `location.pathname.startsWith("/projects/")` which will never match since the real route is `/project/`.

### Issue 3: 404 Page Has Double Top Padding
The NotFound page is rendered inside MainLayout which adds `pt-24 sm:pt-28 lg:pt-32` for non-hero pages. But NotFound also adds its own `pt-32 lg:pt-40`. Result: massive top gap. Fix: add `.jj-hero-fullscreen` class to NotFound so MainLayout treats it as a hero page (no spacing), since NotFound handles its own padding.

### Issue 4: Card Alignment in Handpicked Grid
Cards have `min-h-[140px]` on the content area and `flex-grow` spacer, but the actual card container needs explicit `h-full` on the wrapping `motion.div` to ensure all cards in the same row are equal height.

---

## Changes

### File 1: `src/components/home/FeaturedListings.tsx`
- Line 150: Change `/projects/${project.slug}` to `/project/${project.slug}`
- Line 301: Change `/projects` to `/properties`
- Line 143: Add `h-full` to the motion.div wrapper so grid children stretch equally

### File 2: `src/components/FeaturedProjectAd.tsx`
- Line 35: Change `/projects/${projectSlug}` to `/project/${projectSlug}`

### File 3: `src/components/listing-admin/ReellyImportPanel.tsx`
- Line 1809: Change `/projects/${p.slug}` to `/project/${p.slug}`

### File 4: `src/hooks/useSmartPopupStrategy.ts`
- Line 152: Change `"/projects/"` to `"/project/"`

### File 5: `src/pages/NotFound.tsx`
- Add `jj-hero-fullscreen` class to the outer div so MainLayout does not add header spacing (NotFound already handles its own padding)
- Remove the redundant `pt-32 lg:pt-40` since MainLayout won't add spacing, and the existing `py-12` + flexbox centering is sufficient

### File 6: `src/App.tsx` (optional safety net)
- Add a redirect route: `/projects/:slug` redirects to `/project/:slug` as a catch-all for any other broken links or bookmarks
- Add a redirect: `/projects` redirects to `/properties`
