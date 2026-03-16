
Goal: Fix Session 1 regressions in header tooltips and notification consistency without touching unrelated UI.

Current status (from code audit):
1) Notification counter sync: PARTIALLY IMPLEMENTED
- File: src/components/navigation/HorizontalUtilityBar.tsx
- Component: HorizontalUtilityBar
- Route: desktop header on all non-backoffice routes (e.g., /, /e-signature)
- Problem: notification badge uses alerts.totalAlerts (includes pending tasks) and caps at 9+.
- Related file: src/hooks/useUserAlerts.ts (totalAlerts = notifications + tasks)

2) Notification vs dropdown mismatch: PARTIALLY IMPLEMENTED
- File: src/components/ListingNotificationBell.tsx
- Component: ListingNotificationBell (panelMode/bellOnly)
- Route: mobile header dropdown (GlobalHeader)
- Problem: bell cap displays 9+ while dropdown logic can show exact unread counts; creates visible mismatch.

3) Tooltip color consistency: PARTIALLY IMPLEMENTED
- File: src/components/navigation/HorizontalUtilityBar.tsx
- Component: HorizontalUtilityBar
- Route: desktop header
- Black tooltips remain on: Search, Favorites (heart), Area Unit (ft²/m²), Filter, CRM.
- File: src/components/navigation/GlobalBackButton.tsx
- Component: GlobalBackButton
- Route: desktop header
- Back tooltip still black.

Implementation plan (targeted only):
A) Unify notification count source and display behavior
- Files:
  - src/components/navigation/HorizontalUtilityBar.tsx
  - src/components/ListingNotificationBell.tsx
  - src/components/GlobalHeader.tsx
- Changes:
  1. Use notificationUnreadCount = alertCounts?.totalNotificationAlerts (notifications only) for bell badges.
  2. Keep tasks count only on Tasks badge.
  3. Remove “9+” cap for alert badge (show exact numeric value) so badge equals dropdown unread value.
  4. Ensure ListingNotificationBell panel unread label and bell badge derive from same unread variable.
- State logic:
  - Source of truth: useUserAlerts().totalNotificationAlerts.
  - Badge and dropdown both bind to this same unread value.

B) Enforce gold tooltip text for all header icons user listed
- Files:
  - src/components/navigation/HorizontalUtilityBar.tsx
  - src/components/navigation/GlobalBackButton.tsx
- Changes:
  - Apply gold text class to TooltipContent for:
    - Back
    - Search
    - Favorites (heart)
    - Area Unit (ft²/m²)
    - Filter
    - CRM
    - (retain existing gold on currency/language/tasks/alerts/inbox/dashboard/settings/mode)
  - Keep existing requested descriptions; no extra visual redesign.

C) Verification and proof pack (post-implementation)
- No database changes.
- Routes to verify:
  - /e-signature (desktop header)
  - / (desktop header)
  - Mobile viewport on / (GlobalHeader bell/dropdown consistency)
- Screenshots required:
  1. Alert badge exact number matching dropdown unread count.
  2. Hover tooltip for Back showing gold text.
  3. Hover tooltip for Search showing gold text.
  4. Hover tooltip for heart (Favorites) showing gold text.
  5. Hover tooltip for ft²/m² toggle showing gold text.
  6. Hover tooltip for Filter showing gold text.
  7. Hover tooltip for CRM showing gold text.
- Test evidence steps:
  1. Login with seeded notifications.
  2. Capture bell badge number.
  3. Open notifications panel and capture unread total.
  4. Confirm equality: badgeCount == dropdownUnreadCount.
  5. Hover each listed icon and capture tooltip color/description.
  6. Repeat badge/dropdown check on mobile header to ensure parity across header variants.

Definition of done for this session:
- Badge no longer shows 9+ when actual unread is known.
- Notification bell uses notification unread count only (not tasks).
- All listed header tooltips render in gold text and keep clear action descriptions.
- Evidence screenshots provided for each required hover/count case.
