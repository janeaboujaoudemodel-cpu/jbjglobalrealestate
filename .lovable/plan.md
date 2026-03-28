

# Restore Missing Header Buttons (CRM, Mode Switcher, Tasks, Notifications)

## Problem
All buttons are present in the code but invisible because the horizontal scroll container pushes the right-side buttons (CRM, Tasks, Notifications, Inbox, Dashboard, Mode Switcher, Settings) off-screen. The left rail (Back, Search, Buy, Rent, Sell, Favorites, Area Unit, Language, Currency, Filter) fills most of the available width, and the `flex-1` spacer + right rail overflow beyond the viewport inside `overflow-x-auto`. Users must scroll right to find them — which is not discoverable.

## Fix

### File: `src/components/navigation/HorizontalUtilityBar.tsx`

**Split Row 1 into two non-scrolling sections:**

1. **Left scrollable zone** — contains the navigation/filter controls (Back, Search, Buy, Rent, Sell, Favorites, Area Unit, Language, Currency, Filter). This part keeps `overflow-x-auto` with scroll arrows.

2. **Right fixed zone** — contains CRM, Tasks, Notifications, Inbox, Dashboard, Mode Switcher, Settings. This part sits outside the scroll container with `shrink-0` so it never scrolls away or gets hidden.

```text
┌─────────────────────────────────────────────────────────────────┐
│ [← scrollable nav items →]  │  CRM  Tasks  🔔  📥  📊  Mode  ⚙  │
│  (overflow-x-auto)           │  (always visible, shrink-0)       │
└─────────────────────────────────────────────────────────────────┘
```

**Specific changes:**
- Move the right-side rail (`<div className="flex items-center h-8 shrink-0">` containing CRM through Settings) **outside** the scrollable `ref={row1ScrollRef}` container
- Remove the `<div className="flex-1" />` spacer from inside the scroll container
- Add `ml-auto` to the right rail so it hugs the right edge
- Keep all existing buttons, tooltips, icons, badges, and conditional logic exactly as-is

### Also: Expand CRM visibility
- Change `showCRM` from `!!user && isOwner` to `!!user && (isOwner || mode === 'broker' || mode === 'investor_broker')` so brokers also see the CRM shortcut, matching the comment that already says "owner/broker only"

## What stays the same
- All icons, labels, tooltips, badge counts, links, and conditional rendering logic
- Row 2 filter bar unchanged
- Mobile GlobalHeader unchanged
- Scroll arrows still work for the left navigation zone

