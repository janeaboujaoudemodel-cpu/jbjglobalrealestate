

## Plan: API Security + Rate Limiting + Abuse Prevention

### Current State Assessment

**Already strong:**
- Shared `_shared/ai-utils.ts` provides `checkRateLimit()`, `checkIPBlocklist()`, and `autoBlockIP()` backed by `function_rate_limits` and `ip_blocklist` tables
- ~32 edge functions already use the shared rate limiter (all AI tools, market report, compare-projects)
- `capture-lead` has its own inline rate limiter (10 req / 15 min per IP)
- `user-registration` has rate limiting (5 req / 15 min per IP) + IP blocklist + Zod validation
- `send-email-otp` has basic OTP attempt limiting (3 per 10 min per email)
- `vapi-webhook` has HMAC signature verification
- `whatsapp-webhook` has verify_token validation
- `log-security-event` logs violations and auto-blocks fingerprints after 5 violations
- `security_events`, `scraping_blocks`, `ip_blocklist` tables exist
- `auth-utils.ts` provides origin validation with allowlist
- `VITE_OWNER_EMAIL` in `.env` (unused by frontend, but should be removed — noted in Session 11)
- No actual API secrets exposed in frontend — only `VITE_SUPABASE_PUBLISHABLE_KEY` (safe by design)

**Gaps to fix:**

| Gap | Details |
|-----|---------|
| **Webhooks without signature validation** | `resend-inbound-email-webhook` has NO auth/signature check — anyone can POST fake inbound emails |
| **Auth-sensitive functions without rate limits** | `send-email-otp`, `verify-email-otp`, `reset-password-with-otp`, `change-user-email` lack rate limiting via the shared system |
| **Admin/owner functions without rate limits** | `generate-crm-report`, `wipe-and-rebuild`, `bulk-approve-imports`, `send-admin-message` |
| **No centralized security event logging from edge functions** | Rate limit hits, blocked IPs, auth failures are `console.warn` only — not persisted to `security_events` for owner dashboard |
| **No credential stuffing detection** | Login/signup abuse patterns not tracked beyond basic OTP limits |
| **`VITE_OWNER_EMAIL` still in `.env`** | Flagged in Session 11 but not yet removed |

### Implementation

#### 1. Database Migration

**New table: `api_security_events`** — Centralized security event log from edge functions:
```
id (uuid PK), event_type (text: rate_limit_hit/auth_failure/blocked_ip/
  suspicious_pattern/webhook_invalid/credential_stuffing),
function_name (text), client_ip (text), user_id (uuid nullable),
severity (text: low/medium/high/critical),
details (jsonb), created_at (timestamptz default now())
```
RLS: Owner-only SELECT, service-role INSERT only. No UPDATE/DELETE.

**New table: `webhook_replay_log`** — Replay protection for webhooks:
```
id (uuid PK), webhook_source (text), event_id (text unique),
received_at (timestamptz default now())
```
Unique constraint on `event_id` prevents replay attacks. Auto-cleanup of entries older than 48 hours via index.

#### 2. Shared Security Utilities Enhancement

**Update: `supabase/functions/_shared/ai-utils.ts`**
- Add `logSecurityEvent()` helper that inserts into `api_security_events` using service role
- Called automatically on rate limit violations, IP blocks, and auth failures
- Add `detectCredentialStuffing()` — checks for >10 failed auth attempts from same IP in 30 min

#### 3. Rate Limiting for Unprotected Functions

**New: `supabase/functions/_shared/rate-limit-middleware.ts`**
- Thin wrapper around existing `checkRateLimit` + `checkIPBlocklist` + security event logging
- Provides a single `enforceRateLimit(req, config)` call that returns either `null` (allowed) or a `Response` (blocked)

Apply to these functions by updating their `index.ts`:

| Function | Limit | Notes |
|----------|-------|-------|
| `send-email-otp` | 5/15min per IP | Credential stuffing vector |
| `verify-email-otp` | 10/15min per IP | Brute force OTP guessing |
| `reset-password-with-otp` | 3/15min per IP | Password reset abuse |
| `change-user-email` | 3/60min per user | Sensitive account action |
| `generate-crm-report` | 5/15min per user | Export abuse |
| `bulk-approve-imports` | 10/15min per user | Mass action |
| `send-admin-message` | 20/15min per user | Spam prevention |
| `newsletter-subscribe` | 5/15min per IP | Spam submissions |
| `submit-support-ticket` | 5/15min per IP | Spam submissions |
| `submit-contact-gating` | 10/15min per IP | Form abuse |

#### 4. Webhook Security Hardening

**Update: `resend-inbound-email-webhook/index.ts`**
- Add Resend webhook signature verification using `svix` headers (`svix-id`, `svix-timestamp`, `svix-signature`)
- Add replay protection: check `svix-id` against `webhook_replay_log`, reject duplicates
- Add timestamp freshness check (reject if >5 min old)
- Requires adding `RESEND_WEBHOOK_SECRET` secret (will request from user)

**Update: `whatsapp-webhook/index.ts`**
- Already has verify_token for GET — add replay protection for POST messages using message ID dedup

#### 5. Security Event Dashboard Integration

**New: `src/pages/owner/APISecurityDashboard.tsx`** — Owner-only at `/owner/api-security`

Sections:
- **Rate Limit Monitor**: Recent rate limit hits by function, IP, and user
- **Auth Failures**: Failed authentication attempts with IP/pattern analysis
- **Blocked IPs**: Active IP blocks with reason, expiry, and unblock action
- **Webhook Audit**: Recent webhook events with validation status
- **Credential Stuffing Alerts**: Flagged IPs with repeated auth failures

#### 6. API Key Exposure Audit

**Remove `VITE_OWNER_EMAIL` from `.env`** — already available as runtime secret `OWNER_EMAIL`. Frontend doesn't import it.

**Audit result (no action needed):**
- All `VITE_SUPABASE_PUBLISHABLE_KEY` usage is the anon key (safe by design)
- No other secrets referenced via `VITE_` prefix
- No secrets logged to console
- No secrets in query strings

### Files Summary

| File | Change |
|------|--------|
| **Migration** | Create `api_security_events` + `webhook_replay_log` with immutable RLS |
| **New**: `supabase/functions/_shared/rate-limit-middleware.ts` | Unified rate limit + security logging wrapper |
| **Update**: `supabase/functions/_shared/ai-utils.ts` | Add `logSecurityEvent()` + credential stuffing detection |
| **Update**: 10 edge functions | Add rate limiting via shared middleware |
| **Update**: `resend-inbound-email-webhook/index.ts` | Add Svix signature verification + replay protection |
| **Update**: `whatsapp-webhook/index.ts` | Add message dedup/replay protection |
| **New**: `src/pages/owner/APISecurityDashboard.tsx` | Security monitoring dashboard |
| **Update**: `src/routes/OwnerRoutes.tsx` | Add route |
| **Update**: `.env` | Remove `VITE_OWNER_EMAIL` |

### Implementation Order
1. Database migration (security events + replay log tables)
2. Shared rate-limit middleware + security event logger
3. Apply rate limiting to 10 unprotected edge functions
4. Webhook signature verification (Resend + WhatsApp hardening)
5. API Security Dashboard
6. Route registration + `.env` cleanup

