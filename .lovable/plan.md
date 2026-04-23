

## Goal

Make the horizontal header **cleaner, less crowded, and consistent across all devices** by reducing the visible item count, grouping related controls, and standardizing labels — without removing any functionality (per No-Removal policy).

## Problem today

Row 1 of `HorizontalUtilityBar.tsx` shows **~16 separate cells** with vertical dividers between each: Back · Search · Buy · Rent · Sell · ♥ · ft²/m² · 🇬🇧 · Currency · Filter · CRM · Tasks · 🔔 · Inbox · Dashboard · Mode · Settings. On smaller widths it becomes a horizontally-scrolling rail with arrows — exactly the "crowded" feel you described.

## Cleanup plan (HorizontalUtilityBar.tsx)

### A. Group transactional links into one "Browse" menu

Replace the three separate **Buy / Rent / Sell** cells with **one** `Browse ▾` cell that opens a small popover containing Buy, Rent, Sell. Saves 2 cells + 2 dividers. Links and tooltips preserved verbatim inside the popover.

### B. Move display preferences into a single "Preferences" menu

Collapse **ft²/m² toggle + Language + Currency** (3 cells + 2 dividers) into one **⚙ Display ▾** popover containing: Area Unit toggle, Language switcher, Currency switcher. All three sub-controls keep their existing components — just rendered inside a popover instead of inline.

### C. Merge Tasks / Bell / Inbox into a single "Activity" bell

Consolidate **Tasks + Notifications + Inbox** into one **🔔 Activity** button with a combined unread badge. Clicking opens a small popover with three tabs (Tasks / Alerts / Inbox), each linking to the same destinations as today (`/my-dashboard#tasks`, `#notifications`, `#inbox`). Saves 2 cells + 2 dividers.

### D. Keep these primary cells inline (the "less items" target)

Final row 1 from left → right:

```
[Back] | [Search ⌘K] | [Browse ▾] | [♥ Favorites] | [Filter]      …      [CRM] | [🔔 Activity] | [Display ▾] | [Dashboard] | [Mode] | [Settings]
```

That's **6 left + 6 right = 12 cells max** (vs 16 today), and only **9** for signed-out visitors (no CRM, no Activity). On mobile, the count drops further because CRM/Activity hide when not signed in.

### E. Visual de-clutter

- **Drop the vertical gold dividers** between cells. Replace with simple 12-16px gap spacing — modern headers use whitespace, not rules. Keep ONE divider between the left scrollable group and the right fixed rail so the two zones remain visually distinct.
- **Tighten cell padding** from `px-2.5` to `px-2`, height stays 48px row.
- **Hide labels under `xl`** consistently — currently some cells show labels at `xl`, some never. Standardize: icon-only below xl, icon + label at xl+.
- Keep the gold accent color for icons (brand standard) but reduce hover scale from `1.10` to `1.05` for calmer motion.

### F. Responsive behavior (all devices)

- **≥1280px (xl):** All cells visible with labels next to icons. No scroll arrows.
- **768–1279px:** Icon-only cells, fits without scrolling in most cases. Scroll arrows kept as fallback.
- **<768px (mobile/touch):** The mobile header (`MobileHeader.tsx`) already replaces this bar via `useIsTouchLayout`. I'll verify the mobile sheet menu mirrors the same Browse / Activity / Display groupings so the experience is consistent across devices.

### G. Keep row 2 (filter shortcut bar) untouched

`FilterShortcutBar` already uses its own scroll/overflow logic — out of scope for this cleanup.

## Files touched

- `src/components/navigation/HorizontalUtilityBar.tsx` — restructure cells, add Browse / Display / Activity popovers, remove inline dividers.
- `src/components/navigation/MobileHeader.tsx` (verify only — align grouping if it currently exposes Buy/Rent/Sell or Inbox separately).

No new dependencies. Uses existing `@/components/ui/popover` and the existing sub-components (`LanguageSwitcher`, `CurrencySwitcher`, `ModeSwitcher`).

## No removal — guarantee

Every link, every action, every icon present today remains reachable. The only change is **how** they're surfaced: 3 popovers (Browse, Display, Activity) absorb 8 inline cells, cutting visual noise ~40% while preserving 100% of functionality.

## Out of scope

- No changes to row 2 (filter shortcut bar)
- No changes to the vertical sidebar / L-frame
- No color or branding changes (gold accent + champagne gradient remain)
- No routing/auth/mode logic changes

