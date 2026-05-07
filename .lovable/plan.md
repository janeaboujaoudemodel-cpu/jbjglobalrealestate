## Goal

Upgrade `BrokerBulkUploadDialog` so when multiple databases are uploaded at once, **each file** gets its own:

1. **Editable database name** — auto-synced from filename (without extension), with a clear (✕) button and free-text edit.
2. **Category / specialty** — Leasing / Sales / Leasing+Sales / Other (custom).
3. **Source name** + **Source type** (e.g. "DLD Export", "Bayut scrape", "Manual list", Other).

The per-file selections must persist all the way to the registry so the **chosen labels appear on broker cards and in the Excel grid view** — not just the global batch-level label that's currently used.

---

## What changes

### 1. Upload dialog (`src/components/crm/BrokerBulkUploadDialog.tsx`)

Replace the single global "Specialty / Source" block with a **per-file metadata card** rendered for every uploaded file:

```text
┌─────────────────────────────────────────────────┐
│ 📄 Database name: [DLD Leasing May 2026  ] [✕] │  ← editable, prefilled from filename
│    Original file: dld_leasing_may2026.xlsx       │
│    Rows: 12,430                                  │
│ ─────────────────────────────────────────────── │
│ Category:   [ Leasing ▾ ]  (Sales / Both / Other)│
│ Source name:[ DLD Export        ]                │
│ Source type:[ Government ▾ ]                     │
│ Notes:      [ ............... ]                  │
└─────────────────────────────────────────────────┘
```

Behaviour:
- On file add: `displayName` defaults to `file.name` minus extension. Editable via input. Clear (✕) wipes the field; if empty on submit, fall back to the original filename.
- "Apply to all" quick action at the top so the user can copy the first card's category/source to every other file in one click (helpful for the common case).
- Validation: each file must have a category; "Other" requires a custom label.

State shape becomes:
```ts
interface ParsedFile {
  file: File;
  rows: Record<string, any>[];
  meta: {
    displayName: string;
    specialty: Specialty;
    customLabel: string;
    sourceName: string;
    sourceType: string;
    notes: string;
  };
}
```

### 2. Batch + row pipeline

- Create **one `crm_import_batches` row per uploaded file** (instead of one batch for the whole upload session). Each batch carries that file's `label` (= displayName), `specialty_label`, `specialty_custom_label`, `source_name`, `source_type`, `notes`, `source_filename`.
- Group `allRows` by file; dispatch each file's rows to the existing fast-mode/slow-mode pipeline using its own `batch_id`.
- Pass per-row `specialty_label` + `custom_label` + `source_name` through the request body so the edge function applies the *file's* label, not a batch default.

### 3. Edge functions

- `crm-broker-bulk-import` and `crm-broker-import-finalize`: accept `specialty_label`, `specialty_custom_label`, `source_name`, `source_type`, `display_name` in the request body (still per-batch, since we now create one batch per file). Apply these to:
  - `crm_brokerage_agents.specialty_labels` (append, dedup) — same as today, but using per-file label.
  - `crm_brokerage_agents.import_label` (set on insert; append-on-merge string list).
  - `crm_brokerage_agents.source_history` JSONB — append `{ batch_id, display_name, source_name, source_type, specialty, at }` so each broker carries the trail of every database they came from.
- No DB migration needed — `crm_import_batches` and `crm_brokerage_agents` already have these columns (verified above: `specialty_label`, `specialty_custom_label`, `source_name`, `source_type`, `specialty_labels`, `import_label`, `source_history`, `source_batch_ids`).

### 4. Display in cards + grid (`src/components/crm/IndividualBrokersTab.tsx`)

Already reads `specialty_labels` and `source_history`. Two small visual upgrades:
- **Cards**: render the chip row from `specialty_labels` (already done) and add a small muted "From: <displayName>" line sourced from the most recent `source_history` entry.
- **Excel grid view**: ensure the columns `Category` (joined `specialty_labels`) and `Source database` (latest `source_history.display_name` or the batch label via `source_batch_ids` join) are visible and sortable. Add a quick `Source database` filter chip row above the grid using the distinct values from `crm_import_batches.label`.

### 5. Source-database history panel

The existing "Database history" / batches list keeps working unchanged — it now just shows one row per uploaded file (with displayName, category, source, row count, inserted/merged counts), which is exactly what the user wants.

---

## Out of scope (kept as-is)

- Dedup engine, fast-mode parallel import, review panel, AI clean — all unchanged.
- Brokerage-level upload (this prompt is about the **individual brokers** registry).
- No schema migration.

---

## Files to edit

- `src/components/crm/BrokerBulkUploadDialog.tsx` — per-file meta cards, "Apply to all", batch-per-file dispatch, editable/clearable name.
- `supabase/functions/crm-broker-bulk-import/index.ts` — accept and apply per-batch specialty/source, write `source_history`.
- `supabase/functions/crm-broker-import-finalize/index.ts` — same.
- `src/components/crm/IndividualBrokersTab.tsx` — show "From: <db name>" on cards; ensure `Category` + `Source database` columns + filter chips in the grid.

No new files, no migrations.
