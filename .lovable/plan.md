# JBJ Hub — DLD Sync, Filters & Exports (Locked Spec)

## 1. DLD-style filter dropdown (all 3 tabs)

Match DLD's exact classification, labels and order:
- All
- Sale
- Lease
- Mortgage
- Offices *(brokerages tab only)*
- Nationals
- Group A
- By Project
- By Area

Each option filters the visible list. "By Project" and "By Area" open a searchable sub-picker (project name / area name pulled from DLD data). The dropdown UI mirrors the emerald + white style already used elsewhere in the Hub — no gold, no blue.

## 2. Search bar (per DLD)

Single search box: broker name / office / mobile / area / license no. — matches on any field, live filter.

## 3. Export (all 3 tabs, always visible)

Button next to the DLD filter dropdown → CSV + XLSX. Exports **the currently filtered view** with DLD's column set:
- **Brokers:** Broker No., Name (EN/AR), Office, Mobile, Email, Category, Area, License Expiry
- **Brokerages:** Office No., Name (EN/AR), Manager, Phone, Email, Area, License Expiry
- **Developers:** Developer No., Name (EN/AR), License No., Phone, Email, Status

XLSX uses the existing premium branded exporter (`exportPremiumXlsx`).

## 4. Daily DLD scrape (Firecrawl, B2)

Cron: `03:00 GST` daily via `pg_cron` → dispatcher edge function → three scrapers:
1. `scrape-dld-developers` → `https://dubailand.gov.ae/en/eservices/approved-real-estate-developers/approved-developers/#/`
2. `scrape-dld-brokerages` → `https://dubailand.gov.ae/en/eservices/licensed-real-estate-brokers-offices/licensed-real-estate-brokers-offices-list/#/`
3. `scrape-dld-brokers` → `https://dubailand.gov.ae/en/eservices/licensed-real-estate-brokers/licensed-real-estate-brokers-list/#/`

Each scraper:
- Firecrawl `/scrape` with `formats: ['html','screenshot']`, wait for table render, paginate.
- Parse rows into a typed staging table (`dld_scrape_staging_<segment>`).
- Store the screenshot in `dld_daily_sync_runs` for your visual audit.

## 5. Dedup-safe ingestion (never overwrite)

For each staged row, compare to the live table by normalized keys:
- **Exact match** (same name + same email + same phone, all normalized) → skip.
- **Partial match** (same name + same email, phone differs) OR (same name + same phone, email differs) → insert into `dld_scrape_conflicts` for your review. **No auto-update.**
- **No match** → insert as new record with `source='dld_daily'`, `first_seen_at=now()`.

Existing DB rows are **never overwritten**.

## 6. Conflict review UI

New section on the Hub: "DLD Conflicts (needs your review)" — shows each flagged row with the live record + the DLD value side-by-side, with Approve / Reject buttons. Approve → updates live record. Reject → dismisses.

## 7. Visual proof

Every nightly run writes: rows scanned, new inserted, conflicts flagged, duplicates skipped, plus the source screenshot URL — visible in the Hub sync card.

---

## Build order (single pass)

1. Migration: `dld_scrape_staging_developers`, `dld_scrape_staging_brokerages`, `dld_scrape_staging_brokers`, `dld_scrape_conflicts` (+ grants, RLS, indexes on normalized keys).
2. Edge functions: `scrape-dld-developers`, `scrape-dld-brokerages`, `scrape-dld-brokers`, `dld-daily-dispatcher`, `dld-ingest-and-dedupe`.
3. `pg_cron` schedule row.
4. Shared component `DLDFilterDropdown.tsx` (9-option DLD-style menu + area/project sub-picker).
5. Shared component `DLDExportButton.tsx` (CSV + XLSX, filtered view).
6. Wire filter + export into Brokers, Brokerages, Developers tabs in `RelationshipsHub.tsx`.
7. `DLDConflictsSection.tsx` in the Hub.
8. Verify: run each scraper manually once, check screenshot + counts, confirm no live rows were mutated.

## Technical notes

- Firecrawl connection is **gateway-backed** — use `LOVABLE_API_KEY` + `X-Connection-Api-Key: FIRECRAWL_API_KEY` against `connector-gateway.lovable.dev/firecrawl/v2`.
- Normalization reuses `src/lib/crm/brokerNormalize.ts` (`normalizeEmail`, `normalizePhone`, `normalizeName`).
- Cron uses `pg_cron` + `pg_net` per project standard.
- No changes to any existing broker/brokerage/developer rows are performed by the daily sync — insert-only + conflict flagging.
