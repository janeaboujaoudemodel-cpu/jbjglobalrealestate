
# Fix Plan: Email Verification, Cropped Dialog, and Mode Switcher Issues

## Problem Summary

Three critical issues need to be addressed:
1. **Email verification codes not being received** - Domain not verified on Resend
2. **Cropped email change dialog** - OTP input overflows container on mobile
3. **Mode switcher closes immediately in header** - Event propagation issue with nested dropdowns

---

## Phase 1: Fix Email Verification Delivery

### Root Cause
The edge function logs reveal:
```
Resend API error: {"statusCode":403,"message":"The jbjglobalrealestate.com domain is not verified...
```

### Solution
This is a configuration issue requiring manual action:

**User Action Required:**
1. Go to https://resend.com/domains
2. Add and verify the domain `jbjglobalrealestate.com`
3. Follow Resend's DNS verification steps (add TXT/MX records)
4. Wait for verification to complete (usually within minutes)

**Code Fallback (Temporary):**
The edge function already returns the OTP in the response for debugging. Update the frontend to display this code as a fallback when email delivery fails.

---

## Phase 2: Fix Cropped Email Change Dialog

### Root Cause
- Dialog uses `max-w-md` (448px max width)
- OTP slots are 48px wide × 6 = 288px + gaps = ~304px (fits)
- But the `w-[95vw]` on small screens combined with padding causes overflow

### Files to Modify
- `src/pages/UserProfile.tsx` (lines 614-743)
- `src/components/ui/input-otp.tsx` (optional - for responsive defaults)

### Changes

**UserProfile.tsx - DialogContent (line 616):**
```tsx
// BEFORE
<DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 w-[95vw] max-w-md mx-auto">

// AFTER - Use responsive width and ensure proper overflow handling
<DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto overflow-visible">
```

**OTP Input Group (lines 664-671):**
```tsx
// BEFORE
<InputOTPGroup className="gap-2">
  <InputOTPSlot index={0} className="w-12 h-14 border-2 border-gold/50..." />
  ...
</InputOTPGroup>

// AFTER - Responsive slot sizing
<InputOTPGroup className="gap-1.5 sm:gap-2 flex-wrap justify-center">
  <InputOTPSlot index={0} className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-gold/50..." />
  ...
</InputOTPGroup>
```

### Audit Other Dialogs
Search for similar patterns across the codebase and apply consistent responsive fixes:
- Ensure all dialogs use `max-w-[calc(100vw-2rem)]` as mobile fallback
- Ensure OTP inputs are responsive across all usages

---

## Phase 3: Fix Mode Switcher in Header Account Menu

### Root Cause
The `ModeSwitcher` component is rendered inside `MegaMenuAccount`, which is itself a dropdown-style menu. When clicking a mode option:
1. The `DropdownMenuItem` inside `ModeSwitcher` fires `onSelect`
2. Even with `e.preventDefault()`, the parent `MegaMenuAccount` receives click events and closes
3. The mode change happens but the UI closes before showing success state

### Files to Modify
- `src/components/ModeSwitcher.tsx`

### Solution
Wrap the entire ModeSwitcher dropdown in an event boundary to prevent propagation to parent menus:

```tsx
// In ModeSwitcher.tsx, wrap the DropdownMenu component

<div 
  onClick={(e) => e.stopPropagation()} 
  onPointerDown={(e) => e.stopPropagation()}
>
  <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
    ...
  </DropdownMenu>
</div>
```

### Additional Fix
The `onSelect` handler should also explicitly stop propagation:

```tsx
// Line 144-148 - enhance event handling
<DropdownMenuItem
  key={modeKey}
  onSelect={(e) => {
    e.preventDefault();
    e.stopPropagation(); // ADD THIS
    handleModeChange(modeKey as UserMode);
  }}
  onClick={(e) => e.stopPropagation()} // ADD THIS
  onPointerDown={(e) => e.stopPropagation()}
  ...
>
```

---

## Phase 4: Display OTP Fallback in Frontend (Temporary)

### Purpose
Until the Resend domain is verified, users can still complete email changes using the OTP returned in the response.

### Files to Modify
- `src/pages/UserProfile.tsx`

### Changes
In `handleSendEmailOtp`, check for `dev_otp` in response and display it:

```tsx
const handleSendEmailOtp = async () => {
  // ... existing validation ...
  
  try {
    const response = await supabase.functions.invoke('send-email-otp', {
      body: { email: newEmail, full_name: ... }
    });

    const data = response.data;
    if (data?.error) throw new Error(data.error);

    // Show OTP fallback if provided (domain not verified)
    if (data?.dev_otp) {
      toast.info(`Verification code: ${data.dev_otp}`, {
        description: "Email delivery may be delayed. Use this code to proceed.",
        duration: 30000
      });
    } else {
      toast.success("Verification code sent to your new email");
    }
    
    setEmailChangeStep('verify');
  } catch (error: any) {
    // ... existing error handling ...
  }
};
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/UserProfile.tsx` | Fix dialog width, responsive OTP slots, add OTP fallback display |
| `src/components/ModeSwitcher.tsx` | Add event propagation prevention for nested dropdown |

## User Action Required

**Verify Resend Domain:**
1. Navigate to https://resend.com/domains
2. Add `jbjglobalrealestate.com` 
3. Add the required DNS records to your domain provider
4. Verify the domain

This is required for production email delivery to work reliably.

---

## Testing Checklist

After implementation:
- [ ] Open email change dialog on mobile - verify no cropping
- [ ] Test OTP input on small screens - verify all 6 slots visible
- [ ] Test mode switcher from header account menu - verify dropdown stays open during selection
- [ ] Test mode switcher from footer - verify still works
- [ ] Verify OTP fallback displays when email delivery fails
- [ ] Verify mode actually changes and persists
