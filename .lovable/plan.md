
# Fix Plan: Missing FAQ Links, Gold Mega Menu Cards, Services Arrow Animation, Sold Out Sort Logic

## 4 Issues to Address

---

## 1. Missing FAQ Link in Header Mega Menu

The "Insights" mega menu dropdown has links for Investor FAQ and Broker FAQ (in mode-conditional sections), but the **General FAQ** page (`/faq`) is missing entirely. Several other FAQ pages (Buyer FAQ, Seller FAQ, Landlord FAQ, Tenant FAQ) also exist but are not linked in the header.

**Fix:** Add a "FAQ" link to the **Guides** card in `MegaMenuInsights.tsx`, and add role-specific FAQ links (Buyer FAQ, Seller FAQ, Landlord FAQ, Tenant FAQ) to the relevant sections.

**Files:** `src/components/header/MegaMenuInsights.tsx`

---

## 2. Gold/Champagne Styling for Mega Menu Inner Cards

The `MegaMenuCard` component in `mega-menu-primitives.tsx` currently uses a light champagne gradient (`from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`), which looks close to white. The user wants the cards inside dropdowns to feel more visibly gold/champagne.

**Fix:** Deepen the card gradient to a richer champagne-gold tone: `from-[#F5EBD7] via-[#EDE0C8] to-[#E2D4B8]` with a stronger gold border (`border-gold/50`). This makes the cards clearly distinct from white while maintaining the premium aesthetic.

**Files:** `src/components/header/mega-menu-primitives.tsx` (the `MegaMenuCard` component, around line 327-339)

---

## 3. Services Section Arrow Button Animation

The homepage services section (`ServicesGrid.tsx`) is currently a static 4-card grid with no arrow navigation. The user wants left/right arrow buttons that, when clicked, scroll/slide to the next or previous service card with a visible press animation on the arrow button itself.

**Fix:** Convert `ServicesGrid` to a horizontal scrollable carousel on mobile/tablet (keeping 4-column grid on desktop). Add left/right arrow buttons with a `whileTap={{ scale: 0.85 }}` animation using Framer Motion so the arrow "presses in" on click, giving tactile feedback.

**Files:** `src/components/home/ServicesGrid.tsx`

---

## 4. Sold Out Sort Respects Filters

The current implementation pushes sold-out projects to the bottom of the list regardless. The user clarified: this should only happen when the user has NOT explicitly filtered to hide sold-out projects. Since `hideSoldOut=true` already removes sold-out projects entirely (they're filtered out before the sort), the sort only applies when sold-out projects are visible -- which is the correct behavior.

However, to make the logic cleaner and skip the unnecessary sort when projects are already filtered out:

**Fix:** Wrap the sold-out sort in a condition: only run it when `!filters.hideSoldOut`.

**Files:** `src/pages/PropertiesReelly.tsx` (line 226-234)

---

## Technical Summary

| File | Change |
|------|--------|
| `src/components/header/MegaMenuInsights.tsx` | Add General FAQ + role-specific FAQ links |
| `src/components/header/mega-menu-primitives.tsx` | Deepen MegaMenuCard gradient to richer champagne-gold |
| `src/components/home/ServicesGrid.tsx` | Add arrow buttons with press animation for card navigation |
| `src/pages/PropertiesReelly.tsx` | Wrap sold-out sort in `!filters.hideSoldOut` condition |
