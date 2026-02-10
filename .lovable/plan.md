
# Area Detail Page Fixes -- Multiple UI Issues

## Issues Identified

1. **"Projects in {Area}" heading is black text on dark background** -- invisible/unreadable
2. **Project cards in AreaProjectsGrid are basic/minimal** -- missing handover date, description, developer logo, sale status, proper price formatting
3. **Developer name not gold/clickable** in area project cards
4. **Prices show decimals** (e.g., "2,552,000.015") -- must remove all decimals
5. **"View All Projects" CTA is a plain text link** -- needs proper button styling
6. **DLD Market Widget touches container edges** -- needs inner padding/max-width card treatment
7. **"Explore Properties" CTA section needs premium upgrade**
8. **DLD transaction numbers missing date context** -- must clarify the time period
9. **Consultation form** -- already handled globally by `CombinedContactNewsletter` in MainLayout (no change needed)

## Changes

### File 1: `src/components/area-detail/AreaProjectsGrid.tsx` (Full Rewrite)

This is the biggest change. The current grid fetches minimal fields and renders basic cards. It needs to match the standard `ProjectCard` component.

**Changes:**
- Expand the database query to include all fields needed by `ProjectCard`: `handover_date`, `description`, `status_label`, `sale_status`, `is_sold_out`, `property_type_label`, `bedrooms_min`, `bedrooms_max`, `size_min`, `size_max`, `location`, plus join with `developers(name, slug, logo_url)` and `project_images(image_url, alt_text, sort_order)`
- Replace the custom mini-cards with the actual `ProjectCard` component for consistency
- Change the section heading "Projects in {Area}" from `text-black` to `text-gold` so it is visible on dark backgrounds
- Format the "View All Projects" CTA as a proper premium button (gold gradient, border, ArrowUpRight icon)

### File 2: `src/components/shared/DLDMarketWidget.tsx`

**Changes:**
- Wrap the full-version content in a rounded card with `border border-gold/20 rounded-2xl p-6` so it does not touch container edges
- Add "YTD 2026" label next to the "Transactions" stat so users know the time period
- Update the disclaimer text to include "Year-to-date (YTD) 2026 data" for clarity

### File 3: `src/pages/AreaDetail.tsx` -- CTA Section

**Changes:**
- Upgrade the "Explore Properties in {Area}" CTA card with a more premium design: add a gold accent line at top, subtle gold icon, and improved button styling
- Ensure both buttons have consistent premium look

### File 4: `src/components/ProjectCard.tsx` -- Price Formatting

**Changes:**
- In the `formatPriceWithCurrency` function (line 49-58), ensure `Math.round()` is applied to the converted value before formatting, eliminating any decimal artifacts like ".015"
- For the full-number display in the area grid (non-abbreviated), use `Math.round(price).toLocaleString()` to strip all decimals

## Technical Details

- The `AreaProjectsGrid` will import and use the existing `ProjectCard` component, ensuring cards match the rest of the site (developer logo, handover badge, description, sale status, proper pricing)
- The Supabase query will be expanded to join `developers` and `project_images` tables, matching the pattern used in the main properties page
- Price formatting uses `Math.round()` before `toLocaleString()` to guarantee zero decimals everywhere
- DLD widget card treatment uses inner container with padding so content does not bleed to screen edges
- The time period label "YTD 2026" will be added to stat cards for transparency
