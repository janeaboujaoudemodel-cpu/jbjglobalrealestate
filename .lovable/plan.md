

# Fix CRM Shortcut Visibility in Header

## Problem
The `showCRM` variable uses conditional logic (`!user || isOwner || mode === 'broker' || mode === 'investor_broker'`) that fails when a user IS logged in but hasn't been assigned owner/broker roles. The CRM shortcut should always be visible in the header for discoverability — the access gate at `/owner/crm` (BrokerCRMAccessGate) already handles permission checking.

## Fix

### File: `src/components/navigation/HorizontalUtilityBar.tsx`

**Change 1** — Line 186: Hardcode `showCRM = true` so the CRM icon is always visible in the header rail regardless of auth state or role.

```tsx
// Before
const showCRM = !user || isOwner || mode === 'broker' || mode === 'investor_broker';

// After
const showCRM = true;
```

This is safe because the CRM page itself has `BrokerCRMAccessGate` which checks permissions on navigation. The header shortcut is just a link — it should always be discoverable.

## What stays the same
- All other buttons, icons, tooltips, badges, links
- CRM icon styling, tooltip text, link destination (`/owner/crm`)
- BrokerCRMAccessGate still enforces actual access control
- ModeSwitcher with `showForUnselected` prop
- Right rail structure and layout

