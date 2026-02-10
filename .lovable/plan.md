
# Fix 4 Homepage and Header Issues

## Issue 1: Featured Projects on Homepage ("Handpicked For You")

Currently, `FeaturedListings.tsx` uses an empty `sampleListings` array and shows placeholder cards. It needs to fetch real projects from the database, prioritizing top developers (Emaar, Omniyat, Sobha, Aldar).

**Changes:**
- **`src/components/home/FeaturedListings.tsx`**: Replace empty static array with a live database query using `useQuery` + Supabase. Query projects from the `projects` table where `developer_name` is in the elite list (`Emaar`, `Omniyat`, `Sobha`, `ALDAR`), with status `available` or `active`. Join with `project_images` for the first image. Display 8 cards (2 per developer) showing name, developer, price, location, cover image, and link to the project detail page (`/projects/{slug}`). Remove the Buy/Rent tabs (these are projects, not listings) and show a clean grid of project cards instead.

---

## Issue 2: Account Dropdown Loads in Two Stages

The account mega-menu (`MegaMenuAccount.tsx`) shows a smaller dropdown first, then expands when `ownerLoading` resolves and CRM/listing admin queries finish. The `minHeight: 440px` container shifts when content appears.

**Changes:**
- **`src/components/header/MegaMenuAccount.tsx`**: 
  - Remove the `ownerLoading` spinner -- instead, always render the full layout skeleton with both columns immediately.
  - Show the Owner Shortcuts column with skeleton placeholder links while `ownerLoading` or `crmLoading` is true, so the dropdown never changes size.
  - Once queries resolve, swap skeletons for real links (or hide column if no access). This way the dropdown opens at full size instantly, no two-stage resize.

---

## Issue 3: Search Mega Menu Stays Open When Cursor Leaves

The search icon in the header (line 1433 of `GlobalHeader.tsx`) opens the `GlobalSearchModal` directly on hover. However, it does NOT use the mega menu system -- it calls `setSearchOpen(true)` which opens a full-screen modal. This modal doesn't close on mouse leave because it's a separate modal, not a hover-based mega menu.

**Changes:**
- **`src/components/GlobalHeader.tsx`** (lines 1433-1454): Change the search icon behavior:
  - On hover, open the `MegaMenuSearch` panel (same as language/account) using `handleMegaMenuEnter('search')` instead of `setSearchOpen(true)`.
  - On click, also open the `MegaMenuSearch` panel.
  - The `MegaMenuSearch` panel already closes on mouse leave (line 1496) via `handleMegaMenuLeave`, so this fix aligns search with the same behavior as language and account dropdowns.

---

## Issue 4: Hero Search Bar -- Inconsistent Borders/Shapes

The hero search bar (`HeroSearchBar.tsx`) has visual inconsistency: the location input has `rounded-xl` on mobile but `rounded-l-xl rounded-r-none` on desktop, while the desktop controls section uses `border-y border-r` (no left border, no rounding on left), and the search button has `rounded-r-xl`. This creates a jarring look where parts have different border radii.

**Changes:**
- **`src/components/home/HeroSearchBar.tsx`** (lines 628-643, 970-982): Unify the search bar into a single cohesive rounded container:
  - Wrap the entire desktop search bar in one unified `rounded-xl` container with consistent `bg-white/10 backdrop-blur-md border border-white/30`.
  - Remove individual border classes from the input and controls sections so they share one border.
  - Ensure the search button blends into the right side with matching rounding.
  - On mobile, each element keeps full `rounded-xl` since they stack vertically.

---

## Files to Modify

| File | Change |
|---|---|
| `src/components/home/FeaturedListings.tsx` | Fetch real projects from DB for elite developers, display as project cards |
| `src/components/header/MegaMenuAccount.tsx` | Show skeleton links while loading to prevent two-stage dropdown |
| `src/components/GlobalHeader.tsx` | Change search icon hover to use mega menu system instead of modal |
| `src/components/home/HeroSearchBar.tsx` | Unify border radius and borders into one cohesive search bar container |
