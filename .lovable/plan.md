

# Fix Plan: Remaining UI Issues

## 1. Brochure Logo Cropping (PremiumBrochureCard.tsx)

The JBJ monogram in the brochure card uses `object-cover` (line 153), which crops the logo inside the circle. Change to `object-contain` so the full logo fits without cropping.

**File:** `src/components/project-detail/PremiumBrochureCard.tsx`
- Line 153: Change `object-cover` to `object-contain`

---

## 2. Developer Logo on Handpicked Cards - Remove White Edges

The FeaturedListings cards use `object-cover` (line 180) for developer logos, which can crop some logos. But `object-contain` with padding would show white edges. The fix: use `object-contain` with `p-0.5` instead of no padding, and keep the white background -- this ensures the logo fits fully with minimal white space.

**File:** `src/components/home/FeaturedListings.tsx`
- Line 180: Change `object-cover` to `object-contain p-1`

---

## 3. Developer Logo in DeveloperInfoCard - Remove White Edges

The developer info section on project detail pages uses `object-contain p-2` (line 69). Reduce padding to `p-1` so the logo fills more of the container.

**File:** `src/components/project-detail/DeveloperInfoCard.tsx`
- Line 69: Change `p-2` to `p-1`

---

## 4. "...more" Link Styling

The "more" link in FeaturedListings (line 271) is already gold and has no arrow. The ProjectCard "...more" (line 348) is also gold. Both look correct from the last fix. No additional changes needed here.

---

## 5. Developer Marquee Spacing

Logos currently use `px-4 md:px-6 lg:px-8` with `max-h-[32px] md:max-h-[40px] lg:max-h-[44px]` and `max-w-[120px] md:max-w-[140px]`. Some logos still touch because the container `min-w` values are smaller than the spacing. Fix by:
- Adding a `gap` via the container div instead of padding on individual items
- Setting all logos to a strict uniform max dimensions

**File:** `src/components/DeveloperPartnersMarquee.tsx`
- Line 77: Increase horizontal padding slightly to `px-5 md:px-7 lg:px-9`
- Line 81: Standardize container: `h-10 md:h-12 lg:h-14 w-[120px] md:w-[150px] lg:w-[170px]` (fixed width instead of min-width, ensuring uniform sizing)
- Line 86: Keep max constraints but ensure consistent logo sizing with `max-h-[28px] md:max-h-[36px] lg:max-h-[40px]` (slightly reduced to prevent touching)

---

## 6. Project "Not Found" Page Visibility

The current not-found state (lines 238-252) now uses `bg-premium-bg` which is the light champagne background. The text uses `text-foreground` (dark) and the button uses `variant="dark"`. This should already be visible. However, the user reported a "full black screen" -- this might be the old cached version. Let me verify the current styling is correct and add more visual prominence:

**File:** `src/pages/ProjectDetail.tsx`
- Ensure the not-found section has high-contrast styling with a gold-bordered card container
- Make the "Back to Properties" button use gold styling (`variant="primary"`)

---

## 7. Search Bars Already Sticky

Verified that:
- **Properties page:** Already sticky (`sticky top-14 sm:top-16 md:top-20 lg:top-[72px] z-40`)
- **Developers page:** Already sticky (`sticky top-24 lg:top-20 z-40`)  
- **Area detail:** Already has `AreaStickySearchBar` component with IntersectionObserver

No changes needed for stickiness.

---

## 8. Project Routing

All project cards link to `/project/${project.slug}`. The `useProject` hook queries the `projects` table by slug. If not found locally, the `useReellyProjectBySlug` fallback is tried. Projects from the Handpicked section come from the local DB so they should always resolve. If a project shows "not found", it means neither the local DB nor Reelly API has it.

The "Keturah Reserve" project exists in the DB with slug `keturah-reserve-mag-16`. It should route correctly. No code change needed -- routing works by design.

---

## Summary of Changes

| File | Change |
|------|--------|
| `PremiumBrochureCard.tsx` (line 153) | `object-cover` to `object-contain` for JBJ logo |
| `FeaturedListings.tsx` (line 180) | `object-cover` to `object-contain p-1` for dev logos |
| `DeveloperInfoCard.tsx` (line 69) | `p-2` to `p-1` for dev logo padding |
| `DeveloperPartnersMarquee.tsx` (lines 77, 81, 86) | Uniform spacing and sizing for marquee logos |
| `ProjectDetail.tsx` (lines 238-252) | Enhanced not-found state with gold button styling |

