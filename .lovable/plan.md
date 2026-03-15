
Phase Status (right now, before edits):
- NOT IMPLEMENTED: Your requested Phase 1 fixes are not yet applied in code.
- PARTIALLY IMPLEMENTED: Shortcut systems exist in multiple places, but they are inconsistent and duplicated.
- NOT IMPLEMENTED: Your requested broker verification flow, verified-broker public listing rules, and full Property Evaluator overhaul are not in this phase yet.

Audit Proof (from current codebase and data):
1) Screenshot proof
- Screenshot captured: `tool-results://screenshots/20260315-184826-067417.png`
- Shows route state with visible “My Shortcuts” trigger on vertical nav and top utility rail.
2) Route/component proof
- My Shortcuts sources are split across:
  - `src/components/navigation/GlobalVerticalNav.tsx` (`SHORTCUT_GROUPS`, `MEGA_MENU_LINKS.shortcuts`)
  - `src/components/GlobalHeader.tsx` mobile menu “My Shortcuts”
  - `src/components/GlobalSearchModal.tsx` (`QUICK_SHORTCUTS`, `POPULAR_PAGES`, Admin shortcuts)
- Properties filter/sticky logic:
  - `src/pages/Properties.tsx` (`isFilterFixed`, fixed portal bar at lines ~1138+)
  - `src/components/filters/FilterShortcutBar.tsx` (`ConnectedModeButton`, Saved/Currency/Filter row controls)
- Mode dropdown mismatch source:
  - Premium dropdown: `src/components/ModeSwitcher.tsx`
  - Simpler dropdown in shortcut bar: `FilterShortcutBar.tsx` -> `ConnectedModeButton`
- Project detail overlap source:
  - `src/components/project-detail/ProjectDetailLayout.tsx` uses `scrollIntoView()` without offset (`scrollToRef`)
3) Data/count proof
- DB read shows published projects are much higher than the visible count concern:
  - `projects total`: 2778
  - `is_published = true`: 2778
- Current count logic is fragmented between listing/query/filter layers (`useProjectsListing`, `AdvancedFilterPanel` live count), causing inconsistent user-facing numbers.

Approved Scope to execute first (your answer):
- Phase 1: Filters + counts + header/sticky fixes
- Project count source: Published only

Implementation Plan (Phase 1 execution):
1) Unify “My Shortcuts” into one canonical config
- Create a single shortcuts config module and consume it from:
  - `GlobalVerticalNav` flyout
  - `GlobalHeader` mobile shortcuts block
  - `GlobalSearchModal` quick/admin shortcuts
- Add all missing shortcut entries you requested (Favorites, Shortlist, Saved Filters, AI Home Finder, Compare, Dashboard/Settings, tasks/alerts, etc.) in one source.
- Add role-aware visibility in config-level metadata (owner/broker/investor/public) so all screens render the same list with correct access.

2) Fix project count consistency (Published only)
- Standardize count source to published-only everywhere user sees project totals:
  - Advanced filter modal header count
  - “Show X projects” CTA
  - Properties list summary count
- Make all count surfaces derive from one published-only counting utility/hook.
- Remove hidden drift between listing query, local filters, and UI labels.
- Keep count semantics explicit:
  - “Published total” baseline
  - “Visible after filters” secondary count in-context

3) Resolve horizontal utility bar crop and right-edge clipping
- Update `HorizontalUtilityBar` layout constraints and right padding behavior at 1166px viewport and adjacent breakpoints.
- Ensure search + segmented rail never touches right border and remains fully visible.
- Preserve existing premium segmented appearance and divider structure.

4) Remove fixed-scroll duplication and lock to 2-row behavior on Properties page
- Refactor `Properties.tsx` sticky behavior so fixed state shows only the intended two rows.
- Prevent duplicate controls between top utility rail and fixed property filters (favorites/filter/currency/mode duplications).
- Keep second row connected-premium filter style exactly, while deduping repeated actions.
- Maintain blur/background behavior so dropdowns and content don’t visually collide.

5) Mode dropdown consistency fix
- Use the same premium mode dropdown component behavior as top utility bar for the lower filter-row mode control (same labels/colors/descriptions), while preserving requested outer chip appearance.
- Add guard so mode never changes automatically unless user explicitly selects a new mode.

6) Fix section anchor overlap under sticky filters (Project detail/Areas)
- Replace plain `scrollIntoView` usage in project detail tab jumps with offset-aware scrolling utility.
- Ensure sections (like area/location blocks) are not hidden under fixed sticky bars.
- Apply consistent top-offset logic across affected sticky-filter pages.

7) Vertical nav scroll/expand stability (Submit Listing / My Listings)
- Adjust nav section expansion logic to keep active hub visible without forced jump/crop behavior.
- Prevent “section jumps downward on click” and keep expansion stable under current viewport height.
- Preserve active-page priority highlighting.

8) Offline/reelly favorites click reliability (quick blocker fix in Phase 1)
- In `ReellyProjectCard`, make favorite/shortlist controls reliably clickable on touch/desktop (not only hover-gated in ways that block interaction).
- Keep current visual style; only interaction reliability changes.

Testing & Proof Plan after implementation:
- Routes to test:
  - `/properties`
  - `/project/:slug` (any live project)
  - `/listing-portal/submit`
  - `/listing-portal/my-listings`
  - Any page with vertical nav + shortcuts flyout
- Components to verify:
  - `HorizontalUtilityBar`
  - `FilterShortcutBar`
  - `GlobalVerticalNav`
  - `GlobalHeader` (mobile shortcuts)
  - `GlobalSearchModal`
  - `ProjectDetailLayout`
  - `ReellyProjectCard`
- State logic checks:
  - `isFilterFixed` transition
  - mode state updates only on explicit user action
  - published-only count state vs filtered-visible count state
  - role-filtered shortcut rendering
- Proof artifacts to return:
  - Before/after screenshots on each affected route
  - exact component/file diff list
  - count verification numbers from UI + backend read query
  - interaction evidence (favorites click, sticky dedupe, anchor visibility)

Deferred (not in this approved Phase 1 execution):
- Broker verification full flow + blue tick + verified brokers public directory/payment gating
- Property Evaluator full model/spec/data-source overhaul
- Full backend wiring audit for all forms platform-wide
- These remain NOT IMPLEMENTED in this phase and will be delivered in next batch after Phase 1 proof is accepted.
