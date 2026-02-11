

# Fix Plan: Marquee Spacing, Trust Bar Padding, Premium Search Bar, and Properties Page Issues

## 1. Developer Marquee -- Uniform Spacing and Dubai Properties Logo Size

**File:** `src/components/DeveloperPartnersMarquee.tsx`

The logo containers are all `w-[140px]` but some logos (like Dubai Properties) are inherently smaller images. The `gap-10` is already uniform so the actual gap between items is the same -- the perceived difference comes from smaller logos leaving more whitespace inside their container.

**Fix:**
- Keep `gap-10` (already uniform)
- Increase the Dubai Properties logo container specifically, or better: increase the image height constraint from `h-[28px] md:h-[36px] lg:h-[40px]` to a slightly taller uniform value like `h-[36px] md:h-[42px] lg:h-[48px]` so smaller logos render larger
- This ensures all logos fill their containers more consistently

## 2. Trust Bar Section -- Equal Vertical Spacing

**File:** `src/pages/Index.tsx`

Currently (lines 214-230):
- The Trust Bar section has `py-12 md:py-16` 
- "Trusted By Thousands" has `mb-8 md:mb-10` below it
- "Excellence Guaranteed" has `mt-8 md:mt-10` above it

The section after (FeaturedListings) has its own `py-12 md:py-16`. The spacing between "Excellence Guaranteed" and "Handpicked For You" may differ from the spacing between the developer marquee and "Trusted By Thousands."

**Fix:**
- Ensure the Trust Bar section's top padding matches the bottom spacing before "Handpicked For You" 
- Adjust the Trust Bar `py` values to create visually equal gaps above and below

## 3. Properties Page Search Bar -- Premium Inline Sticky Design

**File:** `src/pages/Properties.tsx`

The current filter section (line 421+) has filters in a grid layout with champagne cards. The user wants:
- All filter dropdowns in ONE horizontal line (not a grid)
- Premium, consistent styling (not mixed square/border styles)
- Sticky under the header on scroll
- Consistent rounded styling across all select triggers

**Fix:**
- Change the filter grid from `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6` to a single-row `flex flex-wrap` layout
- Ensure all SelectTrigger elements have identical `rounded-xl` styling matching the premium champagne gradient
- The section is already `sticky top-14 sm:top-16 md:top-20 lg:top-[72px]` -- this is correct
- Clean up inconsistent border-radius values (some `rounded-lg`, some should be `rounded-xl`)

## 4. "View All Projects" Showing 0 Properties

**File:** `src/pages/Properties.tsx`

When navigating to `/properties` from "View All Projects" (no URL params), the `defaultExtendedFilters` sets `transactionType: 'buy'`. This should show all buy properties. However, the `useEffect` on line 194 may re-run when `developers` data loads and potentially interfere.

**Root cause:** The `useEffect` dependency on `[searchParams, developers]` means it re-runs when developers load. When there are no URL params, the condition on line 237 is false, so it does nothing -- this is correct. But if there's a stale `searchParams` from a previous navigation, it could cause issues.

**Fix:**
- Add a guard: when navigating to `/properties` with NO params at all, explicitly ensure `appliedFilters` are set to defaults that show all projects
- Make the "Browse All Properties" button use `<Link to="/properties">` instead of just `onClick={clearFilters}` to ensure it navigates AND clears filters

## 5. "Browse All Properties" Button Not Clickable

**File:** `src/pages/Properties.tsx` (line 1134-1136)

The button calls `clearFilters` which resets state but doesn't navigate. If the user is already on `/properties`, this should work. But there might be a rendering issue where the button isn't receiving clicks.

**Fix:**
- Change `<Button onClick={clearFilters}>` to ensure it works reliably
- Add explicit `cursor-pointer` and verify the button's variant classes don't block interaction

## Summary of Files to Change

| File | Changes |
|------|---------|
| `src/components/DeveloperPartnersMarquee.tsx` | Increase logo height constraints for uniform visual size |
| `src/pages/Index.tsx` | Equalize Trust Bar section padding top/bottom |
| `src/pages/Properties.tsx` | Inline flex filter layout; fix "0 results" on fresh navigation; fix "Browse All" button |

