

# Fix Developer Search Bar UI, Logo White Borders, Homepage Featured Listings, and Currency Default

## Issues to Fix

### 1. Developer Page Search Bar -- Remove Black Background
The sticky filter section in `src/pages/Developers.tsx` (line 226) has `bg-black` as the outer wrapper. This creates a black bar that doesn't match the approved champagne UI. The inner card already uses the champagne gradient, so the fix is to change the outer section background from `bg-black` to match the premium background.

### 2. Developer Logo White Borders -- STILL Showing
The `DeveloperCard.tsx` logo container (line 85) has `bg-white` and `object-contain p-1`. The `object-contain` preserves aspect ratio, leaving white gaps around rectangular logos. The `p-1` adds additional white padding. The user has been clear multiple times: NO white space should be visible. The logo must fill the entire container edge-to-edge.

**Fix:** Change `object-contain p-1` to `object-fill` (no padding). This stretches the logo to fill the entire container with zero white borders. Apply this same fix everywhere logos appear:
- `DeveloperCard.tsx` line 90
- `DeveloperDetail.tsx` line 170 (already uses `object-fill`, confirmed correct)
- `ReellyProjectCard.tsx` line 158 (uses `object-contain` -- needs fix)
- `ProjectCard.tsx` line 201 (uses `object-contain` -- needs fix)
- `FeaturedListings.tsx` (no logo currently -- add developer logo)

### 3. Homepage "Handpicked For You" -- Expand to 8 Listings with Specific Developers
Currently fetches from `['Emaar', 'Omniyat', 'Sobha', 'ALDAR']` with 2 per developer. The user wants:
- Add Omniyat (already included)
- Add Bugatti Residences by Binghatti
- Add Mercedes-Benz Places by Binghatti
- Remove "The Mirage at Sobha Central" (keep only "The Pinnacle at Sobha Central")
- Total: 8 listings

**Fix:** Update the query to also include Binghatti projects with "Bugatti" or "Mercedes" in the name. Adjust the selection logic to pick specific trending projects and ensure only one Sobha project ("Pinnacle").

### 4. Featured Listings -- Fix Price UI and Add Developer Logo
The `FeaturedListings.tsx` card shows the price badge at bottom-right of the photo. The user wants this fixed. Also, the card should show the developer logo matching the style used in `ProjectCard.tsx` and `ReellyProjectCard.tsx`.

**Fix:** Add developer logo overlay (top-left of image) and ensure the price badge styling is clean and premium.

### 5. ProjectCard.tsx -- Default Currency is EUR, Should Be AED
Line 95: `currency = 'EUR'` needs to change to `currency = 'AED'`.

### 6. Developer Detail Page -- Filters Wrapped in Black Container
Line 252 in `DeveloperDetail.tsx` wraps filters in `bg-black rounded-2xl p-4`. The user said the black wrapper is not the approved UI.

**Fix:** Change to champagne gradient background matching the approved theme.

### 7. Developer Detail -- Slow Listing Load
The `useProjectsByDeveloper` hook may have a long stale time or no prefetching. We can reduce stale time and ensure eager data loading.

---

## Technical Changes

### File: `src/pages/Developers.tsx`
- Line 226: Change `bg-black` to `bg-[hsl(var(--premium-bg))]` for the sticky section background
- This makes the search bar sit on the same premium background as the rest of the page

### File: `src/components/DeveloperCard.tsx`
- Line 90: Change `object-contain p-1` to `object-fill` -- removes all white borders/padding around logos
- This is the definitive fix: logos stretch to fill the 24x24 container completely

### File: `src/components/ReellyProjectCard.tsx`
- Line 158: Change `w-10 h-10 object-contain` to `w-full h-full object-fill` -- match the same edge-to-edge logo style
- Remove the inner sizing constraint so the logo fills the container

### File: `src/components/ProjectCard.tsx`
- Line 95: Change `currency = 'EUR'` to `currency = 'AED'`
- Line 201: Change `w-10 h-10 object-contain` to `w-full h-full object-fill` for logo

### File: `src/components/home/FeaturedListings.tsx`
- Line 14: Expand `ELITE_DEVELOPERS` to include `'Binghatti'`
- Update query logic: pick 1 Omniyat, 1 Sobha ("Pinnacle" only), 2 Emaar, 2 ALDAR, 1 Bugatti (Binghatti), 1 Mercedes-Benz (Binghatti) = 8 total
- Add developer logo overlay to the card (top-left, matching other cards)
- Fix price badge positioning/styling to be consistent

### File: `src/pages/DeveloperDetail.tsx`
- Line 252: Change `bg-black rounded-2xl p-4` to champagne gradient container: `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-2xl p-4`

---

## Files to Modify

| File | Changes |
|---|---|
| `src/pages/Developers.tsx` | Remove black background from sticky search bar |
| `src/components/DeveloperCard.tsx` | Change logo to `object-fill`, remove padding |
| `src/components/ReellyProjectCard.tsx` | Change logo to `object-fill` |
| `src/components/ProjectCard.tsx` | Fix default currency to AED, change logo to `object-fill` |
| `src/components/home/FeaturedListings.tsx` | Add Binghatti (Bugatti/Mercedes), ensure 8 listings, add logo, fix price UI |
| `src/pages/DeveloperDetail.tsx` | Change filters wrapper from black to champagne |

## Execution Order
1. Fix developer card logo (`object-fill`, no padding) -- highest priority
2. Fix project card logos to `object-fill`
3. Remove black background from developers search bar
4. Fix ProjectCard default currency EUR to AED
5. Fix DeveloperDetail filters wrapper
6. Update FeaturedListings with 8 curated listings + logos

