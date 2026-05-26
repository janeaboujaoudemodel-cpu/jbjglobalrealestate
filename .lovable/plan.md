# News Admin Hub + DLD Auto-Ingestion — Build Plan

Two systems built side-by-side, each fully testable on its own. Both follow the project's existing patterns: `requireOwnerAuth` for admin edge functions, RLS on every table, champagne/gold UI, `admin_edit_log` entries for every owner mutation.

---

## 1. News Admin Hub (Khaleej Times-style)

### Tables (migration)

- **`news_sources`** — id, name, slug, base_url, type (rss|html|api), fetch_config (jsonb), is_active, last_fetched_at, created_at, updated_at
- **`news_articles`** — id, source_id (fk), source_url (unique), title, slug (unique), summary, body_html, hero_image_url, author, published_at, ingested_at, status (`draft|published|hidden|deleted`), redirect_to_source (bool, default true), edited_by, edited_at, ai_draft (jsonb — raw link-extract output), created_at, updated_at
- **`news_article_revisions`** — id, article_id, before_values jsonb, after_values jsonb, changed_fields text[], edited_by, edited_at (audit trail; mirrors `admin_edit_log` pattern)

RLS: public read of `news_articles WHERE status='published'`; full CRUD owner-only via `has_role(auth.uid(),'admin')` or `requireOwnerAuth`. `news_sources` and revisions owner-only. GRANTs: `anon`+`authenticated` SELECT on published articles; `service_role` ALL.

### Edge functions

- **`news-extract-from-link`** — owner-only. Input: `{ url }`. Uses universal-link-extractor pattern + Firecrawl scrape (`formats:['markdown','summary',{type:'json',schema}]`) → returns draft `{ title, summary, body_html, hero_image_url, author, published_at, source_url }`. Never publishes; just returns the draft to the UI.
- **`news-article-mutate`** — owner-only. Create / update / hide / delete / toggle-redirect. Writes `news_article_revisions` row on every change.
- **`news-ingest-rss`** *(scheduled, hourly)* — iterates active `news_sources`, fetches RSS/HTML, dedupes on `source_url`, inserts as `status='draft'` for owner review. Pure backend, no auto-publish.

### Admin UI — `/owner/news`

Single page under existing Owner shell, champagne-dominant, full-bleed band, gold hairline card. Sections:

1. **Quick-Add by Link** — single URL input → calls `news-extract-from-link` → renders editable draft form (title, summary, body, hero image, author, date, source URL, redirect-toggle) → Save as Draft / Publish.
2. **Articles table** — columns: title, source, status pill, published_at, redirect, actions (Edit / Hide / Delete / Toggle redirect). Filter pills: All / Draft / Published / Hidden. Search by title.
3. **Sources tab** — manage `news_sources` (add RSS feeds, toggle active, see last fetch time).

Public surface (no UI work here in v1 — articles render through the existing public news route if present; if not, a follow-up adds `/news` and `/news/:slug`. Redirect-toggle on means clicking the public card opens `source_url` in a new tab instead of the in-app article view).

### Tests

- Deno test for `news-extract-from-link` (mocked Firecrawl response → asserts draft shape, never writes to DB).
- Deno test for `news-article-mutate` (owner JWT required, revision row written, status transitions valid).
- Vitest for the admin page: renders table, opens edit dialog, calls mutate function.

---

## 2. DLD / DXB Interact / RERA / Property Monitor Auto-Ingestion

### Tables (migration)

- **`market_data_sources`** — id, key (`dld|dxb_interact|rera|property_monitor`), label, endpoint_url, auth_mode (`none|api_key|scrape`), fetch_config jsonb, is_active, last_run_at, last_status, last_error, created_at, updated_at
- **`market_data_snapshots`** — id, source_id (fk), snapshot_date (date), payload jsonb (raw normalized response), metrics jsonb (extracted KPIs: total_volume_aed, total_transactions, avg_price_sqft, top_areas, etc.), created_at. Unique on `(source_id, snapshot_date)`.
- **`market_data_runs`** — id, source_id, started_at, finished_at, status (`success|partial|error`), rows_ingested, error_text. Operational log.

RLS: existing market-intel rule — admin/owner only on all three tables. GRANTs: `authenticated` SELECT (filtered by `has_role`); `service_role` ALL. No anon access.

### Edge functions

- **`ingest-dld`** — pulls from DLD open-data endpoints (configurable per source row), normalizes to common `metrics` shape, upserts into `market_data_snapshots`, writes `market_data_runs`. Tolerates missing/changed fields (logs partial, never throws).
- **`ingest-dxb-interact`** — Firecrawl scrape of public dashboards (no API), JSON-schema extraction → same upsert path.
- **`ingest-rera`** — same pattern; scrape when no API.
- **`ingest-property-monitor`** — requires API key (deferred until user adds `PROPERTY_MONITOR_API_KEY` secret; function exists and returns a clear "secret missing" status until then).
- **`ingest-market-data-all`** — orchestrator; loops active sources, calls each child function, aggregates run log. This is the cron target.

All ingestion functions: `verify_jwt = false` (cron-callable), but require `INTERNAL_INGEST_SECRET` header to prevent random invocation. Owner UI calls them with the same header from the server side.

### Scheduling

`pg_cron` + `pg_net` (enabled if not already), daily at 03:00 UTC (07:00 Dubai), invokes `ingest-market-data-all`. Scheduling SQL goes through `supabase--insert` (not migration) because it embeds the project URL + anon key.

### Admin UI — `/owner/market-intel` (extends existing if present)

- **Sources panel**: list of 4 sources with status pill (success/partial/error), last_run_at, "Run now" button (owner-only).
- **Runs log**: last 50 `market_data_runs` rows, expandable to show error text.
- **Latest snapshot preview**: per source, today's metrics rendered as IconTile KPI cards (Emerald/Red/Blue/Amber semantic tones per the data-viz standard).

Public-facing market intel pages already exist and read from existing tables — they continue to work; new snapshots can power them in a follow-up once the data shape is validated.

### Tests

- Deno tests per ingestion function with mocked upstream responses: normalization correctness, dedupe on `(source_id, snapshot_date)`, partial-failure recorded as `partial` not `error`.
- Deno test for `ingest-market-data-all` orchestrator: one child fails, others succeed → run log shows mixed statuses, function still returns 200.

---

## Build order

Both proceed in parallel since tables and functions are independent:

1. Migration #1 — `news_*` tables + RLS + GRANTs.
2. Migration #2 — `market_data_*` tables + RLS + GRANTs, enable `pg_cron` + `pg_net`.
3. Edge functions (deploy in one batch): `news-extract-from-link`, `news-article-mutate`, `news-ingest-rss`, `ingest-dld`, `ingest-dxb-interact`, `ingest-rera`, `ingest-property-monitor`, `ingest-market-data-all`.
4. Secrets check: prompt for `INTERNAL_INGEST_SECRET`, `FIRECRAWL_API_KEY` (already linked if connector active), `PROPERTY_MONITOR_API_KEY` (optional — function degrades gracefully).
5. Schedule cron via `supabase--insert`.
6. Admin UI: `/owner/news` and `/owner/market-intel` (extend if exists), wired to the new functions.
7. Tests: run Deno test suite for all new functions; vitest for the two admin pages.
8. Smoke check: invoke `ingest-market-data-all` manually once, confirm `market_data_runs` populated; invoke `news-extract-from-link` with a sample URL, confirm draft returns.

## Technical notes

- All owner mutations write `admin_edit_log` rows (existing project standard) in addition to `news_article_revisions`.
- All scraping respects the competitor-source-exclusion rule (public-facing strips competitor names; internal admin views keep them for attribution).
- News article body rendered through `contentSanitizer.ts` (raw-HTML rule).
- No fake placeholder content — if extraction fails, draft is created empty with the source URL only, flagged for manual completion.
- Champagne-dominant UI everywhere; KPI tiles via `<IconTile />` with semantic data-viz tones; no gray surfaces; section separation via band-tone alternation only.

## Out of scope (follow-ups)

- Public `/news` index + `/news/:slug` reader page (current plan ships admin + ingestion only).
- Charting historical market snapshots (current plan ships ingestion + latest-snapshot KPIs only).
- AI summarization of news bodies beyond what link-extract returns.
