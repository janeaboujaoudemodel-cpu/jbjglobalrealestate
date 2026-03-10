

## Plan: Guides Hub, Horizontal Utility Frame, AI Home Finder, and Mobile Compatibility

### Summary

This plan addresses 4 major areas: (1) a dedicated GUIDES hub in the vertical nav with all books as sub-items, (2) a horizontal utility/toolbar bar that extends from the vertical sidebar as an L-shaped frame, (3) adding AI Home Finder as a highlighted hub item, and (4) comprehensive mobile/responsive fixes.

---

### 1. Add GUIDES Section to Vertical Sidebar

**File: `GlobalVerticalNav.tsx`**

- Add `"GUIDES"` to `SECTION_KEYS` (after INSIGHTS, before SERVICES):
  ```
  ["PROPERTIES", "TOOLS", "INSIGHTS", "GUIDES", "SERVICES", "COMPANY", "LEGAL", "MY ACCOUNT"]
  ```
- Add `BookOpen` to `SECTION_ICONS` for `"GUIDES"`.
- Add all guide/book pages as `NAV_ITEMS` with `section: "GUIDES"`:
  - Guides Library → `/guides` (with megaMenu: 'guides')
  - Buyer's Guide → `/buyer-guide`
  - Seller's Guide → `/seller-guide`
  - Rental Guide → `/rent-guide`
  - Tenant Guide → `/tenant-guide`
  - Landlord Guide → `/landlord-guide`
  - Investor Education → `/investor-education`
  - Broker Education → `/broker-education`
  - Golden Visa Guide → `/guides/golden-visa-uae`
  - Books Library → `/education-hub`
  - FAQ Hub → `/faq`
- Remove the "Guides" item from the INSIGHTS section since it now has its own hub.
- The GUIDES mega menu flyout (`guides` key) already exists with these links — it will continue to show when clicking the Guides Library item.

### 2. Horizontal Utility Toolbar (L-shaped Frame)

**Files: `MainLayout.tsx`, new `HorizontalUtilityBar.tsx`**

Create a new `HorizontalUtilityBar` component that renders as a fixed horizontal bar at the top of the page, starting from the right edge of the vertical sidebar (200px or 48px when collapsed). This creates an L-shaped frame with the sidebar.

The bar will contain (left-to-right):
- Search (⌘K)
- Favorites / Shortlist (heart icon)
- Sqft / Sqm toggle
- Language switcher
- Currency switcher
- Gold divider
- Mode selector (Investor / Broker / Both)
- My Dashboard link
- My Account link
- Settings
- Advanced Search link

**Behavior:**
- Fixed position, `top: 0`, `left: 200px` (or `48px` collapsed), `right: 0`, `height: 40px`
- Same champagne gradient as sidebar, `border-b border-gold/20`
- Minimizable: a small chevron to collapse it to just icons or hide entirely
- On mobile (`< 1024px`): hidden — the mobile header handles these controls
- Remove `VerticalNavUtilityBar` from inside `GlobalVerticalNav.tsx` since it moves to the horizontal bar

**MainLayout.tsx changes:**
- Render `<HorizontalUtilityBar />` alongside the vertical nav for desktop (`lg:block`)
- Adjust `main` top padding to account for the 40px bar: add `lg:pt-[40px]` when the bar is visible

### 3. AI Home Finder in Vertical Sidebar

**File: `GlobalVerticalNav.tsx`**

- Add `{ label: "AI Home Finder", href: "/quiz", icon: Home, highlight: true }` to the highlighted hubs in `NAV_ITEMS` (it already exists in the `ai-tools` mega menu links, but not as a standalone sidebar hub item).
- Keep the purple styling for `/quiz` that already exists in `getItemStyle`.

### 4. Section Click = Expand Sub-items + Show Flyout

**File: `GlobalVerticalNav.tsx`**

Currently, clicking a section header only toggles the accordion. Change behavior so that:
- Clicking a section header **both** opens the accordion sub-items AND opens the mega menu flyout (if the section's first item has a `megaMenu` key).
- Update `toggleSection` to also call `setActiveMegaMenu` with the first mega menu key found in that section's items.
- This gives the dual view: sub-pages visible in the sidebar + the full flyout panel visible simultaneously.

### 5. Mobile Compatibility Overhaul

**Files: `GlobalHeader.tsx`, `MainLayout.tsx`, `index.css`**

**A. Responsive utility bar:**
- The new `HorizontalUtilityBar` is desktop-only (`hidden lg:flex`)
- Mobile continues to use the existing `GlobalHeader` mobile menu which already has search, language, etc.

**B. Layout fixes for phones:**
- Audit all `lg:pl-[200px]` usages — ensure they have proper fallbacks for mobile (already `pt-24 sm:pt-28 lg:pt-0`)
- Add `safe-area-inset` padding for notched phones: `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`
- Ensure the mobile slide-down menu doesn't overflow on small screens by adding `max-h-[100dvh]` and `overflow-y-auto`

**C. Touch targets:**
- Ensure all nav items have minimum `44px` touch targets on mobile (already 40-44px, verify)

**D. Performance:**
- The vertical nav is already lazy-loaded. The new horizontal bar should also be lazy or lightweight.

---

### Files Modified

| File | Changes |
|------|---------|
| `src/components/navigation/GlobalVerticalNav.tsx` | Add GUIDES section, AI Home Finder hub, dual expand behavior, remove utility bar |
| `src/components/navigation/HorizontalUtilityBar.tsx` | **New file** — horizontal toolbar with search, mode, language, currency, shortcuts |
| `src/components/MainLayout.tsx` | Render HorizontalUtilityBar for desktop, adjust padding |
| `src/index.css` | Safe-area-inset for notched phones |

