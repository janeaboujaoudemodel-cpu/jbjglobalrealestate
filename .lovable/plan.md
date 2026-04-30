## Goal

Extend the existing `crm_developer_registry` and `crm_brokerages` tables with a shared, normalized **outreach field set** plus matching enums, indexes, and validation triggers — without removing or renaming any existing column. Add two thin support tables for outreach touchpoints and tags lookups.

This proposal is open for review before any SQL runs.

---

## What's already there (do not touch)

- `crm_developer_registry` — owner_id, developer_name/slug, status, agency_code, commission_tier, registration/expiry dates, developer_contact (jsonb), documents (jsonb), priority, tags[], notes, ai_summary/ai_next_action, last_interaction_at, developer_email, etc.
- `crm_brokerages` — owner_id, company_name, rera_license, office_location, website, primary/secondary_contact (jsonb), status, deal_count/value, last_interaction_at, tags[], notes, ai_summary, first_contact_at, next_followup_at, emirate, last_email/auto_reply timestamps.

Both keep their RLS policies and existing data intact.

---

## Shared outreach field set (added to BOTH tables)

| Column | Type | Purpose |
|---|---|---|
| `outreach_stage` | enum `outreach_stage` | Lifecycle: `not_contacted`, `attempted`, `engaged`, `meeting_booked`, `nda_pending`, `nda_signed`, `active_partner`, `dormant`, `declined`, `blacklisted` |
| `outreach_channel_pref` | enum `outreach_channel` | `email`, `phone`, `whatsapp`, `linkedin`, `in_person`, `unknown` |
| `last_outreach_at` | timestamptz | Last time WE reached out |
| `last_response_at` | timestamptz | Last time THEY responded |
| `response_count` | int default 0 | # responses ever received |
| `attempt_count` | int default 0 | # outreach attempts |
| `next_action_at` | timestamptz | Scheduled next-touch |
| `next_action_note` | text | Short instruction (≤ 500 chars) |
| `assigned_to` | uuid → auth.users | Owning rep (nullable) |
| `do_not_contact` | bool default false | Hard suppression flag |
| `dnc_reason` | text | Required when `do_not_contact = true` |
| `nda_status` | enum `nda_status` | `none`, `requested`, `sent`, `signed`, `expired` |
| `nda_signed_at` | timestamptz | |
| `linkedin_url` | text | Validated URL |
| `whatsapp_e164` | text | Validated E.164 phone |
| `source` | enum `outreach_source` | `manual`, `import`, `referral`, `website`, `event`, `cold_research`, `inbound` |
| `source_detail` | text | Free-form |
| `health_score` | int (0–100) | Computed/curated |

All columns are **nullable** with sensible defaults to preserve existing rows.

---

## New enums

```sql
create type public.outreach_stage as enum (...);
create type public.outreach_channel as enum (...);
create type public.nda_status as enum (...);
create type public.outreach_source as enum (...);
```

---

## New support tables

### `crm_outreach_touchpoints`
Single timeline for both entity types — replaces ad-hoc tracking.

| Column | Type |
|---|---|
| `id` | uuid pk |
| `owner_id` | uuid not null |
| `entity_type` | enum (`developer`, `brokerage`) |
| `entity_id` | uuid not null |
| `channel` | `outreach_channel` |
| `direction` | enum (`outbound`, `inbound`) |
| `subject` | text |
| `body_excerpt` | text (≤ 2000 chars, sanitized) |
| `occurred_at` | timestamptz default now() |
| `created_by` | uuid → auth.users |
| `metadata` | jsonb |
| `created_at` / `updated_at` | timestamptz |

Indexes: `(entity_type, entity_id, occurred_at desc)`, `(owner_id, occurred_at desc)`.

### `crm_outreach_tags`
Owner-scoped tag dictionary so tags[] arrays can be validated/autocompleted.

| `id`, `owner_id`, `label` (unique per owner), `color`, `category`, `created_at` |

---

## Validation rules (via triggers, not CHECK constraints)

Per project memory ("validation triggers, not CHECK"):

1. **Email format** on `developer_email`, contact-jsonb emails — RFC-lite regex.
2. **URL format** on `website`, `linkedin_url` — must start `https?://`.
3. **E.164** on `whatsapp_e164` — `^\+[1-9]\d{6,14}$`.
4. **DNC integrity** — if `do_not_contact = true`, require non-empty `dnc_reason` AND auto-set `outreach_stage = 'blacklisted'` if currently active.
5. **NDA integrity** — `nda_signed_at` required when `nda_status = 'signed'`; clear it otherwise.
6. **Stage progression guard** — cannot move from `blacklisted` back to active stages without owner role; logged to audit.
7. **Counts** — `response_count` / `attempt_count` ≥ 0 (clamp).
8. **Touchpoint hygiene** — on insert into `crm_outreach_touchpoints`, automatically bump `last_outreach_at`/`last_response_at`, `attempt_count`/`response_count`, and `last_interaction_at` on the parent row.
9. **PII** — emails/phones never logged to audit diffs in plaintext (hash via existing PII helpers).

---

## Indexes

- `crm_developer_registry (owner_id, outreach_stage, next_action_at)`
- `crm_brokerages (owner_id, outreach_stage, next_action_at)`
- `crm_developer_registry (assigned_to) where assigned_to is not null`
- `crm_brokerages (assigned_to) where assigned_to is not null`
- GIN on existing `tags[]` if missing.

---

## RLS

- New columns inherit existing policies on parent tables (no policy change needed).
- `crm_outreach_touchpoints` — owner-only read/write via `owner_id = auth.uid()` plus owner-role bypass through existing `has_role()` SECURITY DEFINER function. Aligns with [CRM Data Protection](mem://security/crm-data-protection-and-access-standard).
- `crm_outreach_tags` — same model.

---

## Code touch points (after migration)

- `src/integrations/supabase/types.ts` — auto-regenerated; do not edit manually.
- Add `src/lib/crm/outreachSchema.ts` with zod schemas mirroring the DB validation (client-side parity).
- No UI built in this step — schema + validation only. UI work will be a follow-up plan.

---

## Out of scope for this plan

- UI for managing outreach (separate plan).
- Backfilling `outreach_stage` from heuristics (separate task; default `not_contacted`).
- Email/WhatsApp send infrastructure (already exists).
- Removing or renaming any legacy column.

---

## Deliverables

1. One migration: enums + column adds + new tables + indexes + triggers + RLS for new tables.
2. `src/lib/crm/outreachSchema.ts` zod schemas.
3. Short README at `docs/crm/outreach-schema.md` documenting the field set + state machine.

After approval I will implement in default mode and report back.