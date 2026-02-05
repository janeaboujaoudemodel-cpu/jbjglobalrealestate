
# Mode Switcher Click Bug Fix Plan

## Problem Analysis

The mode selection dropdown closes immediately when you click on a mode option. This is happening because Radix UI's `DropdownMenuItem` component has **built-in close-on-select behavior** that cannot be prevented with `stopPropagation()` or `preventDefault()` on the click event.

### Root Cause
Radix's `DropdownMenuItem` uses an internal `onSelect` callback that triggers the menu close. The current code uses `onClick` which fires **after** Radix has already processed the selection and scheduled the close.

### Current Code (Not Working)
```tsx
<DropdownMenuItem
  onClick={(e) => handleModeChange(modeKey as UserMode, e)}
  ...
>
```

### Why It Fails
1. User clicks the menu item
2. Radix fires internal `onSelect` → closes menu
3. Then `onClick` fires → tries to prevent close but menu already closed

---

## Solution

### Fix 1: Replace `onClick` with `onSelect` and Prevent Close

Use Radix's `onSelect` prop which fires **before** the menu closes and allows preventing the close:

```tsx
<DropdownMenuItem
  onSelect={(e) => {
    e.preventDefault(); // This prevents Radix from closing
    handleModeChange(modeKey as UserMode);
  }}
  ...
>
```

### Fix 2: Manual Close After Success State

After the mode changes successfully, close the dropdown manually with a small delay to show the success state:

```tsx
const handleModeChange = async (newMode: UserMode) => {
  await setMode(newMode);
  
  // Emit event for immediate UI updates
  window.dispatchEvent(new CustomEvent('userModeChange', { detail: newMode }));
  
  // Show success toast
  toast.success(`Switched to ${MODE_CONFIG[newMode].label}`);
  
  // Close dropdown after brief delay
  setTimeout(() => setIsOpen(false), 400);
};
```

---

## Avatar Flicker Fix

### Problem
The avatar initials flash from "JB" → "J" because `crmProfile` loads asynchronously and causes a re-render.

### Solution
1. Use **stable fallback** from `user_metadata` immediately (before CRM profile loads)
2. Only update if CRM profile has a **different** name
3. Add **loading skeleton** for the avatar until stable

### Implementation
```tsx
// Prioritize user_metadata (available immediately) over CRM profile (async)
const accountDisplayName = useMemo(() => {
  // Use cached CRM profile only if loaded, otherwise fall back to immediate data
  const crmName = !crmLoading ? (crmProfile as any)?.display_name : null;
  const metaName = (typeof userMeta.full_name === "string" ? userMeta.full_name : null) ||
                   (typeof userMeta.name === "string" ? userMeta.name : null);
  
  return crmName || metaName || user?.email?.split("@")[0] || "My Account";
}, [crmProfile, crmLoading, userMeta.full_name, userMeta.name, user?.email]);
```

---

## Dropdown Layout Shift Fix

### Problem
The dropdown opens smaller then expands, causing layout shift.

### Solution
Set **fixed minimum dimensions** on the dropdown shell:

```tsx
<MegaMenuShell 
  ref={ref}
  className="!left-auto !right-6 !w-[640px]"
  noScroll
  style={{ minHeight: '440px' }}
>
```

And ensure the inner content has a fixed height:
```tsx
<div className="p-6" style={{ minHeight: '420px', minWidth: '600px' }}>
```

---

## "Long-Press Disables Modes" Issue

### Analysis
This is a **touch event conflict** on mobile. When you long-press, the browser may trigger a context menu or different event that interferes with the click.

### Solution
Add touch event handling to ensure modes remain selectable:

```tsx
<DropdownMenuItem
  onSelect={(e) => {
    e.preventDefault();
    handleModeChange(modeKey as UserMode);
  }}
  onPointerDown={(e) => e.stopPropagation()} // Prevent touch conflicts
  ...
>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ModeSwitcher.tsx` | Use `onSelect` instead of `onClick`, add `onPointerDown` for touch stability |
| `src/components/header/MegaMenuAccount.tsx` | Fix avatar loading with stable fallback, add min dimensions |

---

## Verification Checklist

After implementation:
- [ ] Click on Investor Mode → stays open until mode changes, then closes
- [ ] Click on Broker Mode → selects without dropdown closing immediately
- [ ] Long-press on any mode → mode remains selectable (not disabled)
- [ ] Avatar shows stable initials (no JB → J flicker)
- [ ] Dropdown opens at full size (no expand animation)
- [ ] Badge shows "Investor • 0 pts earned" format
- [ ] Mode persists after page refresh

---

## Technical Details

### Radix DropdownMenuItem Behavior
By default, `DropdownMenuItem` closes the menu when selected. This is controlled by the `onSelect` callback:
- If `onSelect` calls `event.preventDefault()` → menu stays open
- If not prevented → menu closes

### Current Implementation Gap
The current code uses `onClick` which fires **after** Radix's internal selection handling. By the time `onClick` runs and tries to prevent closing, the menu is already scheduled to close.

### Correct Approach
Use `onSelect` to intercept the selection **before** Radix processes the close, then manually control when to close the dropdown.
