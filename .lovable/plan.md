
# Broker Education Page Overhaul and Missing Navigation Links

## Overview

This plan addresses 9 distinct issues across the Broker Education page, footer navigation, and the Graphic Designer tool. The scope is large, so changes are organized by priority.

---

## Part 1: Add Missing FAQ Pages to Footer Navigation

**Problem:** The Guides section in the footer only lists "General FAQs" (`/faq`). Missing: Buyer FAQ, Seller FAQ, Landlord FAQ, Tenant FAQ.

Existing FAQ pages: `/faq`, `/investor-faq`, `/broker-faq`. The buyer/seller/landlord/tenant FAQ pages do NOT exist yet.

**Changes:**

1. **Create 4 new FAQ pages** (following the same pattern as `InvestorFAQ.tsx` and `BrokerFAQ.tsx`):
   - `src/pages/BuyerFAQ.tsx` at route `/buyer-faq`
   - `src/pages/SellerFAQ.tsx` at route `/seller-faq`
   - `src/pages/LandlordFAQ.tsx` at route `/landlord-faq`
   - `src/pages/TenantFAQ.tsx` at route `/tenant-faq`
   - Each page uses the premium champagne UI (not the black dark theme)

2. **Add routes in `App.tsx`** for the 4 new FAQ pages

3. **Update `Footer.tsx`** -- Add FAQ links to the Guides section:
   ```
   guidesLinks = [
     ...existing guides...,
     { label: "Buyer FAQs", href: "/buyer-faq" },
     { label: "Seller FAQs", href: "/seller-faq" },
     { label: "Landlord FAQs", href: "/landlord-faq" },
     { label: "Tenant FAQs", href: "/tenant-faq" },
     { label: "General FAQs", href: "/faq" },  // already exists
   ]
   ```

---

## Part 2: Fix White Text on White/Champagne Backgrounds (Full Audit)

**Problem:** The `BookLanguageFilter` dropdown uses `text-white` for items and `bg-black/95` background. This is on a champagne page. The non-selected languages appear in white text which blends on light backgrounds.

**Changes in `src/components/broker-education/BookLanguageFilter.tsx`:**
- Change trigger button: remove `text-white`, use `text-black` + `bg-white/80 border-gold/40` (champagne-appropriate)
- Change dropdown: `bg-white border-gold/30` instead of `bg-black/95`
- Change items: `text-black` default, `hover:bg-gold/10 hover:text-gold`, active items `text-gold bg-gold/15`

**Global audit scope** -- check other dropdowns on champagne pages:
- Any dropdown using `text-white` on `bg-white` or champagne backgrounds will be fixed to `text-black`

---

## Part 3: Standardize Book Card Sizes

**Problem:** Books in the same learning path row are different sizes because `minHeight: 320px` allows variable content to push heights differently.

**Changes in `src/components/broker-education/Book3DCard.tsx`:**
- Set a fixed height for the book cover: `h-[400px]` (or similar) instead of `minHeight: 320px`
- Use `flex flex-col` with `flex-1` on the content section so titles/descriptions clip consistently
- All books will be visually identical in dimensions regardless of content length

---

## Part 4: Advanced Restricted Section -- Explain Why and Fix Request Access

**Problem:** The restricted books show a disabled "Restricted Access" button that does nothing. No explanation of why it is restricted or when access will be granted.

**Changes in `src/components/broker-education/Book3DCard.tsx`:**
- For restricted books, replace the disabled button with:
  - A short explanation: "Available after completing all foundational books and receiving manager approval"
  - A working "Request Access" button that opens a dialog/toast confirming the request was submitted
- The request access button will show a toast: "Access request submitted. Your manager will review it."

**Changes in `src/pages/BrokerEducation.tsx`:**
- Under the "Advanced (Restricted)" learning path header, add a notice card explaining:
  - These books contain advanced proprietary strategies
  - Access requires completion of all other learning paths + manager approval
  - Contact your team lead or use the Request Access button

---

## Part 5: Fix Certification Section UI (Remove Black Theme)

**Problem:** The `CertificationSection` uses `className="bg-black"` with white text -- contradicting the champagne UI standard.

**Changes in `src/pages/BrokerEducation.tsx`:**
- Change `<CertificationSection className="bg-black" />` to use champagne wrapper: wrap in `jj-layer-2` div

**Changes in `src/components/certification/CertificationSection.tsx`:**
- Replace `bg-black/40` cards with `jj-card-inner` (champagne)
- Replace `text-white` with `text-black`, `text-white/70` with `text-black/70`
- Phase cards and progress bars adapted to champagne palette

**Changes in `src/components/certification/PhaseCard.tsx`:**
- Replace dark bg classes (`bg-black/40`, `bg-emerald-500/5`) with champagne equivalents
- Text colors: `text-white` to `text-black`, locked states: `text-black/40`

---

## Part 6: Fix Hero Buttons (Faded Against Background)

**Problem:** Hero buttons use `variant="hero"` which has `bg-transparent` and `text-primary-foreground` (white text with white border). On the dark video background, the border blends.

**Changes in `src/pages/BrokerEducation.tsx`:**
- The `variant="hero"` is actually correct (transparent bg, white text/border, gold icon, champagne fill on hover). The issue is the video overlay makes the background too dark/similar.
- Add stronger border: use `className="border-white/90"` override on the hero buttons
- Alternatively, use the `PremiumHeroButton` component which has thicker borders (`border-2`) and stronger hover effects, matching the homepage hero exactly

---

## Part 7: Premium Page Upgrade -- Support Benefits and JBJ Employee Value Proposition

**Problem:** The page lacks messaging about JBJ employee benefits (24/7 support, events, continuous education).

**Changes in `src/pages/BrokerEducation.tsx`:**
- Add a new section between Progress & Recognition and Certification: **"JBJ Employee Benefits"**
- 4-card grid showing:
  1. 24/7 Support -- Dedicated support for all registered brokers
  2. Continuous Education -- Regular book updates and new content
  3. Events & Networking -- Exclusive JBJ broker events and workshops
  4. AI Tools Access -- Full access to all AI-powered broker tools
- Each card uses the `jj-card-inner` champagne style with gold icon boxes

**CTA Section update:**
- Change "Ready to Get Started?" to "Join the JBJ Broker Network"
- Add messaging: "Registered JBJ employees get full access to all books, AI tools, and 24/7 support"
- Primary CTA: "Apply to Join JBJ" (links to `/join`)
- Secondary CTA: "Back to Dashboard" (existing)

---

## Part 8: Add JBJ Brand Color Palette to Graphic Designer

**Problem:** The JBJ brand palette needs to be available in the AI Graphic Designer tool.

**Status:** The `ColorPaletteManager.tsx` already has `JBJ_BRAND_PALETTE` with the 6 brand colors (Gold, Black, White, Dark Gray, Champagne, Dark Gold). This is already integrated in the Design Studio's "Color Palettes" tab. No changes needed here -- it is already implemented.

---

## Part 9: Access Unlocking Logic for Registered Employees

**Problem:** Books should auto-unlock when a user is registered as a JBJ employee through the Employee Hub.

This is a backend logic change. When a new joiner is added via the Employee Hub:
- Their profile `role` or a new `is_jbj_employee` flag is set to true
- The `useBrokerEducation` hook checks this flag and shows all non-restricted books as accessible
- Restricted books still require separate approval

This requires a database check -- will add a note in the education hook to check employee status. Full implementation depends on the Employee Hub backend structure.

---

## Files to Create/Modify

| File | Change |
|---|---|
| `src/pages/BuyerFAQ.tsx` | NEW -- Buyer FAQ page |
| `src/pages/SellerFAQ.tsx` | NEW -- Seller FAQ page |
| `src/pages/LandlordFAQ.tsx` | NEW -- Landlord FAQ page |
| `src/pages/TenantFAQ.tsx` | NEW -- Tenant FAQ page |
| `src/App.tsx` | Add 4 new FAQ routes |
| `src/components/Footer.tsx` | Add FAQ links to Guides section |
| `src/components/broker-education/BookLanguageFilter.tsx` | Fix text colors for champagne background |
| `src/components/broker-education/Book3DCard.tsx` | Fixed height, restrict explanation, request access button |
| `src/pages/BrokerEducation.tsx` | Fix cert section wrapper, hero buttons, add benefits section, update CTA, restricted notice |
| `src/components/certification/CertificationSection.tsx` | Convert from dark to champagne theme |
| `src/components/certification/PhaseCard.tsx` | Convert from dark to champagne theme |

## Execution Order

1. Fix BookLanguageFilter dropdown (quick, high-visibility fix)
2. Fix Book3DCard sizes and restricted access
3. Convert CertificationSection and PhaseCard to champagne
4. Fix hero buttons in BrokerEducation
5. Add employee benefits section and update CTA
6. Create 4 FAQ pages + routes + footer links
7. Add restricted section explanation
