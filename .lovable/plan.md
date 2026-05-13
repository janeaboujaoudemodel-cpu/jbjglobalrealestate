## Confirm Registration Status — Developer Workflow

Builds entirely on existing tables (`crm_developer_registry`, `crm_outreach_touchpoints`, `email_send_log`, `developer_action_items`) and the existing `crm-send-developer-registration` edge function. No new providers, no schema redesign — only one additive migration and reuse of the locked-send + Resend pipeline already in place.

---

### 1. New CTA — "Confirm Registration Status"
- Add a button next to "Send Registration Email" / "Bulk Outreach" / "Send Test" inside `DevelopersDirectory.tsx` and the Developer tab of Relationships Hub.
- Variant `gold`, opens `<ConfirmRegistrationModal />`.

### 2. Smart selection modal (`ConfirmRegistrationModal.tsx`)
Two-pane layout (champagne surface, gold hairline):

**Left — Eligible queue (default list).** Server-side query filtering `crm_developer_registry` by:
- `outreach_count > 0` OR `contract_signed_at IS NOT NULL` OR `required_docs_complete = true`
- AND `registration_status NOT IN ('registered','commission_eligible','confirmed_registered')`
- AND `do_not_contact = false`
- AND valid `developer_email`
- AND no confirmation sent in last 24h (`registration_confirmation_sent_at`).

Filter chips: emirate, registration stage, contract status, "no response > N days", "follow-up needed".
Bulk: select all / unselect all / status filter.

**Right — Manual override.** Search box (debounced) over the full registry, including already-registered devs; Add chip injects them into the campaign with a warning pill.

**Status badges (gold/champagne palette + tooltip):**
`Registered`, `Commission Eligible`, `Pending Registration`, `Awaiting Confirmation`, `Contract Signed`, `Follow-up Needed`, `Registration Rejected`, `No Response`.
Centralised in `src/lib/crm/registrationStatus.ts` (label + tone + tooltip).

### 3. Email preview & approval
Reuse the existing locked-send pipeline (`useLockedSend` + `outreach_locked_payloads`). One row per developer is locked with editable Subject + Body + CC + BCC + attachments + sender forced to `Contact@JBJ.AE`. Per-row preview drawer pre-render exactly what will be sent (Single-Agency rule already enforced server-side). "Approve & Send" calls existing `crm-send-developer-registration` with `template = 'registration_confirmation'`.

Template variables: `{{developer_name}} {{contact_name}} {{registration_status}} {{contract_date}} {{sender_name}} {{company_name}}` resolved server-side from the registry row.

### 4. Contract-signed automation
- E-signature `EnvelopeDetail` already writes `contract_document_url` + `contract_signed_at` on completion. Add a post-completion hook that:
  1. Upserts the file into `crm_developer_documents` (existing) tagged `signed_contract`.
  2. Schedules `next_action_at = now() + interval (configurable, default 1 day)` and `next_action_note = 'Confirm registration status'`.
- Global default editable in Owner → Settings → Automation (single row in `app_settings`).

### 5. Auto-stop engine
Extend the existing `gmail-inbox-sync` / `classify-developer-request` edge function with a regex+LLM matcher for phrases like "officially registered", "registration completed", "commission eligible", "broker registration approved". On match:
- Set `registration_status = 'registered'`, `registered_at = now()`, `commission_eligible = true`.
- Cancel scheduled `next_action_at` for confirmation.
- Append touchpoint (inbound) and a system note in `developer_action_items`.

### 6. Owner Registration Documents panel
New section inside `DeveloperProfile` (owner-gated via `requireOwnerAuth` + `useUserRole`). Lists `crm_developer_documents` rows filtered to owner-only doc kinds: signed contract, trade license, RERA, passport, VAT, MOU, NDA, registration approval, commission approval, email confirmation. Upload + replace + download.

### 7. Communication history
Every send already writes to `email_send_log` and `crm_outreach_touchpoints`. Surface a "Confirmations" tab in the developer profile filtered to `template_name = 'registration_confirmation'` with delivered/opened/replied chips (data already present).

### 8. Safety guardrails (server-side, in edge function)
Hard checks before each send: valid email, prior outreach exists, contract present when required, sender forced to `Contact@JBJ.AE`, attachment list non-empty when template requires, `registration_confirmation_sent_at` not within last 24h, suppression list clear.

---

### Database (one additive migration)
- `ALTER TABLE crm_developer_registry ADD COLUMN IF NOT EXISTS commission_eligible boolean NOT NULL DEFAULT false;`
- `CREATE TYPE` extension if needed for new status values (`confirmed_registered`, `registration_rejected`, `no_response`) — added via `ALTER TYPE crm_dev_registration_status ADD VALUE IF NOT EXISTS …`.
- New table `app_automation_settings (id, key, value jsonb, updated_at)` for the editable follow-up delay.
- RLS: owner/admin only via existing `has_role` helper.

### Files
- New: `src/components/crm/ConfirmRegistrationModal.tsx`, `src/components/crm/registration/StatusBadge.tsx`, `src/lib/crm/registrationStatus.ts`, `src/components/crm/registration/OwnerDocumentsPanel.tsx`, `src/hooks/useRegistrationAutomation.ts`, `src/pages/owner/settings/AutomationSettings.tsx`.
- Edited: `src/components/crm/entity/DevelopersDirectory.tsx`, `src/pages/owner/OwnerRelationships.tsx`, `src/pages/e-signature/EnvelopeDetail.tsx`, `supabase/functions/crm-send-developer-registration/index.ts`, `supabase/functions/classify-developer-request/index.ts`, `supabase/functions/gmail-inbox-sync/index.ts`.
- Migration: one file adding the column, enum values, settings table, RLS.

### Out of scope
- No new email provider, no rewrite of existing outreach pipeline.
- Brokerage outreach untouched (Single-Agency rule preserved).
- No changes to e-signature chrome from previous task.

---

### Open question before I start
Should **"Confirm Registration Status"** be its own dedicated template (separate subject line + body, e.g. *"Please confirm our registration status"*), or a variant of the existing registration outreach email? My default is **separate template** — clearer audit trail and lets the auto-stop engine match replies precisely. Confirm or override.
