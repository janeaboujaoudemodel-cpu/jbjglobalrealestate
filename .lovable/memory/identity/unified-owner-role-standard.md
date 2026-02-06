# Memory: identity/unified-owner-role-standard

The system implements a strict binary identity model:

## Identity States

1. **Owner**: The sole privileged identity, verified exclusively by an authenticated email match (`auth.email === OWNER_EMAIL`).
2. **Visitor**: Any unauthenticated user (anonymous).

## Blocked State

- **Authenticated but not Owner**: Any logged-in user where `auth.email !== OWNER_EMAIL` must be hard-blocked (403) server-side.
- No alternative authenticated states are permitted.

## Deprecated Terms

Terms like "Admin", "Staff", "Moderator", or "User" are deprecated. Use:
- "Owner" for the single privileged identity
- "Visitor" for anonymous/unauthenticated users

## Enforcement

- All authorization is enforced at the API/RLS level
- UI must only reflect permissions, never decide them
- Never use "admin-only" — always say "Owner-only access"
