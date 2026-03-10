

## Plan: Legal Hub Audit, Favicon Fix, Resale Filters, Navigation Polish

### Summary
This plan covers 5 areas: (1) deep audit and UI upgrade of all legal pages, (2) JBJ favicon fix, (3) resale properties filter expansion, (4) vertical nav cleanup (remove utility icons), and (5) horizontal utility bar polish.

---

### 1. Legal Hub Pages — Deep Audit & Premium UI Upgrade

**Pages to audit (8 total):**
- Terms (`Terms.tsx`) — dark bg hero + champagne cards, has sidebar TOC ✓ but text inside cards uses `text-zinc-700` inconsistently
- Privacy (`Privacy.tsx`) — same pattern as Terms ✓
- Cookies (`Cookies.tsx`) — uses dark bg, has TOC, champagne cards ✓ but hero is smaller/different layout than Terms
- AML/KYC (`AmlKycPolicy.tsx`) — dark bg, TOC, champagne cards ✓ but missing SEOHead
- Disclaimers (`Disclaimers.tsx`) — uses accordion sections, different from others (no sidebar TOC)
- Intellectual Property (`IntellectualProperty.tsx`) — dark bg, champagne cards, no sidebar TOC
- Accessibility (`Accessibility.tsx`) — dark bg, sidebar TOC ✓ but missing SEOHead
- Trust & Audit Center (`TrustAndAuditCenter.tsx`) — accordion sections, missing SEOHead
- Risk Disclosure (`RiskDisclosure.tsx`) — dark bg, sidebar TOC ✓ but missing SEOHead
- Trust & Compliance (`TrustAndCompliance.tsx`) — dark bg, sidebar TOC ✓ but missing SEOHead

**Standardization fixes (NO content changes):**
- Add `<SEOHead>` to all pages missing it (Cookies, AmlKyc, Accessibility, TrustAndAuditCenter, RiskDisclosure, TrustAndCompliance, IntellectualProperty)
- Standardize all heroes: `py-28 md:py-36` with the institutional badge pill (`Legal` / `Compliance` / `Inclusion`), consistent max-width, consistent spacing
- Standardize TOC sidebar: All pages get `aside` sidebar TOC on desktop + mobile TOC card, with active-state highlighting (border-l-2 gold)
- Pages currently missing sidebar TOC: Disclaimers, IntellectualProperty — add it
- Standardize body layout: `max-w-6xl mx-auto px-4 py-12 flex gap-8` with `aside w-64` and `main flex-1`
- Standardize footer on all pages: gold divider + copyright + links to Privacy/Terms
- Ensure all `CCard` components use identical gradient: `from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30`
- Ensure all `GoldDivider` components use identical pattern

### 2. Favicon — JBJ Monogram

**File: `public/favicon.svg`**

Current favicon shows only "J". Fix to show "JBJ" in a premium, readable way:
- Use the JBJ monogram layout: large centered "B" with smaller "J" flanking on each side
- Or stack "JBJ" horizontally with gold gradient text on black circle
- Keep the gold gradient and ring border styling
- Change the `<text>` element from single "J" to "JBJ" with adjusted font-size (~140-160px) so all three letters fit clearly

### 3. Resale Properties — Expanded Filters

**File: `ResaleProperties.tsx`**

- Expand `PROPERTY_TYPES` to include: commercial, plot, retail, offices (matching the main properties page constants)
- Expand `BEDROOM_OPTIONS` to include 6 BR and 7+ BR options
- Update hero badge from "JBJ Investor Network" to an exclusive branding like "Exclusive JBJ Global Real Estate — Investor Resale Portfolio"
- Update description to emphasize exclusivity under JBJ company

### 4. Vertical Nav — Remove Utility Icons

**File: `GlobalVerticalNav.tsx`**

- Remove the `VerticalNavUtilityBar` component entirely (lines 391-504)
- Remove the `<VerticalNavUtilityBar onSearchOpen={...} />` call at line 979
- These controls (search, heart, sqft/sqm, language, currency) now live in the horizontal utility bar exclusively
- This frees up vertical space in the sidebar

### 5. Horizontal Utility Bar & Vertical Nav Polish

**File: `HorizontalUtilityBar.tsx`**
- Make the sidebar toggle (minimizer) more visually prominent: larger icon, gold border, clearer tooltip
- Change "Advanced Filter Search" text to just a filter icon (`SlidersHorizontal`) with tooltip "Advanced Filter — Search and filter all properties with full criteria"
- Fix: make the advanced filter link actually navigate to `/properties` with a `?advanced=true` param or scroll to filters

**File: `GlobalVerticalNav.tsx`**
- Make monogram and wordmark bigger: increase img from `w-11 h-11` to `w-14 h-14`, increase text sizes
- Make "JBJ GLOBAL REAL ESTATE" fully readable: use two lines with larger font
- Contact Support & Create Ticket: make equal size, same height (`py-3`), same styling, aligned

---

### Files to Edit

| File | Changes |
|------|---------|
| `public/favicon.svg` | Fix to show "JBJ" instead of "J" |
| `src/pages/Terms.tsx` | Minor hero padding standardization |
| `src/pages/Privacy.tsx` | Minor hero padding standardization |
| `src/pages/Cookies.tsx` | Add SEOHead, standardize hero, add sidebar TOC |
| `src/pages/AmlKycPolicy.tsx` | Add SEOHead, standardize hero layout |
| `src/pages/Disclaimers.tsx` | Add sidebar TOC, standardize hero |
| `src/pages/IntellectualProperty.tsx` | Add sidebar TOC, standardize hero |
| `src/pages/Accessibility.tsx` | Add SEOHead, standardize hero |
| `src/pages/TrustAndAuditCenter.tsx` | Add SEOHead, standardize hero |
| `src/pages/RiskDisclosure.tsx` | Add SEOHead, standardize hero |
| `src/pages/TrustAndCompliance.tsx` | Add SEOHead, standardize hero |
| `src/pages/ResaleProperties.tsx` | Expand property types, bedrooms, exclusivity branding |
| `src/components/navigation/GlobalVerticalNav.tsx` | Remove VerticalNavUtilityBar, enlarge monogram/wordmark, equalize support buttons |
| `src/components/navigation/HorizontalUtilityBar.tsx` | Prominent minimizer, filter icon only for advanced search |

