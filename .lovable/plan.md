
# UAE Developers + Brokerages Registration CRM

A fully integrated, owner-only outreach engine for registering JBJ Global Real Estate with every UAE developer and brokerage, organized by emirate, with verified sources, locked sender (CONTACT@JBJ.AE), automated follow-ups, and reply intelligence.

## Scope

1. Two new owner-only datasets (Developers + Brokerages) with full schema parity to your spec.
2. Shared outreach state machine (Not Contacted → Registered).
3. Locked sender: only `CONTACT@JBJ.AE`. Hard block on `janeaboujaoudemodel@gmail.com` and any other sender.
4. Bilingual email templates (English + Arabic) with attachment support.
5. Automated follow-up scheduler (D+2, D+5, D+10, mark No Response D+14).
6. Reply ingestion + AI summarization → updates record, extracts requested docs, drafts response.
7. Owner dashboard with 7-emirate tabs, priority filters, source verification UI.
8. Strict validation: no guessing, source URL required per record/contact/license/project.

## Database (new migrations)

```text
public.uae_developers
public.uae_brokerages
public.uae_outreach_log          (communication_history rows)
public.uae_outreach_attachments  (attachments_sent rows)
public.uae_outreach_sources      (per-field source URLs)
public.uae_outreach_settings     (locked sender, follow-up cadence, blocklist)
```

- Enums: `uae_emirate`, `outreach_status`, `verification_status`, `company_priority`, `developer_company_type`.
- All tables: `owner_id` column + RLS — only the owner role (`has_role(auth.uid(),'owner')`) can SELECT/INSERT/UPDATE/DELETE. No public/broker/visitor access.
- Unique constraints on `legal_company_name`, `website`, `license_number` (brokerages) for duplicate matching.
- Validation triggers (not CHECK) for: source URL required when contact/phone/email/project present; `verification_status='Not Verified'` blocks outreach.
- Indexes on `emirate_section`, `outreach_status`, `next_follow_up_date`, `priority`.

## Edge Functions

1. **`uae-outreach-send`** — sends one email through Lovable Emails infra (transactional). Hard-locks `from = CONTACT@JBJ.AE`; rejects any other sender; refuses send if `verification_status = 'Not Verified'`, recipient email null, or sources missing. Renders EN or AR template, attaches uploaded docs, writes to `uae_outreach_log`, updates record status to `Test Sent` / `Contacted`.
2. **`uae-outreach-followup-cron`** — scheduled via pg_cron daily. For each record with `outreach_status IN ('Test Sent','Contacted','Follow-up Needed')`:
   - D+2 → first follow-up
   - D+5 → second
   - D+10 → final
   - D+14 with no reply → mark `No Response`
3. **`uae-outreach-reply-ingest`** — webhook + scheduled poll on the CONTACT@JBJ.AE inbox. Matches reply by thread id / sender domain / company name; calls `google/gemini-2.5-pro` (Lovable AI) to: summarize, extract requested documents, extract contact person, extract deadline, recommend next action, draft response. Writes to `uae_outreach_log`, updates status to `Replied`.
4. **`uae-outreach-source-verify`** — on-demand: given a source_url, runs Firecrawl scrape (existing connector pattern) to confirm the field still appears on the official page; flips `verification_status` to `Partially Verified` on conflict and adds a note.

All functions: `requireOwnerAuth` middleware (existing pattern), CORS, Zod input validation, rate-limited.

## Frontend (owner-only)

New route group under `/owner/uae-registry/`:

```text
/owner/uae-registry                     → Overview (7 emirate tiles, KPIs)
/owner/uae-registry/developers          → Developers table, filters, bulk actions
/owner/uae-registry/developers/:id      → Developer detail + outreach timeline
/owner/uae-registry/brokerages          → Brokerages table
/owner/uae-registry/brokerages/:id      → Brokerage detail + outreach timeline
/owner/uae-registry/compose             → Bilingual composer + test-send flow
/owner/uae-registry/automation          → Follow-up cadence, blocklist, audit
```

Components reuse existing white-dominant monochrome design tokens, Inter font, `--price-orange` not used here, AI summary cards use the violet AI theme. All gated behind `OwnerGuard` + freshly verified step-up auth (existing `useStepUpAuth`) before any send.

## Email templates

Two HTML templates (EN + AR) added under `supabase/functions/_shared/uae-templates/` with placeholders: `{{contact_person_name}}`, `{{company_name}}`, `{{attachments_list}}`. Body is white (#FFFFFF) per email infra rule. Sender display: "JBJ Global Real Estate <CONTACT@JBJ.AE>".

## Automation & validation rules (enforced server-side)

- `send_rules.sender_email = 'CONTACT@JBJ.AE'` — hardcoded, not configurable from UI.
- Forbidden sender list includes `janeaboujaoudemodel@gmail.com` — function returns 403 if attempted.
- Test send required before bulk send is unlocked per record (flag `test_email_completed`).
- Bulk send capped at 50/run with 2s delay to respect Lovable Emails queue.
- Status transitions enforced via DB trigger (only valid forward transitions allowed).

## Source collection workflow

- Each record requires at least one row in `uae_outreach_sources` before it can move past `Not Verified`.
- "Add source" UI runs Firecrawl scrape → shows extracted snippet → owner confirms → saves with `fields_verified[]` and `date_checked`.
- Priority hierarchy enforced in UI: official site > government registry > LinkedIn/press > portals.

## Prerequisites I will set up

- Lovable Emails domain on `jbj.ae` with sender `CONTACT@JBJ.AE` (will trigger setup dialog if not already verified).
- Firecrawl connector (already documented in stack) — link via standard connectors picker.
- pg_cron + pg_net for daily follow-up job.

## Out of scope (explicit)

- Bulk import of pre-existing developer/brokerage lists — owner adds records manually or via the source-verification flow. Happy to add CSV import in a follow-up.
- Sending from any account other than CONTACT@JBJ.AE.
- Public-facing exposure of any data in this module.

## Deliverables

- 6 SQL migrations (tables, enums, RLS, triggers, cron job).
- 4 edge functions (send, follow-up cron, reply ingest, source verify).
- 7 new pages + ~15 components under `/owner/uae-registry/`.
- 2 bilingual email templates (EN, AR).
- Owner-only nav entry in Executive Command Center.

Approve and I'll implement in this order: DB + RLS → templates + send function → composer UI → tables/detail pages → follow-up cron → reply ingest → source verification.
