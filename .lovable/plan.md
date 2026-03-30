

# Create Read-Only Auditor Access for Salim Akil

## Overview
Create a secure, time-limited "auditor" role that grants Salim Akil (salim@be-venture.partners) read-only access to view all pages — including owner-protected areas — without the ability to modify, delete, or create anything. Access auto-expires after 30 days.

## Architecture

```text
┌─────────────────────────────────────────┐
│           OwnerGuard (updated)          │
│                                         │
│  isOwner? ──→ Full RW access            │
│  isAuditor? ─→ Read-only view access    │
│  Neither? ───→ /403 Access Denied       │
└─────────────────────────────────────────┘
```

## Steps

### 1. Database: Add `auditor` role to `app_role` enum
Add the new enum value so it can be assigned in `user_roles`.

### 2. Database: Add `expires_at` column to `user_roles`
A nullable timestamp column. When set, the role is only valid if `expires_at > now()`. This powers the 30-day auto-expiry.

### 3. Database: Update `has_role()` function
Modify the existing `has_role` security definer function to also check `expires_at` — a role with a past expiry is treated as non-existent.

### 4. Create the user account
Sign up Salim Akil (salim@be-venture.partners) with a generated secure password. Create a profile entry with his name. Assign the `auditor` role with `expires_at = now() + 30 days`.

### 5. Update `OwnerGuard` component
Allow users with the `auditor` role to pass through (in addition to owners). Add an `isAuditor` context flag.

### 6. Add `isAuditor` to `AuthContext`
After owner verification, also check if the user has the `auditor` role. Expose `isAuditor` flag.

### 7. Create `useAuditorReadOnly` hook
A simple hook that returns `true` when the current user is an auditor. Components use this to disable write actions (edit, delete, approve, submit buttons).

### 8. Add read-only enforcement layer
Create a small `<AuditorReadOnlyBanner />` component that shows a persistent "Read-Only Audit Mode" banner at the top when an auditor is logged in, and a `ReadOnlyGuard` wrapper that disables form submissions and destructive buttons.

### 9. Update RLS policies
Add SELECT-only policies for the `auditor` role on key tables (CRM, listings, analytics) so the auditor can view data but not insert/update/delete.

## Security safeguards
- Auditor can only SELECT — no INSERT, UPDATE, DELETE at RLS level
- 30-day auto-expiry enforced in the `has_role()` function itself (server-side)
- No access to destructive operations (wipe, bulk approve) even visually
- You can revoke access anytime by deleting the role from `user_roles`
- Password will be generated and shared with you privately — Salim will need to change it on first login

## Files to create/modify
- `supabase/migrations/` — new migration for enum + expires_at + has_role update + RLS
- `src/contexts/AuthContext.tsx` — add `isAuditor` flag
- `src/components/OwnerGuard.tsx` — allow auditor passthrough
- `src/hooks/useAuditorReadOnly.ts` — new hook
- `src/components/AuditorReadOnlyBanner.tsx` — new component
- Edge function or direct DB insert for account creation + role assignment

