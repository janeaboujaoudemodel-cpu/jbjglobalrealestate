

## Plan: Show Contextual Shortcuts in Horizontal Bar When Sidebar is Minimized

### Problem
When the vertical sidebar is collapsed, all the navigation shortcuts disappear into tiny icons. The horizontal bar doesn't compensate by showing additional quick-access links.

### Solution
Add a **conditional shortcuts strip** in the horizontal bar that appears **only when the sidebar is collapsed** (`sidebarCollapsed === true`). The shortcuts shown depend on the user's role:

**For Owner (`isOwner`):**
- CRM, Admin Panel, Listing Admin, Properties, Areas, Developers, Analytics, Founder Assistant

**For Authenticated Users (non-owner):**
- My Dashboard, Properties, Areas, Developers, Listing Portal, Guides

**For Visitors (not logged in):**
- Properties, Areas, Developers, Guides

### Implementation — `src/components/navigation/HorizontalUtilityBar.tsx`

1. **Add a collapsed-only shortcuts section** between the Buy/Rent/Sell links and the right-side user shortcuts (after the `{divider}` at line 157)
2. Wrap it in `{sidebarCollapsed && ( ... )}` so it only renders when sidebar is minimized
3. Use the same gold pill styling as existing shortcuts for consistency
4. Show shortcuts as icon+label links with `hidden xl:inline` text labels (icon-only on smaller screens)
5. Add imports for any missing icons (e.g., `Shield` for Admin, `MapPin` for Areas)

### Files

| File | Changes |
|------|---------|
| `src/components/navigation/HorizontalUtilityBar.tsx` | Add conditional shortcuts strip visible only when sidebar is collapsed, role-aware |

