

## Plan: Developer-Aware Homepage, Performance Audit & Full Wiring Fix

### Issues Identified

1. **Homepage shows "Are You a Developer?" CTA to users already registered as developers** — The `DeveloperPortalCTA` component renders unconditionally for everyone, including developers who already selected that mode.

2. **Contact Support button opens `mailto:` instead of navigating** — The sidebar "Contact Support" is an `<a href="mailto:">` which triggers the OS mail client instead of instant in-app navigation. This feels "slow" because the browser hands off to the mail app.

3. **General navigation slowness** — The sidebar has 1200+ lines of complex rendering with mega menus, dynamic data fetching (developers, areas), and heavy re-renders. The `Contact Support` mailto and `Create Ticket` Link both work but the mailto triggers external app launch which feels broken.

---

### Fix 1: Conditional Developer CTA on Homepage

**In `src/pages/Index.tsx`:**
- Import `useUserModeContext` 
- If `isDeveloperMode` is true, replace the generic "Are You a Developer?" CTA with a **Developer Quick Actions** panel showing: "Submit New Project", "Submit Event", "My Projects", "Follow Up Tasks" — direct links into `/developer-portal` tabs

**In `src/components/home/DeveloperPortalCTA.tsx`:**
- Accept an `isDeveloper` prop
- When `isDeveloper === true`: Show "Welcome back, Developer" with quick-action cards (Submit Project, Submit Event, Check Listings, Add Task)
- When `isDeveloper === false`: Show the existing "Are You a Developer?" CTA

### Fix 2: Contact Support → In-App Navigation

**In `src/components/navigation/GlobalVerticalNav.tsx`:**
- Replace the `mailto:` link for "Contact Support" (lines 1061-1067 expanded, lines 1147-1152 collapsed) with a `<Link to="/ticket-hub?tab=new">` or a dedicated `/contact-support` page
- Both expanded and collapsed states need updating
- This ensures instant in-app navigation instead of triggering an external mail client

### Fix 3: Performance — Reduce Sidebar Re-renders

**In `src/components/navigation/GlobalVerticalNav.tsx`:**
- Wrap `renderNavContent` in `useMemo` keyed on `openSection`, `session`, `role`, `pathname`
- Memoize `SHORTCUT_GROUPS` filtering with `useMemo`
- Add `React.memo` to mega menu sub-components
- Ensure `useDevelopers()` and `useAreas()` queries have proper `staleTime` (already set globally to 5min, but verify they aren't re-fetching on every render)

### Fix 4: Full Button/Wiring Audit

Scan all navigation items and CTAs for:
- **Faded buttons**: Any button using `variant="secondary"` or `variant="ghost"` on dark backgrounds → replace with champagne gradient or `PremiumHeroButton`
- **Dead links**: Verify all `href` targets in `NAV_ITEMS` and `SHORTCUT_GROUPS` resolve to registered routes
- **Immediate redirects**: Ensure all `<Link>` components use React Router (no full page reloads), and all click handlers use `navigate()` without unnecessary async delays

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/home/DeveloperPortalCTA.tsx` | Add `isDeveloper` prop, show quick-actions for developers |
| `src/pages/Index.tsx` | Pass `isDeveloperMode` to `DeveloperPortalCTA` |
| `src/components/navigation/GlobalVerticalNav.tsx` | Replace mailto with in-app Link, memoize heavy renders |

