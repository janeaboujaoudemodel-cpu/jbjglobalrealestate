# Batch Implementation Plan

Five tracks executed in one pass. LD 33k import is gated on the user uploading the CSV — everything else ships now.

## 1. `developer-enrich` edge function

Goal: fill missing `logo_url`, `ceo_name`, `trade_license_number`, `headquarters`, social handles on `developers` rows.

- New function `supabase/functions/developer-enrich/index.ts`
  - Input: `{ developer_ids?: string[], limit?: number, dry_run?: boolean }`
  - Auth: `requireOwnerAuth` (per Zero Trust standard)
  - For each developer with any null target field:
    1. Google CSE search (`<name> Dubai developer official site`) → top domain
    2. Firecrawl `scrape` (formats: `markdown`, `branding`) on root + `/about`, `/leadership`, `/contact`
    3. Lovable AI Gateway (`google/gemini-3-flash-preview`) with strict JSON schema → `{logo_url, ceo_name, trade_license_number, headquarters, instagram, linkedin, x, facebook, youtube, website}`
    4. Sanity-check logo URL (HEAD 200 + image content-type), fall back to `branding.logo`
    5. Upsert ONLY null/empty columns (never overwrite human edits); write `developer_enrichment_log` row with diff + sources
- Migration: `developer_enrichment_log` table (developer_id, source_urls jsonb, fields_filled jsonb, model, created_at) + RLS owner-only.
- UI: "Enrich missing data" button on `DevelopersDirectory` (owner only) → calls function with current filter scope, toast with N updated.

## 2. Company typeahead in broker drawer

Goal: when editing/creating a broker, the "Current company" field is a combobox that writes both `current_company` (text, free-form fallback) and `current_brokerage_id` (FK to `brokerages`).

- Component `src/components/crm/BrokerageCombobox.tsx`
  - shadcn `Command` + `Popover`, champagne tokens, IconTile gold
  - Debounced query `brokerages` by `name ilike` + trade_license, top 8
  - "Create new brokerage…" inline action if no exact match → opens mini-form (name, license #, city) → inserts and selects
- Wire into `BrokerEditDrawer` (or equivalent — confirm exact filename when implementing): on select set `current_brokerage_id = row.id` and `current_company = row.name`; on free-text fallback clear FK.
- Migration: ensure `crm_brokers.current_brokerage_id uuid references public.brokerages(id) on delete set null` + index.

## 3. `birthday-dispatcher` edge function + cron

- Function `supabase/functions/birthday-dispatcher/index.ts`
  - Reads `crm_contacts` where `extract(month from birthday)=extract(month from now() at time zone 'Asia/Dubai')` and same day
  - For each: render branded HTML template (champagne + gold hairline, JBJ monogram, no faded gold text), respect single-agency rule, push through `quotaGuardedFetch` → `email_quota_try_claim` → Resend gateway
  - Idempotency: `email_send_log` unique on `(contact_id, kind='birthday', sent_on::date)`
  - Returns `{queued, sent, skipped_quota, skipped_already_sent}`
- Template: `supabase/functions/_shared/templates/birthdayEmail.ts` — Inter, ink on champagne, executive signature "Amanda Clarke, Executive Assistant" (never "AI"), unsubscribe footer.
- pg_cron via `supabase--insert` (not migration — contains project URL + anon key) at 08:00 Asia/Dubai = `0 4 * * *` UTC.
- E2E test: `index.test.ts` seeds a contact with today's birthday in a temp schema, calls function, asserts log row + Resend gateway mock 200.

## 4. Owner-badge email scrub

- Search `rg "user\\.email|session\\.user\\.email" src/` and audit every render adjacent to an Owner / role badge.
- Replace with role-only text: `"Owner"` / `"Executive"` / `"Broker"` per current mode; keep email visible only inside the Account Settings page.
- Add ESLint custom rule `no-email-near-role-badge` (regex on JSX) to CI to prevent regression — registered in `eslint.config.js` plus `scripts/contrast/`-style guard script.
- No DB change; this is presentation-only per the user's rule.

## 5. LD 33k import — awaiting file

- Backfill script + idempotent loader are already drafted in `scripts/import/ld-brokers.ts`.
- Action required from user: drop the LD CSV/XLSX into chat. On receipt next turn:
  1. Copy upload → `/tmp/ld.csv`
  2. Dry-run: row count, column map, dedupe key (email||phone||license)
  3. Chunked insert into `crm_brokers` via `import-ld-brokers` edge function with `on conflict do update` on the dedupe key
  4. Report inserted / updated / skipped

## Out of scope this batch

- CRM Insights AI strip (queued, separate pass)
- Investor / Sales Rep / Agency tabs
- Trade-license popups (already removed earlier)

## Technical notes

- All new edge functions: `verify_jwt = false` default + in-code `requireOwnerAuth`; CORS from `@supabase/supabase-js/cors`; Zod validation.
- All new UI: champagne tokens only, IconTile gold, no solid gold fills, no faded gold text, `<AdaptiveHairline />` for dividers.
- Single-agency email rule enforced in birthday dispatcher before send.
- Resend quota guard: `quotaGuardedFetch` + `email_quota_try_claim` RPC on every outbound.

Approve to execute tracks 1–4 immediately; track 5 waits on the CSV.
