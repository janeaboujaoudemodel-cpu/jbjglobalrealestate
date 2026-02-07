

## Homepage Mortgage Calculator Cards - Champagne Gold Styling

### Overview
Update the four compact mortgage calculator cards (Down Payment, Monthly Payment, Loan Amount, Interest) on the homepage to use the premium champagne gold theme instead of the current dark zinc styling.

---

### Current Styling (lines 91-145 in `src/components/MortgageCalculator.tsx`)

The four cards currently use:
- **Background**: `bg-zinc-900/80` (dark zinc)
- **Border**: `border-gold/30`
- **Text colors**: `text-zinc-400` for labels, `text-gold` for percentages, `text-white` for values

---

### New Champagne Gold Styling

Each card will be updated to use the established champagne gradient theme:

**Updated card classes:**
- **Background**: `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]`
- **Border**: `border-gold/40`
- **Text colors**: 
  - Labels: `text-black/60` (for readability on light background)
  - Percentages: `text-gold` (stays gold for emphasis)
  - Currency values: `text-black` (high contrast on champagne)

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/MortgageCalculator.tsx` | Update the 4 compact mode cards (lines 92, 106, 120, 134) to use champagne gradient background and appropriate text colors |

---

### Detailed Changes

**Card 1 - Down Payment (line 92):**
- Change: `bg-zinc-900/80 border border-gold/30` → `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40`
- Change label: `text-zinc-400` → `text-black/60`
- Change value: `text-white` → `text-black`

**Card 2 - Monthly Payment (line 106):**
- Same background and border changes
- Same text color updates

**Card 3 - Loan Amount (line 120):**
- Same background and border changes
- Same text color updates

**Card 4 - Total Interest (line 134):**
- Same background and border changes
- Same text color updates

**Footer text (line 150):**
- Update: `text-zinc-400` → `text-black/60` for consistency

---

### Visual Result

```text
Before:                              After:
┌────────────────────────┐          ┌────────────────────────┐
│ ████ DARK ZINC ████████│          │ ░░░░ CHAMPAGNE ░░░░░░░░│
│ Down Payment           │          │ Down Payment           │
│ 20%                    │          │ 20%                    │
│ AED 400,000           │          │ AED 400,000           │
└────────────────────────┘          └────────────────────────┘
        (dark bg)                          (champagne gradient)
```

