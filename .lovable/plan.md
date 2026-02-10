

# Comprehensive Fixes: "Reelly API" Label, Search Bar, Developer Detail, Currency, and Data Integrity

## Overview

This plan addresses 12+ issues across the properties page, developer detail page, project cards, and global data integrity. Changes are organized by priority.

---

## Part 1: Remove "Live from Reelly API" Label

**Problem:** The properties page (PropertiesReelly.tsx) displays a "Live from Reelly API" badge in the hero section (line 238). This must never be visible to users -- it reveals the data source.

**Fix in `src/pages/PropertiesReelly.tsx`:**
- Delete lines 228-239 (the entire button element containing "Live from Reelly API")
- Also search and remove any other visible "Reelly" references across all user-facing pages (admin panels like ReellyImportPanel are fine to keep since they are internal)

**Also check and clean:**
- `src/pages/Properties.tsx` (line 141 has a comment referencing "Reelly API" -- comments are fine, but check for visible text)
- Any other user-facing component that mentions "Reelly"

---

## Part 2: Fix Default Currency -- EUR Should Be AED

**Problem:** In `ReellyProjectCard.tsx` line 86, the default currency is `'EUR'` instead of `'AED'`. This causes all cards to show prices in Euro when no currency prop is passed.

**Fix in `src/components/ReellyProjectCard.tsx`:**
- Change line 86 from `currency = 'EUR'` to `currency = 'AED'`

---

## Part 3: Fix Sale Status Badge Position -- Move "Sold Out" to Left Side on Cards

**Problem:** The user wants all sale status badges on the left side of the card (external view). Currently, the badge is already positioned top-left (line 216), but the developer logo is also top-left (line 153-161). When both exist, they overlap.

**Fix in `src/components/ReellyProjectCard.tsx`:**
- Keep the sale status badge at top-left
- Move the developer logo to top-left but offset the badge below it (e.g., `top-16` when logo exists)
- This matches the pattern already used in `ProjectCard.tsx`

---

## Part 4: Add Color-Coded Sale Status Labels in Filter Dropdown

**Problem:** The sale status dropdown in PropertiesReelly.tsx shows plain text labels without color coding. The user wants visible color indicators (red for Sold Out, green for On Sale, etc.).

**Fix in `src/pages/PropertiesReelly.tsx`:**
- Update the `SALE_STATUS` array to include a `dotClass` property for each status
- Render a colored dot next to each label in the SelectItem:
  - Announced: gold dot
  - Presale (EOI): amber dot
  - Start of Sales: blue dot
  - On Sale: green dot
  - Sold Out: red dot

---

## Part 5: "Price on Request" Policy -- Only When No Price Available

**Problem:** The user clarified: show "Price on Request" ONLY when no price data exists (null/0). Never show wrong prices. Never fabricate numbers. The current implementation is correct but the default text needs to be more premium.

**Fix in `src/components/ReellyProjectCard.tsx`:**
- Change "Price on Request" to "Details on Request" for a more premium feel
- Ensure the price is always shown in the user's selected currency (AED by default)

---

## Part 6: Developer Detail Page -- Hero Section Fixes

**Problem:** The developer detail page (/developer/emaar) has multiple issues:
1. Hero image is blurry/low quality -- uses `developer.feature_image_url` which may be a low-res thumbnail
2. No title/name overlay on the hero section
3. Stats show "N/A" for missing data instead of hiding them
4. Map has no navigation controls
5. EmiratesTabs and ProjectFilters don't match the approved UI (dark theme with white text)
6. Grid shows 4 columns but CTA buttons are broken/truncated

**Fixes in `src/pages/DeveloperDetail.tsx`:**
- Use `getHighResImageUrl` utility for the hero image to get 1920x1080 resolution
- Add a title overlay on the hero (developer name + tagline)
- Hide stats that show "N/A" instead of displaying them
- Change project grid from `lg:grid-cols-4` to `lg:grid-cols-3` for better card readability
- Style EmiratesTabs and ProjectFilters to use champagne theme (matching PropertiesReelly) instead of dark theme

**Fix in `src/components/developer/DeveloperProjectsMap.tsx`:**
- Add zoom controls (`zoomControl={true}`) and navigation to the Leaflet map

---

## Part 7: Sticky Search Bar on Properties Page

**Problem:** The search/filter bar should remain sticky under the header as the user scrolls, so they can always adjust filters.

**Current state:** The filter section in PropertiesReelly.tsx already has `sticky top-16 lg:top-[72px] z-40` (line 256). This should already work. The issue may be that the header height doesn't match. 

**Fix in `src/pages/PropertiesReelly.tsx`:**
- Verify the sticky top offset matches the actual header height (h-24 = 96px on mobile, h-20 = 80px on desktop)
- Update to `sticky top-24 lg:top-20 z-40`

---

## Part 8: Enhance Search Bar with Bedrooms Filter

**Problem:** The user wants the search bar to include bedrooms, and the existing filters need to be more premium. Currently the bar has: search, emirate, sale status, and advanced filters button.

**Fix in `src/pages/PropertiesReelly.tsx`:**
- Add a "Bedrooms" dropdown to the main filter row (Studio, 1, 2, 3, 4, 5+)
- Add a "Developer" dropdown to the main filter row (using the developers list)
- Move "Price Range" and "Size Range" (from/to inputs) into the Advanced Filters dialog
- Ensure all dropdowns use the champagne theme with black text

---

## Part 9: Dynamic Property Count

**Problem:** The total count should update in real-time when properties are added. Currently, the count comes from the API pagination response (`totalCount`), which already reflects the current database state. Each page load fetches fresh data.

**Fix:** No code change needed -- the count already comes from the API and updates on each request. The `staleTime` of 5 minutes in `useReellyProjects.ts` means the cache refreshes every 5 minutes. To make it more responsive:
- Reduce `staleTime` from 5 minutes to 2 minutes in `useReellyProjects.ts`

---

## Part 10: Currency Change Tooltip/Popup

**Problem:** The user wants a one-time tooltip/popup that tells new users "You can change the currency from here" with an arrow pointing to the currency filter. When they click "OK", it dismisses permanently.

**Fix:**
- Create a `CurrencyTooltip` component that renders a floating tooltip near the currency selector
- Use `localStorage` to track if the user has dismissed it (`currency_tooltip_dismissed`)
- Show it only on the first visit to the properties page
- Include an arrow pointing to the currency selector and an "OK" button to dismiss

---

## Part 11: Data Integrity Audit

**Problem:** The user wants assurance that no wrong information is displayed. Key checks:
1. Prices come directly from the API (`price_from`) -- no fabrication
2. Developer names come directly from the API (`developer_name`) -- no fabrication
3. Sale status comes directly from the API -- no fabrication
4. Location/emirate comes from the API

**No code changes needed for data integrity** -- all data is sourced from the API. The "Price on Request" fallback only shows when no price data exists. No fake numbers are generated.

---

## Part 12: ProjectFilters on Developer Detail -- Theme Fix

**Problem:** The `ProjectFilters` component uses dark theme (`SelectTriggerDark`, `SelectContentDark`, `SelectItemDark`) which creates white text on the champagne background of the developer detail page.

**Fix in `src/pages/DeveloperDetail.tsx`:**
- The `ProjectFilters` component is designed for dark backgrounds. Since the developer detail page uses a premium-bg (light) background, we need to either:
  - Wrap the filters in a dark container, OR
  - Pass a `theme` prop to ProjectFilters to use light-themed selects
- Simplest fix: wrap the filters section in a dark container (`bg-black rounded-2xl p-4`)

---

## Files to Modify

| File | Change |
|---|---|
| `src/pages/PropertiesReelly.tsx` | Remove "Live from Reelly API" label, fix sticky offset, add bedrooms/developer filters, add color-coded sale status dots, add currency tooltip |
| `src/components/ReellyProjectCard.tsx` | Fix default currency from EUR to AED, fix badge/logo collision, premium "Details on Request" |
| `src/pages/DeveloperDetail.tsx` | Fix hero (high-res image + title overlay), hide N/A stats, fix grid to 3 cols, wrap filters in dark container |
| `src/components/developer/DeveloperProjectsMap.tsx` | Add zoom controls to Leaflet map |
| `src/hooks/useReellyProjects.ts` | Reduce staleTime from 5min to 2min |
| `src/components/CurrencyTooltip.tsx` | New component: one-time currency change tooltip |

## Execution Order

1. Remove "Live from Reelly API" label (critical -- user is very unhappy)
2. Fix default currency EUR to AED
3. Fix sale status badge positioning (left side, no overlap with logo)
4. Fix Developer Detail hero (high-res + title + hide N/A stats)
5. Fix Developer Detail grid (3 cols) and filters (dark container)
6. Add map zoom controls
7. Add color-coded sale status in filter dropdown
8. Add bedrooms/developer filters to search bar
9. Fix sticky search offset
10. Add currency tooltip
11. Reduce staleTime for fresher counts

