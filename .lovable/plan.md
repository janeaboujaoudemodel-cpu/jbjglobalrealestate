

## Session 4 — Header Alignment, Notification Accuracy, Filter Wiring, and Gold Styling Fixes

### Issues Identified

**1. Horizontal header not aligned with sidebar header — PARTIALLY IMPLEMENTED**
- **File:** `src/components/navigation/HorizontalUtilityBar.tsx` line 114
- The horizontal utility bar uses `[body.jj-vertical-nav-active_&]:left-[200px]` but has `left-0` by default (no default left offset when sidebar is active on initial render before body class is applied)
- The bar starts at `top-0` which sits on top of the 88px sidebar header, not beside it

**2. Sidebar collapse button too close to wordmark — PARTIALLY IMPLEMENTED**
- **File:** `src/components/navigation/GlobalVerticalNav.tsx` lines 1082-1088
- The collapse button uses `ml-1` — too tight against the wordmark text
- The ChevronLeft icon uses `text-black/40` — should be gold per user request

**3. Notification badge/tooltip mismatch (showing 11 on hover vs 6 on badge) — PARTIALLY IMPLEMENTED**
- **File:** `src/components/navigation/HorizontalUtilityBar.tsx` lines 314-329
- Badge shows `alerts!.totalNotificationAlerts` — correct source
- The tooltip just says "View your notifications" (no count), so the "11" the user sees is likely from the notification panel dropdown which fetches its own data independently
- **Root cause:** `ListingNotificationBell` panel fetches fresh notifications while `useUserAlerts` has 30s stale time — they can show different counts
- **Fix:** Make the panel header show the same `unreadCount` from `useUserAlerts` hook (line 99 of ListingNotificationBell.tsx), and ensure the bell badge in HorizontalUtilityBar also uses the same source. The mismatch is that the panel counts local unread from fetched items vs the hook's DB count.

**4. Filter bar not fully wired — all filters should navigate to /properties — PARTIALLY IMPLEMENTED**
- **File:** `src/components/navigation/HorizontalUtilityBar.tsx` lines 87-95
- `handleFilterChange` only encodes `q`, `type`, and `emirate` — drops price, bedrooms, size, views, statuses, construction, areas, developers, sort, hideSoldOut, etc.
- **Fix:** Use the same `encodeFilters` function from `GlobalFilterBar.tsx` (or replicate it) to encode ALL filter params

**5. Icons in horizontal header not all gold — PARTIALLY IMPLEMENTED**
- **File:** `src/components/navigation/HorizontalUtilityBar.tsx` line 105
- `iconClass` uses `text-black/50` for Filter, Tasks, Alerts, Inbox, Dashboard, Settings icons
- Should be `text-[hsl(var(--gold))]` for all header icons

**6. Area unit toggle border styling — PARTIALLY IMPLEMENTED**
- **File:** `src/components/navigation/HorizontalUtilityBar.tsx` lines 209-226
- Has `rounded-none` — should have rounded corners to look premium

**7. Tooltip descriptions need to explain what each field does — PARTIALLY IMPLEMENTED**
- Current tooltips like "View your notifications" are too brief
- User wants each tooltip to explain the field's purpose

---

### Implementation Plan

#### A. Fix horizontal header alignment with sidebar
**File:** `src/components/navigation/HorizontalUtilityBar.tsx`
- The bar already has `[body.jj-vertical-nav-active_&]:left-[200px]` and `[body.jj-vertical-nav-collapsed_&]:left-[48px]` which handles the left offset
- Remove the default `left-0` and replace with proper default left offset matching the sidebar state

#### B. Fix sidebar collapse button spacing and gold icon
**File:** `src/components/navigation/GlobalVerticalNav.tsx`
- Change `ml-1` to `ml-auto` on the collapse button to push it to the far right with natural spacing
- Change `text-black/40` to `text-gold` on the ChevronLeft icon

#### C. Fix notification count mismatch
**File:** `src/components/ListingNotificationBell.tsx`
- In panelMode header, show `unreadCount` (from useUserAlerts hook) instead of counting from local fetched notifications
- This ensures the panel header "Notifications (X)" matches the bell badge number exactly

**File:** `src/components/navigation/HorizontalUtilityBar.tsx`
- Add the notification count to the tooltip: `"View your notifications ({count})"`

#### D. Wire all filters to /properties with full params
**File:** `src/components/navigation/HorizontalUtilityBar.tsx`
- Replace the partial `handleFilterChange` (lines 87-95) with a complete encoding that passes all filter state to URL params — reuse the `encodeFilters` logic from `GlobalFilterBar.tsx`

#### E. Make all header icons gold
**File:** `src/components/navigation/HorizontalUtilityBar.tsx`
- Change `iconClass` from `text-black/50 group-hover:text-black/70` to `text-[hsl(var(--gold))] group-hover:text-[hsl(var(--gold))]`

#### F. Fix area unit toggle borders
**File:** `src/components/navigation/HorizontalUtilityBar.tsx`
- Change `rounded-none` to `rounded-lg` on the area unit button

#### G. Enhance tooltip descriptions
**File:** `src/components/navigation/HorizontalUtilityBar.tsx`
Update all tooltip texts to be descriptive:
- Search: "Search properties, developers, areas, and more (⌘K)"
- Buy: "Browse off-plan and ready properties for sale in the UAE"
- Rent: "Browse properties available for rent across the UAE"
- Sell: "List your property for sale or rent on JBJ Global"
- Favorites: "View your saved and shortlisted properties"
- ft²/m²: "Toggle between Square Feet and Square Meters for property sizes"
- Filter: "Open advanced property filters — price, bedrooms, type, handover, and more"
- CRM: "Access your Customer Relationship Management dashboard"
- Tasks: "View and manage your pending action items"
- Alerts: "View your unread notifications and updates"
- Inbox: "Open your direct messages and correspondence"
- Dashboard: "Access your personalized dashboard with analytics and activity"
- Mode: "Switch between Buyer, Broker, Investor, or Developer modes"
- Settings: "Manage your account, profile, and preferences"

---

### Files Modified
1. `src/components/navigation/HorizontalUtilityBar.tsx` — icons gold, filter wiring, tooltip text, area unit border
2. `src/components/navigation/GlobalVerticalNav.tsx` — collapse button spacing and gold icon
3. `src/components/ListingNotificationBell.tsx` — panel unread count consistency

### Database Changes
None.

### Testing Steps
1. Verify horizontal header left edge aligns with sidebar content area
2. Hover over bell icon — tooltip count should match badge number
3. Open notification panel — unread count in panel header should match badge
4. Click any filter in advanced filter panel → verify navigation to `/properties` with all params in URL
5. Hover each icon — verify gold color and descriptive tooltip text
6. Check area unit toggle has rounded borders
7. Verify sidebar collapse button has spacing from wordmark and gold icon color

