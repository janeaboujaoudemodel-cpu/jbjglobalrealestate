

## Plan: Vertical Nav Fixes, Favorites Page Restyle, and Homepage Divider

### Issues to Fix

1. **Double highlight on "Buy Properties"** — When clicking "Buy / Off-Plan" in PROPERTIES section (which opens the `buy` mega menu), the highlighted hubs above don't have a `buy` mega menu item, but the `isRouteActive("/properties")` check causes the PROPERTIES section header to stay highlighted AND the item stays highlighted. The real bug: `getItemStyle` uses `activeMegaMenu ? isThisMenuOpen : routeActive` — when a mega menu is open, items WITHOUT a megaMenu key fall back to `routeActive`, which can be true for multiple items pointing to `/properties`. Fix: ensure only the item that triggered the mega menu shows as active.

2. **Careers & Join green too strong** — Reduce emerald from `emerald-500/600` to `emerald-400` with lower opacity.

3. **Utility bar position** — Move the utility bar (search, favorites, sqft/sqm, language, currency) from the bottom up to sit on the same horizontal line as the divider under the monogram/logo area. Add investor mode toggle, dashboard, my account shortcuts there too.

4. **Legal as dedicated hub** — Extract "Legal" from COMPANY section, create a new `LEGAL` accordion section with all legal pages listed as sub-items.

5. **Services sub-items in sidebar** — Currently SERVICES section only has one item ("Services" with a mega menu). Add all service sub-pages as direct accordion sub-items so they're visible in the sidebar too.

6. **Color inversion: sidebar titles gold, icons black; flyout titles black, icons gold** — Already partially done in flyouts. For sidebar: section titles → gold, item icons → black. Flyout keeps current style (titles black, icons gold).

7. **My Shortcuts more highlighted** — Increase border/bg prominence on the My Shortcuts button.

8. **My Tasks section** — Add alerts, books, favorites, shortlisted to the "My Tasks" shortcut group.

9. **Collapsed nav: show all section icons vertically** — Currently only shows monogram + expand button. Add vertical icon strip for all sections (PROPERTIES, TOOLS, INSIGHTS, SERVICES, COMPANY, LEGAL, MY ACCOUNT) with active one in gold, rest in black.

10. **Favorites page** — Replace dark theme with champagne gold theme. Replace `from-gold to-gold-dark` active tab color with champagne gradient. Fix overall UI.

11. **Homepage: single divider under ContinueSearching** — Currently there's no `<SectionDivider />` before ContinueSearching but there is one after (line 282). The user says there's a duplicate — check and ensure only one divider exists between ContinueSearching and the next section.

---

### Changes

#### `src/components/navigation/GlobalVerticalNav.tsx`

**A. Fix double highlight bug**
- In `getItemStyle`, when `activeMegaMenu` is set, only highlight items whose `megaMenu` matches. Items without `megaMenu` should NOT highlight based on route when a mega menu is open.

**B. Reduce Careers green**
- Change `emerald-500/15` → `emerald-400/10`, `emerald-700` → `emerald-600`, `emerald-500/30` → `emerald-400/20` for the join item styling.

**C. Move utility bar under monogram**
- Move `<VerticalNavUtilityBar>` from the bottom pinned area to directly under the logo/monogram `border-b` section. Add investor mode toggle, dashboard, and my account icons to the utility bar.

**D. Add LEGAL section**
- Add `"LEGAL"` to `SECTION_KEYS`.
- Move `{ label: "Legal", ... }` from COMPANY into a new `section: "LEGAL"` with sub-items: Terms, Privacy, Cookies, Disclaimers, IP, AML/KYC, Accessibility, Trust Center.
- Add `Scale` icon to `SECTION_ICONS` for LEGAL.

**E. Expand SERVICES sub-items**
- Add all service sub-pages (Property Management, Golden Visa, Mortgage Advisory, Valuation, Selling Advisory, Short-term Rentals, etc.) as direct NAV_ITEMS under the SERVICES section.

**F. Color inversion**
- Section header titles: change from `text-black` to `text-gold` (or `text-[#C9A84C]`).
- Section header icons: change from `text-gold` (active) / `text-black/50` (inactive) to `text-black/70` always.
- Sub-item icons in sidebar: `text-black/60` (not gold).
- Flyout items keep current style: icons gold, titles black.

**G. My Shortcuts more highlighted**
- Increase border to `border-2 border-gold/50`, add `bg-gold/10` default state, stronger gradient when active.

**H. My Tasks group additions**
- Add `Bell` (Alerts), `BookMarked` (Books), `Heart` (Favorites), `ListChecks` (Shortlisted) to the "My Tasks" shortcut group.

**I. Collapsed nav: all section icons**
- Replace the collapsed view (currently just monogram + expand button) with a vertical icon strip: monogram at top, then icons for each section (Building2, Sparkles, Lightbulb, Briefcase, Users, Scale, User), then expand button at bottom. Active section icon in gold, rest in black/60. Each icon clickable to expand + open that section.

#### `src/pages/Favorites.tsx`

**J. Champagne gold restyle**
- Change background from dark (`from-[#1a1810] via-[#0f0e0a] to-black`) to champagne (`from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`).
- Change text colors from white to black.
- Replace `from-gold to-gold-dark` active tab color with champagne gradient (`from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]`) with black text.
- Update cards, borders, and action bars to match champagne theme.

#### `src/pages/Index.tsx`

**K. Fix duplicate divider**
- Ensure only one `<SectionDivider />` exists between ContinueSearching and ResalePropertiesSection. Currently line 269 has one before FeaturedListings and line 282 has one after ContinueSearching — verify no duplicate and add/remove as needed so there's exactly one divider after ContinueSearching.

---

### Files Modified
- `src/components/navigation/GlobalVerticalNav.tsx` — Items A–I
- `src/pages/Favorites.tsx` — Item J
- `src/pages/Index.tsx` — Item K

