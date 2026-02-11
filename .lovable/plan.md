

# Fix Plan: Areas, Project Routing, Marquee, Cards, and Brochure

## Issue 1: 95 Areas Still Missing Images

95 areas have no images at all. The current `enrich-area-images` function only pulls from associated projects -- these 95 areas have no projects with images.

**Fix:** Update `enrich-area-images` edge function to use AI image generation (Gemini image model) as a fallback when no project images exist. For each area without an image:
1. Call the Lovable AI image generation endpoint with a prompt like "Aerial panoramic photo of {area name}, Dubai, UAE, community master plan view, real estate photography"
2. Upload the generated image to Supabase Storage (create an `area-images` bucket)
3. Store the public URL in `areas.image_url` and `areas.hero_image_url`
4. Process in batches of 5 (image generation is slower)

Then invoke the function to process all 95 remaining areas.

**Files:** `supabase/functions/enrich-area-images/index.ts`

---

## Issue 2: Project "Not Found" Black Screen

When clicking some project cards, users see a black screen with "Project not found" and an invisible "Back to Properties" button. The issue is poor styling of the not-found state.

**Fix in `src/pages/ProjectDetail.tsx` (lines 238-248):**
- Add the JBJ monogram/logo for branding
- Change text to white/gold for visibility on dark backgrounds
- Style the "Back to Properties" button with the gold CTA styling
- Add padding-top to avoid header overlap

---

## Issue 3: "...more" Link Styling on Project Cards

In `FeaturedListings.tsx` (line 269-274), the "More" link is orange with an arrow. User wants it in gold with no arrow and no underline.

**Fix in `src/components/home/FeaturedListings.tsx` (lines 269-274):**
- Change `text-orange-500` to `text-gold`
- Remove the arrow icon
- Add `no-underline` styling

Also fix in `src/components/ProjectCard.tsx` (lines 346-352):
- Change `text-black` to `text-gold`
- Remove `ArrowUpRight` icon
- Remove underline

---

## Issue 4: Developer Logo Gold Border on Handpicked Cards

User wants a thin gold border around developer logos on the photo overlay in FeaturedListings cards.

**Fix in `src/components/home/FeaturedListings.tsx` (lines 175-185):**
- Add `border-2 border-gold` to the logo container
- Use `object-cover` instead of `object-fill` to eliminate white edges inside the logo container

Also fix globally in `src/components/ProjectCard.tsx` (line 197):
- Already has `border-2 border-gold` -- verify `object-cover` is used

---

## Issue 5: Developer Marquee Spacing

Some logos still touch each other or have inconsistent sizes.

**Fix in `src/components/DeveloperPartnersMarquee.tsx`:**
- Reduce `px-6 md:px-10 lg:px-12` to `px-4 md:px-6 lg:px-8` for tighter but uniform spacing
- Set a fixed max-height for all logos: `max-h-[32px] md:max-h-[40px] lg:max-h-[44px]`
- Add `max-w-[120px] md:max-w-[140px]` to constrain oversized logos

---

## Issue 6: Brochure Section Fixes

Three issues:
1. JBJ logo in brochure is cropped inside circle -- needs `object-contain` and proper sizing
2. Brochure image should be more visible (reduce dark overlay)
3. Remove "Request Brochure" button from the left column, keep only "Unlock Brochure" under the brochure card

**Fix in `src/components/project-detail/PremiumBrochureCard.tsx`:**
- Line 149: Change logo container to use `object-contain` with proper padding (already has it -- verify `p-1.5` is adequate, increase to `p-1`)
- Line 130: Reduce dark overlay opacity from `from-black via-black/60` to `from-black/80 via-black/40`

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx` (lines 1013-1022):**
- Remove the "Request Brochure" / "Download Brochure" button from the left column description area

---

## Issue 7: Area Card Routing Verification

All area cards already route to `/area/{slug}` via `<Link to={/area/${area.slug}}>`. The `AreaDetail` page exists and renders for any valid slug. Areas with no data show a redirect to `/areas`. This routing is working correctly -- no code change needed, just ensuring all 183 areas have content (images + descriptions) so they render properly.

---

## Issue 8: Search Bar Fixed on Scroll

The area detail hero search bar scrolls away. User wants it sticky/fixed.

**Fix in `src/components/area-detail/AreaHeroSection.tsx`:**
- Extract the search bar into its own sticky component that becomes fixed at the top when scrolled past
- Use `position: sticky` with `top: 80px` (below header) and appropriate z-index

---

## Summary

| # | Issue | Files | Type |
|---|-------|-------|------|
| 1 | 95 areas missing images | enrich-area-images edge function | Edge function + invoke |
| 2 | Project not found black screen | ProjectDetail.tsx | UI fix |
| 3 | "more" link styling | FeaturedListings.tsx, ProjectCard.tsx | Style fix |
| 4 | Developer logo gold border | FeaturedListings.tsx, ProjectCard.tsx | Style fix |
| 5 | Marquee spacing | DeveloperPartnersMarquee.tsx | Style fix |
| 6 | Brochure fixes | PremiumBrochureCard.tsx, ProjectDetailLayout.tsx | UI fix |
| 7 | Area routing | No change needed | Verified |
| 8 | Sticky search bar | AreaHeroSection.tsx | New behavior |

