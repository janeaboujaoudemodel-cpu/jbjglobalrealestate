

# Fix Navigation Arrow Overlap with Medium Chat Button

## Problem
When the chat support is in its "medium" collapsed state (the expanded banner showing "JBJ Support - Available 24/7"), the navigation arrows (`PageNavigation`) at `bottom-44` overlap with or sit too close to the chat button at `bottom-20`. The expanded banner is ~56px tall, meaning its top edge reaches ~136px from bottom, while arrows sit at 176px — only 40px gap which causes visual overlap especially on smaller screens.

## Fix

**File: `src/components/PageNavigation.tsx`**

Instead of always using `bottom-44`, make the arrow position dynamic based on whether the collapsed chat button is in its medium (attention pulse) or minimized (circle) state. Pass a new prop `isChatMedium` from `MainLayout`.

- When chat is **open** (full panel): arrows hidden (already works via `isChatOpen`)
- When chat is **collapsed + medium/attention-pulse**: arrows move to `bottom-56` (~224px) to clear the taller banner
- When chat is **collapsed + minimized** (small circle): arrows stay at `bottom-36` (~144px), just above the 56px circle at `bottom-20`
- When chat is **not rendered**: arrows at default `bottom-28`

**File: `src/components/MainLayout.tsx`**

Pass `isChatMedium={showAttentionPulse && effectiveCollapsed}` to `PageNavigation` so it knows which collapsed variant is showing.

### Changes

| File | Change |
|------|--------|
| `src/components/PageNavigation.tsx` | Add `isChatMedium` prop; dynamically set bottom class: `bottom-56` when medium, `bottom-36` when minimized circle |
| `src/components/MainLayout.tsx` | Pass `isChatMedium` prop to `PageNavigation` |

