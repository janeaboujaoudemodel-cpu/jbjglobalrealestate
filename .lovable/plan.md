

## Plan: Authentication Hardening + MFA + Device Trust + Session Security (Layer 4B)

### Current State

**Already exists:**
- `CRMReAuthModal` — password re-auth for CRM sensitive actions
- `useCRMSessionSecurity` — idle timeout (15min), elevated session (10min), sensitive action gating
- `useBiometricAuth` — WebAuthn (Face ID/Touch ID) but client-only challenge (no server verification)
- `verify-owner` — backend owner verification via user_roles + app_settings
- `owner-auth-middleware` — zero trust JWT + role check for edge functions
- `api_security_events` — centralized security event logging
- OTP-based email verification flow exists (`send-email-otp`, `verify-email-otp`)
- Rate limiting on auth endpoints (Session 14)

**Critical gaps:**
- **No MFA/TOTP** — no `supabase.auth.mfa` usage anywhere; owner/admin rely on single-factor password
- **Biometric is client-only** — challenge generated locally, never verified server-side; purely cosmetic security
- **No trusted device tracking** — no `trusted_devices` table; every login is treated equally
- **No session revocation** — `signOut` uses `scope: 'local'` only; no ability to kill all sessions or revoke specific ones
- **No login anomaly detection** — no tracking of device fingerprint, geo, or impossible travel
- **Re-auth modal is CRM-only** — not reusable for owner-level sensitive actions (exports, rollbacks, key changes)
- **No suspicious login alerts** — failed logins are rate-limited but owner isn't notified of patterns

### Implementation

#### 1. Database Migration

**New table: `trusted_devices`**
```
id (uuid PK), user_id (uuid NOT NULL), device_fingerprint (text NOT NULL),
device_name (text), browser (text), os (text), last_used_at (timestamptz),
trusted_at (timestamptz default now()), expires_at (timestamptz),
is_revoked (bool default false)
```
RLS: Users can SELECT/UPDATE their own devices only. No public INSERT (service-role only).

**New table: `login_events`**
```
id (uuid PK), user_id (uuid), email (text), client_ip (text),
device_fingerprint (text), user_agent (text), browser (text), os (text),
country (text nullable), city (text nullable),
event_type (text: success/failure/suspicious/blocked),
failure_reason (text nullable), created_at (timestamptz default now())
```
RLS: Owner-only SELECT. Service-role INSERT only.

#### 2. Edge Function: `record-login-event`

Called after every sign-in attempt (success or failure) from the frontend `AuthContext`.

Logic:
- Parse user-agent for browser/OS
- Record IP, fingerprint, result
- **Anomaly detection**: Check last 5 successful logins for this user — if new device fingerprint not in `trusted_devices`, flag as `suspicious` and log to `api_security_events`
- **Impossible travel**: Compare IP geo (country level via header `cf-ipcountry`) against last login within 2 hours — flag if different country
- **Credential stuffing cross-check**: Call existing `detectCredentialStuffing()` from rate-limit-middleware

#### 3. Generalized Re-Auth Modal

**Refactor `CRMReAuthModal` → `src/components/security/ReAuthModal.tsx`**

A platform-wide re-authentication modal that:
- Accepts `actionLabel`, `onSuccess`, `severity` (normal/critical)
- For `critical` severity: requires password + shows action confirmation
- Logs to `api_security_events` (not just `crm_security_events`)
- Used by owner dashboards for: exports, permission changes, key updates, publishing, rollback, wipe-and-rebuild

**New hook: `src/hooks/useStepUpAuth.ts`**
```typescript
const { requireStepUp } = useStepUpAuth();
// Returns true if re-auth needed, shows modal automatically
await requireStepUp("Export CRM Data", "critical", onConfirmed);
```
- Checks if user has elevated session (reuses `useCRMSessionSecurity` logic but generalized)
- If elevated within last 10 min, skips modal
- Otherwise shows `ReAuthModal`

#### 4. Session Management Controls

**Update `AuthContext`**:
- Add `signOutAllSessions()` — calls `supabase.auth.signOut({ scope: 'global' })`
- Add `signOutOtherSessions()` — calls `supabase.auth.signOut({ scope: 'others' })`

**New section in owner settings**: "Active Sessions"
- Shows trusted devices from `trusted_devices` table
- "Revoke All Other Sessions" button
- "Remove Trusted Device" per-device action

#### 5. Trusted Device Flow

**New hook: `src/hooks/useTrustedDevice.ts`**
- Generates device fingerprint from: `navigator.userAgent` + `screen.width` + `screen.height` + `navigator.language` + `navigator.platform` (hashed via Web Crypto SHA-256)
- On login success, checks if fingerprint exists in `trusted_devices`
- If not: prompts "Trust this device?" with 30-day expiry
- If trusted: skips re-auth for medium-sensitivity actions (still required for critical)

#### 6. Suspicious Login Notification

**Update `record-login-event`**: When a login is flagged as `suspicious` (new device, impossible travel, or repeated failures):
- Insert into `api_security_events` with severity `high`
- If owner email is configured, send notification via existing `send-admin-message` edge function

#### 7. Owner Security Dashboard Enhancement

**Update `src/pages/owner/ZeroTrustAuditPanel.tsx`** — Add new tabs:
- **Login Activity**: Recent login events with device, location, status
- **Trusted Devices**: List with revoke controls
- **Session Controls**: Global sign-out, other-session sign-out buttons
- **Anomaly Alerts**: Impossible travel flags, new device logins, credential stuffing detections

#### 8. Biometric Hardening Note

The existing `useBiometricAuth` uses client-side WebAuthn with locally generated challenges. Full server-side WebAuthn verification requires storing public keys server-side and verifying assertions against them. The current implementation provides device-level verification (the OS verifies the user's identity) but not server-side proof. This is acceptable for UX convenience (quick re-login) but should NOT be treated as a security factor. The plan:
- Keep biometric as a convenience login shortcut
- Mark it clearly as "device verification" not "MFA"
- All security-critical paths require password re-auth regardless of biometric status

### Files Summary

| File | Change |
|------|--------|
| **Migration** | Create `trusted_devices` + `login_events` tables with RLS |
| **New**: `supabase/functions/record-login-event/index.ts` | Login event recording + anomaly detection |
| **New**: `src/components/security/ReAuthModal.tsx` | Generalized re-auth modal (replaces CRM-only version) |
| **New**: `src/hooks/useStepUpAuth.ts` | Step-up authentication orchestrator |
| **New**: `src/hooks/useTrustedDevice.ts` | Device fingerprinting + trust management |
| **Update**: `src/contexts/AuthContext.tsx` | Add global/other session sign-out + call record-login-event on sign-in |
| **Update**: `src/pages/owner/ZeroTrustAuditPanel.tsx` | Add login activity, trusted devices, session controls tabs |
| **Update**: `src/routes/OwnerRoutes.tsx` | No new routes needed (extends existing panel) |

### Implementation Order
1. Database migration (trusted_devices + login_events)
2. `record-login-event` edge function
3. `ReAuthModal` + `useStepUpAuth` hook
4. `useTrustedDevice` hook
5. AuthContext session management updates
6. ZeroTrustAuditPanel enhancements

