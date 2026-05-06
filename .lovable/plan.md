
## Overview

Three connected pieces:

1. **Import** the 10,078 rows from `Broker_Offices.xls` into the brokerage CRM, with strict de-duplication against the existing 504 records.
2. **Auto-enrich** missing fields (website, phone, email, address, Instagram, logo) by Google-searching the agency name + RERA office number.
3. **Configurable export builder** for Brokerages and Developers that always reflects live data and lets you pick fields to include/exclude per export (e.g. with/without admin number, with/without broker numbers).

---

## 1. Import — DLD Broker Offices (10,078 rows)

The uploaded file is the official DLD broker register. Columns: `Office Number, Name English, Name Arabic, Website, Phone, Email`.

**Schema additions** (`crm_brokerages`):
- `dld_office_number` (text, unique index) — official DLD/RERA office number, the canonical dedupe key
- `name_arabic` (text)
- `enrichment_status` ('pending' | 'enriched' | 'failed' | 'skipped'), `enrichment_attempts` (int), `enrichment_last_run_at`

**Dedupe strategy** (in order):
1. Match on `dld_office_number` (most reliable).
2. Match on normalised `company_name` (uppercase, strip `L.L.C / LLC / BR / (BRANCH)`, punctuation collapsed).
3. Match on normalised primary `email` domain.

Only rows that match none of the above are inserted as new. Existing rows get backfilled with `dld_office_number` and `name_arabic` if missing — never overwriting curated fields (status, notes, contacts, etc.).

**How**: a one-shot edge function `crm-import-dld-brokerages` that accepts the parsed JSON (we'll send the parsed rows from the file), processes in batches of 500 with a server-side normalize/match/insert, and returns a report: `{ inserted, updated, duplicates_skipped, sample }`.

After completion you'll get a summary toast like *"Inserted 9,612 new agencies, updated 287 existing, skipped 179 duplicates"*.

---

## 2. Google enrichment for missing fields

A scheduled edge function `crm-enrich-brokerage-from-google` runs in the background and processes any brokerage where website/phone/email/address is empty.

For each agency:
- Search Google for `"<Company name>" Dubai real estate broker` (Firecrawl Search, already configured).
- Scrape the top result + the agency's own site if found.
- Use Lovable AI (`google/gemini-3-flash-preview`) to extract: website, primary phone, public email, Instagram URL, office address, logo URL.
- Only fills fields that are currently empty — never overwrites your data.
- Marks `enrichment_status = enriched/failed`, increments `enrichment_attempts`, capped at 3 retries.

Triggered automatically after import for every new row, plus a manual **"Enrich missing fields"** button on the Relationships page that processes the visible filtered list.

Throttled to 5 concurrent Firecrawl calls + 1 s spacing to stay within credits.

---

## 3. Configurable export builder (Brokerages + Developers)

Replace the current single "Export" dropdown with an **Export configurator dialog**:

```text
┌─────────────────── Export agencies ──────────────────┐
│ Format:  ◉ Excel (.xlsx)  ○ CSV  ○ PDF              │
│                                                      │
│ Scope:   ◉ Visible filtered (e.g. 312)               │
│          ○ Selected rows (12)                        │
│          ○ Entire database (10,304)                  │
│                                                      │
│ Columns:                                             │
│  ☑ Agency name        ☑ DLD office #   ☑ Emirate    │
│  ☑ Website            ☑ Phone          ☑ Email      │
│  ☑ Instagram          ☑ Office address              │
│  ☐ Admin contact name ☐ Admin phone   ☐ Admin email│
│  ☐ Broker contact name☐ Broker phone  ☐ Broker email│
│  ☑ Agency status      ☑ Outreach status             │
│  ☑ Last message       ☑ Next follow-up              │
│  ☑ Attempts ☑ Deals  ☑ Agents  ☑ Active brokers    │
│  ☐ Internal notes     ☐ AI summary                  │
│                                                      │
│ Presets:  [Public sheet] [Internal full]            │
│           [Without broker contacts]                  │
│           [Without admin contacts]                   │
│                                                      │
│                          [Cancel]   [Download]       │
└──────────────────────────────────────────────────────┘
```

Behaviour:
- **Always live** — reads directly from the current React Query cache (which is the freshest DB read), so any status / contact / note change you made is in the file.
- **Column toggles** drive both the headers and which keys are included; status colouring in xlsx still applies to whichever status columns are kept.
- **Presets** save to `localStorage` per user (`Public sheet`, `Internal full`, `Without broker contacts` are seeded).
- Same configurator wired into the **Developers** tab — column list adapts (no broker/admin contacts; instead developer license, project count, registration status, etc.).

Files touched:
- `src/components/crm/ExportConfigurator.tsx` *(new)* — dialog + column model.
- `src/utils/exportBrokerages.ts` — accept dynamic `columns: ColumnKey[]` + scope hook.
- `src/utils/exportDevelopers.ts` — same dynamic-columns refactor.
- `src/pages/CRMRelationships.tsx` — replace `ExportMenu` with `ExportConfigurator`, pass `selectedIds` for "Selected rows" scope.

---

## Technical details

**Migration** (SQL):
```sql
ALTER TABLE crm_brokerages
  ADD COLUMN IF NOT EXISTS dld_office_number text,
  ADD COLUMN IF NOT EXISTS name_arabic text,
  ADD COLUMN IF NOT EXISTS enrichment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS enrichment_attempts int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enrichment_last_run_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS crm_brokerages_dld_office_number_key
  ON crm_brokerages (dld_office_number) WHERE dld_office_number IS NOT NULL;
```

**Import flow**: parse the .xls in the browser (HTML table parser), POST 500-row chunks to `crm-import-dld-brokerages`. Server normalizes, dedupes, upserts.

**Enrichment**: uses the existing Firecrawl connection + Lovable AI — no new credentials. If Firecrawl credits run low we'll fall back to website-only scraping for rows that already have a website.

**Exports**: column selection lives on the client; the xlsx writer (ExcelJS) loops over the chosen `columns[]` array, preserving banded rows + status fill. PDF & CSV use the same array.

---

## Out of scope

- Editing the DLD register itself (we treat it as the source of record for `dld_office_number` only).
- Bulk-emailing the 10k agencies — your existing Bulk Send flow already handles that with its own warnings/limits.
- Adding new contact fields (admin/broker phone columns already exist; we're only making them optional in the export).

After approval I'll execute in this order: migration → import edge function + run → enrichment edge function (kicks off in background) → export configurator UI.
