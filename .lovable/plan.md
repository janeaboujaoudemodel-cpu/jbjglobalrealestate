

# Fix Global Vertical Nav: Single-Active Hub, Complete Pages, Premium Styling, Layout Audit

## Issues to Fix

1. **Multiple hubs highlighted simultaneously** — clicking a new mega-menu section must close the previous one before opening the new one
2. **Search icon not gold** — needs gold icon + highlighted label
3. **Missing "Create Ticket" link** — add alongside Contact Support
4. **Missing pages in nav** — legal, services sub-pages, books/guides, cards, all AI tools need to be present
5. **Flyout scroll behavior** — background must NOT scroll when mega-menu flyout is open; only the flyout panel scrolls
6. **Flyout must be fixed/full-height** — not a small floating card, but a full-screen panel (like AI tools hub does) anchored to the right of the sidebar
7. **Layout audit** — verify all pages render correctly with `lg:pl-[200px]` padding globally

## Changes

### 1. `GlobalVerticalNav.tsx` — Full Rewrite of Key Sections

**Single-active mega-menu** (already works via toggle logic in `handleNavClick`): The bug is that **both the route-based `isActive` AND `isMenuOpen` can be true** for different items simultaneously, making two items appear highlighted. Fix: when a mega-menu opens, only that item should show the active/highlighted style. The `isActive` check for items with mega-menus should be suppressed when ANY mega-menu is open.

**Flyout panel upgrade:**
- Change from `max-w-[400px] max-h-[70vh]` floating card → **full-height fixed panel** filling the right side of sidebar (`left: 200px, top: 0, bottom: 0, width: 420px`)
- Add `overflow: hidden` to `document.body` when flyout is open to prevent background scroll
- Flyout content scrolls internally via `overflow-y-auto`
- Remove `onMouseLeave={closeMegaMenu}` — close only on backdrop click or nav item click

**Add missing nav categories with mega-menus:**
- `services` mega-menu: Property Management, Golden Visa, Mortgage Advisory, Valuation, Selling Advisory
- `company` mega-menu: About, Team, Founder, Contact, Careers, Press Kit
- `legal` mega-menu: Terms, Privacy, Cookies, Disclaimers, IP, AML/KYC, Accessibility, Trust Center
- `guides` mega-menu: Buyer Guide, Seller Guide, Rent Guide, Tenant Guide, Landlord Guide, Investor Education, Broker Education, Golden Visa Guide
- Expand `creative` mega-menu with Real Estate Suite, Property Suite links
- Expand `ai-tools` with any missing tools (Competitor Analysis, Virtual Staging, etc.)

**Search styling:** Gold icon (`text-gold`), add a small gold badge/label "Quick Search" 

**Bottom section:** Add "Create Ticket" link (`/my-tickets`) alongside Contact Support

**Body scroll lock:** When `activeMegaMenu` is set, add `overflow: hidden` to `document.body`; remove on close

### 2. `MainLayout.tsx` — Minor Fixes

- Ensure the `lg:pt-0` works correctly for all routes (no double spacing)
- Verify footer and contact section get `lg:pl-[200px]` consistently

### 3. Layout Audit Items (CSS fixes)

- Check hero sections on homepage, properties, areas, developers don't overflow under the sidebar
- Verify mobile hamburger menu still works and shows the same complete nav
- Ensure `PageNavigation` floating buttons don't overlap with the sidebar on desktop

### Files to Edit
- `src/components/navigation/GlobalVerticalNav.tsx` — major update (single-active, full-height flyout, body scroll lock, complete nav items, gold search, create ticket)
- `src/components/MainLayout.tsx` — minor padding/spacing audit fixes
- `src/components/PageNavigation.tsx` — ensure left positioning accounts for sidebar on desktop (`lg:left-[216px]`)

