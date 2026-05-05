
# UAE Registry — Gap Closure (modify existing only)

The schema, dedup engine, settings (`CONTACT@JBJ.AE` locked, forbidden Gmail), follow-up cron, sources table, comm-history log, attachments table, send + test-send gating, CSV import, smart actions, dedup triggers — **already exist**. This plan only builds the **missing** pieces from the spec.

## What's missing vs. what's already built

| Spec item | Status | Action |
|---|---|---|
| Tables `uae_dev_registry` / `uae_brk_registry` with all fields incl. JSONB office_locations, public_key_contacts, uae_projects, international_projects, public_registration_identifiers, active_developer_relationships, service_categories | EXISTS | none |
| All enums (emirate, status, verification, priority, master, company_type) | EXISTS | none |
| `uae_registry_sources`, `uae_registry_log`, `uae_registry_attachments`, `uae_registry_settings` | EXISTS | none |
| Sender locked to `CONTACT@JBJ.AE`, forbidden `janeaboujaoudemodel@gmail.com` | EXISTS in `uae_registry_settings` | none |
| Test-send required before bulk; "Not Verified" blocks sending; missing recipient/sources blocks | EXISTS in `uae-registry-send` | none |
| Follow-up scheduling D+2 / D+5 / D+10 / mark No Response D+14 | Cron EXISTS but only **marks** records due; does not actually send the follow-up email | **Add auto-send** |
| Dedup by name / website / phone / license | EXISTS | none |
| CSV import + smart actions (call / email / WhatsApp) | EXISTS in list page | none |
| Detail page shows full editable record (founded_year, registration_email, registration_page_url, broker_registration_process, required_documents, key contacts, projects, identifiers, locations, license) | **MISSING** — current detail page only shows outreach + sources + log | **Build full editor** |
| Attachments UI (upload + view rows from `uae_registry_attachments`) | **MISSING** | **Build** |
| Master developer Evidence required when status = Yes | Not enforced in DB | **Add trigger** |
| Inbound reply ingestion: match by email_thread_id / sender_domain / company_name / outreach_email, set status `Replied`, save to log, AI summarize + extract requested documents / contact person / registration instructions / deadline + draft response | **MISSING** | **Build edge function + Resend inbound webhook hook** |
| Last response summary, required next action auto-fill on reply | **MISSING** | covered by inbound function |

## Part 1 — Schema additions (single migration, additive only)

1. Trigger `validate_master_developer_evidence` on `uae_dev_registry` BEFORE INSERT/UPDATE: if `master_developer_status = 'Yes'` and `master_developer_evidence` is NULL/blank → raise `'master_developer_evidence required when status = Yes'`.
2. Indexes for follow-up sender + reply matching:
   - `uae_dev_registry (next_follow_up_date) where outreach_status in ('Test Sent','Contacted','Follow-up Needed')`
   - same on `uae_brk_registry`
   - `uae_registry_log (email_thread_id)` and `(email_message_id)`

## Part 2 — Detail page full editor (`UAERegistryDetailPage.tsx`)

Add tabbed sections inside the existing page (no new route, no new page). Tabs: **Profile · Contacts · Projects · Sources · Communication · Attachments · Outreach** (Outreach + Sources + Communication tabs already render; the rest are new).

Profile tab fields written directly to `uae_dev_registry` / `uae_brk_registry`:
- Common: `legal_company_name`, `brand_name`, `emirate_section`, `website`, `headquarters_address`, `office_google_maps_url`, `instagram_url`, `linkedin_url`, `data_source`, `notes`, `last_verified_date`, `verification_status`, `priority`, `outreach_*`.
- Developer-only: `company_type`, `master_developer_status`, `master_developer_evidence` (required when status=Yes — UI mirrors trigger), `founded_year`, `registration_email`, `registration_page_url`, `broker_registration_process`, `required_documents_for_registration` (chip input).
- Brokerage-only: `license_number`, `regulator_or_authority`, `rera_orn_or_broker_number`, `service_categories` (multi-select), `outreach_contact_person`, `outreach_email`, `outreach_phone`, `company_size_estimated`, `number_of_brokers`, `specialization`, `primary_market`.

Contacts tab — JSONB editors with add/remove rows for:
- `office_locations`, `main_phone_numbers`, `main_email_addresses`, `public_key_contacts`. Each row enforces a `source_url` field (matches spec validation).

Projects / Identifiers tab (developer-only): `uae_projects`, `international_projects`, `public_registration_identifiers`. Brokerages get `active_developer_relationships` here instead.

All edits go through existing `useUpdateRecord` mutation in `useUAERegistry.ts` — no new hooks beyond a tiny `useUpsertRow` helper for JSONB array editing.

## Part 3 — Attachments UI

In the new Attachments tab:
- Upload to existing Supabase storage bucket (reuse `crm-attachments` bucket; if absent, the migration in Part 1 also creates `uae-registry-attachments` private bucket with owner-only RLS).
- Insert row into `uae_registry_attachments` with `developer_id` or `brokerage_id`, `file_name`, `storage_path`, `sent_to`, `sent_date`.
- List existing rows with download (signed URL) + delete.
- New hook `useRegistryAttachments(type, recordId)` in `useUAERegistry.ts`.

## Part 4 — Auto follow-up sender

New edge function `uae-registry-followup-send` (extends pattern from `uae-registry-send`):
- Triggered by existing pg_cron at 09:00 Dubai (alter existing job to call this AFTER `uae-registry-followup-cron`).
- Selects records where `next_follow_up_date <= today`, `outreach_status in ('Test Sent','Contacted','Follow-up Needed')`, `verification_status != 'Not Verified'`, recipient email present, `do_not_send` rules pass.
- Renders template variant `developer_followup_<n>` / `brokerage_followup_<n>` from existing `crm_email_templates` table (variants will be inserted in the same migration; reuse champagne/black branding from previous turn — no new template engine).
- Sends via Resend from `CONTACT@JBJ.AE`, threads on previous `email_message_id`.
- Logs to `uae_registry_log` with channel=`Email`, direction=`Outbound`, `summary='Follow-up #N'`, captures `email_message_id`.
- Updates `last_email_sent_at`, increments `number_of_follow_ups_sent`, recomputes `next_follow_up_date` per `uae_registry_settings`.

Cron change: alter existing schedule to invoke `uae-registry-followup-cron` then `uae-registry-followup-send` sequentially.

## Part 5 — Inbound reply ingestion + AI extraction

New edge function `uae-registry-inbound-reply`:
- Invoked by existing `resend-inbound-email-webhook` (add a hand-off block: if recipient is `contact@jbj.ae` AND a matching `uae_registry_log.email_thread_id` or `email_message_id` exists, forward the parsed payload to this function).
- Match priority: `email_thread_id` → `email_message_id` → `outreach_email` exact → `sender_domain` (lower(split_part(from, '@', 2))) against `website_domain` → fuzzy `legal_company_name`.
- On match:
  1. Insert `uae_registry_log` row (channel=`Email`, direction=`Inbound`, full body, `email_thread_id`, `email_message_id`).
  2. Call Lovable AI Gateway (`google/gemini-2.5-flash`) with prompt to return JSON `{ summary, requested_documents[], contact_person, registration_instructions, deadline, recommended_next_action, draft_response_html }`. Store in `uae_registry_log.ai_extracted` (column already exists).
  3. Update record: `outreach_status='Replied'`, `last_reply_received_at=now()`, `last_response_summary=summary`, `required_next_action=recommended_next_action`, `next_follow_up_date=null`.
- Show AI extraction + draft reply in the detail page Communication tab (read from `ai_extracted` JSONB) with one-click "Send draft" reusing `uae-registry-send`.

No new tables. No new pages. All authentication via owner JWT or service role for webhooks.

## Part 6 — Files to edit (no new files apart from 2 edge functions and 1 migration)

- `supabase/migrations/<new>.sql` — master-developer evidence trigger, indexes, follow-up cron alter, follow-up template variants insert, optional storage bucket.
- `src/pages/owner/uae-registry/UAERegistryDetailPage.tsx` — replace with tabbed editor (Profile / Contacts / Projects / Sources / Communication / Attachments / Outreach).
- `src/hooks/useUAERegistry.ts` — add `useRegistryAttachments`, JSONB array helpers.
- `supabase/functions/resend-inbound-email-webhook/index.ts` — branch to UAE registry handler.
- `supabase/functions/uae-registry-followup-send/index.ts` — new.
- `supabase/functions/uae-registry-inbound-reply/index.ts` — new.

## Out of scope

- Any new dashboard / module / "v2" page.
- Changing the brokerage outreach templates (locked from previous turn).
- Touching `crm_brokerages` / `crm_developer_registry` overlays — they remain CRM-only and link via existing FKs.

Approve to switch to build mode and execute.
