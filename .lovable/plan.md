
# Homepage Improvements - Multiple Fixes

## 1. Handpicked For You - Card & Price Fixes

### Equal card sizes
- All cards already use `flex flex-col h-full` but the content area `min-h-[140px]` can vary. Will enforce a fixed content height so all cards render identically.

### Price badge - move to bottom-right of photo with premium styling
- Move the price badge from `top-3 right-3` to `bottom-3 right-3` on the photo
- Upgrade background from `bg-black/70 border-amber-500/50` to a premium dark gradient with gold border: `bg-gradient-to-br from-black/90 via-black/80 to-gold/20 border border-gold/50 backdrop-blur-md`
- Keep text in gold tones but make it bolder and more refined

### Handover date in orange
- Change handover date text color from `text-zinc-500` to `text-orange-500` in the card content area

### Listing curation changes
- **Remove Binghatti Village**: There's no "Binghatti Village" in the DB, but the current code picks 2 Binghatti (Bugatti + Mercedes). Will change to pick only 1 Binghatti (Bugatti only).
- **Add DAMAC Lagoons**: Replace the second Binghatti slot with a specific DAMAC Lagoons pick (slug: `damac-lagoons-damac-56`)
- **Keep 1 Emaar**: Add `addOne('Emaar')` back to the priority list so one Emaar project appears (e.g., Grove Ridge or Golf Hills)
- Final order: DAMAC, DAMAC Lagoons, ALDAR, Omniyat, Sobha, Nakheel, Binghatti (Bugatti only), Emaar (1 premium)

**File:** `src/components/home/FeaturedListings.tsx`

## 2. Trust Bar Section - Add Gold Divider Below 4 Cards

Add a second gold divider line (matching the existing "Trusted By Thousands" line style) below the TrustBar cards, creating a balanced frame: divider above, 4 cards, divider below.

**File:** `src/pages/Index.tsx` (lines 210-220)

## 3. Mortgage Calculator - 3x2 Grid Layout

The current `grid-cols-2 sm:grid-cols-3` already does 3 columns on desktop, but the cards are cramped because the numbers are long. Changes:
- Change grid to `grid-cols-2 lg:grid-cols-3` with slightly larger padding
- Make the currency values use `text-[11px] lg:text-sm` to fit within card width
- Remove the percentage row (`100%`, `20%`, etc.) that takes space, and combine it as a suffix to the label instead
- This gives more vertical space for the actual price numbers to be readable

**File:** `src/components/MortgageCalculator.tsx` (lines 342-393)

## Technical Details

### FeaturedListings.tsx changes:
- Line 96-106: Replace curation logic -- remove second `addOne('Binghatti')`, add `addOne('DAMAC', 'lagoons')` and `addOne('Emaar')`
- Line 204-217: Move price badge from `top-3 right-3` to `bottom-3 right-3`, upgrade bg/border classes
- Line 258-264: Change handover date from `text-zinc-500` to `text-orange-500 font-semibold`

### Index.tsx changes:
- After line 219 (`<TrustBar />`), add a matching gold divider line identical to lines 213-217

### MortgageCalculator.tsx changes:
- Line 343: Change grid to `grid-cols-2 lg:grid-cols-3` (already correct, but increase gap)
- Lines 348-392: Remove the standalone percentage `<p>` rows from each card to save vertical space; fold the percentage into the label text. Reduce font sizes on currency values for readability.
