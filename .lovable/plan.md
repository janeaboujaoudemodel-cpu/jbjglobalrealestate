

# Fix My Account Dropdown Avatar Style

## Problem Identified
The current MegaMenuAccount has these issues:
1. **Square avatar with gold border** - Lines 89-102 use `rounded-2xl` wrapper with gold gradient background and `rounded-xl` on the Avatar
2. **Green online indicator dot** - Line 104 adds a green circle
3. The dropdown IS already rectangular (using MegaMenuShell) - this is correct

## Solution

### Restore Default Circular Avatar Style
Remove the current premium square styling and restore the default circular avatar:

**Current code (lines 88-105):**
```tsx
<div className="relative">
  <div 
    className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
    style={{
      background: 'linear-gradient(135deg, #C8A766 0%, #D4AF37 50%, #B8860B 100%)',
    }}
  >
    <Avatar className="h-[72px] w-[72px] border-2 border-white/30 rounded-xl">
      ...
    </Avatar>
  </div>
  {/* Online indicator */}
  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full" />
</div>
```

**New code:**
```tsx
<Avatar className="h-16 w-16">
  <AvatarImage src={accountPhotoUrl ?? ""} alt={...} className="object-cover" />
  <AvatarFallback className="bg-black text-gold text-xl font-bold">
    {getInitials(String(accountDisplayName))}
  </AvatarFallback>
</Avatar>
```

### Changes Summary
| Element | Before | After |
|---------|--------|-------|
| Avatar shape | Square (rounded-2xl/rounded-xl) | Circle (default rounded-full) |
| Gold gradient wrapper | Present | Removed |
| Gold border on avatar | Present (border-white/30) | Removed |
| Green online dot | Present | Removed |
| Dropdown shape | Rectangular (MegaMenuShell) | No change - already correct |

---

## Technical Details

### File to Modify
`src/components/header/MegaMenuAccount.tsx`

### Specific Changes
1. **Lines 88-105**: Replace the entire avatar section wrapper
   - Remove the outer `<div className="relative">` with gold gradient background
   - Remove the green indicator dot
   - Use simple `<Avatar>` with default circular styling
   - Keep a reasonable size (h-16 w-16 = 64px) for the dropdown context
   - Keep the black background fallback with gold initials (matches brand)

2. The rest of the component (links, admin shortcuts, sign out button) stays unchanged - they're already premium styled correctly

