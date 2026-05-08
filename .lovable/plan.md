# Resend-Only Sending + Daily Free-Plan Cap

## 1. Resend free plan limits (verified)
- **100 emails / day**
- **3,000 emails / month**
- **2 requests / second** (burst rate)
- Custom domain only sends after DNS verification; otherwise sender is locked to `onboarding@resend.dev`.

We will enforce the **daily 100** cap as the hard ceiling, plus a soft **2,900 / 30-day** monthly guard so we don't blow the monthly quota either. The Resend API key is kept active and untouched (per your choice).

## 2. Funnel every send through one Resend gateway

Today ~35 edge functions call Resend or Gmail directly. We add a single shared module + edge function that becomes the *only* path to Resend:

```
supabase/functions/_shared/resendClient.ts        ← shared sender + cap check
supabase/functions/email-send-gateway/index.ts    ← thin HTTP wrapper (for non-edge callers)
```

All existing senders (`send-owner-email`, `outreach-send-locked`, `outreach-bulk-worker`, `rel-send-bulk-email`, `resend-support-ticket-confirmation`, `documents-send`, `esign-*`, `send-*-email`, `uae-registry-send`, `crm-send-brokerage-outreach`, etc.) are refactored to call `sendViaResend(...)` from the shared module instead of `fetch("https://api.resend.com/emails", …)` or Gmail API directly.

Result: one chokepoint = one place to enforce the cap, log usage, and swap providers later.

## 3. Daily/monthly cap enforcement

New table `email_send_quota` (admin-only RLS, service role writes):

| column | purpose |
|---|---|
| `day` (date, PK) | UTC date bucket |
| `sent_count` (int) | successful sends that day |
| `failed_count` (int) | for observability |
| `last_send_at` (timestamptz) | drives 2 req/s throttle |

Plus a **single-row** `email_send_quota_config` table holding the editable limits (`daily_limit=100`, `monthly_limit=2900`, `rate_per_sec=2`) so you can tune from the UI without redeploying.

Logic inside `sendViaResend`:
1. `SELECT … FOR UPDATE` today's row (insert if missing).
2. Reject with `429 DAILY_LIMIT_REACHED` if `sent_count >= daily_limit`.
3. Sum last 30 days; reject with `429 MONTHLY_LIMIT_REACHED` if `>= monthly_limit`.
4. Sleep to honor `rate_per_sec` (cheap `setTimeout` based on `last_send_at`).
5. POST to Resend; on 2xx increment `sent_count`, else `failed_count` + return original error.

Caps are **global / account-wide** (your choice).

## 4. Owner-facing UI

Small panel on `/owner/crm/relationships` (and Communication Hub):
- Today's usage `47 / 100` progress bar (gold hairline, ink text — per design tokens).
- 30-day usage `1,204 / 2,900`.
- "Edit limits" dialog → updates `email_send_quota_config`.
- Banner appears in any send dialog when ≥90% used; sends are blocked at 100%.

## 5. What is NOT changed
- Resend API key stays as-is (no rotation, no deletion).
- Gmail-based personal-inbox sync (read side) untouched. Only **outbound** sending is consolidated to Resend. If you'd rather keep Gmail-as-sender for `send-owner-email` personal account, say so and I'll exclude it from the funnel.
- Lock-and-send byte-for-byte pipeline (`outreach-send-locked`) untouched at the payload layer; only its final HTTP call is swapped to `sendViaResend`.

## 6. Files touched (high level)
- **New**: `supabase/functions/_shared/resendClient.ts`, `email-send-gateway/index.ts`, migration for `email_send_quota` + `email_send_quota_config` + RLS, `src/components/owner/EmailQuotaCard.tsx`, hook `useEmailQuota.ts`.
- **Edited**: ~12 highest-traffic sender edge functions to call the shared client. Remaining lower-traffic ones in a follow-up pass.
- **Note** (heads-up, per project policy): the platform doesn't have first-class rate-limiting primitives, so this is an app-level cap stored in Postgres — good enough for a 100/day ceiling, not a defense against abuse spikes.

## 7. Verification
- Unit-style Deno test for `sendViaResend` mocking Resend + quota table (limit reached → 429, under limit → success increments counter).
- Manual: send 3 test emails, confirm counter increments and UI updates live.
- Force `daily_limit=2`, attempt 3rd send, confirm block + toast.