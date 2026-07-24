# JBJ Campaign Truth Reconciliation Plan

The dashboard currently disagrees with reality because it reads from *intent* tables (queue rows, "attempted" flags) rather than *provider evidence*. This plan rebuilds the truth layer first, then rewires everything on top of it. No new schema until existing paths are wired.

---

## Phase 0 — Read-only reconciliation (no code changes)

Produce one canonical reconciliation report before touching anything.

Inputs:
- Gmail: `HELPDESK@JBJ.AE` and `infoo.jane@gmail.com` — Inbox, Sent, Threads, Auto-replies (via existing Gmail connector / `comm-inbound-sync`).
- Resend: `/emails` list + webhook events already stored in `resend_events`.
- Supabase spine: `jbj_campaign_recipients`, `jbj_campaign_sends`, `email_send_log`, `resend_events`, `crm_email_threads`, `developer_replies`.

Output: a single SQL view `jbj_recipient_truth_v1` keyed by `(campaign_id, developer_id, recipient_email)` with columns:
`resend_accepted_at, resend_delivered_at, resend_bounced_at, resend_complained_at, resend_rejected_reason, gmail_sent_at, gmail_replied_at, gmail_auto_reply, manual_status, computed_status`.

Deliverable: markdown reconciliation report saved to `.lovable/reconciliation/2026-07-24.md` listing per-status counts and a diff vs. current dashboard.

---

## Phase 1 — Fix lock semantics

Current bug: every developer row is treated as sent/locked because a queue row exists.

Rule: `locked = TRUE` only when `resend_accepted_at IS NOT NULL` OR `manual_status IN ('registered','replied','delivered')`.

- Migration: recompute `jbj_campaign_recipients.locked` from `jbj_recipient_truth_v1`.
- Unlock everything else → becomes retryable.
- Update `outreach-lock-payload` and `outreach-send-locked` to only set locked on Resend `202` acceptance.
- UI: the "437 already sent" pill reads from the truth view, not row count.

---

## Phase 2 — Preserve manual "Registered"

- Add `developers.manual_registration_status` (already present as `registration_status_override` in some paths — audit and unify to one column).
- `computed_status` in the truth view uses manual override as highest priority.
- Never overwritten by campaign auto-classification.
- Show on cards, filters, dashboard, campaign eligibility (registered = excluded from future sends unless owner opts in).

---

## Phase 3 — Canonical KPI source

One view: `jbj_dashboard_kpis_v1` returning every KPI the user listed:
Total, Eligible, Missing email, Registered, Pending, Queued, Accepted, Delivered, Opened, Clicked, Human replies, Auto replies, Rejected, Invalid email, Invalid domain, Mailbox full, Deferred, Complaint, Bounce, Retry required, Retry completed, Waiting follow-up, Follow-up completed, No response.

- React components stop computing counts. All KPI tiles call `useJbjKpis()` which selects from the view.
- Each tile carries a `filterKey` matching a case in `jbj_recipient_truth_v1.computed_status`.
- Clicking a tile pushes `?filter=<key>` and `BrandedEmailDashboard` filters rows by the same key.

---

## Phase 4 — Sender chain audit + fix

Preview says `helpdesk@jbj.ae` but recipients see `infoo.jane@gmail.com`.

- Audit `outreach-send-locked`, `crm-send-developer-registration`, `crm-send-brokerage-outreach`, `_shared/outreachIdentity.ts`, `_shared/resend.ts` for the actual `from`, `envelope.from`, `reply_to`, `return_path` passed to Resend.
- Verify Resend domain `jbj.ae` is verified; if not, block sends and surface a red banner instead of falling back to Gmail.
- Force: `From: JBJ GLOBAL REAL ESTATE <helpdesk@jbj.ae>`, `Reply-To: helpdesk@jbj.ae`, `Cc: infoo.jane@gmail.com`, envelope = `helpdesk@jbj.ae`.
- If a fallback sender is ever used, UI shows a "Sent via fallback: <address>" chip on the recipient row — no pretending.

---

## Phase 5 — Template contact block + template immutability

- Add fixed block under the intro paragraph in every branded template (developer, brokerage, broker, client, career):

  > If you have any questions regarding registration, required documents, onboarding, or partnership, please contact our Broker Relations & Administration team.
  > **Broker & Admin Contact — Waleed** · [050-999-3839](tel:+971509993839)
  > Email: **[helpdesk@jbj.ae](mailto:helpdesk@jbj.ae)** · CC: infoo.jane@gmail.com

  `helpdesk@jbj.ae` and Waleed's phone rendered as clickable, visually prominent (emerald pill).
- Restore Google Calendar booking button in the developer template.
- Template versioning: freeze `template_versions.approved_at`; sends record `template_version_id`. Editing an approved template creates a new draft version — never mutates the approved row.

---

## Phase 6 — Follow-up Agent (real workflow)

On inbound reply (`comm-inbound-sync` → `crm-email-sync`):
1. Classify into one of: Registered, Application pending, Documents requested, Waiting broker, Waiting contracts, Commission discussion, Meeting requested, Call requested, Automatic reply, Vacation, Out of office, Rejected, Interested, Not interested, Wrong contact, Duplicate, Spam, Unknown.
2. Apply side effects: update `developers.status`, `jbj_campaign_recipients.reply_status`, insert `crm_tasks` follow-up, generate AI draft into `crm_ai_drafts`, insert `user_notifications`, append `crm_timeline_events`.
3. On AI 402 / 429, mark reply `classification_deferred` (not `no_match`) — already partially in place; verify.

---

## Phase 7 — Portal parity

Replicate the developer-portal set (Campaigns, Templates, AI writer, Follow-up AI, Classification, Timeline, Analytics, Retry queue, Documents, Calendar, Provider status, Reply detection) into:
- Brokerage Portal
- Individual Broker Portal
- Client Portal (Buyer + Seller)
- Careers Portal

Shared components: `PortalCampaignDashboard`, `BrandedEmailDashboard`, `useJbjKpis({ portal })`.

---

## Phase 8 — Performance

- Server-side pagination on all recipient lists (25/page, cursor-based on `created_at`).
- Indexes: `(campaign_id, computed_status)`, `(developer_id, campaign_id)`, `(recipient_email)` on truth view's base tables.
- `useJbjKpis` cached via React Query with 30s staleTime + realtime invalidation on `resend_events` and `jbj_campaign_recipients`.
- Prefetch dashboard KPIs on portal route enter.
- Kill N+1 in developer cards: single join for `campaign_recipient + last_reply + manual_status`.

---

## Phase 9 — Verification

- Run Phase 0 reconciliation again after fixes; diff must be zero.
- Playwright: open `/owner/crm/jbj/owner-developers`, click each KPI tile, assert filtered row count === tile number.
- Send a live test to `infoo.jane@gmail.com` and verify raw headers: `From: helpdesk@jbj.ae`, envelope matches, Reply-To matches.
- Screenshot proof stored under `.lovable/verification/phase9/`.

---

## Technical notes

- No new tables in Phases 1–6. Only views (`jbj_recipient_truth_v1`, `jbj_dashboard_kpis_v1`) and column additions on existing tables.
- All views use `security_invoker=true`; base tables retain RLS.
- Edge functions touched: `outreach-lock-payload`, `outreach-send-locked`, `crm-send-developer-registration`, `crm-send-brokerage-outreach`, `crm-email-sync`, `comm-inbound-sync`.
- Frontend: `BrandedEmailDashboard.tsx`, `DeveloperOwnerCampaignDashboard.tsx`, `PortalOverview.tsx`, `BrandedEmailsPanel.tsx`, new `useJbjKpis.ts` hook.

## Out of scope

- New schema beyond the two reconciliation views + manual-status column unification.
- Any UI redesign beyond wiring KPI tiles to filters and adding the contact block.
- Migrating away from Resend or adding new providers.
