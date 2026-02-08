
# Account Menu Dropdown UI Improvements

## Summary

Make 4 improvements to the account dropdown menu (MegaMenuAccount.tsx):
1. Add gold border around the JB profile avatar circle
2. Display family name alongside the first name
3. Improve spacing between "Select your mode", mode switcher, and "Edit Profile" 
4. Extend the "AI Tools" header divider to span full width across both columns

---

## Current Issues

| Issue | Location | Problem |
|-------|----------|---------|
| Avatar border | Line 162-167 | Border is `border-zinc-300` (grey), not gold |
| Family name missing | Line 170-172 | Only shows `accountDisplayName`, no separate family name display |
| Cramped spacing | Lines 196-216 | "Select your mode" label, ModeSwitcher, and "Edit Profile" are too close together |
| AI Tools divider | Left column only | The divider under left column doesn't extend across to the right column |

---

## Implementation Plan

### 1. Gold Border on Avatar

**File: `src/components/header/MegaMenuAccount.tsx`** (Lines 162-167)

Change avatar border from grey to gold:

```tsx
// BEFORE
<Avatar className="h-16 w-16 border-2 border-zinc-300 bg-transparent">
  ...
  <AvatarFallback className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-zinc-300 ...">

// AFTER
<Avatar className="h-16 w-16 border-2 border-gold bg-transparent">
  ...
  <AvatarFallback className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold ...">
```

### 2. Display Family Name

Update the name display to show first name + family name from user metadata:

**File: `src/components/header/MegaMenuAccount.tsx`** (Update useMemo logic and display)

Add logic to extract first/last name:
```tsx
const firstName = useMemo(() => {
  const fn = userMeta.first_name as string | null;
  if (fn) return fn;
  // Fallback: first word of full_name
  const fullName = String(accountDisplayName);
  return fullName.split(' ')[0] || fullName;
}, [userMeta.first_name, accountDisplayName]);

const lastName = useMemo(() => {
  const ln = userMeta.last_name as string | null;
  if (ln) return ln;
  // Fallback: rest of full_name
  const fullName = String(accountDisplayName);
  const parts = fullName.split(' ');
  return parts.slice(1).join(' ') || '';
}, [userMeta.last_name, accountDisplayName]);
```

Update display (Line 170-172):
```tsx
// Show "First Last" format
<p className="text-black font-bold text-lg truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
  {firstName} {lastName}
</p>
```

### 3. Improve Spacing in Right Section

**File: `src/components/header/MegaMenuAccount.tsx`** (Lines 195-216)

Add more vertical spacing between elements:

```tsx
<div className="flex flex-col items-end gap-2 shrink-0">
  {/* "Select your mode" label */}
  <p className="text-[10px] text-gold font-semibold uppercase tracking-wider">
    Select your mode
  </p>
  
  {/* Mode Switcher */}
  <div onClick={(e) => e.stopPropagation()} ...>
    <ModeSwitcher variant="header" />
  </div>
  
  {/* Spacer + Edit Profile - more separation */}
  <Link 
    to="/profile" 
    onClick={onClose} 
    className="flex items-center gap-1.5 text-gold text-sm font-semibold hover:underline transition-colors mt-4"
  >
    Edit Profile
    <ChevronRight className="w-3.5 h-3.5" />
  </Link>
</div>
```

Changes:
- Increase `gap-1` → `gap-2` on the container
- Remove `mb-0.5` from the label
- Increase `mt-3` → `mt-4` on the Edit Profile link

### 4. Full-Width Divider Under AI Tools

Currently, the divider at line 252 (`border-t border-gold/30`) only spans the left column. To create a full-width divider that goes across both columns (similar to how other mega menus do it), we need to restructure slightly:

**Option A: Add a full-width divider above "Your Account" section header**

Move the column headers above the grid and add a shared divider:

```tsx
{/* Section Headers Row - Full Width */}
<div className="grid grid-cols-2 gap-6 mb-2">
  <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold px-2 py-1.5">
    Your Account
  </p>
  {(isOwner || hasCRMAccess || hasListingAdminAccess) && (
    <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold px-2 py-1.5">
      Owner Shortcuts
    </p>
  )}
</div>

{/* Full-width divider under headers */}
<div className="h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent mb-4" />

{/* Two-Column Content Grid */}
<div className="grid grid-cols-2 gap-6">
  ...
</div>
```

**Option B (Simpler): Add matching dividers in both columns**

Add an identical divider at the same position in the right column to create visual continuity.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/header/MegaMenuAccount.tsx` | All 4 changes listed above |

---

## Visual Before/After

```
BEFORE:                              AFTER:
┌─────────────────────────┐          ┌─────────────────────────┐
│ [JB] Jane bou Jaoude    │          │ [JB] Jane bou Jaoude    │
│ grey ← Investor+Broker  │          │ GOLD← Investor+Broker   │
│ border  pts             │          │ border  pts             │
│         Select your mode│          │                         │
│         [I | B | I+B]   │          │         Select your mode│
│         Edit Profile    │ cramped  │         [I | B | I+B]   │
│                         │          │                         │ spaced
│                         │          │         Edit Profile    │
├─────────────────────────┤          ├─────────────────────────┤
│ Your Account | Shortcuts│          │ Your Account | Shortcuts│
│ ─────────── |           │ half     │ ─────────────────────── │ full
│ Links...    | Links...  │          │ Links...    | Links...  │
└─────────────────────────┘          └─────────────────────────┘
```

---

## Verification Steps

After implementation:
1. Click on account icon in header
2. Verify avatar has gold border (both the Avatar and AvatarFallback)
3. Verify first name + family name are displayed correctly
4. Verify good spacing between "Select your mode", mode switcher, and "Edit Profile"
5. Verify the divider extends full width across both columns
