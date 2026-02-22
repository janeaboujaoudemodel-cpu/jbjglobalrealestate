

# UI Polish and Mega Menu Updates

This plan addresses 5 distinct issues: the Golden Visa contact CTA visibility, account dropdown loading and active color styling, page premium styling, and missing mega menu links.

---

## 1. Golden Visa -- Make "Contact Our Team" a Premium CTA Button

**Problem:** The "Contact our team for professional guidance" link (line 630-634 in `GoldenVisaGuide.tsx`) is a tiny underlined text link that's nearly invisible.

**Fix in `src/pages/guides/GoldenVisaGuide.tsx` (lines 629-634):**
- Replace the plain text link with a full-width premium CTA section
- Use a champagne-gold gradient background card with a large Button component
- Include a Phone icon and descriptive subtitle
- Style: `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]` card, large gold-bordered button with dark text, proper padding (`py-12`), and a bold heading above it

---

## 2. Account Dropdown -- Instant Loading and Champagne Active Colors

**Problem A:** The account dropdown content loads partially (empty cards then populated). This is caused by multiple async queries (`crmProfile`, `hasListingAdminAccess`, `tierProgress`) that resolve at different times.

**Fix in `src/components/header/MegaMenuAccount.tsx`:**
- The `isDataLoading` flag (line 202) already exists but may not gate all content. Ensure the entire dropdown body shows a single unified skeleton state until `isDataLoading` is false, preventing partial rendering.

**Problem B:** The active currency/unit buttons use `bg-gold text-black` (a flat yellow/gold). User wants the champagne highlight style matching the owner dashboard.

**Fix in `src/components/header/MegaMenuAccount.tsx` (lines 339-343, 360-363):**
- Change active state from `bg-gold text-black` to `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-[#C8A766]/60 shadow-sm`
- This matches the premium champagne highlight used in the owner dashboard

---

## 3. Golden Visa and Guide Pages -- More Premium Champagne Styling

**Problem:** The white/pearl card sections look plain. User wants richer gold champagne premium feel with better titles and dividers.

**Fix in `src/pages/guides/GoldenVisaGuide.tsx`:**
- Update `Section` wrapper (line 46-54): change white sections from `bg-white` to `bg-gradient-to-b from-white to-[#FDFBF7]`, and ivory sections from `bg-[#FAF6EE]` to `bg-gradient-to-br from-[#FAF6EE] via-[#F5EBD7]/30 to-[#FAF6EE]`
- Enhance `SectionHeader` (line 56-65): add a subtle gold underline beneath each title (`border-b-2 border-[#C8A766]/30 pb-4`)
- Upgrade the gold divider between sections from `h-px` to `h-[2px]` with a richer gold gradient

---

## 4. Mega Menu Services -- Add Missing Links

**Problem:** The Services mega menu is missing: Rental Index, Property Valuation, and Snagging (already listed but user reported missing -- verify and ensure visibility).

**Fix in `src/components/header/MegaMenuServices.tsx`:**
- Snagging & Inspection already exists (line 15) -- confirmed present
- Add `Property Valuation` to `coreServices` array: `{ name: 'Property Valuation', href: '/sell/valuation', icon: Calculator }`
- Add `Rental Index` to `coreServices` array: `{ name: 'Rental Index', href: '/rental-index', icon: TrendingUp }`
- Import `TrendingUp` from lucide-react

Also update `src/components/header/MegaMenuInsights.tsx` Services block (lines 55-62):
- Add `Rental Index` link: `{ label: 'Rental Index', href: '/rental-index', icon: TrendingUp }`
- Add `Short-term Rentals` link: `{ label: 'Short-term Rentals', href: '/services/short-term-rentals', icon: Calendar }`
- Add `Snagging & Inspection` link: `{ label: 'Snagging & Inspection', href: '/services/snagging', icon: ClipboardCheck }`
- Import `TrendingUp`, `Calendar`, `ClipboardCheck` from lucide-react

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/pages/guides/GoldenVisaGuide.tsx` | Premium CTA button for contact, richer section backgrounds and dividers |
| `src/components/header/MegaMenuAccount.tsx` | Champagne active color for currency/unit buttons, unified skeleton loading |
| `src/components/header/MegaMenuServices.tsx` | Add Property Valuation and Rental Index links |
| `src/components/header/MegaMenuInsights.tsx` | Add Rental Index, Short-term Rentals, Snagging to Services block |

