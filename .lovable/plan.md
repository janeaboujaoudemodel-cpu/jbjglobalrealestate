# Execute Master Recreation Plan — Adapted for THIS Backend

## Important conflict found

The Master Prompt in `.lovable/plan.md` creates these tables fresh:
`developers`, `projects`, `deals`, `developer_contacts`, `user_roles`,
`listings`, `media_assets`, plus several enums (`emirate`, `app_role`,
`deal_status`, etc.).

Your current Lovable Cloud database **already has** these tables, in heavy
production use, with very different schemas:

- `developers` — has `logo_url`, `headquarters`, `website_url`,
  `ceo_name`, `license_number`, `is_hidden`, `logo_locked`, etc.
  (no `slug`, no `hq_emirate`, no `registration_status`, no
  `primary_email`).
- `projects` — your live project catalogue (used everywhere on the public site).
- `deals` — broker/CRM deals with `broker_user_id`, `unit_number`,
  `deal_value_aed`, `points_awarded`, etc. (no `counterparty_type`,
  no `commission_pct`).
- `developer_contacts` — different shape (`developer_user_id`,
  `position`, `nationality`, `rating`).
- `user_roles` — already exists with its own enum.
- `uae_dev_registry` / `uae_brk_registry` — your existing UAE outreach
  tables.

Running the prompt as-is would either fail (CREATE TYPE / TABLE already
exists) or, worse, drop & recreate live tables and destroy production
data.

## Approach

Build the new module **alongside** the existing system using a `rel_`
prefix on every new table and enum. Nothing existing is touched. When
you are ready to merge into the public catalogue we can map `rel_*` →
existing tables in a follow-up.

## What I will build

### 1. Database (new migration)
New enums (prefixed):
`rel_emirate`, `rel_registration_status`, `rel_onboarding_status`,
`rel_counterparty_type`, `rel_deal_status`, `rel_campaign_audience`,
`rel_campaign_status`, `rel_email_send_status`, `rel_media_kind`.

New tables (all with RLS, owner-only writes via existing `is_owner` /
`has_role` patterns, authenticated reads):
- `rel_developers`, `rel_brokerages`
- `rel_developer_contacts`, `rel_brokerage_contacts`
- `rel_deals`, `rel_deal_payments`
- `rel_email_campaigns`, `rel_email_sends`
- `rel_projects`, `rel_listings`, `rel_media_assets`, `rel_listing_media`
- Trigger `trg_rel_media_fanout` auto-attaches uploaded media to every
  published listing of the chosen project.
- View `rel_listing_with_media`.
- Storage buckets: `rel-logos` (public), `rel-media` (public),
  `rel-kyc` (private, owner-only).

### 2. Seed data
Insert the full UAE list from the plan (≥40 developers, ≥80 brokerages
— I'll extend the brokerage list to reach 80 with real UAE names) into
`rel_developers` / `rel_brokerages`. Auto-fill `google_maps_url` for any
nulls.

### 3. Edge functions
- `rel-send-bulk-email` — Resend-powered campaign sender, mustache
  merge, status fanout, flips `registration_status` → `submitted` /
  `onboarding_status` → `invited` on success. JWT verified, owner-only.
- `rel-schedule-followup` — daily cron via pg_cron + pg_net at 09:00
  Dubai. Helper SQL function `rel_followup_due_sends()`.
- Both use `RESEND_API_KEY` (will request via add_secret if not set).

### 4. Pre-seeded campaigns
Two draft campaigns inserted:
- "Developer Registration — Brokerage Pack" (with the Google Drive KYC
  link `https://drive.google.com/drive/folders/1EsWVmAPv6ljBzWbWNAvv07EQrHwi5drS`).
- "Brokerage Invite — Citi Developers".

### 5. Front-end (owner-only)
New routes wrapped in `OwnerGuard`:
- `/owner/relationships` — tabs Developers | Brokerages, Emirate +
  status filters, search, bulk-select → "Send Email Campaign", clean
  domain links, detail drawer (Profile / Contacts / Registration /
  Deals / Commission / Email History).
- `/owner/relationships/revenue` — KPI strip + dual ledger.
- `/owner/media-ingest` — drag-drop dropzone, project combobox,
  auto-fanout to listings.

Components live under `src/pages/owner/relationships/*` and
`src/components/relationships/*`. Champagne theme, IconTile, ink text
(matches existing memory rules).

### 6. Acceptance check
After build I'll:
- query `rel_developers` count to confirm seed,
- invoke `rel-send-bulk-email` against the developer campaign in
  test-only mode (1 recipient = your own email) to confirm Resend works,
- upload a sample PDF to `/owner/media-ingest` and verify the fanout
  trigger populated `rel_listing_media`.

## What I will NOT do
- Will not modify existing `developers`, `projects`, `deals`,
  `developer_contacts`, `user_roles` tables.
- Will not drop any enum.
- Will not touch the public website routes.
- No mock/placeholder rows.

## Secrets needed
- `RESEND_API_KEY` (will request via add_secret if not already in your
  project secrets).

After approval I will run the migration, deploy both edge functions,
seed the data, scaffold the UI, and verify acceptance criteria.
