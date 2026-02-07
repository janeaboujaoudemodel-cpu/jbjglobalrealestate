
# Footer Reorganization: Swap Services & Investor Hub + Align Grid

## Overview
Reorganize the footer's main link section from 4 unbalanced columns into a properly aligned 4x2 grid layout where:
- All section titles and dividers are horizontally aligned across each row
- Services moves up to replace Investor Hub's position
- Investor Hub moves down to where Services was

---

## Current Structure (Unbalanced)

```text
Column 1           | Column 2       | Column 3              | Column 4
-------------------|----------------|----------------------|------------------
Properties         | Investor Hub   | Guides               | About
Sell               | (empty space)  | Market Intelligence  | Careers
Services           |                |                      | Legal
```

---

## New Structure (Aligned 4x2 Grid)

```text
ROW 1 (Aligned titles + content):
Properties         | Services       | Guides               | About

ROW 2 (Aligned titles + content):
Sell               | Investor Hub   | Market Intelligence  | Careers + Legal
```

---

## Technical Changes

### File: `src/components/Footer.tsx`

#### Step 1: Restructure Column Layout
Change from 4 stacked columns to a true grid with two distinct rows:

**Row 1:** 4 equal columns
- Properties (Column 1)
- Services (Column 2) - moved from Column 1 bottom
- Guides (Column 3)
- About (Column 4)

**Row 2:** 4 equal columns
- Sell (Column 1)
- Investor Hub (Column 2) - moved from Column 2 top
- Market Intelligence (Column 3)
- Careers + Legal (Column 4)

#### Step 2: Apply Consistent Styling
Each section in a row gets:
- Same `min-height` for content area alignment
- Identical title styling: `font-bold text-xs sm:text-sm md:text-base uppercase tracking-[0.12em] mb-2 sm:mb-3 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30 text-gold`
- Same padding and spacing

#### Step 3: Add Row Divider
Insert a gold gradient divider between Row 1 and Row 2 to visually separate the two aligned rows.

---

## Layout Diagram

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                            CHAMPAGNE CARD                                     │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────────┤
│   PROPERTIES    │    SERVICES     │     GUIDES      │        ABOUT            │
│   ───────────   │   ───────────   │   ───────────   │      ───────────        │
│   • Buy Props   │   • All Svcs    │   • Buyer Guide │      • About JBJ        │
│   • Rent Props  │   • Buyer Adv   │   • Seller Guide│      • Founder          │
│   • Developers  │   • Seller Adv  │   • Landlord    │      • Team             │
│   • List Prop   │   • Leasing     │   • Tenant      │      • Awards           │
│                 │   • Investment  │   • Area Guides │      • News             │
│                 │   • Snagging    │   • Golden Visa │                         │
│                 │   • Prop Mgmt   │   • FAQs        │                         │
├─────────────────┴─────────────────┴─────────────────┴─────────────────────────┤
│                          ═══ GOLD DIVIDER ═══                                 │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────────┤
│      SELL       │  INVESTOR HUB   │  MARKET INTEL   │    CAREERS + LEGAL      │
│   ───────────   │   ───────────   │   ───────────   │      ───────────        │
│   • Sell Prop   │   • Education   │   • Overview    │      • Apply            │
│   • Seller Guide│   • FAQs        │   • Area Intel  │      • HR Agent         │
│   • Valuation   │   • Tools       │   • Reports     │      • Training         │
│   • Advisory    │   • Dashboard   │   • Methodology │      ───────────        │
│                 │                 │                 │      LEGAL              │
│                 │                 │                 │      • Terms            │
│                 │                 │                 │      • Privacy          │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────────┘
```

---

## Code Changes Summary

### Lines ~545-720: Replace the 4-column layout

**Current structure (lines 545-720):**
- Single grid with 4 columns, each column stacks multiple sections vertically

**New structure:**
- Two separate rows, each with a 4-column grid
- Row 1: Properties | Services | Guides | About
- Row 2: Sell | Investor Hub | Market Intelligence | Careers + Legal
- Gold divider between rows
- Consistent `min-height` per row for alignment

### Styling Consistency
All 8 sections will use:
- Title: `font-bold text-xs sm:text-sm md:text-base uppercase tracking-[0.12em] mb-2 sm:mb-3 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30 text-gold`
- Content spacing: `space-y-1 sm:space-y-1.5 md:space-y-2.5`
- Link styling: `text-zinc-700 hover:text-gold transition-all duration-300 text-xs sm:text-sm md:text-base inline-block hover:translate-x-1`
- Padding: `p-2 sm:p-3 md:p-5`

---

## Benefits of This Approach
1. **Visual alignment** - All titles in each row are at the same height
2. **Clean separation** - Row 1 contains "main" categories, Row 2 contains "secondary" categories
3. **Swapped positions** - Services is now prominent (Row 1), Investor Hub is in Row 2
4. **Consistent styling** - Same min-heights ensure dividers and titles align across columns
