## Passkey / Biometric Sign-In (WebAuthn) — Plan

Adds true biometric login (Face ID, Touch ID, Windows Hello, Android fingerprint) using the WebAuthn standard on top of the current Supabase (Lovable Cloud) auth. Existing email+password and Google sign-in stay intact — passkeys are an additional method.

### 1. What the user will get

**Enrollment (after they are already signed in):**
- New "Security" panel in Account Settings shows "Sign in faster with Face ID / fingerprint".
- One-tap enroll button triggers the OS biometric prompt and registers a passkey for their account.
- List of registered passkeys with device label + created date + revoke button.

**Sign-in (`/auth` page):**
- New "Continue with Passkey" button above the email field.
- If the browser supports conditional UI, the email input also shows the passkey autofill chip natively.
- Click → OS biometric prompt → signed in. No password typed.

**Fallbacks always visible:** email+password, Google, magic link — no user is ever locked out if their device changes.

### 2. Architecture

WebAuthn credentials are stored in our own table and verified by an edge function; that function then mints a Supabase session for the matched user, so the rest of the app continues to use the existing `supabase.auth` session with no changes.

```text
Browser (SimpleWebAuthn/browser)
   │  1. GET  /webauthn-options            → challenge + allowed credentials
   ▼
Edge Fn: webauthn-options ── reads webauthn_challenges, user_passkeys
   │  2. navigator.credentials.get()  (OS biometric prompt)
   ▼
Browser
   │  3. POST /webauthn-verify   { assertion }
   ▼
Edge Fn: webauthn-verify
   │   • verifies signature (SimpleWebAuthn/server)
   │   • looks up user_id from credential_id
   │   • uses service role to generateLink / createSession
   ▼
Returns { access_token, refresh_token }
   │
   ▼
Browser: supabase.auth.setSession(...)  →  signed in
```

### 3. Backend (Lovable Cloud)

**Tables (new migration):**

- `user_passkeys` — one row per registered credential
  - `id uuid PK`, `user_id uuid FK → auth.users on delete cascade`
  - `credential_id text unique not null` (base64url)
  - `public_key bytea not null`
  - `counter bigint not null default 0`
  - `transports text[]`, `device_label text`, `aaguid uuid`
  - `backed_up boolean`, `created_at`, `last_used_at`
- `webauthn_challenges` — short-lived challenge store
  - `id uuid PK`, `challenge text not null`, `user_id uuid null` (null for usernameless flow)
  - `kind text check in ('registration','authentication')`
  - `expires_at timestamptz` (5 minute TTL, cleaned by cron)

Both tables get explicit GRANTs (`authenticated`, `service_role`) and RLS:
- `user_passkeys`: user can `select` / `delete` their own rows; inserts happen only via service role.
- `webauthn_challenges`: no direct client access; service role only.

**Edge functions (4):**

1. `webauthn-register-options` — auth required. Generates registration options, stores challenge, returns options.
2. `webauthn-register-verify` — auth required. Verifies attestation, inserts row in `user_passkeys` with a device label.
3. `webauthn-auth-options` — public. Generates authentication options (supports usernameless / conditional UI).
4. `webauthn-auth-verify` — public. Verifies assertion, updates `counter` + `last_used_at`, then mints a Supabase session for `user_id` using the service role and returns `{ access_token, refresh_token }`.

Library: `@simplewebauthn/server` in edge functions, `@simplewebauthn/browser` in the client.

**RP config:**
- `rpID` = current hostname (`jbj.ae`, `www.jbj.ae`, preview host) — read from request origin.
- `rpName` = "JBJ Global Real Estate".
- Support multiple origins so preview + custom domains all work.

### 4. Frontend

**New files:**
- `src/lib/passkeys.ts` — thin wrapper around SimpleWebAuthn/browser: `registerPasskey()`, `signInWithPasskey()`, `isPasskeySupported()`, `hasConditionalUI()`.
- `src/components/account/PasskeyManager.tsx` — enroll button + list + revoke, mounted in the existing Security section of Account Settings.
- `src/components/auth/PasskeyButton.tsx` — "Continue with Passkey" button + conditional-UI hook (`useEffect` triggers `mediation: 'conditional'` on the email input).

**Edits:**
- `src/pages/Auth.tsx` (or the current sign-in page): add `PasskeyButton` above the email field; wire conditional UI to the email input's `autocomplete="username webauthn"`.
- Account settings page: mount `PasskeyManager` inside the Security card.

### 5. Security posture

- Challenges are single-use, 5-minute TTL, deleted after verification.
- `counter` is monotonic-checked; a decrease revokes the credential and forces re-auth.
- Enrollment requires an already-authenticated session (no anonymous passkey binding).
- Session minting uses the service role only inside the verify function; the key never touches the client.
- Origins are whitelisted server-side (preview, `jbj.ae`, `www.jbj.ae`) — any other origin is rejected.
- Rate-limit both `-options` endpoints (per-IP, 20/min) to prevent challenge farming.
- User can revoke any device from Account Settings; revoked credential ids are refused immediately.

### 6. Rollout & fallbacks

- Feature is additive: nothing removed. Email/password + Google keep working exactly as today.
- If WebAuthn is unsupported (older browsers, some in-app webviews), the passkey button hides itself and the standard form is used.
- If a passkey is lost with the device, the user signs in with email/password or Google and re-enrolls.

### 7. Deliverables per step

1. Migration: `user_passkeys` + `webauthn_challenges` with GRANTs + RLS.
2. Deploy 4 edge functions above; add `@simplewebauthn/server` import.
3. Add `@simplewebauthn/browser` to the app; ship `src/lib/passkeys.ts`.
4. Mount `PasskeyButton` on the auth page + conditional-UI hook.
5. Mount `PasskeyManager` in Account Settings → Security.
6. Playwright pass: verify support detection on the preview, enroll flow (mocked authenticator), and revoke.

Approve and I'll build it in that order.
