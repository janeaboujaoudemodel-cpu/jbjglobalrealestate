

## Plan: Fix Notification Counter Sync, Title Color, and Header Tooltips

### Analysis Summary

**TASK 1 — Notification Count Mismatch**

Two separate count sources create the discrepancy:

- **HorizontalUtilityBar.tsx (line 321)**: Badge shows `alerts?.totalAlerts` from `useUserAlerts` hook — this is a `head: true` count query across 4 tables (ticket notifs + listing notifs + system notifs + pending tasks). Returns aggregate counts only.
- **ListingNotificationBell.tsx (line 99)**: Bell badge shows `unreadCount` = ticket + listing + system (3 tables, **excludes tasks**). Panel fetches actual records with limits (5 + 10 + 5 = 20 max, capped at 15). The panel list length may differ from any badge count because it fetches all notifications (read + unread), not just unread.
- **Root cause**: Badge counts unread items via `count: "exact", head: true`, while panel fetches actual rows (both read and unread) with arbitrary limits. Badge = unread count; panel list = all recent notifications.

**Fix**: Make the bell badge in `ListingNotificationBell` use `alertCounts?.totalAlerts` (same as HorizontalUtilityBar) so both badges match. In the panel, filter `notifications.filter(n => !n.is_read).length` should equal the badge. Display total count consistently.

**Files**: `src/components/ListingNotificationBell.tsx` line 99, `src/components/navigation/HorizontalUtilityBar.tsx` lines 321-324.

---

**TASK 2 — Notification Title Color**

- **Current**: `ListingNotificationBell.tsx` line 194: `text-stone-900` (black)
- **Fix**: Change to `text-[hsl(var(--gold))]` for gold champagne color
- **File**: `src/components/ListingNotificationBell.tsx` line 194

Also fix the panel header title (line 160): `text-stone-900` → gold-tinted.

---

**TASK 3 — Header Tooltip Descriptions**

Current tooltips in `HorizontalUtilityBar.tsx` are mostly one-liners. Update to match required descriptions:

| Item | Current (line) | Required |
|------|--------|----------|
| Tasks | "My Tasks" (308) | "View and manage your tasks" |
| Notifications | "Notifications — N unread" (328-330) | "View your notifications" |
| Inbox | "My Inbox — Messages & updates" (345) | "Open your messages" |
| Dashboard | "My Dashboard & Profile" (363) | "Access your dashboard" |
| Settings | "Profile & Settings" (386) | "Manage account settings" |
| Buy | "Explore properties for sale" (155) | Already correct |
| Rent | "Rent a property" (170) | "Find properties for rent" |
| Sell | "List your property for sale or rent" (185) | Already correct |
| Language | "Select your language" (235) | Already correct |
| Currency | "Select your currency" (245) | Already correct |
| Mode | No tooltip wrapping ModeSwitcher (369-371) | "Select your mode based on your role" |

**Files**: `src/components/navigation/HorizontalUtilityBar.tsx` — update tooltip text on ~6 lines, add Tooltip wrapper around ModeSwitcher.

---

### Implementation

**Batch 1 (all 3 tasks, 2 files)**:

1. **`src/components/ListingNotificationBell.tsx`**:
   - Line 99: Change `unreadCount` to use `alertCounts?.totalAlerts || 0` for consistency
   - Line 194: Change `text-stone-900` → `text-[hsl(var(--gold))]`
   - Line 160: Change header `text-stone-900` → `text-[hsl(var(--gold))]`

2. **`src/components/navigation/HorizontalUtilityBar.tsx`**:
   - Line 308: "My Tasks" → "View and manage your tasks"
   - Line 328-330: Simplify to "View your notifications"
   - Line 345: "My Inbox — Messages & updates" → "Open your messages"
   - Line 363: "My Dashboard & Profile" → "Access your dashboard"
   - Line 170: "Rent a property" → "Find properties for rent"
   - Line 386: "Profile & Settings" → "Manage account settings"
   - Lines 369-371: Wrap ModeSwitcher in Tooltip with "Select your mode based on your role"

### Testing Steps
1. Log in, check bell badge count matches panel unread count
2. Open notification panel, verify titles show in gold
3. Hover each header item, verify tooltip text matches spec

### Proof Deliverables
- Component names: `ListingNotificationBell`, `HorizontalUtilityBar`
- Routes: `/` (homepage header), `/my-dashboard#notifications`
- No database changes required

