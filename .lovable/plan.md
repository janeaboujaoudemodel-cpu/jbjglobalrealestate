

# Fix Plan: Prices, Palm Jumeirah Content, Recommendations UI, and Sold Status

## Problem 1: Broken Prices (Decimal Garbage)

**Root cause:** The database stores prices with floating-point artifacts (e.g., `4205000.0135` instead of `4,205,000`). The `formatPriceWithCurrency` function in both `ProjectCard.tsx` and `ReellyProjectCard.tsx` uses `.toFixed(2)` for millions, which produces values like `AED 4.21M` -- but worse, for some prices it shows the raw decimal noise.

**Fix:** Round all prices to the nearest whole number before formatting. Changes in 3 places:

1. **`src/components/ProjectCard.tsx` (line 49-58)** -- Replace `formatPriceWithCurrency`:
   - Round `converted` to nearest integer with `Math.round()` before any formatting
   - For millions: use `(Math.round(converted) / 1000000).toFixed(1)` (one decimal max, e.g., "AED 4.2M")
   - For thousands: same `Math.round` treatment
   - Remove `.toFixed(2)` which shows ugly two-decimal values

2. **`src/components/ReellyProjectCard.tsx` (line 47-57)** -- Same fix as above (identical function)

3. **`src/components/PropertyRecommendationPopup.tsx` (line 134-138)** -- Same fix for its `formatPrice` function

4. **`src/utils/formatNumber.ts` (line 46)** -- Already uses `maximumFractionDigits: 0` which is correct, but add explicit `Math.round()` before `toLocaleString` as an extra safeguard

## Problem 2: Missing Prices and "Sold Out" Status

**Database shows:** Villa Amaya, Villa Elaine, Five Palm, Luce, Orla Infinity, Seven Palm, Searenity, Six Senses, The Palm Tower, Royal Bay, SLS Residences all have `is_sold_out: true` or `sale_status: Sold Out` with `price_from: null`.

**Fix in `ProjectCard.tsx`:**
- When `price_from` is null AND project is sold out (`is_sold_out === true` or `sale_status` contains "Sold"), show "Sold" instead of hiding the price line entirely
- When `price_from` is null and NOT sold out, show "Price on Request"

**Changes:**
- `src/components/ProjectCard.tsx` (lines 307-314) -- Replace the price display block to handle null prices with sold-out status
- `src/components/ReellyProjectCard.tsx` -- Same treatment

## Problem 3: Palm Jumeirah Description Too Short

Current description in the database: "Palm Jumeirah is the iconic artificial island offering luxury living with stunning waterfront views." -- one sentence only.

**Fix:** Update the `areas` table to add a rich, detailed description for Palm Jumeirah including:
- Development history (started 2001, by Nakheel)
- Key facts (5.72 km long, shaped like a palm tree)
- Price appreciation data (yearly increases)
- Lifestyle highlights (beach clubs, luxury hotels, dining)
- Investment appeal

This will be a database update (UPDATE query on the areas table).

Additionally, update `AreaAboutSection.tsx` to display longer descriptions with proper formatting -- split into paragraphs if the description is long enough (over 300 characters).

## Problem 4: Recommendation Popup UI Colors

The recommendation popup currently uses `bg-gradient-to-br from-zinc-900 via-black to-zinc-900` with `border-gold/30`. The user wants the colors/UI improved.

**Fix in `PropertyRecommendationPopup.tsx`:**
- Change the popup background to a premium dark gradient with gold accent: `bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#1a1a1a]` with `border border-gold/50`
- Increase border visibility and add a subtle gold glow: `shadow-[0_0_30px_rgba(212,175,55,0.15)]`
- Make project cards inside the popup have stronger hover contrast

## Implementation Order

1. Fix `formatPriceWithCurrency` in ProjectCard.tsx and ReellyProjectCard.tsx (price rounding)
2. Fix null price display -- show "Sold" or "Price on Request"
3. Fix PropertyRecommendationPopup price formatting and UI colors
4. Update Palm Jumeirah description in the database
5. Update AreaAboutSection to handle long descriptions with paragraph breaks

## Files Changed

- `src/components/ProjectCard.tsx` -- Fix formatPriceWithCurrency, handle null prices
- `src/components/ReellyProjectCard.tsx` -- Same price fixes
- `src/components/PropertyRecommendationPopup.tsx` -- Fix formatPrice and UI colors
- `src/components/area-detail/AreaAboutSection.tsx` -- Support long descriptions with paragraphs
- `src/utils/formatNumber.ts` -- Add Math.round safeguard
- Database: UPDATE areas SET description = '...' WHERE slug = 'palm-jumeirah'

