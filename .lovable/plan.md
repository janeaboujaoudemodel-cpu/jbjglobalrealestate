

## Unified Navigation Overhaul: Mobile Hamburger + Desktop Vertical Nav with Mega Menus

This is a large change that touches the mobile hamburger menu, the desktop vertical sidebar (PropertiesVerticalNav), and adds new navigation categories. Here is the breakdown:

---

### Part 1: Redesign Mobile Hamburger Menu (Phone/iPad)

**What changes:**
The current `Sheet`-based mobile menu in `GlobalHeader.tsx` (lines 648-1271) will be replaced with a new champagne-gold themed sidebar matching the `PropertiesVerticalNav` style.

**New mobile menu features:**
- Opens from the **right side** (keeps current behavior)
- Uses the same champagne gradient background (`from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`) as the vertical nav
- **Bigger monogram** at the top (w-16 h-16 on mobile, w-20 h-20 on iPad) with "JBJ GLOBAL" / "REAL ESTATE" text
- Quick action row: Search, Account, Language, Currency (same as now but styled to match)
- **All pages organized under collapsible categories** with expand/collapse chevrons:
  1. **Buy** -- Properties for Sale, Apartments, Villas, Buyer's Guide, Mortgage Calculator
  2. **Sell** -- List Your Property, Seller's Guide, Property Valuation, Selling Advisory
  3. **Rent** -- Properties for Rent, Tenant's Guide, Property Management
  4. **Projects** -- All Off-Plan Projects, New Launches
  5. **Developers** -- All Developers, Emaar, DAMAC, Sobha, Nakheel, Binghatti, Meraas, etc. + "View All Developers"
  6. **Areas** -- Explore All Areas + top area links from database (same as MegaMenuAreas)
  7. **Insights** (NEW) -- All 8 sub-sections from MegaMenuInsights: News & Updates, Market Intelligence, Guides, Services, Business Suites, Investor/Broker Tools, Company, Legal
  8. **Services** -- Our Services, Property Management, Mortgage Advisory, Valuation, etc.
  9. **Creative Toolkit** -- Toolkit Hub, AI Video Studio, etc.
  10. **About & Company** -- About Us, Team, Brokers, Careers, Awards, Contact, etc.
  11. **Resources & Guides** -- Guides Library, Market Intelligence, News, FAQ
  12. **Partners & Tools** -- Partners Hub, Mortgage Partners, etc.
  13. **Legal & Trust** -- Terms, Privacy, Cookies, Trust & Audit
- Each category has a **gold chevron** that rotates on expand/collapse
- Subpages show as flat link lists (icon + title), matching current mobile link style
- User section at bottom (dashboard, profile, owner shortcuts, sign out)
- Footer: bigger monogram + "Contact Support"

**File modified:** `src/components/GlobalHeader.tsx`

---

### Part 2: Enhance Desktop Vertical Nav (PropertiesVerticalNav)

**What changes:**
The `PropertiesVerticalNav` (shown when filter bar replaces header on scroll) gains mega menu hover capability and new utility items.

**New features:**
- **Bigger monogram**: Increase from w-12 to w-14 or w-16
- **Add new nav items**: Areas, Insights
- **Add utility section** at the bottom (above Contact Support):
  - Search icon (opens GlobalSearchModal)
  - Language switcher (compact)
  - Currency switcher (compact)
  - Profile / Dashboard / Settings links
- **Mega menu on hover (desktop only)**: When hovering over "Developers", "Areas", "Buy", "Sell", "Rent", "Projects", or "Insights", a floating mega menu card appears to the right of the sidebar. This is the **same mega menu component** used in the main header (MegaMenuDevelopers, MegaMenuAreas, MegaMenuBuy, etc.)
- Items that have mega menus get a small chevron indicator

**How hover mega menus work:**
- Each nav item with a mega menu gets `onMouseEnter` / `onMouseLeave` handlers
- On hover, the corresponding `MegaMenu*` component renders as an absolutely positioned panel to the right of the sidebar
- A backdrop overlay appears behind the mega menu
- On mouse leave, the panel closes after a short delay (same 80ms pattern as main header)

**File modified:** `src/components/navigation/PropertiesVerticalNav.tsx`

---

### Part 3: Add "Insights" to Vertical Nav

The vertical nav currently has 15 items. "Insights" will be added between "Market Intel" and "Guides", linking to `/insights` or triggering the mega menu on hover.

The Insights mega menu content is already defined in `MegaMenuInsights.tsx` with 8 categories (News, Market Intelligence, Guides, Services, Business Suites, Mode Tools, Company, Legal).

---

### Technical Details

**Files to modify:**
1. `src/components/GlobalHeader.tsx` -- Redesign mobile menu section (lines 648-1271). Add Insights and Areas with full subpage lists to mobile collapsibles. Increase monogram size.
2. `src/components/navigation/PropertiesVerticalNav.tsx` -- Add mega menu hover system, utility icons (search, language, currency, profile), Insights nav item, bigger monogram.

**Files to import in PropertiesVerticalNav:**
- `MegaMenuBuy`, `MegaMenuSell`, `MegaMenuRent`, `MegaMenuProjects`, `MegaMenuAreas`, `MegaMenuDevelopers`, `MegaMenuInsights`
- `GlobalSearchModal` for the search trigger
- `LanguageSwitcher`, `CurrencySwitcher` for utility row

**No new files created** -- all changes are within existing components.

**Responsive behavior summary:**
- **Phone/iPad** (touch or below 1024px): Hamburger opens redesigned champagne sidebar from right. Categories expand to show flat page title lists. No mega menu cards.
- **Desktop with filter bar active** (vertical nav visible): Hovering nav items shows the same rectangular mega menu cards with video/images that the main header uses. Utility icons for search, language, currency, profile are in the sidebar footer.
- **Desktop normal** (main header visible): No changes -- existing mega menu pill nav continues as-is.

