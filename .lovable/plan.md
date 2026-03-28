

# Fix CRM Access Denied + Email Security + Dual Owner Registration

## Problems

1. **Owner gets Access Denied on CRM**: The `verify-owner` edge function checks `user_roles` table, `app_settings.owner_email`, and `OWNER_EMAIL` env var — but `janeaboujaoudemodel@gmail.com` likely has no `owner`/`admin` role in `user_roles`. The function returns `email_mismatch`, AuthContext sets `isOwner = false`, and OwnerGuard redirects to `/403`.

2. **Email leaked in API responses**: The `verify-owner` edge function returns the user's email in its JSON response (`email: user.email`) for ALL outcomes — including denial. This is a security risk.

3. **Header CRM shortcut visibility**: Currently `showCRM = !!user && (isOwner || mode === 'broker' || ...)`. Since `isOwner` is false, the CRM only shows if `mode` happens to match. It should be strictly tied to `isOwner`.

4. **AccessDenied page**: Already fixed to hide email, but need to confirm no remnants.

## Plan

### 1. Database: Register both owner emails with owner+admin roles
Insert `owner` and `admin` roles for the user ID associated with `janeaboujaoudemodel@gmail.com` into `user_roles`. Use a migration that looks up the user by email from `auth.users` and inserts if not exists.

```sql
-- Add owner and admin roles for janeaboujaoudemodel@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::app_role FROM auth.users WHERE email = 'janeaboujaoudemodel@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'janeaboujaoudemodel@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure janeaboujaoudenails@gmail.com also has both roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::app_role FROM auth.users WHERE email = 'janeaboujaoudenails@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'janeaboujaoudenails@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### 2. Edge Function: Remove email from verify-owner responses
**File: `supabase/functions/verify-owner/index.ts`**

Remove `email: user.email` from ALL response bodies (lines 64, 80, 89, 98). Return only `isOwner`, `source`, and `reason` — never PII.

### 3. Header: Keep showCRM tied to isOwner
**File: `src/components/navigation/HorizontalUtilityBar.tsx`**

The current logic `!!user && (isOwner || mode === 'broker' || mode === 'investor_broker')` is correct for visibility. Once the database fix registers the owner, `isOwner` will be `true` and CRM will show and work.

### 4. AccessDenied: Confirm no email display
**File: `src/pages/AccessDenied.tsx`** — Already fixed. Verify no `userEmail` or `user.email` rendering remains.

## What stays the same
- OwnerGuard logic (correct as-is, just needs `isOwner` to resolve `true`)
- BrokerCRMAccessGate logic
- AuthContext verification flow
- All route protection structure

