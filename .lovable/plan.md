

## Mortgage Calculator Cards - Add Property Price & Improve Interest Display

### Overview
Enhance the compact mortgage calculator cards on the homepage by adding a Property Price card and improving the clarity of all cards, especially the Interest card which currently shows confusing information.

---

### Current Issue Analysis

**Interest Calculation Verification:**
The calculation IS mathematically correct:
- Property: AED 2,000,000
- Loan Amount: AED 1,600,000 (80%)
- At 4.5% over 25 years = AED 1,067,000 total interest

This is accurate - over 25 years, compound interest on AED 1.6M at 4.5% does equal approximately AED 1M. However, the current card shows "25 Years" which doesn't explain the percentage of total cost.

**Current Problems:**
1. No Property Price card (users want to see the starting price)
2. Cards not in logical order
3. Interest card shows "25 Years" instead of a meaningful percentage
4. Monthly payment shows "/month" instead of a useful percentage

---

### Proposed Changes

**1. Add Property Price Card (New)**
| Field | Value |
|-------|-------|
| Label | Property Price |
| Percentage | 100% |
| Amount | AED 2,000,000 |
| Icon | Building2 |

**2. New Card Order (5 cards total)**
1. Property Price (100%) - AED 2,000,000
2. Down Payment (20%) - AED 400,000
3. Loan Amount (80%) - AED 1,600,000
4. Total Interest (53% of loan) - AED 1,067,000
5. Monthly Payment - AED 8,890/month

**3. Interest Card Improvements**
- Change percentage display from "25 Years" to the **interest as % of loan amount**
- Formula: `(totalInterest / loanAmount) * 100` = 66.7% (interest adds 67% to your loan)
- Or show as % of total payment: `(totalInterest / totalPayment) * 100` = 40%
- Add subtitle showing rate and term: "@ 4.5% | 25 yrs"

**4. Monthly Payment Card Improvements**
- Show as percentage of total payment divided by months
- Or show relative affordability indicator

---

### Layout Change

**Current: 4 cards in 2x2 grid on mobile, 4 columns on desktop**
```
[Down Payment] [Monthly] [Loan] [Interest]
```

**New: 5 cards - 2+3 pattern on mobile, 5 columns on desktop**
```
Mobile:
[Property Price] [Down Payment]
[Loan Amount] [Interest] [Monthly]

Desktop:
[Property] [Down] [Loan] [Interest] [Monthly]
```

---

### Technical Implementation

**File to modify:** `src/components/MortgageCalculator.tsx`

**Changes:**

1. **Add Building2 icon import** (line 2)

2. **Add new calculated values** (inside useMemo, around line 58):
   ```typescript
   const interestPercentOfLoan = (totalInterest / loanAmount) * 100;
   const interestPercentOfTotal = (totalInterest / totalPayment) * 100;
   ```

3. **Update compact view grid** (line 90):
   - Change from `grid-cols-2 sm:grid-cols-4` to `grid-cols-2 sm:grid-cols-5`

4. **Add Property Price card first** (before Down Payment card):
   - Icon: Building2
   - Label: Property Price
   - Percentage: 100%
   - Value: formatCurrency(propertyPrice)

5. **Reorder cards**:
   - Property Price (new) → Down Payment → Loan Amount → Interest → Monthly Payment

6. **Update Interest card display**:
   - Change from showing "25 Years" to showing meaningful percentage
   - Add subtitle with rate and term info

7. **Update Monthly Payment card**:
   - Keep "/month" indicator
   - Consider adding percentage of annual income context

---

### Visual Outcome

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 🏢 Property     │ │ 📊 Down Payment │ │ 💰 Loan Amount  │ │ 📈 Interest     │ │ 🧮 Monthly      │
│ 100%            │ │ 20%             │ │ 80%             │ │ 67% of loan     │ │ /month          │
│ AED 2,000,000   │ │ AED 400,000     │ │ AED 1,600,000   │ │ AED 1,067,000   │ │ AED 8,890       │
│                 │ │                 │ │                 │ │ @ 4.5% | 25 yrs │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

### Note on Interest Amount

The ~AED 1 million interest on a AED 2 million property IS correct:
- Borrowing AED 1.6M for 25 years at 4.5% = AED 1.07M in interest
- This is standard mortgage math - over 25 years, interest accumulates significantly
- The percentage display will help users understand this represents 67% added cost on their loan, not the annual rate

