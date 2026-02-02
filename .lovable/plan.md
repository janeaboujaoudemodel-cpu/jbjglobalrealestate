
# Fix Section Title Divider Alignment in Header Mega Menus

## Issue Identified

In the mega menu dropdowns (Investor Hub, Broker Hub, etc.), when there are two columns side-by-side with section titles, the **gold divider line under each section title** (`border-b border-gold/30`) is NOT horizontally aligned.

**Example - Investor Hub:**
- Column 1: "Dashboard & Portfolio" section title
- Column 2: "Investor Tools" section title
- The bottom borders of these titles should be at the **same vertical position**, but they may appear misaligned if text wrapping or icon spacing differs.

## Root Cause

The `MegaMenuSectionTitle` component in `mega-menu-primitives.tsx` uses:
```tsx
<div className="flex items-center justify-between mb-5 pb-2 border-b border-gold/30">
```

This has **no fixed height**, so if one title is slightly taller (due to font rendering, icon size, or wrapping), the dividers won't align.

## Solution

**Set a consistent minimum height on the section title container** to ensure all section title dividers align at the same vertical position across columns.

---

## Technical Changes

### File 1: `src/components/header/mega-menu-primitives.tsx`

**Update `MegaMenuSectionTitle` component (lines 121-133):**

**Current:**
```tsx
<div ref={ref} className="flex items-center justify-between mb-5 pb-2 border-b border-gold/30">
```

**Change to:**
```tsx
<div ref={ref} className="flex items-center justify-between mb-5 pb-2 border-b border-gold/30 min-h-[36px]">
```

The `min-h-[36px]` ensures all section titles have the same minimum height, so their bottom borders align horizontally across adjacent columns.

---

## Affected Mega Menus (Auto-Fixed by Primitive Change)

| Menu | Columns with Section Titles |
|------|----------------------------|
| **MegaMenuInvestorHub** | "Dashboard & Portfolio" ↔ "Investor Tools" |
| **MegaMenuBrokerHub** | "Dashboard & Tools" ↔ "Education & Resources" |
| **MegaMenuMore** | 4 columns: "About & Company", "Resources & Guides", "Partners & Tools", "Legal & Trust" |
| **MegaMenuServices** | Single "Our Services" title |
| **MegaMenuDevelopers** | Single "Top Developers in Dubai" title |
| **MegaMenuAreas** | Single "Top Areas in Dubai" title |
| **MegaMenuSearch** | Single "Search & Shortcuts" title |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/header/mega-menu-primitives.tsx` | Add `min-h-[36px]` to `MegaMenuSectionTitle` container |

---

## Visual Result

| Before | After |
|--------|-------|
| Section title dividers at different vertical positions | All section title dividers **perfectly aligned horizontally** |
| Inconsistent spacing across columns | Uniform, professional appearance |
