# Broker Onboarding Repair — Full E2E Hardening

No new systems. All work extends `crm_brokers`, `crm_database_grants`, `vw_crm_database_access`, `vw_crm_broker_overview`, existing edge functions, and `BrokerGuard`.

## Step 1 — Fix activation routing (kills the 404)

**Root cause hypotheses to verify before patching:**
1. `/broker/activate` is in `StandaloneRoutes` but Standalone routes may not be mounted on the published domain (`jbj.ae`) — only on preview. Verify in `App.tsx` route tree.
2. Published `_redirects` / SPA fallback may strip `?token=`.
3. Route exists but `BrokerActivate` throws before render (missing token → blank → boundary).

**Fixes:**
- Promote `/broker/activate` out of any conditionally-mounted group; mount unconditionally at the top of the router so it is reachable on `jbj.ae`, `www.jbj.ae`, preview, and published.
- Add explicit states to `BrokerActivate.tsx`:
  - `loading` (initial)
  - `verifying-token` (preflight `crm-broker-invite-status` call)
  - `invalid` / `expired` / `already-activated` / `revoked` / `blocked` — each with branded copy + "Request new invitation" CTA that calls `crm-broker-invite` resend
  - `otp` → `password` → `success`
- New tiny edge function **`crm-broker-invite-status`** (read-only): given `token`, returns `{ status, email_masked, expires_at }` without leaking PII. Pure SELECT against `crm_brokers` by hashed token. No state change.
- On success: `await refreshSession()` → `navigate('/broker/crm', { replace: true })`. Guard against landing back on `/auth`.
- Update `crm-broker-invite` email link to use absolute production origin (`https://jbj.ae/broker/activate?token=...`) regardless of where the invite was generated.

## Step 2 — Broker entity synchronization (single source of truth)

Reuse `crm_brokers` + `vw_crm_broker_overview`. No new tables.

- **Brokers Registry** (`BrokersRegistry.tsx`): read from `vw_crm_broker_overview` so every invited broker — `invited`, `otp_sent`, `activated`, `blocked` — appears immediately with status chip, assigned-databases count, last-seen.
- **CRM lead-assignment dropdowns**: replace any local broker queries with one shared hook `useAllBrokersForAssignment()` that selects from `crm_brokers WHERE invitation_status IN ('activated') OR is_active_broker` plus pending invites (visually disabled).
- **Owner BrokerGrantsManagerDialog**: already reads grants; add a "broker snapshot" header pulling from `vw_crm_broker_overview` so owner sees activation status inline.
- Confirm `link_broker_entity_by_email()` runs on first broker login (already wired in `BrokerGuard`) — add the same call inside `crm-broker-activate` for belt-and-suspenders.

## Step 3 — Database access visibility & UX

Extend `DatabasesHub.tsx` only. No new module.

Per database row, expand a "Grantees" drawer (reads `vw_crm_database_access` filtered by `database_id`) showing:
- broker name + status chip
- `granted_by` (resolved via `profiles`)
- `granted_at`, `expires_at`
- `permission_level`, `visibility_direction`, date window
- status (`active` / `suspended` / `revoked` / `expired`)
- actions: **Suspend**, **Resume**, **Revoke**, **Edit scope** — all hitting existing `crm-broker-grant-*` functions (or add a single `crm-broker-grant-mutate` if missing)

Broker side: confirm `/broker/crm/database/:id` opens correctly from the broker's database card click; fix the link target if it currently passes `grant_id` instead of `database_id`.

## Step 4 — Broker restrictions & owner visibility

In `BrokerGuard`, add a path blocklist applied when the user is a pure broker (not owner):
```
/owner, /admin, /internal, /jbj-*, /developer, /agency, /relationships, /hr, /finance
```
→ redirect to `/broker/crm`. Owner bypass remains via `verify-owner`.

Add a tiny `useIsPureBroker()` helper so individual nav components can hide owner-only links instead of rendering then 403'ing.

## Step 5 — Email UI/UX rebuild

Rewrite `supabase/functions/_shared/brokerInviteEmail.ts`:
- **One** rounded outer container (`border-radius: 16px`, hairline `#B89555` border, soft shadow). Remove the nested sharp card.
- Premium header band: champagne `#F7F2EA` background, centered **JBJ monogram** (use existing public asset, embed as absolute URL `https://jbj.ae/...` — email clients block relative paths), wordmark "JBJ GLOBAL REAL ESTATE", thin gold hairline divider.
- Body: ink `#1A1A1A` on white, generous 32px padding, OTP block in cream `#EFE6D6` with letter-spacing.
- Single primary CTA "Activate broker access" → champagne fill, ink text, gold hairline border (per no-gold-fills rule). Plain-text fallback URL below.
- Footer: muted ink, legal line, "JBJ Global Real Estate L.L.C S.O.C", no social icons in transactional invite.
- Zero blue anywhere; verify via headless render diff.

## Step 6 — True end-to-end QA (one pass, no stopping)

Run as a single script, capture screenshots into `/mnt/documents/qa-batch2-v2/`:

1. Owner creates fresh `qa_e2e_<ts>` broker in CRM
2. Owner assigns a source database + 3 leads
3. Owner clicks "Send invitation" → email lands in `infoo.jane@gmail.com`
4. Capture email render (desktop + mobile widths)
5. Click activation link → land on `/broker/activate` (no 404)
6. Enter OTP → set password → auto sign-in → land on `/broker/crm`
7. Broker sees ONLY assigned database + 3 leads
8. Broker tries `/owner/crm` → redirected to `/broker/crm`
9. Owner refreshes `DatabasesHub` → sees broker under Grantees with `active` status, granted_at, granted_by
10. Owner refreshes Brokers Registry → broker shows `activated`, last-seen recent
11. Confirm `crm_audit_logs` rows for: invite_sent, otp_verified, broker_activated, broker_login, grant_viewed
12. Only after green: resume session/revoke/heartbeat/suspicious-login QA (Batch 2 tail)

## Files to create / modify

**New:**
- `supabase/functions/crm-broker-invite-status/index.ts`

**Modified:**
- `src/pages/BrokerActivate.tsx` (state machine + preflight + branded error states)
- `src/routes/StandaloneRoutes.tsx` or `src/App.tsx` (ensure activation route reachable on published domain)
- `src/components/BrokerGuard.tsx` (path blocklist for pure brokers; expose `useIsPureBroker`)
- `src/components/crm/DatabasesHub.tsx` (Grantees drawer)
- `src/components/crm/BrokerGrantsManagerDialog.tsx` (snapshot header)
- `src/components/crm/BrokersRegistry.tsx` (read from `vw_crm_broker_overview`)
- `src/pages/broker/BrokerCRM.tsx` (fix database card → `/broker/crm/database/:database_id`)
- `supabase/functions/_shared/brokerInviteEmail.ts` (full rebuild — unified container + monogram)
- `supabase/functions/crm-broker-invite/index.ts` (use absolute prod origin for link)
- `supabase/functions/crm-broker-activate/index.ts` (call `link_broker_entity_by_email` defensively)
- New shared hook: `src/hooks/useAllBrokersForAssignment.ts`

**No DB migration required** — all views/columns from the previous repair are sufficient. If `crm-broker-grant-mutate` doesn't exist, add it as a thin wrapper (one new edge function only if needed).

## Out of scope (deferred to Batch 2 tail after green)
Session heartbeat QA, revoke single/all, block device, suspicious-login alerts. All infra already exists; we only resume testing once the onboarding flow above is fully green.

---

**Approve to implement?** I will execute Steps 1–6 in a single pass and report back only after the full E2E run is green with screenshots.