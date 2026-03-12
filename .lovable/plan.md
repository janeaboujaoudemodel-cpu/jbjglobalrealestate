

## Plan: Vertical Nav Auto-Expand + Role-Based Chat Shortcuts + Full Page Coverage

### Problem Summary
1. **Vertical sidebar**: Clicking a section (e.g., "Business Suites") navigates to the page but does NOT auto-expand that section in the sidebar to show all subpages. It only auto-expands on initial mount.
2. **Chat shortcuts**: Currently hardcoded with 10 generic options. Owner cannot see CRM, Admin Panel, Listing Admin, Inbox, etc. Regular users see the same list as owner. No role-based filtering.
3. **Full page coverage**: All pages should be discoverable in the vertical nav and footer across all devices.

---

### Changes

#### 1. Auto-expand sidebar section on route change (`GlobalVerticalNav.tsx`)

**Current bug**: Line 834-847 — auto-open only fires once (`hasAutoOpenedRef`). On subsequent navigations, the section does NOT re-open.

**Fix**: Remove the `hasAutoOpenedRef` guard. On every `location.pathname` change, find the section containing the active route and set it as `openSection`. Also scroll the section into view. This replaces the current route-change effect (lines 797-804) which currently only closes mega menus.

Key change in the route-change `useEffect`:
- Find matching section for current path
- Call `setOpenSection(matchedSection)`
- `scrollIntoView` the section element
- Keep mega menu close logic

#### 2. Role-based Chat Shortcuts (`ChatShortcuts.tsx` + `AIChatWidget.tsx`)

**Current**: 10 hardcoded shortcuts (buy, sell, rent, etc.) — no role awareness.

**New approach**:
- Accept `userRole` prop (from `useUserRole`) in `ChatShortcuts`
- Define role-based shortcut sets:
  - **Owner/Admin**: All current shortcuts PLUS: Owner Command Center, CRM Dashboard, Admin Panel, Listing Admin, Inbox/Enquiries, Customer Happiness, CV Center, Email Client, Team Chat, Automations
  - **broker_jbj** (with CRM assigned): Current shortcuts PLUS: CRM Dashboard, My Tasks, Inbox, Broker Dashboard
  - **broker_jbj** (without CRM): Current shortcuts only + Dashboard, Tasks, Notifications
  - **broker_partner**: Current shortcuts + Broker Portal, Broker Toolkit
  - **investor**: Current shortcuts + Investor Hub, Investor Dashboard, Portfolio
  - **visitor/client**: Current shortcuts + Dashboard, Favorites, Shortlists, Notifications, Books

- Pass role from `AIChatWidget` (add `useUserRole` hook there) to `ChatShortcuts`
- For broker CRM access: check if `crm_users_profile` exists for that user (already done in `useUserRole` hook — `isJBJBroker` flag)

#### 3. Footer completeness audit (`Footer.tsx`)

The footer already has ~15 card sections covering most pages. I will cross-reference the vertical nav's `NAV_ITEMS` list against the footer link arrays and add any missing routes. Key gaps to check:
- AI Tools (many individual AI tools not in footer)
- Business Suites section
- Admin/Owner links (conditionally shown for owner role)
- Productivity tools completeness

#### 4. Vertical nav completeness

The vertical nav already contains 300+ items covering all sections. Will verify no major pages are missing and ensure the `SECTION_KEYS` array and `sectionGroups` mapping include all routes.

---

### Files to modify

| File | Change |
|------|--------|
| `src/components/navigation/GlobalVerticalNav.tsx` | Auto-expand section on every route change (not just initial mount) |
| `src/components/chat/ChatShortcuts.tsx` | Add role-based shortcut filtering with owner/broker/investor/visitor sets |
| `src/components/AIChatWidget.tsx` | Pass `useUserRole()` data to ChatShortcuts |
| `src/components/Footer.tsx` | Add missing page links to ensure full coverage |

### Verification
After implementation, I will take browser screenshots of:
1. Clicking "Business Suites" in sidebar → section auto-expands showing all subpages
2. Chat shortcuts for owner role showing admin hubs
3. Footer showing comprehensive page coverage

