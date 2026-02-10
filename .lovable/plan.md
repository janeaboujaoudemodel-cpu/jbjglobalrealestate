
# Fix Dropdown Themes, Footer Links, Areas Page Redesign, and Sort Button Active Colors

## Overview
This plan addresses four major issues: (1) all dropdown menus site-wide must use the champagne gradient instead of white, (2) footer needs "Projects" and "Buy/Sell" links, (3) the Areas page needs a full redesign with hero photo, transparent header, champagne grid background, and developer-style area cards with photos/descriptions, and (4) the active sort button color on the Areas page filter needs to match the approved champagne UI.

---

## Part 1: Fix All Dropdown Backgrounds from White to Champagne

**Problem:** The default `SelectContent` component (in `src/components/ui/select.tsx`) already has the correct champagne background (`bg-[#FDFBF7]`). However, many pages override this with `className="bg-white border-gold/30"`, which makes the dropdown appear white instead of champagne.

**Fix:** Remove the `bg-white` override from every `SelectContent` usage across all affected pages. The default component styling already handles the champagne gradient, gold border, and shadow correctly.

**Files affected:**
- `src/pages/Developers.tsx` (line 264): `bg-white` on tier filter dropdown
- `src/pages/PropertiesReelly.tsx` (lines 284, 302, 350, 370, 390): 5 dropdowns with `bg-white`
- `src/pages/Properties.tsx` (lines 527, 619, 638, 658, 739, 765, 784, 848, 869, 890): ~10 dropdowns with `bg-white`
- `src/pages/Contact.tsx` (lines 561, 587, 611): 3 dropdowns with `bg-white`
- `src/pages/ExecutiveAssistant.tsx` (lines 619, 712, 725): 3 dropdowns
- `src/pages/Admin.tsx` (lines 794, 841): 2 dropdowns

**Action for each:** Change `SelectContent className="bg-white border-gold/30"` to just `SelectContent` (no className override), letting the default champagne theme show through.

---

## Part 2: Add "Projects" Link to Footer + Ensure Buy/Sell Presence

**Problem:** The footer currently has "Buy Properties" and "Rent Properties" under the Properties card, and "Sell" as a separate card. There is no "Projects" link that maps to the `/properties` (Reelly projects) page, matching the header navigation.

**Fix in `src/components/Footer.tsx`:**
- Add `{ label: "Projects", href: "/properties" }` to the `propertiesLinks` array (after "Rent Properties" and before "Developers")
- This matches the header's "Projects" navigation item

---

## Part 3: Redesign Areas Page (`/areas`)

**Problem:** The current Areas page (`src/pages/AreaGuides.tsx`) has several issues:
1. No hero photo -- uses a dark gradient instead of a fullscreen hero image
2. The header is not transparent on initial load (it should be transparent over the hero, then become fixed/solid on scroll)
3. The grid section background is black (`bg-black`) instead of champagne
4. Area cards are small text-only boxes without photos, descriptions, or uniform sizing
5. The sort buttons (A-Z, Trending, Building icon) use `bg-gold text-black` for active state which the user says doesn't match the approved UI

### 3a. Hero Section -- Add Fullscreen Photo
- Replace the current dark gradient hero with a fullscreen background image (use an existing Dubai skyline asset or a placeholder image URL)
- The hero should be full viewport height on initial load (`min-h-screen` or `h-screen`)
- Overlay the title, stats, and search badge on top of the image with a dark gradient overlay
- Make the header transparent on initial load by adding a class/prop system (similar to how the Developers page handles it with `jj-hero-fullscreen`)

### 3b. Transparent Header on Initial Load
- The `GlobalHeader` component likely already supports transparent mode for hero pages. The Areas page needs to use the same hero class (`jj-hero-fullscreen`) that triggers transparent header behavior, matching the Developers page pattern.

### 3c. Grid Background -- Change from Black to Champagne
- Change `bg-black` (line 218) on the grid section to `bg-[hsl(var(--premium-bg))]` (the standard champagne premium background)
- Change text colors from white/zinc to black/zinc-700 accordingly

### 3d. Area Cards -- Developer-Style Cards with Photos and Descriptions
- Replace the current small text-only area links with full cards matching the DeveloperCard style
- Each card should include:
  - Area image (`area.image_url`) with fallback gradient
  - Area name as title
  - Area description (2-3 lines, truncated)
  - Emirate label
  - Property count badge
  - Trending indicator if applicable
- Cards should be uniform size (same height) in a responsive grid (1/2/3/4 columns)
- Link to `/area/{slug}` for the detail page

### 3e. Sort Button Active Color Fix
- Change the active state from `bg-gold text-black` to `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold text-black` (champagne gradient with gold border)
- The inactive state should use `bg-white border border-gold/30 text-zinc-700`
- This applies to the A-Z, Trending (flame icon), and Building icon sort buttons

---

## Part 4: Area Data Enrichment -- Provident Extraction

The user mentioned extracting area data from Provident and Reelly API projects. This is a data pipeline task that requires a backend edge function to scrape/fetch area information (photos, descriptions) from external sources. This is a separate task from the UI changes and will be noted for future implementation.

For now, the cards will use `area.image_url` (already in the database schema) and `area.description` (also in the schema). Areas without images will show a gradient placeholder.

---

## Technical Summary

| File | Changes |
|---|---|
| `src/pages/Developers.tsx` | Remove `bg-white` from SelectContent (line 264) |
| `src/pages/PropertiesReelly.tsx` | Remove `bg-white` from 5 SelectContent instances |
| `src/pages/Properties.tsx` | Remove `bg-white` from ~10 SelectContent instances |
| `src/pages/Contact.tsx` | Remove `bg-white` from 3 SelectContent instances |
| `src/pages/ExecutiveAssistant.tsx` | Remove `bg-white` from 3 SelectContent instances |
| `src/pages/Admin.tsx` | Remove `bg-white` from 2 SelectContent instances |
| `src/components/Footer.tsx` | Add "Projects" link to propertiesLinks array |
| `src/pages/AreaGuides.tsx` | Full redesign: fullscreen hero with photo, transparent header support, champagne grid background, developer-style area cards with photos/descriptions, fix sort button active colors |

## Execution Order
1. Fix all dropdown `bg-white` overrides across all pages (global consistency fix)
2. Add "Projects" link to footer
3. Redesign Areas page hero section with fullscreen photo
4. Change Areas grid background from black to champagne
5. Replace area text links with full developer-style cards
6. Fix sort button active/inactive styling
