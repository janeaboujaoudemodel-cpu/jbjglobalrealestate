

## Plan: Vertical Sidebar Overhaul — Gap Fix, Section Clarity, Rich Flyouts

### Issues Identified

1. **Black gap below "Create Ticket Support"**: The sidebar container (`h-full`) doesn't stretch the inner content to fill the full height. The bottom section needs the sidebar to use `flex-col` with the bottom pinned via `mt-auto`.

2. **Active section not highlighted properly**: When clicking a section like "Insights", the section header itself doesn't get gold-highlighted, and "Map" (from another section) stays visually active. The `isRouteActive` logic doesn't clear when a mega menu opens from a different section.

3. **Subsection items not indented**: Items inside a section are at the same indentation level as the section header, making it hard to distinguish hierarchy.

4. **Flyout menus for Developers/Areas are plain link lists**: Unlike the horizontal header's rich mega menus (which show curated top developers/areas from the database), the vertical nav flyouts just show "All Developers" — one link. Need to populate with real data like the horizontal `MegaMenuDevelopers` and `MegaMenuAreas` do (top 12 curated entries).

5. **Section boundaries unclear**: No visual separator between sections; hard to tell where one section ends and the next begins.

---

### Changes

#### 1. Fix black gap — `GlobalVerticalNav.tsx`
- On the full sidebar container (line 844), ensure the flex-col layout fills the parent with the bottom utility/support section pushed down using `mt-auto` on the bottom wrapper.
- Wrap the bottom two sections (utility + support) in a single `<div className="mt-auto">` so they always stick to the bottom, and the scrollable nav area fills remaining space.

#### 2. Highlight active section header — `GlobalVerticalNav.tsx`
- When a section is open and contains the active route OR an open mega menu belongs to an item in that section, give the section header a gold background (`bg-gold/15 text-gold border-l-2 border-gold`).
- Fix `getItemStyle`: when a mega menu is open, only highlight the item whose mega menu is open — not route-matched items in other sections.

#### 3. Indent sub-items — `GlobalVerticalNav.tsx`
- Add `pl-4` (left padding) to the items container inside each collapsible section, creating a visual indent showing they belong under the section header.
- Add a subtle left gold border (`border-l-2 border-gold/20`) on the items container for a tree-line effect.

#### 4. Rich flyouts for Developers, Areas, and other data-driven menus — `GlobalVerticalNav.tsx`
- Import `useDevelopers` and `useAreas` hooks.
- For the `developers` mega menu key, show the same 12 curated developer slugs (matching `MegaMenuDevelopers.tsx` pattern) as links inside the flyout panel.
- For the `areas` mega menu key, show the same 12 curated area slugs (matching `MegaMenuAreas.tsx` pattern).
- Add a "View All" CTA link at the bottom of each.
- Enrich the `guides` flyout similarly (already has good links, just ensure books/education-hub is prominent).

#### 5. Section dividers — `GlobalVerticalNav.tsx`
- Add a thin `<hr className="border-gold/15 mx-3 my-1" />` between each section group for visual separation.

#### 6. Auto-close other sections on open — `GlobalVerticalNav.tsx`
- When user clicks a section header, close all other sections (accordion behavior) so only one section is expanded at a time. This prevents confusion about which section is active.

---

### Files Modified
- `src/components/navigation/GlobalVerticalNav.tsx` — all changes consolidated here

