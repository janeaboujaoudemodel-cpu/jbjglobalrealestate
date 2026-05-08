# Unified CRM Ecosystem — Audit & Consolidation Plan

## 1. Audit findings (reuse, don't rebuild)

The system already has a strong relational CRM foundation. Existing tables to **KEEP as canonical**:

| Domain | Canonical table | Notes |
|---|---|---|
| Brokerages | `crm_brokerages` | Has license, website, contacts, tags, status, outreach state |
| Individual brokers | `crm_brokers` + `crm_brokerage_agents` | Agents row links to brokerage; brokers row is the personal record |
| Broker history | `broker_company_history` | Already supports prev companies (started_at/ended_at) |
| Developers | `crm_developer_registry` | Has office, website, country, contacts |
| Developer reps | `developer_representatives` (+ `developer_sales_reps`, `developer_contacts`) | Three overlapping tables — must consolidate |
| Investors | `crm_leads` where `lead_type='investor'` (+ `client_investors`) | Investors live in unified leads |
| Master contacts | `crm_leads` | Source/import metadata, labels, tags, scoring |
| Imports | `crm_imports`, `crm_import_batches`, `crm_broker_import_staging` | Already track source, batch, file |
| Campaigns | `campaigns`, `crm_email_campaigns`, `crm_campaign_recipients`, `campaign_members` | Reuse |
| Activity | `crm_activities`, `crm_brokerage_notes`, `crm_brokerage_events`, `crm_relationship_status_history`, `crm_outreach_touchpoints` | Reuse |
| Scanner | `crm-save-scanned-card` edge fn already upserts to `crm_brokerages` & `crm_developer_registry` | Reuse — extend, don't replace |

**Duplicates to deprecate (data-migrate then drop):**
`rel_brokerages`, `rel_developers`, `rel_brokerage_contacts`, `rel_developer_contacts`, `jbj_brokers`, `jbj_leads`, plain `leads`, `developers` (legacy), `developer_sales_reps` + `developer_contacts` (merge into `developer_representatives`).

## 2. Schema consolidation (single migration)

1. **Brokerage ↔ Broker link**: ensure `crm_brokerage_agents.broker_id uuid REFERENCES crm_brokers(id)` exists; backfill by matching email/phone normalized; add `current_brokerage_id` on `crm_brokers` (denormalized pointer) + trigger to sync.
2. **Broker history**: keep `broker_company_history`; add trigger on `crm_brokerage_agents` brokerage change → close prior row, insert new.
3. **Developer reps unification**: migrate rows from `developer_sales_reps` and `developer_contacts` into `developer_representatives` (add missing cols: `whatsapp`, `linkedin`, `instagram`, `role`, `source`, `source_batch_ids`, `import_label`, `current_developer_id`); add `developer_rep_company_history` mirror of broker history.
4. **Source tracking** (verify/add on `crm_leads`, `crm_brokerages`, `crm_brokerage_agents`, `developer_representatives`):
   - `database_source text`, `event_source text`, `upload_source text`, `original_filename text`, `imported_by uuid`, `imported_at timestamptz`, `source_history jsonb`.
5. **Unified contact view**: `vw_crm_contacts` UNION ALL across brokers, agents, reps, investors, partners — exposes `(id, kind, name, email, phone, company_id, company_kind, company_name, source, labels, last_interaction_at)` for global search/exports.
6. **rel_* / jbj_* / leads / developers**: data-migrate into canonical, then `DROP TABLE` (or mark with comment + revoke) — feature-flagged so app keeps building.

## 3. Backend (edge functions)

- **Extend `crm-save-scanned-card`** (already creates brokerage/developer): also write `crm_brokerage_agents` / `developer_representatives` rows linked to the company, and call new `upsert_contact_with_company` RPC.
- **New RPC `upsert_contact_with_company(payload jsonb)`**: single source of truth used by scanner, manual entry, bulk import, and LinkedIn import. Handles: company find-or-create, contact find-or-create (email/phone fuzzy), link, history row on company change, source append.
- **Extend `crm-broker-bulk-import` and `crm-bulk-upload-brokerages` / `crm-bulk-upload-developers`** to call the same RPC so all import paths share logic.
- **New `crm-export` edge function**: streams CSV/XLSX filtered by `{ scope: 'brokerage'|'developer'|'source'|'event'|'label'|'country'|'city'|'team'|'campaign', value }` from `vw_crm_contacts`.

## 4. UI (reuse existing pages, add tabs)

- **`CRMRelationships.tsx` Brokerage detail drawer**: ensure tabs `Linked Brokers | Notes | Meetings | Campaigns | Cards | Follow-ups | Source history`. Most exist; add missing Cards & Source-history tabs.
- **`AdminCRM.tsx` Broker detail**: add `Current company`, `Previous companies` (from `broker_company_history`), `Role title`, `Relationship timeline`, `Campaign status`.
- **`AdminDevelopers.tsx` / `DeveloperDetail.tsx`**: mirror the brokerage layout — `Linked Reps | Notes | Meetings | Campaigns | Cards | Follow-ups`.
- **New Rep detail panel** inside developer drawer: current developer, previous developers, role, timeline.
- **Source filter chips** on CRM lists: filter by `database_source`, `event_source`, `upload_source`, `original_filename`, label, country, city, team, campaign.
- **Unified Export modal** (button on every list/detail) → calls `crm-export` with the active scope/filters.
- **Scanner save flow**: already proposes Merge/Update/Add — add a "Link to existing brokerage/developer" picker so reps and brokers always land in the right company.

## 5. Deprecation rollout (safe order)

1. Migration adds new columns + view + RPC (non-breaking).
2. Edge functions switch to RPC.
3. UI switches reads to canonical tables + view.
4. Backfill script copies `rel_*`, `jbj_*`, `leads`, `developers` rows into canonical (idempotent, dedup by email/phone).
5. After verification, drop legacy tables in a follow-up migration.

## 6. Acceptance checklist

- Creating "FAM Properties" then scanning "John Smith @ FAM" → John appears in **Individual Brokers** AND in **FAM → Linked Brokers**, auto-linked.
- Changing John's company updates `current_brokerage_id` and inserts a `broker_company_history` row.
- Same behavior for Sobha + Sarah Ahmed via `developer_representatives`.
- Every contact row has `database_source`, `event_source`, `upload_source`, `original_filename`, `imported_by`, `imported_at`.
- Exports work scoped by brokerage / developer / source / event / label / country / city / team / campaign.
- Brokerage and developer detail views show the full relational hub (linked people, notes, meetings, campaigns, cards, follow-ups).
- No new parallel CRM tables created; `rel_*`, `jbj_*`, plain `leads`, plain `developers` are migrated and removed.

## Technical details (for engineers)

- All new policies use `requireOwnerAuth` + `has_role(auth.uid(),'admin')`; never expose PII to anon.
- `vw_crm_contacts` is a `SECURITY INVOKER` view; underlying RLS still applies.
- Triggers: `trg_sync_broker_company` on `crm_brokerage_agents`, `trg_sync_rep_company` on `developer_representatives`.
- Indexes: `(email_normalized)`, `(phone_normalized)`, `(brokerage_id)`, `(current_developer_id)`, GIN on `tags`, `specialty_labels`.
- Keep champagne-gold design tokens, IconTile, locked-send + quota standards intact — no UI restyle in this scope (No Removal policy).
