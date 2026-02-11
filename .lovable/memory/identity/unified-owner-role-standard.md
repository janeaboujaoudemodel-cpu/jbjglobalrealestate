# Memory: identity/unified-owner-role-standard

The system implements a strict binary identity model:

## Identity States

1. **Owner**: The sole privileged identity, verified exclusively by an authenticated email match (`auth.email === OWNER_EMAIL`).
   - OWNER_EMAIL: `janeaboujaoudenails@gmail.com`
   - **Owner Legal Name (LOCKED)**: `Jane Bou Jaoude` — This spelling is FINAL. No variants allowed anywhere in UI, DB, prompts, voice, email sender, templates, AI memory, or logs.
2. **Visitor**: Any unauthenticated user (anonymous/no auth token).

## Blocked State

- **Authenticated but not Owner**: Any logged-in user where `auth.email !== OWNER_EMAIL` must be hard-blocked (403) server-side and redirected to `/403` (AccessDenied page).

## Deprecated Terms

Terms like "Admin", "Staff", "Moderator", or "User" are **completely removed** from the codebase. Use:
- "Owner" for the single privileged identity
- "Visitor" for anonymous/unauthenticated users
- "Owner-only access" instead of "admin-only"

## Auth Context

- `isOwner` is the only privilege flag in `AuthContext`
- `isAdmin` has been **removed entirely** (not aliased)
- `OwnerGuard` component protects routes requiring Owner access

## Enforcement

- All authorization is enforced at the API/RLS level (server-side)
- UI only reflects permissions, never decides them
- Never use "admin-only" — always say "Owner-only access"

## Implementation Status (Complete - February 2026)

- ✅ `isAdmin` removed from `AuthContext` and all global contexts
- ✅ All components use `isOwner` from auth context
- ✅ Domain-specific flags renamed: `isAdmin` → `hasOwnerAccess` or `isCRMOwner`
- ✅ `OwnerGuard` component created for route protection
- ✅ `/403` AccessDenied page created
- ✅ All Owner-only routes wrapped with `OwnerGuard` in App.tsx
- ✅ Terminology updated across UI ("Admin Panel" → "Owner Panel")
- ✅ Translation strings updated (en.ts)

## Protected Routes (via OwnerGuard)

All `/admin/*`, `/crm/*`, `/internal/*`, `/owner/*`, `/jbj-*`, `/founder-assistant`, `/employee-hub`, 
`/hr-dashboard`, `/it-department`, `/security-console`, `/automations`, `/studio`, and other management routes
are now wrapped with `OwnerGuard` for UI-layer protection.

Server-side enforcement via Edge Functions + RLS remains authoritative.
