

# Fix: Right-Side Buttons Pushed Off-Screen

## Root Cause
The scroll container (`ref={row1ScrollRef}`) at line 253 has `flex-1` but lacks `min-w-0`. In CSS flexbox, items default to `min-width: auto`, meaning the scroll container refuses to shrink below the natural width of its children. The right rail (CRM, Tasks, Notifications, Inbox, Dashboard, Mode Switcher, Settings) gets pushed beyond the viewport.

## Fix

### File: `src/components/navigation/HorizontalUtilityBar.tsx`

**One-line change** on line 255: Add `min-w-0` to the scroll container's className.

```
Before: "flex-1 h-full flex items-center gap-2 px-3 sm:px-5 xl:px-6 pr-2 sm:pr-3 xl:pr-4 overflow-x-auto ..."
After:  "flex-1 min-w-0 h-full flex items-center gap-2 px-3 sm:px-5 xl:px-6 pr-2 sm:pr-3 xl:pr-4 overflow-x-auto ..."
```

This allows the left scrollable zone to shrink, giving the right fixed rail (`shrink-0`) the space it needs to stay visible.

## What stays the same
- All buttons, icons, tooltips, badges, links, and conditional logic remain exactly as-is
- The right rail structure (already outside the scroll container) is correct and untouched
- Row 2 filter bar unchanged

