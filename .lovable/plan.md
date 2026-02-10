
# Standardize Mortgage Calculator Cards Globally

## What Changes

The homepage compact mortgage calculator shows 4 champagne gold cards (Property Price, Down Payment, Loan Amount, Monthly Payment). The user wants this same card layout to appear **everywhere** the mortgage calculator is shown, plus two additional cards: **Interest Rate** and **Total Cost After Mortgage**.

Currently:
- **Homepage** (`compact=true`): Shows 4 champagne cards only -- missing interest and total cost
- **Full calculator** (`compact=false`): Shows sliders on left + a different results layout on right (no champagne cards)
- **Project detail page**: Uses full calculator (`compact=false`)
- **Dedicated /mortgage-calculator page**: Uses full calculator
- **Property Suite tab**: Uses full calculator via page embed
- **Real Estate Suite tab**: Uses full calculator via page embed

## The Fix

**File: `src/components/MortgageCalculator.tsx`**

### 1. Add 2 new cards to the compact view (lines 92-157)

Currently the compact view has a `grid-cols-4` with 4 cards. Change to a **6-card grid** (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`) adding:

- **Card 5 -- Interest Rate**: Shows `4.5%` (the current rate) as the gold percentage, and the total interest amount (e.g., `AED 1,234,567`) as the value. Label: "Interest Rate". Subtitle shows the loan term (e.g., "25 Years").
- **Card 6 -- Total Cost**: Shows `100%` as the gold percentage, and the total payment amount (property price + total interest, i.e., `calculations.totalPayment`) as the value. Label: "Total Cost". This tells the buyer exactly how much the property will cost them after the mortgage.

Same champagne gradient styling as existing 4 cards.

### 2. Show the 6 champagne summary cards in the full (non-compact) view too

In the full calculator's results section (lines 298-385), **replace the current 2x2 breakdown grid** (lines 312-334) with the same 6 champagne cards from compact mode. This ensures the user sees the same familiar card layout whether on the homepage, project page, or dedicated calculator page.

The full view will keep:
- The "Estimated Monthly Payment" hero block (lines 300-310) -- keep as-is
- Replace the 2x2 muted grid (lines 312-334) with the 6 champagne cards
- Keep the payment breakdown bar (lines 336-365)
- Keep the disclaimer and CTA

### 3. Responsive grid

- Mobile: 2 columns (3 rows of 2 cards)
- Tablet: 3 columns (2 rows)
- Desktop: 6 columns (1 row) for compact; 3 columns (2 rows) for full view (since it shares space with sliders)

## Files to Modify

| File | Change |
|---|---|
| `src/components/MortgageCalculator.tsx` | Add Interest Rate and Total Cost cards to compact view; replace 2x2 breakdown in full view with same 6 champagne cards |

No other files need changes -- every location (homepage, project detail, dedicated page, suites) uses the same `MortgageCalculator` component, so fixing it once applies globally.

## Technical Details

The 2 new cards use data already computed in `calculations`:
- Interest card: `interestRate` (state) + `calculations.totalInterest`
- Total Cost card: `calculations.totalPayment`

The champagne card style is already defined on lines 96-149 and will be reused identically for the new cards. The `TrendingUp` icon (already imported) will be used for Interest, and a wallet/receipt icon for Total Cost.
