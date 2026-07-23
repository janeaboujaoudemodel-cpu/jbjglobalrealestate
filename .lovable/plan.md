# In-House Outreach Automation — Phased Build

Goal: a "virtual admin/broker" that pushes both sides (brokerages ⇢ CITI Developers, developers ⇢ JBJ), follows up on its own, classifies replies, updates status, prepares drafts, and reports back daily. Bulk send already works today; this plan adds the automation on top **without** touching the bulk-send path you're about to use.

## Phase 1 — Ship now, then you bulk-send (this turn)

1. **Mirror AI classifier to brokerage inbound.** Brokerages currently only bump `outreach_stage` on reply. Extend `comm-inbound-sync` so brokerage replies also run the AI analyzer with brokerage-specific rules ("Are they registering with CITI Developers? registered / documents_required / pending_application / under_review / rejected"), and write `ai_summary`, `ai_next_action`, `registered_status`, requested-documents list, and a draft reply for Jane.
2. **Register the outbound sends** already produced by `crm-send-brokerage-outreach` and `crm-send-developer-registration` into `crm_relationship_email_log` with `detected_status = "sent"` so cadence + digest can see them (some paths currently skip this).
3. **Safety switch**: add `crm_owner_settings.automation_mode` = `off | draft_only | auto_send` (default `draft_only`). Everything Phase 2/3 respects this.

## Phase 2 — Cadence engine (next turn, after you confirm Phase 1 works)

Nightly pg_cron `outreach-cadence-run` at 08:00 Dubai:

```text
brokerage — CITI Developers side
  T+3d  no reply  → F1 nudge
  T+7d  no reply  → F2 value-add (briefing invite)
  T+14d no reply  → F3 last touch
  T+21d no reply  → mark dormant

developer — JBJ side
  T+2d  no reply  → F1 polite ping
  T+6d  no reply  → F2 attach JBJ trade licence
  T+12d no reply  → F3 escalation to Jane
  documents_required → auto-draft doc reply with attachments listed
  pending_application → auto-draft "we've applied, awaiting review"
```

In `draft_only` mode the engine writes a draft to `owner_comm_ai_drafts` and pings the Hub; in `auto_send` it sends via the existing send functions with the same signature/branding rules.

## Phase 3 — Daily digest + headless form-fill (later)

- **08:15 Dubai digest** email to `infoo.jane@gmail.com`: sent yesterday, replies parsed, statuses changed, drafts awaiting approval, DLD deltas.
- **Playwright form-fill worker** (separate Deno-Deploy-compatible runtime, not Supabase edge function): opens the developer's registration URL, fills fields from JBJ profile, screenshots each step, stores as draft submission for your approval. Not achievable inside a Supabase edge function — needs the worker split out.

## What I will NOT do this turn

- Touch `BrandedEmailsPanel.tsx` or the bulk-send buttons (you're about to use them).
- Auto-send anything without `automation_mode = 'auto_send'`.
- Build the Playwright form-fill (Phase 3 — different runtime).

## E2E test in Phase 1

1. Insert a synthetic inbound brokerage reply row → assert AI summary, next_action, registered_status, and draft populated on the brokerage card.
2. Insert a synthetic inbound developer reply saying "please share trade licence and RERA" → assert `status = documents_required` and requested_documents list populated.
3. Send one live test email to `infoo.jane@gmail.com` via the brokerage path and verify the row lands in `crm_relationship_email_log` as outbound + `sent`.
4. Playwright screenshot of the brokerage card showing the new AI summary + draft.

## Technical details

- Extend `analyzeDeveloperReply` in `supabase/functions/comm-inbound-sync/index.ts` into `analyzeInboundReply({ side: 'brokerage' | 'developer', ... })`. Brokerage prompt reframes: "we are CITI Developers inviting them to register with us."
- Add columns via migration: `crm_brokerages.ai_summary`, `ai_next_action`, `ai_draft_reply`, `registered_status`, `requested_documents text[]`, `ai_generated_at`. Grants + RLS unchanged (owner-only already).
- `crm_owner_settings.automation_mode text default 'draft_only' check (automation_mode in ('off','draft_only','auto_send'))`.
- Cadence engine (Phase 2) will be new function `outreach-cadence-run` invoked by pg_cron; not created this turn.
