

# Fix Plan: Card Photos, "Project Not Found", Developer Hero, Sold Out Badge, UI Colors, and More Button

This plan addresses the multiple issues reported on the /properties page and related pages.

---

## Issue 1: "Project Not Found" When Clicking Cards

**Root Cause:** The /properties page uses `PropertiesReelly.tsx` which fetches projects from the `reelly-projects` edge function. Each card links to `/project/{slug}`. But `ProjectDetail.tsx` fetches the project from the local `projects` database table using `useProject(slug)`. If a Reelly project's slug doesn't exist in the local `projects` table, it shows "Project not found".

**Fix:** Update `ProjectDetail.tsx` to add a fallback -- if the project is not found in the local `projects` table, fetch it from the `reelly-projects` edge function by slug, then map the Reelly data to the `ProjectDetailData` format. This ensures every card that appears on the listings page is viewable when clicked.

**Files:**
- `src/pages/ProjectDetail.tsx` -- Add Reelly fallback fetch
- `src/hooks/useReellyProjects.ts` -- Add a `useReellyProjectBySlug` hook

---

## Issue 2: Card Photos Missing (Hotels/Residences)

**Root Cause:** `ReellyProjectCard.tsx` renders images from `project.images[currentImageIndex]?.image_url || project.thumbnail`. If both `images` array and `thumbnail` are empty/null, the `VerifiedMedia` component shows a placeholder. This is a data issue -- some projects from the Reelly API come without images.

**Fix:** 
- In `ReellyProjectCard.tsx`, add a fallback to `project.gallery[0]` (the gallery array from Reelly) when images array is empty and thumbnail is null.
- Also ensure the `reelly-projects` edge function returns gallery images mapped into the `images` array if `project_images` are empty.

**Files:**
- `src/components/ReellyProjectCard.tsx` -- Add gallery fallback for image source

---

## Issue 3: "Sold Out" Badge Position -- Move from Right to Left

**Current:** In `ProjectCard.tsx` (line 279-285), the "Sold Out" badge is at `top-3 right-3`, overlapping the favorite/shortlist buttons.

**Fix:** Move the "Sold Out" badge to the LEFT side (`top-3 left-3`), offset below the developer logo if present (same as the sale status badge logic). Remove the duplicate `saleStatusBadge` that also shows "Sold Out" on the left to avoid double badges.

**Files:**
- `src/components/ProjectCard.tsx` -- Move Sold Out badge from right to left, deduplicate with saleStatusBadge
- `src/components/ReellyProjectCard.tsx` -- Same treatment

---

## Issue 4: Developer Detail Page -- Black Screen, No Hero Content

**Root Cause:** The developer hero section (line 112-138 in `DeveloperDetail.tsx`) only renders if `developer.feature_image_url` exists. Many developers don't have a feature image, so the hero is completely skipped, showing only the content section directly (which appears as a "black page" flash during loading).

**Fix:**
- When no `feature_image_url` exists, show a hero section with a dark gradient background and the developer name/tagline (instead of skipping entirely).
- The loading skeleton already exists but is minimal -- enhance it to show a full-height skeleton hero during load to prevent the black flash.

**Files:**
- `src/pages/DeveloperDetail.tsx` -- Add fallback hero when no feature image; improve loading skeleton

---

## Issue 5: Gold Color Mixing with Orange -- Developer Name Uses Two Colors

**Current:** In `ProjectCard.tsx`, the developer name uses gold (`text-gold`), but the "...more" button uses a gradient `from-gold via-handover to-gold` which includes the orange handover color. The price also uses `text-handover` (orange) and `text-gold` inconsistently.

**Fix:**
- Change "...more" link from the gold-to-orange gradient to solid `text-gold font-semibold` for consistency
- Standardize price color to `text-gold` only (remove `text-handover` from price display)
- Same treatment in `ReellyProjectCard.tsx`

**Files:**
- `src/components/ProjectCard.tsx` -- Unify to gold only, remove orange from "...more" and price
- `src/components/ReellyProjectCard.tsx` -- Same changes

---

## Issue 6: "...more" Button Not Readable Enough

**Fix:** Make the "...more" text more prominent:
- Change from inline gradient text to a visible `text-gold font-bold underline` style
- Add a small arrow icon to make it clearly clickable

**Files:**
- `src/components/ProjectCard.tsx` -- Restyle "...more" link
- `src/components/ReellyProjectCard.tsx` -- Same

---

## Issue 7: CTA Buttons (Email, Call, Chat) Redirect

**Current:** The Email, Call, and WhatsApp buttons use `<a href=...>` tags which should work. However, `onClick={(e) => e.stopPropagation()}` might interfere in some cases.

**Fix:** Verify all three buttons use proper `href` attributes with correct protocols (`mailto:`, `tel:`, WhatsApp URL). Remove unnecessary `stopPropagation` if the buttons are inside an `<a>` link (they're outside the Link wrapper, so stopPropagation isn't needed on the CTA section).

**Files:**
- `src/components/ProjectCard.tsx` -- Verify CTA button hrefs
- `src/components/ReellyProjectCard.tsx` -- Same

---

## Implementation Order

1. Move "Sold Out" badge from right to left (both card components)
2. Fix gold/orange color mixing -- unify to gold only
3. Make "...more" button readable
4. Add image gallery fallback for missing card photos
5. Fix developer detail hero (fallback for missing feature image)
6. Fix "Project Not Found" -- add Reelly fallback in ProjectDetail
7. Verify CTA button redirects

## Files Changed Summary

- `src/components/ProjectCard.tsx` -- Badge position, colors, "...more" styling
- `src/components/ReellyProjectCard.tsx` -- Same fixes
- `src/pages/DeveloperDetail.tsx` -- Fallback hero section
- `src/pages/ProjectDetail.tsx` -- Reelly fallback for project detail
- `src/hooks/useReellyProjects.ts` -- Add single-project fetch hook

