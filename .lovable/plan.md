
# Restoration & Fix Plan: Listing Admin Access + Email OTP + Mode Selection

## Executive Summary

There are three interrelated issues affecting your account experience:

1. **Listing Admin redirects to homepage** - You are already set up correctly in the database (both "owner" and "admin" roles, plus an active listing_admins entry for `janeaboujaoudenails@gmail.com`). The redirect is happening because **you changed your email** and either (a) you're still logged in with a different email, or (b) the OTP flow to change it back failed.

2. **Email OTP not received / UI broken** - The edge function is configured correctly and RESEND_API_KEY is present. However, the most recent OTP record in the database shows code `377855` was created for `janeaboujaoudenails@gmail.com` but never verified. The email may not have arrived due to sender domain configuration or spam filtering. The OTP input dialog may also have layout issues.

3. **Mode selection dropdown closes on click** - The `ModeSwitcher` component uses a Radix `DropdownMenu`. Clicking an option triggers `handleModeChange()` which calls `setIsOpen(false)` + `navigate('/my-dashboard')`. This is working as designed, but if you're holding/long-pressing or if the menu closes before you can select, there's a touch event conflict. Additionally, "Broker" and "Investor + Broker" appear disabled because the `canAccessBrokerMode` check requires role = "broker", "broker_partner", or "broker_jbj", but your `user_role_selections` shows "investor" - not broker.

4. **"Explorer" label showing instead of mode** - The tier badge shows "Explorer" because that's the tier name from `useTierProgress()`, not the user mode. The mode label shows separately via `ModeSwitcher`. These are two different concepts (tier vs mode).

5. **Avatar flicker (JB → J)** - The `getInitials()` function splits the display name by space. If the name changes during loading (e.g., from CRM profile vs user metadata), the initials flash. Need to stabilize the avatar rendering.

---

## Root Cause Analysis

### Listing Admin Access

| Check | Status | Details |
|-------|--------|---------|
| user_roles.admin | PASS | user_id `72ca2405-b4ca-48df-9b47-623ee260a3cc` has "admin" role |
| user_roles.owner | PASS | same user_id has "owner" role |
| listing_admins | PASS | email `janeaboujaoudenails@gmail.com` is active |
| Current session email | UNKNOWN | If you changed email to something else and never changed back, your session is for a different user_id |

**Conclusion**: The `ListingAdminGuard` is role-based and correct. The issue is that you may be logged in as a different email (not the one with admin privileges). You need to either:
- Sign in again with `janeaboujaoudenails@gmail.com`, OR
- Successfully complete the email change flow to switch back to that email

### Email OTP Not Received

| Check | Status | Details |
|-------|--------|---------|
| RESEND_API_KEY secret | PASS | Secret is configured |
| Domain verified | User said YES | But sender is `onboarding@resend.dev` (Resend's shared sandbox) |
| Recent OTP record | FOUND | Code 377855 for janeaboujaoudenails@gmail.com, created ~1 hour ago, not verified |
| Edge function logs | EMPTY | No recent calls logged (may have timed out or not been called) |

**Root cause options**:
1. Email sent but went to spam (very common with `onboarding@resend.dev` sender)
2. Edge function call failed before sending (network issue, function cold start)
3. Resend API returned error but the fallback code path didn't surface it clearly

**Solution**: Update the sender to use a verified domain (e.g., `noreply@jbj.ae` or `no-reply@jbjglobalrealestate.com`) and ensure the OTP is clearly shown in dev mode or logged to the console for testing.

### OTP Dialog Layout Broken

The `DialogContent` in `UserProfile.tsx` (lines 615-744) uses proper styling:
- `className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 sm:max-w-md"`
- `InputOTPGroup` with 6 slots

But the `OTPVerificationModal.tsx` (used elsewhere) has a dark theme (`bg-zinc-900`). There may be a mismatch if the wrong modal is being triggered, or CSS conflicts with the input-otp component.

### Mode Selection Closes on Click

The `ModeSwitcher` component (lines 59-79) does:
```typescript
const handleModeChange = async (newMode: UserMode) => {
  const requiresBroker = newMode === 'broker' || newMode === 'investor_broker';
  if (requiresBroker && !canAccessBrokerMode) {
    toast.error('You need a broker role to access Broker Mode');
    return;  // <-- Exits but dropdown stays open
  }
  
  await setMode(newMode);
  setIsOpen(false);  // <-- Closes dropdown
  navigate('/my-dashboard', { replace: true });  // <-- Navigates away
  toast.success(`Switched to ${MODE_CONFIG[newMode].label}`);
};
```

**Issues**:
1. For Broker modes, if `canAccessBrokerMode` is false, it shows an error but doesn't close - this is correct
2. The menu closes after successful selection - this is intentional
3. The "disabled" appearance happens because you're not registered as a broker role

**Your request**: "Make them selectable for everyone" means removing the broker role requirement. This will allow anyone to switch to Broker mode, but broker-only pages/tools will still be locked.

---

## Implementation Plan

### Part 1: Fix Email OTP Delivery

**File: `supabase/functions/send-email-otp/index.ts`**

1. Update the sender address from `onboarding@resend.dev` to your verified domain
2. Add fallback console logging of OTP for development
3. Improve error messaging when Resend fails
4. Ensure the function returns the dev_otp in development for testing

### Part 2: Fix OTP Dialog Layout

**File: `src/pages/UserProfile.tsx`**

1. Ensure the OTP input slots have proper sizing and contrast
2. Add minimum width to the dialog to prevent layout collapse
3. Ensure the InputOTP component is properly styled for the champagne theme

### Part 3: Enable All Modes for Everyone

**File: `src/components/ModeSwitcher.tsx`**

1. Remove the broker role requirement for mode selection
2. Keep the `isDisabled` visual state but allow clicks
3. Show a different message: "You're now in Broker Mode - some features may be limited"

### Part 4: Fix Avatar Flicker

**File: `src/components/header/MegaMenuAccount.tsx`**

1. Stabilize the display name resolution with a memo/state that doesn't change mid-render
2. Add a loading state for the avatar initials
3. Set minimum dimensions on the avatar container to prevent layout shift

### Part 5: Clarify Tier vs Mode Labels

**File: `src/components/header/MegaMenuAccount.tsx`**

1. Replace "Explorer" tier label with mode-aware labeling
2. Change points display from "X pts" to "X pts earned"
3. Ensure the mode label is prominently displayed

### Part 6: Hide Admin Shortcuts for Non-Admins

**Files: `src/components/header/MegaMenuAccount.tsx`, `src/components/GlobalHeader.tsx`**

1. The Listing Admin link should only appear if the user has access (owner, admin, or listing_admin)
2. Add a check similar to `ListingAdminGuard` before rendering the link
3. This prevents showing a link that will just redirect away

### Part 7: Fix Mode Click Behavior

**File: `src/components/ModeSwitcher.tsx`**

1. Add `e.stopPropagation()` to mode option clicks to prevent dropdown close race conditions
2. Ensure the dropdown remains stable until selection is confirmed
3. Fix any long-press conflicts on mobile

---

## Database Status (No Changes Needed)

Your database is correctly configured:
- `user_roles`: You have both "admin" and "owner" roles for user_id `72ca2405-b4ca-48df-9b47-623ee260a3cc`
- `listing_admins`: Entry exists for `janeaboujaoudenails@gmail.com`, is_active = true
- `email_verifications`: Most recent OTP code `377855` was never verified

The issue is session/email mismatch, not database configuration.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/send-email-otp/index.ts` | Update sender domain, improve error handling, add dev logging |
| `src/pages/UserProfile.tsx` | Fix OTP dialog layout, ensure proper styling |
| `src/components/ModeSwitcher.tsx` | Remove broker role restriction, fix click behavior |
| `src/components/header/MegaMenuAccount.tsx` | Stabilize avatar, fix labels, conditional admin links |
| `src/components/GlobalHeader.tsx` | Conditional rendering of Listing Admin link in mobile menu |

---

## Immediate Workaround

While these fixes are being implemented, you can regain Listing Admin access by:

1. **Sign out completely** (clear the session)
2. **Sign in with** `janeaboujaoudenails@gmail.com` (the email that has admin/owner roles)
3. **Access /listing-admin directly** - it should work since that user_id has all required permissions

If you forgot the password for that email, use the "Forgot Password" flow to reset it.

---

## Testing Checklist

After implementation:
- [ ] Email OTP arrives in Gmail inbox (not spam)
- [ ] OTP dialog displays correctly on mobile and desktop
- [ ] Can switch between all three modes (Investor, Broker, Investor+Broker)
- [ ] Mode selection persists after refresh
- [ ] Avatar initials don't flicker
- [ ] Points label shows "X pts earned"
- [ ] Listing Admin link only shows for authorized users
- [ ] Listing Admin page loads correctly when accessed with correct email
