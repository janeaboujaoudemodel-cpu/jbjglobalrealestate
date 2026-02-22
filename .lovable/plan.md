

# Comprehensive Bug Fix and UX Improvement Plan

This plan addresses all reported issues across the Properties page, Project Detail page, Homepage, and mobile experience.

---

## 1. Properties Page Hero Video -- Use a Unique Video (Not Homepage Video)

**Problem:** The "Discover Dubai's Finest Off-Plan Properties" page reuses the same hero video (`hero-video.mp4`) from the homepage.

**Fix:** Upload or reference a different premium Dubai skyline/real estate video for the Properties page. Change the `HERO_VIDEO_URL` in `src/components/PropertiesHeroVideo.tsx` to a new unique video (e.g., a Downtown Dubai morning skyline drone shot). If no alternate video exists in storage, we will use a high-quality static hero image as a fallback with a cinematic Ken Burns animation effect, giving the Properties page its own visual identity.

**File:** `src/components/PropertiesHeroVideo.tsx`

---

## 2. Remove Gold Divider on Properties Page

**Problem:** A gold gradient divider (`h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent`) appears between the hero/filter bar and the project grid on the Properties page (line 305 in `PropertiesReelly.tsx`).

**Fix:** Remove the divider element entirely from `src/pages/PropertiesReelly.tsx` (line 304-305).

**File:** `src/pages/PropertiesReelly.tsx`

---

## 3. Fix Filter Bar Overflow and Scroll Arrows

**Problem:** Filter pills overflow their containers on mobile. The scroll indicator arrows are invisible or blocked by adjacent buttons. Content text overflows filter buttons.

**Fix in `src/components/filters/FilterShortcutBar.tsx`:**
- Make scroll arrows more visible: larger size, higher contrast, solid gold background instead of transparent gradient
- Ensure arrow buttons have no overlapping elements -- increase the right-side gradient fade width
- Add `overflow-hidden text-ellipsis` to all pill buttons to prevent text overflow
- Increase minimum width of filter pills to prevent text wrapping/overflow
- Make Row 1 (connected toolbar) items use `min-w-fit` to prevent content clipping

---

## 4. Fix Project Photo Loading Performance

**Problem:** Project card photos load very slowly or not at all on mobile.

**Fix in `src/components/ReellyProjectCard.tsx` and `src/components/SafeImage.tsx`:**
- Add `loading="lazy"` with proper `fetchPriority` settings
- Use optimized storage URLs (`?width=400&height=300`) for card thumbnails to reduce payload
- Add a shimmer placeholder while images load to prevent layout shifts
- Ensure fallback chain works: `cover_image_url` -> first gallery image -> branded placeholder

---

## 5. Fix Project Detail Page Hero Image Quality

**Problem:** The hero image on the project detail page sometimes uses a low-quality or cropped photo.

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx` (lines 254-263):**
- Update `heroImage` selection logic to pick the highest-resolution image from the gallery
- Use `getHighResImageUrl()` (already imported) to request the full-size version
- Prioritize images that have landscape orientation and high resolution over cover thumbnails
- Remove any width/height constraints from the hero `SafeImage` that could cause cropping

---

## 6. Fix Amenities Photos Display

**Problem:** Amenities section doesn't show photos even when `amenity_images` data exists from Reelly.

**Fix in `src/components/project-detail/AmenitiesWithPhotos.tsx`:**
- Verify the `findRealPhoto` matching logic works with actual Reelly data keys
- Add broader keyword matching (e.g., "Swimming Pool" should match "pool", "swimming-pool")
- When amenity photos exist, display them as the card background with the icon overlaid, instead of icon-only cards
- If no photo is found for a specific amenity, fall back to the icon-only card

---

## 7. Fix JBJ AI Project Intelligence Logo

**Problem:** The AI Analyzer loading state uses `jbj-monogram-nobuffer.png` which has a background the user doesn't want.

**Fix in `src/components/project-detail/ProjectAIAnalyzer.tsx` (line 9):**
- Switch from `jbjMonogramNobuffer` to `jbjMonogramTransparent` (the transparent variant with no black background)
- The transparent monogram (`jbj-monogram-transparent.png`) was already imported and available in `BrandMonogram.tsx`

---

## 8. Project Detail -- Ensure Construction Progress, Handover, Payment Plan Visibility

**Problem:** These data points aren't always visible on project detail pages.

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx`:**
- The `QuickFactsBar` already displays handover date when available (line 44-48)
- The `ConstructionTimelineSection` only shows when `construction_progress` is not null (line 300)
- The `PaymentPlanVisualization` shows when payment data exists (line 1047)
- Ensure all three are always visible by relaxing the visibility conditions: show construction section with a "Data pending" state, show payment section with at least the payment_plan text string, and always show the handover in QuickFactsBar even with a "TBD" fallback

---

## 9. Fix DLD Market Intelligence Padding on Mobile

**Problem:** The Dubai Market Intelligence widget touches the project brochure card below it, and the divider between pros/cons and the widget isn't centered.

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx` (lines 992-1000):**
- Increase bottom padding on the divider section from `py-10` to `py-14 md:py-16`
- Add `mb-8` to the DLDMarketWidget wrapper to create space before the brochure section

---

## 10. Remove Extra Layer from Consultation Form

**Problem:** The "Register Interest" form has three visual layers: main background -> champagne card (`jj-card-inner` with border) -> form card. User wants to remove the middle layer.

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx` (lines 1137-1146):**
- Remove the wrapping `jj-card-inner` div with champagne background styling
- Keep only the `ConsultationRequestForm` which already has its own premium card styling (gradient + gold border + shadow)
- The form card will sit directly on the main section background

---

## 11. SectionDivider Removal for Specific Sections

**Problem:** User wants gold dividers removed under "Explore Areas" and "Top Developer" sections on the homepage.

**Clarification needed:** The homepage uses `SectionDivider` between every section. The user specifically mentioned removing dividers under "Areas We Cover" and potentially other sections. Will remove the `SectionDivider` immediately after `AreasWeCover` (line 543-544 in Index.tsx).

---

## Technical Summary of Files to Edit

| File | Changes |
|------|---------|
| `src/components/PropertiesHeroVideo.tsx` | Replace video URL with unique properties-page video |
| `src/pages/PropertiesReelly.tsx` | Remove gold divider (line 304-305) |
| `src/components/filters/FilterShortcutBar.tsx` | Fix overflow, visible arrows, pill sizing |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Hero image quality, form layer removal, DLD padding, section visibility |
| `src/components/project-detail/AmenitiesWithPhotos.tsx` | Photo display improvements |
| `src/components/project-detail/ProjectAIAnalyzer.tsx` | Fix monogram import |
| `src/components/project-detail/QuickFactsBar.tsx` | Handover TBD fallback |
| `src/pages/Index.tsx` | Remove specific section dividers |

