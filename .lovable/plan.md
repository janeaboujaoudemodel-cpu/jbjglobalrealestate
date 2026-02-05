
# Fix Email Change Flow: Custom OTP Verification

## Problem Summary

The current email change uses Supabase's built-in `updateUser({ email })` which has two issues:
1. **Sends verification to BOTH emails** - Supabase's security design sends confirmation to old + new email
2. **Exposes Lovable URLs** - When clicking the confirmation link, users are redirected to `id-preview--*.lovable.app` which exposes Lovable branding

This is unacceptable for your users who should never see Lovable references.

---

## Solution: Custom OTP-Based Email Change

Replace Supabase's default flow with a custom OTP verification that:
- Sends OTP **only to the NEW email** (proving ownership)
- Never shows any Lovable URLs
- Uses your existing `send-email-otp` and `verify-email-otp` edge functions
- Updates the email via admin API after successful OTP verification

---

## Implementation Plan

### 1. Create New Edge Function: `change-user-email`

This backend function will:
- Accept the user ID and new email
- Verify an OTP was validated for that email
- Update the user's email using Supabase Admin API
- No redirect URLs involved - purely API-based

**Location**: `supabase/functions/change-user-email/index.ts`

```text
Request Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. User enters new email in dialog                          │
│ 2. Frontend calls send-email-otp with NEW email only        │
│ 3. User enters 6-digit OTP from email                       │
│ 4. Frontend calls verify-email-otp                          │
│ 5. Frontend calls change-user-email (new edge function)     │
│    → Validates OTP was verified                             │
│    → Updates auth.users email via Admin API                 │
│ 6. User is logged out and must re-login with new email      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Modify UserProfile.tsx

Replace the current `handleChangeEmail` flow with a multi-step process:

**Step 1**: Enter new email → Send OTP
**Step 2**: Enter OTP code → Verify OTP  
**Step 3**: OTP verified → Execute email change via edge function

**New UI Flow**:
```text
┌────────────────────────────────────────┐
│ Change Email Address                   │
├────────────────────────────────────────┤
│ Current: jane@example.com              │
│                                        │
│ New Email: [___________________]       │
│                                        │
│ [Send Verification Code]               │
├────────────────────────────────────────┤
│ Enter the 6-digit code sent to         │
│ your new email:                        │
│                                        │
│ [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ]         │
│                                        │
│ [Verify & Change Email]                │
└────────────────────────────────────────┘
```

---

## Technical Details

### New Edge Function: `change-user-email`

```typescript
// Validates:
// 1. User is authenticated (JWT required)
// 2. OTP was verified for the new email within last 10 minutes
// 3. Updates email using supabase.auth.admin.updateUserById()

Input: { new_email: string }
Output: { success: true, message: "Email changed" } or { error: string }
```

### UserProfile.tsx Changes

1. **Add state variables**:
   - `emailChangeStep: 'input' | 'verify'`
   - `otpCode: string`
   - `sendingOtp: boolean`
   - `verifyingOtp: boolean`

2. **Add functions**:
   - `handleSendEmailOtp()` - Calls `send-email-otp` with NEW email only
   - `handleVerifyAndChangeEmail()` - Calls `verify-email-otp` then `change-user-email`

3. **Update Dialog UI**:
   - Step 1: Email input + "Send Code" button
   - Step 2: OTP input + "Verify & Change" button
   - Success: Close dialog + sign user out to re-login

---

## Security Measures

| Security Check | Implementation |
|---------------|----------------|
| User authentication | JWT token required for `change-user-email` |
| Email ownership | OTP sent only to new email |
| OTP validation | Must be verified within 10 minutes |
| Rate limiting | Existing 3 attempts per 10 minutes |
| Force re-login | User signed out after email change |

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/change-user-email/index.ts` | **CREATE** - New edge function |
| `supabase/config.toml` | **UPDATE** - Add function config |
| `src/pages/UserProfile.tsx` | **UPDATE** - New OTP-based email change flow |

---

## Result

After implementation:
- OTP sent **only to the new email** (not both)
- **Zero Lovable URLs** exposed to users
- Users verify ownership via 6-digit code (no email links)
- Proper email ownership verification before change
- User forced to re-login with new email after change
