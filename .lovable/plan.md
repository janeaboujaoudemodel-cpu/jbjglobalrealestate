

# Fix CRM and Mode Switcher Not Showing in Header

## Root Cause

Two separate gating issues prevent these buttons from rendering:

1. **ModeSwitcher** (line 512): The component internally checks `hasSelectedRole` from `useUserRole()` and returns `null` if the user hasn't completed role selection. The header already passes no `showForUnselected` prop, so it defaults to `false`.

2. **CRM + Tasks + Notifications + Inbox** (lines 413-489): All wrapped in `{user && (...)}` — if `user` is null (not yet loaded or in preview), none render. The `showCRM` logic itself is correct (`isOwner || broker || investor_broker`), but the outer `user` gate blocks everything.

3. **ModeSwitcher** also depends on `useUserModeContext()` which may show loading state indefinitely if auth hasn't resolved.

## Fix

### File: `src/components/navigation/HorizontalUtilityBar.tsx`

**Change 1**: Pass `showForUnselected={true}` to `ModeSwitcher` in the header so it always renders regardless of role selection state.

```tsx
// Line 512: Change from
<ModeSwitcher variant="header" />
// To
<ModeSwitcher variant="header" showForUnselected />
```

**Change 2**: Move ModeSwitcher, Dashboard, and Settings OUTSIDE the `{user && (...)}` block (they're already outside — confirmed). No change needed here.

**Change 3**: Show CRM for ALL logged-in users who are owner/broker, and ensure the `user` gate doesn't hide everything when auth is still loading. Add a fallback: show Dashboard, ModeSwitcher, and Settings even without `user` so they're always visible.

Restructure the right rail (lines 412-533) to:
- Keep CRM, Tasks, Notifications, Inbox inside `{user && (...)}`
- Keep Dashboard, ModeSwitcher, Settings OUTSIDE `{user && (...)}` — they're already outside, just confirm no structural issue

### File: `src/components/ModeSwitcher.tsx`

No changes needed — the `showForUnselected` prop already exists and works correctly.

## What stays the same
- All icons, tooltips, badges, links, conditional logic
- Row 2 filter bar
- Mobile header
- CRM visibility logic (`showCRM` predicate is already correct)

