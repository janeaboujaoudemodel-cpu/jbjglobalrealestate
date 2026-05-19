# Broker Identity & Lifecycle — Architecture Map
_Pre-Pass-4 verification. Confirms canonical sources and de-duplication boundaries._

## 1. Canonical broker identity

| Table / View | Role | Canonical? | Notes |
|---|---|---|---|
| `crm_brokers` | Owner-managed broker directory (invitation, OTP, activation, block, owner_id) | **YES — canonical for CRM/access** | Holds `user_id`, `invitation_status`, `invitation_token_hash`, `otp_hash`, `otp_attempts`, `otp_expires_at`, `activated_at`, `blocked_at` |
| `broker_profiles` | Public-facing broker profile (display name, photo, bio) for the broker product (subscriptions, training, marketplace) | Canonical for **public broker product**, NOT for CRM access | Linked by `user_id`. Separate concern — do not merge. |
| `jbj_brokers` | Legacy import table (per Unified Relational CRM Standard, deprecated) | NO — deprecated | Must not be referenced by new code. |
| `broker_subscriptions` | Broker product subscription tier | Canonical for billing only | Linked by `user_id`. Orthogonal to CRM access. |
| `broker_verifications` | KYC / identity verification artefacts | Canonical for verification only | Linked by `user_id`. Orthogonal. |
| `ai_brokers` | AI persona records (e.g. Amanda Clarke) | Canonical for AI personas | Not a real human broker. Not in scope. |

**Conclusion:** `crm_brokers` is the single source of truth for any *owner-controlled* broker (the entity that receives invitations, OTPs, grants, sessions, blocks). `broker_profiles` / `broker_subscriptions` / `broker_verifications` are separate, orthogonal concerns keyed on `auth.users.id` and must not be merged into `crm_brokers`.

## 2. Lifecycle & access tables

| Table | Key | Purpose |
|---|---|---|
| `crm_brokers` | `id`, `user_id` | Lifecycle state: `invitation_status`, `activated_at`, `blocked_at` |
| `crm_database_grants` | `broker_user_id` → `crm_brokers.user_id` | Per-database grant. Lifecycle: `revoked_at`, `expires_at` |
| `crm_lead_shares` | `shared_with` → `crm_brokers.user_id` | Per-lead share. Lifecycle: `revoked_at`, `expires_at` |
| `crm_broker_sessions` | `broker_id` → `crm_brokers.id`, also `broker_user_id` | Active session tracking. Lifecycle: `revoked_at`, `expires_at` |
| `crm_broker_blocked_devices` | `broker_id` → `crm_brokers.id` | Per-device block list. |
| `crm_broker_import_staging` | — | Bulk import buffer; flows into `crm_brokers`. |

All five access surfaces (grants, shares, sessions, blocked devices, lifecycle) already pivot on `crm_brokers` (`id` or `user_id`). **No new identity table is required for Pass 4.**

## 3. Aggregation view

`vw_crm_broker_overview` (verified live):

```sql
SELECT id AS broker_id, user_id, owner_id,
       COALESCE(full_name, email_lower) AS broker_name,
       email_lower AS broker_email,
       invitation_status, activated_at, blocked_at,
       is_active_broker, last_active_at,
       (SELECT count(*) FROM crm_database_grants g
         WHERE g.broker_user_id = b.user_id AND g.revoked_at IS NULL)
         AS active_database_count,
       (SELECT count(*) FROM crm_leads l
         WHERE l.assigned_broker_id = b.id) AS assigned_lead_count,
       (SELECT count(*) FROM crm_broker_sessions s
         WHERE s.broker_id = b.id AND s.revoked_at IS NULL)
         AS active_session_count
  FROM crm_brokers b;
```

This already unifies identity + grant count + lead count + session count. The owner UI (BrokersRegistry, Sessions panel, DatabasesHub) all read from this view — single read path, no fan-out.

## 4. Duplication risk assessment for Pass 4

Pass 4 originally proposed a new `vw_crm_brokers_unified` UNION-ing `crm_brokers`, `crm_leads` (role=broker), `broker_subscriptions`, AI Home Finder, chat leads, etc.

| Source | Already covered? | Recommendation |
|---|---|---|
| `crm_brokers` | `vw_crm_broker_overview` | Reuse |
| `crm_leads` where role=broker | Separate (pre-broker leads — never invited yet) | Add a thin view `vw_crm_broker_leads` OR a single computed column on the overview, not a UNION |
| `broker_subscriptions` | Orthogonal (billing tier) | LEFT JOIN into overview; do not UNION |
| AI Home Finder / chat / website submissions | These are *lead sources* not *brokers* | Surface as a "source" attribute on the matching `crm_leads` row, do not UNION |
| Manual brokers | = `crm_brokers` with `manual_origin=true` | Already covered |

**Verdict:** A UNION-style `vw_crm_brokers_unified` would re-introduce the broker-identity fragmentation that the Unified Relational CRM Standard was created to remove. **Drop the UNION view from Pass 4.** Replace with:

1. Extend `vw_crm_broker_overview` with `subscription_tier`, `lead_source_origin`, `is_pre_invite` (LEFT JOINs only).
2. Add a separate `vw_crm_broker_pre_invite_leads` for the "broker-shaped leads not yet invited" funnel — kept distinct from `crm_brokers` so identity stays single-sourced.
3. Build `UnifiedBrokerPicker` to read from both views with a `pillSource` filter — but each row still has a stable canonical key (`crm_brokers.id` OR `crm_leads.id`, never overlapping).

---

# Stabilization Report — Passes 1–3

## Static verification (machine-checked)

| Check | Result |
|---|---|
| `scripts/contrast/check-no-blue.mjs` against CRM/Broker scope | ✓ Pass — 0 violations |
| Direct grep for `blue-/sky-/indigo-/#3B82F6/#2563EB/accent-color: blue` in the 6 touched files | ✓ Clean |
| Fixed-width risk scan (`w-[6/7/8…]`, `overflow-x`) in DatabasesHub/GrantBrokerAccessDialog/BrokerGrantsManagerDialog | ✓ Only `min-w-[200px]` + `basis-[280px]` inside `flex-wrap` parent — safe |
| `DatePopover` controlled `month` state | ✓ `useState<Date>(value ?? new Date())` + `onMonthChange={setMonth}` — prev/next will advance |
| `DatePopover` fixed panel width | ✓ `w-[300px]` — no jitter on viewport resize |
| `pointer-events-auto` on Calendar inside dialog | ✓ Applied |
| Z-index layering | Popover `z-[10200]` > Dialog `z-[10050]` — calendar will always render above dialog |

## Out-of-scope blue violations (acknowledged debt)

46 CRM files outside the touched Broker-Access surfaces still contain blue tokens (allowlisted in `scripts/contrast/no-blue-allowlist.json`). These are tracked, not regressed, and will be addressed module-by-module as each is touched. They do not affect the Broker Access flow rendered by the 3 stabilized files.

## Live visual QA — blocked

Live owner-side visual QA across breakpoints (1440 / 1280 / 1024 / 820 / 414 / 390 / 375 / 360 × sidebar open/closed × zoom 90/100/110) **cannot be performed by the agent in this session** — the owner CRM is gated behind Google OAuth, which the browser-automation tool cannot complete (acknowledged limitation from the previous turn). The auth screen at `/owner/crm` was confirmed via screenshot but no authenticated content could be rendered.

The static/code-level checks above eliminate the structural risks (fixed widths, blue leakage, stuck-month calendar bug, dialog z-index). The remaining verification — actual pixel-level overflow, dropdown clipping, keyboard overlap on mobile — requires owner manual sign-off.

## What the owner needs to visually confirm

After signing in via Google, walk through this checklist at 1440 / 1024 / 414:

**DatabasesHub** — toolbar wraps, action labels collapse to icons under 1024px, no horizontal scroll, badges don't overlap row text.

**GrantBrokerAccessDialog** — Existing & New modes stack to single-column under 640px, footer buttons stack, calendar opens within viewport, scope/permission/direction Selects render champagne (no native blue).

**BrokerGrantsManagerDialog** — `BrokerStatusBadge` colors correct for each lifecycle state, revoke buttons stack on mobile, sessions panel shows session count.

**DatePopover** — open/close rapidly, click prev/next 5× in each direction, click a date, reopen — month should land where you left it; no duplicate calendars; no width jitter.

**No-blue spot checks** — Tab through the form (focus ring should be champagne `#B89555/40`), select a row (selected state should be cream `#EFE6D6`), hover a button, select text inside the dialog (selection should be champagne, not browser-default blue).

If any check fails, report the exact breakpoint + element and Pass 4 stays blocked.

## Hold on Pass 4

Per user direction, Pass 4 (Unified Broker Ecosystem) is **not started**. Revised scope for Pass 4 — based on the architecture map above — is logged in this document (drop the UNION view, extend `vw_crm_broker_overview` instead). Awaiting owner sign-off on Passes 1–3 before queuing Pass 4.

Pass 7 backlog (centralized broker-control center + single lifecycle state machine) remains queued — not started.
