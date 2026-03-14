

## Plan: WAF / Edge Defense / DDoS / Bot Protection (Security Layer 4E)

### Current State

**Already in place:**
- `enforceRateLimit` middleware used on 12 edge functions (auth, OTP, contact, admin, support)
- `checkIPBlocklist` with auto-block after 5 rate limit violations (12h block)
- `detectCredentialStuffing` — 10 failures in 30min → critical event
- `AntiBot` component — client-side behavioral analysis (mouse, scroll, click timing, honeypot)
- `ObfuscationLayer` — decoy DOM elements for scraper confusion
- `_headers` — CSP, X-Frame-Options, nosniff
- Origin validation in `auth-utils.ts` (CORS allowlist)
- `record-login-event` — impossible travel + new device detection

**Gaps identified:**
- **72 of 84 edge functions have NO rate limiting** — including all AI tools, data sync, scraping, and internal endpoints
- **No request-body-size enforcement** — large payloads can exhaust resources
- **No user-agent blocking** — known bot UAs (curl, python-requests, scrapy) not filtered
- **No progressive penalty** — repeated offenders get same 12h block regardless of severity
- **AntiBot is client-only** — easily bypassed; no server-side bot signal verification
- **No global middleware** — each function must manually import/call rate limiting
- **Admin/owner endpoints inconsistently protected** — some use `requireOwnerAuth` without rate limiting

### Implementation

#### 1. Create `supabase/functions/_shared/waf-middleware.ts`

A unified "WAF layer" function that combines all edge defenses into a single call:

```typescript
export async function enforceWAF(req, config): Promise<WAFResult>
```

This will chain:
1. **Request size check** — reject bodies > 1MB (configurable per function)
2. **User-agent filter** — block known bot UAs (python-requests, scrapy, wget, curl without browser headers, headless Chrome identifiers)
3. **Origin validation** — reject requests from non-allowed origins on browser-facing functions
4. **IP blocklist check** — existing `checkIPBlocklist`
5. **Rate limiting** — existing `enforceRateLimit` with per-function config
6. **Credential stuffing check** — on auth-related functions
7. Return `{ allowed, response, clientIp, serviceClient }` — same pattern as existing middleware

Config tiers (preset profiles):
- `"auth"` — 5 req/15min, credential stuffing check, strict UA filter
- `"ai"` — 10 req/5min per user, 30 req/15min per IP
- `"admin"` — 20 req/15min, owner-auth required
- `"public"` — 60 req/5min per IP, basic UA filter
- `"internal"` — 5 req/5min, owner-auth + strict origin

#### 2. Apply WAF to Unprotected Edge Functions

Update the highest-risk unprotected functions to use `enforceWAF`:

**AI tools (15 functions)** — `ai-virtual-staging`, `ai-price-predictor`, `ai-neighborhood-insights`, `ai-lead-qualification`, `ai-followup-scheduler`, `ai-objection-handler`, `ai-market-report`, `ai-competitor-analysis`, `ai-roi-calculator`, `ai-meeting-summarizer`, `ai-translation-hub`, `ai-video-tour-script`, `ai-contract-reviewer`, `ai-document-generator`, `ai-property-analyzer` — apply `"ai"` tier

**Admin/sync functions** — `reelly-api-sync`, `daily-reelly-auto-sync`, `reelly-backfill-projects`, `sync-developer-images`, `enrich-pending-imports`, `provident-enrich-projects` — apply `"internal"` tier

**Public-facing** — `account-lifecycle`, `handover-alerts`, `record-login-event` — apply `"public"` tier

#### 3. Progressive Penalty Escalation

Update `autoBlockIP` in `ai-utils.ts`:
- 1st block: 12 hours
- 2nd block: 48 hours  
- 3rd block: 7 days
- 4th+ block: 30 days (semi-permanent)
- Calculate from `block_count` already tracked in `ip_blocklist`

#### 4. Bot User-Agent Detection

Add to `waf-middleware.ts`:

```typescript
const BOT_UA_PATTERNS = [
  /python-requests/i, /scrapy/i, /wget/i, /curl\//i,
  /HeadlessChrome/i, /PhantomJS/i, /Selenium/i,
  /bot/i, /spider/i, /crawl/i, /slurp/i,
];
// Exception: Googlebot, Bingbot (legitimate crawlers for SEO)
const ALLOWED_BOTS = [/Googlebot/i, /bingbot/i, /Applebot/i];
```

Log blocked bot attempts to `api_security_events` with severity `medium`.

#### 5. Request Body Size Enforcement

In `waf-middleware.ts`, check `Content-Length` header and reject if > configured max (default 1MB, 5MB for file-upload functions).

#### 6. Enhanced Security Headers

Update `public/_headers` to add:
- `X-Permitted-Cross-Domain-Policies: none`
- Tighten CSP `connect-src` to include only production domains
- Add `Cross-Origin-Opener-Policy: same-origin`
- Add `Cross-Origin-Resource-Policy: same-origin`

#### 7. Edge Function: `waf-health-check`

A verification function (owner-only) that:
- Lists all edge functions and their WAF protection status
- Shows current IP blocklist stats
- Shows rate limit violation trends (last 24h)
- Returns a JSON report for the security dashboard

---

### Files Summary

| File | Change |
|------|--------|
| **New**: `supabase/functions/_shared/waf-middleware.ts` | Unified WAF middleware |
| **New**: `supabase/functions/waf-health-check/index.ts` | WAF status verification |
| **Update**: `supabase/functions/_shared/ai-utils.ts` | Progressive penalty escalation |
| **Update**: `public/_headers` | Additional security headers |
| **Update**: ~20 edge functions | Add `enforceWAF` calls |
| **Update**: `supabase/config.toml` | Register new function |

### Implementation Order
1. Create `waf-middleware.ts` with tiered profiles
2. Update `ai-utils.ts` for progressive penalties
3. Apply WAF to AI tool functions (highest abuse risk)
4. Apply WAF to admin/sync functions
5. Apply WAF to remaining public functions
6. Harden `_headers`
7. Create `waf-health-check` verification function

