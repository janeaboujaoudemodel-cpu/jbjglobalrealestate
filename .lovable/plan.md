
# Project Detail Page Performance, Layout, and UX Fixes

This plan addresses all reported issues across the project detail page, homepage, and listing grid.

---

## 1. Payment Plan Tab Order and Active Color Fix

**Problem:** The "100% Payment" tab shows first (as default), and the active tab uses the old flat `bg-gold` yellow instead of champagne.

**Fix in `src/components/project-detail/PaymentPlanVisualization.tsx`:**
- Line 126: Change `defaultValue` from conditional to always `"installment"` first -- the payment plan tab should always be the primary/first tab
- Swap the tab order: Payment Plan tab first (left), then 100% Payment tab second (right)
- Lines 128, 132: Change `data-[state=active]:bg-gold data-[state=active]:text-black` to `data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-[#C8A766]/60`

---

## 2. Sticky Nav Active Tab -- Champagne Instead of Gold

**Problem:** Active tab in Row 2 sticky nav uses `bg-gold/20 text-gold border border-gold/40` which is the old yellow.

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx` (line 649-650):**
- Change active state to champagne gradient: `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-[#C8A766]/60 shadow-sm`

---

## 3. Add Missing Sections to Sticky Navigation (Amenities, Payment Plan, etc.)

**Problem:** The hardcoded Row 2 nav (lines 635-657) only has 7 tabs (Details, Gallery, Developer, Location, Brochure, AI Analyzer, Mortgage) while there are 17+ sections. This creates huge gaps between visible nav items and actual content.

**Fix:** Replace the hardcoded 7-tab array with the dynamic `visibleTabs` array that already exists (line 323-357), which includes all sections: Details, Gallery, Units, Progress, Developer, Highlights, Floor Plans, Specs, Amenities, Media, Location, Master Plan, Brochure, Payment Plan, Investment, Useful Info, AI Analyzer, Mortgage.

---

## 4. AI Analyzer Loading Monogram -- Make Bigger

**Problem:** The JBJ monogram during AI analysis loading is `w-20 h-20` which is too small.

**Fix in `src/components/project-detail/ProjectAIAnalyzer.tsx` (line 261):**
- Change `w-20 h-20` to `w-32 h-32 md:w-40 md:h-40`
- Increase the glow blur from `scale-150` to `scale-[1.8]`

---

## 5. Reduce Padding Between AI Intelligence Section and DLD Market Widget

**Problem:** The gold divider between AI Analyzer and DLD Market Widget has too much vertical padding (`py-14 md:py-16`), making the spacing asymmetric.

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx` (line 1027):**
- Change `py-14 md:py-16` to `py-6 md:py-8` to tighten the gap

---

## 6. Investment Metric Cards -- More Premium Styling

**Problem:** The cards for Rental Yield, Capital Growth, Investment Rating use plain `bg-card` with simple borders.

**Fix in `src/components/project-detail/InvestmentMetricsSection.tsx`:**
- Upgrade each card from `rounded-xl border border-gold/30 bg-card` to `rounded-xl border-2 border-gold/40 bg-gradient-to-br from-card via-card to-gold/5 shadow-md hover:shadow-lg hover:shadow-gold/15 transition-all`
- Add `ring-4 ring-gold/10` to the icon circle containers for a premium feel

---

## 7. Inaura Ad Image Fix

**Problem:** The Inaura Hotels ad in `FEATURED_ADS` has a broken/missing image.

**Fix in `src/components/FeaturedProjectAd.tsx` (line 102):**
- The URL `https://d3h330vgpwpjr8.cloudfront.net/x/1128x/Feature_309f6a8c5c.webp` may be dead
- Look up the Inaura project in the database and use its `cover_image_url` or first gallery image as the ad image
- If no database image is available, use a working CDN URL or fallback gradient

---

## 8. Listing Card Padding -- Equal Spacing from Edges

**Problem:** Project cards in the grid touch the left edge of the container but have spacing on the right. The layout should have equal margins on both sides and equal gaps between cards.

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx` (line 675):**
- The container uses `px-6 md:px-12 lg:px-16` which should provide equal padding. The issue may be that the max-width container is misaligned.
- Verify the `max-w-[1600px] mx-auto` container is not being overridden by parent styles
- Add `w-full` to ensure centering works properly

---

## 9. Homepage Mortgage Calculator -- Remove Duplicate Title

**Problem:** The homepage has its own "Mortgage Calculator" heading (Index.tsx line 466-468) and below it the MortgageCalculator component. The user sees "Mortgage Calculator" appearing twice.

**Fix in `src/pages/Index.tsx`:** The component is called with `compact` so it shouldn't show its own title. The "duplication" is likely the "Financial Tools" badge + the "Mortgage Calculator" heading + the subtitle all appearing redundant. Simplify by removing either the badge or the subtitle to make it look like one clean title block.

---

## 10. Amenity Photos -- Ensure Photos Load

**Problem:** Amenities still show only icons without photos. The `AmenitiesWithPhotos` component relies on `amenity_images` data from the project.

**Fix:** The `amenity_images` field needs to be populated during the enrichment pipeline. This is a data issue -- the `reelly-auto-enrich` function should map amenity names to their corresponding images from the project gallery or Reelly API. For now, ensure the component gracefully handles missing photos (it already does with icon fallback), but the real fix is to run the enrichment to populate `amenity_images`.

---

## 11. Filter Shortcut Bar -- Edge-to-Edge Layout

**Problem:** The fixed filter bar and shortcut buttons have gaps at the edges instead of filling the full width.

**Fix in the Row 1 container (line 624):**
- Remove `container mx-auto` constraint so the bar stretches edge-to-edge
- Change to `max-w-full px-2` to allow full-width scrolling content

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/components/project-detail/PaymentPlanVisualization.tsx` | Swap tab order (Payment Plan first), champagne active color |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Champagne active tab, use `visibleTabs` in Row 2, reduce AI-DLD divider padding, fix filter bar width |
| `src/components/project-detail/ProjectAIAnalyzer.tsx` | Larger loading monogram (w-32 h-32 / w-40 h-40) |
| `src/components/project-detail/InvestmentMetricsSection.tsx` | Premium card styling with gradients and rings |
| `src/components/FeaturedProjectAd.tsx` | Fix Inaura image URL |
| `src/pages/Index.tsx` | Clean up duplicate mortgage title elements |
