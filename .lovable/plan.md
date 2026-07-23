# JBJ Campaign & Portals — Full Repair Plan

Source of truth: `JBJ_Campaign_Audit_and_Developer_Requirements_2.xlsx` (CAM/DATA/UI/TPL/PERF/PORT/AI/AUD IDs). Nothing below adds dummy data, fake counters, or disconnected UI — every number, status and card is wired to the canonical DB and to real provider/mailbox events.

Scope is very large. I propose to execute in 6 sequenced phases, each independently verifiable. **I will pause after each phase for your approval before starting the next**, so we don't rebuild silently.

---

## Phase 0 — Canonical schema + audit log (foundation, no UI change yet)

Goal: give every portal one shared spine so numbers stop drifting (771 vs 775 vs 626).

New tables (all with GRANT + RLS):

- `campaigns` — portal_kind, template_version_id, sender_email, reply_to, subject, status, created_by.
- `campaign_recipients` — campaign_id, entity_type (developer/brokerage/broker/client/candidate), entity_id, email, pre_send_status, send_status, delivery_status, reply_status, business_status, resend_message_id, provider_response, timestamps for each stage.
- `email_events` — recipient_id, event_type (queued|accepted|delivered|opened|clicked|bounced|complained|replied|autoreply|ooo|dsn), raw provider payload, timestamp. Append-only.
- `email_templates` + `email_template_versions` — approved versions immutable; edits create draft (TPL-001).
- `follow_up_tasks` — recipient_id, rule, due_at, expected_outcome, required_outcome, assigned_to, status.
- `document_requirements` — entity_id, doc name, source (extracted from reply / manual), status.
- `campaign_audit_log` — actor, ai_or_human, portal, entity, prev, new, evidence_thread_id, confidence, reason.

Reconciliation migration (does NOT delete data — DATA-001, CAM-004):

- Backfill `campaign_recipients` from `crm_relationship_email_log` + `email_send_log` + existing campaign tables.
- Match against Resend message IDs where present; unmatched Gmail sends → `send_status = attempted` with `provider = gmail_legacy`.
- Reclassify: Gmail "limit reached" → `limit_blocked`; "address not found" → `invalid_email`; "domain not found" → `invalid_domain`; "mailbox full" → `deferred`; blocked/rejected → `rejected` (uses the 44 confirmed rows from the audit sheet as the seed correction list).
- Emit exception report row per unmatched email.
- Indexes on (entity_type, entity_id), (campaign_id, send_status), (email), (resend_message_id).

Deliverables: migration SQL, one `useCanonicalCounts` hook everyone consumes, exception CSV.

---

## Phase 1 — Resend as the only live send route (CAM-001, CAM-002, CAM-003)

- Rewrite/consolidate `crm-send-developer-registration`, `crm-send-brokerage-outreach`, and new `crm-send-client-followup`, `crm-send-career-*` into one internal `send-campaign-email` helper that:
  - calls Resend API with verified domain,
  - persists `resend_message_id` + provider_response,
  - only sets `send_status = provider_accepted` after Resend 200,
  - on failure, writes correct pre-send/send status (limit_blocked / invalid_email / rejected / deferred) — never `sent`.
- Remove any Gmail-based bulk send code path. Gmail stays only for inbound (see Phase 2).
- New `resend-webhook` edge function receives delivered/bounced/complained/opened/clicked and writes to `email_events`; recipient rollup computed from events.
- Quota panel reads Resend account usage endpoint; delete the app-side daily cap.
- Test-send button also routes through Resend and records a real event.

---

## Phase 2 — Inbound sync + AI reply classifier (CAM-006, plus §4-6 of the request)

- `gmail-inbound-sync` (existing `comm-inbound-sync` refactor) matches every reply to a `campaign_recipient` via message headers / thread ID / references / to+from+subject fallback.
- Classifier (Lovable AI) tags: human | auto_ack | ooo | dsn | ticketing | security. Only `human` counts toward the "Responded" KPI; the others populate an "Automated responses" KPI.
- AI operational agent runs per human reply:
  - developer: registered / pending / documents_required / registration_pending / approved / rejected → status updates only when evidence is explicit; ambiguous → review task.
  - brokerage: registration / agreement / meeting / decline / lead / commission → status + tasks.
  - individual broker: employment + verification + interest.
  - client: extracts budget, type, beds, location, timeline, stage.
  - candidate: application/cv/interview/offer.
- Every AI action writes to `campaign_audit_log` with confidence + evidence.
- Document requirements auto-extracted into `document_requirements` rows.

---

## Phase 3 — Follow-up engine + Expected/Required outcome (CAM-008, §7-9)

- Cron-driven `follow-up-run` reads eligible recipients (`delivered` AND `no human reply` AND not registered/unsubscribed/hard-bounced/rejected).
- Default cadence: 3 / 7 / 14 business days; document-required and application-pending have their own rules; meeting_requested waits for booking event.
- Each task carries `expected_outcome` and `required_outcome`. AI drafts the reply targeting the Required Outcome (not a generic bump). User must approve before send unless task is marked low-risk.
- Follow-ups stop automatically on registration / rejection / hard-bounce / unsubscribe / human reply awaiting internal action.

---

## Phase 4 — Dashboard + portals wired to canonical data (CAM-005, DATA-002/003, UI-001/2/3, PORT-001..004)

- One `PortalCampaignDashboard` used by Developer, Brokerage, Individual Broker (new), Client (Buyer + Seller), Career portals.
- Every KPI card (Total / Eligible / Selected / Missing Email / Attempted / Provider Accepted / Delivered / Opened / Clicked / Human Responses / Automated / Limit Blocked / Invalid Email / Invalid Domain / Hard Bounce / Soft Bounce / Deferred / Follow-up Required / Registered / Pending / Documents Required / Rejected / No Response) is a filter link into a shared drill-down table (search, sort, export, bulk retry, bulk follow-up, open profile, open thread).
- Entity cards show real status, last contact, last reply, follow-up state, assignee, email health. Emerald tiles get white icons; compact labels use "Pending" (UI-002/003).
- Manual "Add" and "Upload database" wired into each portal via the existing forms (PORT-003, PORT-004). New Individual Broker Portal split from brokerage-company records (PORT-002).
- Numbers never diverge — every count reads the same `campaign_counts` view.

---

## Phase 5 — Campaign builder + template protection + Calendar CTA (AI-001, TPL-001, TPL-002)

- Unified builder: audience filters → selection → warnings (missing/invalid/previously contacted) → sender + reply-to → subject/preview → body → saved templates → AI rewrite → test send → approval → schedule → live send → provider status.
- Template versioning: approved version locked; any edit forks to a new draft version and requires explicit "Replace active version" confirmation.
- Restore Google Calendar booking button on brokerage + individual broker + eligible client templates using the saved booking link stored in `crm_owner_settings`. Developer templates keep it off by default.

---

## Phase 6 — Performance + final verification (PERF-001, §15, §18)

- Server-side pagination on all lists; DB indexes as listed in Phase 0; `campaign_counts` materialized view refreshed by webhook + cron; React Query dedupe + skeletons; remove full-catalog client loads.
- End-to-end verification checklist run with Playwright + real Resend send to `infoo.jane@gmail.com`:
  - test send, live send, provider ID stored, delivery webhook, bounce webhook, inbound Gmail matched, human vs auto classification, developer status auto-updated from a reply, document requirement extracted, follow-up created then stopped after registration, calendar CTA present in broker template, approved template unchanged, every KPI clickable, all counts reconcile.
- Completion report: DB changes, edge fn changes, webhook wiring, status mapping, AI rules, follow-up rules, migration counts, test evidence, remaining exceptions.

---

## Technical notes (for reference, not user-facing)

```text
canonical counts view
  campaign_recipients
    ├── pre_send_status
    ├── send_status         (attempted / provider_accepted / limit_blocked / ...)
    ├── delivery_status     (from email_events webhook)
    ├── reply_status        (human / auto / ooo / dsn / none)
    └── business_status     (registered / pending / documents_required / rejected / ...)

drill-down = filter on any one of those columns
KPI number  = COUNT(*) over the same filter — never computed independently per component
```

---

## Confirm before I start Phase 0

Two things I want to confirm before touching the database, because Phase 0 is the foundation everything else sits on:

1. **Approve executing in 6 phases with a pause+approval between each** (vs. one giant merge). This lets you verify counts after Phase 0 before Phase 1 sends anything.
2. **Approve the reclassification of historical rows** using the 44 confirmed failures from the audit sheet as the seed. Existing records will be corrected in place (never deleted), and an exception report will list anything unmatched.

Reply "go" and I'll start Phase 0 (schema + reconciliation migration + exception report), and stop for your review before Phase 1.