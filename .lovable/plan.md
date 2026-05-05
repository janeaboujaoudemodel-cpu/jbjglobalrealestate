
# UAE Real Estate Database Engine — System Upgrade

This is a **modify and extend** plan. No new modules, pages, or duplicate tables. Everything below changes existing files only.

## Existing system that will be reused

| Concern | Existing artifact (kept & extended) |
|---|---|
| Brokerage master directory | `public.uae_brk_registry` (currently empty, 0 rows) |
| Developer master directory | `public.uae_dev_registry` (currently empty, 0 rows) |
| Owner CRM brokerage records | `public.crm_brokerages` (377 rows) |
| Owner CRM developer records | `public.crm_developer_registry` (774 rows) |
| Source attribution | `public.uae_registry_sources` |
| Activity log | `public.uae_registry_log` |
| Brokerage UI (list + detail) | `src/pages/owner/uae-registry/UAERegistryListPage.tsx`, `UAERegistryDetailPage.tsx`, `UAERegistryOverview.tsx` |
| CRM Relationships UI | `src/pages/CRMRelationships.tsx` + `src/hooks/useCRMRelationships.ts` |
| Hook layer | `src/hooks/useUAERegistry.ts` |
| Enrichment edge functions | `enrich-uae-brokerage-directory`, `enrich-developer-registry`, `extract-brokerage-contacts` |
| Outreach edge function | `crm-send-brokerage-outreach`, `uae-registry-send` |

**No tables are added.** The UAE registry tables already cover every requested field — they just need a few extra columns and proper dedup constraints.

## Part 1 — Schema additions (single migration)

`uae_brk_registry` — add only what's missing:
- `instagram_url text`
- `office_google_maps_url text` (already have address; add explicit maps link)
- `company_size_estimated text`
- `number_of_brokers integer`
- `specialization text[]`
- `primary_market text`
- `data_source text` (alias view of `uae_registry_sources` first row)
- Normalized dedup columns (generated): `name_norm text generated always as (regexp_replace(lower(unaccent(brand_name)),'\s+|llc|l\.l\.c|real estate|realty|brokers?|properties|group|co\.?|company','','g')) stored`
- Unique constraint: `unique(name_norm)` plus existing license unique
- Btree index on `lower(website)`, `phone digits-only` for fuzzy lookup

Same additions, equivalent fields, on `uae_dev_registry` (it already has most fields — only add `instagram_url`, `name_norm`, indexes).

Add Postgres function `public.find_existing_company(p_kind text, p_name text, p_website text, p_phone text) returns uuid` that returns the existing UAE registry id when:
- exact match on `name_norm`, OR
- same domain on `website`, OR
- same digits-only phone in `main_phone_numbers`.

Triggers `before insert on uae_brk_registry / uae_dev_registry` reject the insert and raise `'DUPLICATE:<existing_id>'` so client/edge code can switch to UPDATE.

## Part 2 — Hook + UI changes (no new pages)

**`src/hooks/useUAERegistry.ts`** — extend `useCreateRecord` to:
1. Call `rpc('find_existing_company', …)` first.
2. If id returned → call `useUpdateRecord` instead, toast "Merged into existing record".
3. Else insert.

Add `useImportRegistryCsv(type)` hook that:
- Accepts `File`.
- Parses with `papaparse` (already in deps; verify with `code--view package.json` at build time, fall back to lightweight parser).
- Maps columns by header (case-insensitive) to schema fields.
- Validates each row with zod (`email`, `httpUrl`, `e164` from `outreachSchema`).
- Per row: dedup check → upsert.
- Returns `{ inserted, updated, rejected: [{row, reason}] }`.

**`src/pages/owner/uae-registry/UAERegistryListPage.tsx`** — additions only:
- New "Import CSV/Excel" button → opens existing dialog component pattern (`CRMImportModalV3` is reused as base, wrapped for registry).
- New columns visible: phone (click-to-call `tel:`), email (click-to-email `mailto:`), website (target=_blank), instagram, linkedin, google maps, verification status badge, last_verified_date.
- Smart actions row: 📞 / ✉️ / 💬 (WhatsApp `https://wa.me/<digits>`).
- Server-side pagination (25/50/100) and debounced search across `brand_name`, `legal_company_name`, `phone`, `email` to handle 2000+ rows without lag.

**`src/pages/owner/uae-registry/UAERegistryDetailPage.tsx`** — additions only:
- Show full field set (instagram, maps link, size, broker count, specialization, primary_market, source URL list from `uae_registry_sources`).
- "Re-enrich from website" button → invokes existing `enrich-uae-brokerage-directory` / `enrich-developer-registry` edge function for the single record.

**`src/pages/CRMRelationships.tsx`** — additions only:
- Status enum already supports outreach stages; surface the 5 required statuses (`Not Contacted`, `Contacted`, `Follow-up`, `Registered`, `Rejected`) as quick filters mapped onto existing `outreach_stage` values (`not_contacted`, `engaged`, `attempted`, `active_partner`, `declined`).
- Add "Open in UAE Registry" link on each brokerage/developer card, jumping to the existing registry detail page.

## Part 3 — Edge function changes (extend existing only)

**`enrich-uae-brokerage-directory`** + **`enrich-developer-registry`**:
- Strict rule enforcement: only fetch the official `website` of the record. No third-party scraping, no guessing.
- Use existing `firecrawl` connector pattern (scrape → extract `phone`, `email`, `address`, `linkedin`, `instagram` from page DOM/markdown).
- For each extracted value, write a row to `uae_registry_sources` with `source_url = website`, `fields_verified = […]`.
- Never overwrite a non-null field that has a different verified source unless `force=true`.
- If a field is not on the website → leave NULL.

**`crm-send-brokerage-outreach`** — already brand-correct from prior turn; no change here, only ensure it reads from the upgraded `uae_brk_registry` so a single outreach updates `last_outreach_at`, `outreach_count`, and `outreach_status` on the master record (no duplicate write to `crm_brokerages`).

## Part 4 — Duplication control (zero tolerance)

Three layers:
1. **DB**: unique index on `name_norm`, unique on `license_number`, unique partial on lower(website domain). Trigger raises `DUPLICATE:<id>` so callers always know to update.
2. **Edge functions**: every insert path (`uae-registry-send`, enrichment functions, CSV importer edge handler) calls `find_existing_company` before insert.
3. **Client**: `useCreateRecord` and the CSV importer hook short-circuit to update on duplicate.

`crm_brokerages` (377) and `crm_developer_registry` (774) stay as **owner-scoped CRM overlays** linked by FK to the registry master via existing columns (`match_directory_id`, `uae_developer_id`). A backfill SQL pass (one-time, in the same migration) will:
- Insert missing master rows from CRM tables into `uae_brk_registry` / `uae_dev_registry` using the same dedup function.
- Populate `match_directory_id` / `uae_developer_id` on the CRM rows.

Result: one master record per real-world company, CRM rows reference it, no duplicates anywhere.

## Part 5 — Performance

- All filter/search columns indexed (`emirate_section`, `outreach_status`, `name_norm`, lower(website)).
- List pages move from "fetch all" to range-paginated queries (`.range(from, to)` with `count: 'exact'`).
- React Query keyed by `(type, emirate, search, page)`.

## Files that will be edited

- `supabase/migrations/<new>.sql` (single migration: columns + indexes + trigger + function + backfill)
- `src/hooks/useUAERegistry.ts`
- `src/pages/owner/uae-registry/UAERegistryListPage.tsx`
- `src/pages/owner/uae-registry/UAERegistryDetailPage.tsx`
- `src/pages/CRMRelationships.tsx`
- `src/hooks/useCRMRelationships.ts` (add registry link helpers only)
- `supabase/functions/enrich-uae-brokerage-directory/index.ts`
- `supabase/functions/enrich-developer-registry/index.ts`
- `supabase/functions/crm-send-brokerage-outreach/index.ts` (master-record write only)

No new files, no new tables, no new pages.

## Out of scope (intentionally)

- Any new dashboard, admin page, or "v2" module.
- Any web scraping beyond the official company website.
- Any change to brokerage email templates (already finalized in previous turn).

Approve to switch to build mode and execute the migration + edits above.
