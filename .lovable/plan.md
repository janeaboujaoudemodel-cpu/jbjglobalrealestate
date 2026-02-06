
# Fix Plan: Mode Switcher Dropdown & Email Change Dialog Issues

## Problem Analysis

### Issue 1: Mode Switcher Closes Immediately in Header Account Menu

**Root Cause Identified:**
The ModeSwitcher uses Radix UI's `DropdownMenuContent`, which renders via a portal to `document.body`. When this portal content is clicked:
1. The click event propagates through the DOM
2. The GlobalHeader backdrop (`onClick={closeMegaMenu}`) at line 1488 receives the click
3. The entire MegaMenuAccount closes before the mode change completes

**Why Previous Fix Failed:**
The `stopPropagation()` handlers in ModeSwitcher only prevent React synthetic event propagation within the dropdown component tree. They don't prevent native DOM clicks from reaching the backdrop because the portal renders OUTSIDE the MegaMenuShell container.

**Z-Index Layers:**
- Backdrop: `z-[9998]` (absolute inset-0)
- MegaMenuShell: `z-[9999]`
- Radix Portal: Renders to body, no specific z-index relationship to backdrop

### Issue 2: Email Change Dialog Not Opening

**Assessment:**
After code review, the dialog implementation appears correct:
- Button at line 477 correctly calls `setShowEmailChangeDialog(true)`
- Dialog component at line 624 correctly uses `open={showEmailChangeDialog}`

The issue may be related to the browser testing environment or a rendering timing issue. I'll verify and add console logging to diagnose.

---

## Solution Architecture

### Phase 1: Fix Mode Switcher Backdrop Conflict

**Approach A: Controlled Backdrop Click Handling**

Modify the backdrop `onClick` handler in GlobalHeader.tsx to check if the click target is within a dropdown portal before closing:

```typescript
// Line 1486-1489 in GlobalHeader.tsx
<div 
  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
  onClick={(e) => {
    // Check if click originated from a Radix portal (dropdown/popover)
    const target = e.target as HTMLElement;
    const isInsideRadixPortal = target.closest('[data-radix-portal]');
    if (!isInsideRadixPortal) {
      closeMegaMenu();
    }
  }}
/>
```

**Approach B: ModeSwitcher with Portal Container Override**

Configure Radix DropdownMenu to render into a specific container rather than document.body:

```typescript
// In ModeSwitcher.tsx
<DropdownMenuContent 
  container={document.getElementById('mega-menu-portal-container')}
  ...
>
```

Then add a container div inside MegaMenuShell that has higher z-index.

**Recommended: Approach A** - Less invasive, single file change, addresses root cause at the event handling level.

### Phase 2: Verify Email Change Dialog

Add diagnostic console logging to confirm the button click is triggering state updates:

```typescript
// In UserProfile.tsx, line 477
onClick={() => {
  console.log('Email change dialog triggered');
  setShowEmailChangeDialog(true);
}}
```

If the dialog state is updating but not rendering, investigate potential CSS conflicts or z-index issues with the Dialog component.

---

## Implementation Changes

### File 1: `src/components/GlobalHeader.tsx`

**Change:** Modify backdrop onClick handler to ignore clicks from Radix portals

**Location:** Lines 1486-1489

**Before:**
```tsx
<div 
  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
  onClick={closeMegaMenu}
/>
```

**After:**
```tsx
<div 
  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
  onClick={(e) => {
    // Don't close if click came from a Radix portal (dropdowns, popovers, etc.)
    const target = e.target as HTMLElement;
    if (target.closest('[data-radix-portal]')) return;
    closeMegaMenu();
  }}
/>
```

### File 2: `src/components/ModeSwitcher.tsx`

**Change:** Add higher z-index to DropdownMenuContent to ensure visibility

**Location:** Line 131-133

**Before:**
```tsx
<DropdownMenuContent 
  align="end" 
  className="w-64 bg-white border border-zinc-200 shadow-xl rounded-xl p-1 z-50"
>
```

**After:**
```tsx
<DropdownMenuContent 
  align="end" 
  className="w-64 bg-white border border-zinc-200 shadow-xl rounded-xl p-1 z-[10001]"
  sideOffset={5}
>
```

### File 3: `src/pages/UserProfile.tsx`

**Change:** Add console logging for dialog trigger debugging (temporary)

**Location:** Line 477

This will help verify the button click is registering. If the issue is confirmed as a rendering problem, further investigation into Dialog z-index may be needed.

---

## Technical Details

### Radix Portal Behavior
Radix UI renders dropdown content to `document.body` by default via a portal. This means:
- The content is NOT a DOM child of the trigger element
- Click events don't propagate through the React component tree as expected
- Native DOM event bubbling can reach elements "behind" the portal

### Z-Index Stack
After fixes:
- Backdrop: `z-[9998]`
- MegaMenuShell: `z-[9999]`
- ModeSwitcher Dropdown: `z-[10001]` (above backdrop, properly layered)

---

## Testing Checklist

After implementation:
1. Open Header Account Menu → Click "Investor Mode" → Dropdown should open
2. Click "Broker Mode" → Mode should change, dropdown stays visible briefly, then closes with success toast
3. Repeat from footer mode switcher → Should continue working
4. Open Profile page → Click "Change" next to email → Dialog should open
5. Test dialog on mobile viewport → Verify no cropping
6. Test complete email change flow with OTP
