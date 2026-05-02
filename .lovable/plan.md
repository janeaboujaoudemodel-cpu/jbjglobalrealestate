# Fix Real Handover Dates for All Projects

## Diagnosis (from production data)

| Bucket | Count | Status |
|---|---|---|
| Total projects | 2,778 | — |
| Reelly-sourced (`reelly_id IS NOT NULL`) | 1,237 | 1,236 already have a real handover from Reelly. Only **1** missing. |
| `handover_date = 'Q4 2026'` (suspicious bulk default) | 563 | **561 are non-Reelly** — clearly a placeholder fill, not a real date. |
| `handover_date IS NULL` | 376 | All 376 still have a `source_url`, 99 also have `developer_name`. |

Two real problems:
1. **561 non-Reelly rows are stamped `Q4 2026`** — a fake bulk default that the cards display as a "real" date. Worse than NULL.
2. **376 NULL rows** never got resolved.

The existing `supabase/functions/backfill-handover-dates/` already has Stage 2 (Firecrawl scrape of `source_url`) and Stage 3 (Lovable AI inference from developer + name) — but it only runs against `handover_date IS NULL` and skips the `Q4 2026` bulk default. And `supabase/functions/reelly-backfill-details/` writes amenities/floor plans but never writes `handover_date`/`expected_completion` from Reelly's `completion_datetime` / `construction_end_date` / `completion_date` fields.

## Plan

### 1. Patch `supabase/functions/reelly-backfill-details/index.ts` — write Reelly's real handover

After the existing Reelly detail fetch, add normalization + persistence:

```text
if detail.completion_datetime || detail.completion_date || detail.construction_end_date:
   raw = first non-empty of those three
   normalized = normalizeHandover(raw)  // shared util — Q1-4 YYYY | YYYY | "Ready" | null
   if normalized:
       updateData.handover_date = normalized
       updateData.expected_completion = normalized
```

This is the source of truth for the 1,237 Reelly projects and any future Reelly imports. (Today only 1 of them is missing, but this closes the loop and protects future imports.)

### 2. Add an "owner-only" admin endpoint to clear the `Q4 2026` bulk default

New edge function `supabase/functions/clear-fake-handover-defaults/index.ts`:

- Owner-auth gated.
- Sets `handover_date = NULL` and `expected_completion = NULL` for every row where:
  - `handover_date = 'Q4 2026'` AND
  - `reelly_id IS NULL` AND
  - `expected_completion` is also `'Q4 2026'` or NULL (extra safety so we don't blow away a hand-curated date).
- Returns the affected count.

This converts the 561 fakes into honest NULLs so the cards show "Coming soon" instead of misinforming buyers — and so the existing backfill engine will pick them up.

### 3. Run the existing two-stage backfill against the now-NULL rows

Once Step 2 is done, ~561 + 376 ≈ ~937 rows are NULL. Trigger the existing pipeline:

- **Stage 2 (Firecrawl)** — all 937 have a `source_url`. Batches of 50.
- **Stage 3 (Lovable AI)** — for any remaining stragglers that have `developer_name` (gemini-2.5-pro, temperature 0, returns `null` when not confident; never invents dates).

No schema or UI changes needed — `backfill-handover-dates` already exists and is owner-gated; the Provident Portal already has a UI for triggering it. The only code change here is wiring up Reelly persistence (Step 1) and adding the placeholder-clearing function (Step 2).

### 4. Add a small one-off owner UI tile (optional but recommended)

In the existing Provident Portal admin page, add a "Run handover repair" panel with three buttons:
- **Clear Q4 2026 placeholders** → calls the new function from Step 2.
- **Stage 2 — Firecrawl batch** → existing `backfill-handover-dates` with `{ stage: 2, batch_size: 50 }`.
- **Stage 3 — AI batch** → existing `backfill-handover-dates` with `{ stage: 3, batch_size: 50 }`.

Each button shows the live "remaining" count returned by the function so you can rerun until 0.

## Out of scope

- No changes to the property/project card UI — `deriveHandover` and the "Coming soon" fallback already handle every state correctly.
- No mass writes against Reelly projects (their data is already correct).
- No writes that fabricate dates. Every value persisted must come from Reelly, the project's own scraped page, or a confidence-gated AI inference that is allowed to return `null`.
- No changes to `daily-reelly-auto-sync` schedules.

## Acceptance

- After Step 1 + Reelly re-run: any future Reelly import auto-fills handover.
- After Step 2: zero non-Reelly rows are stamped `Q4 2026` unless that's their genuine value (which we cannot prove, so they fall back to NULL → "Coming soon").
- After Step 3 batches drain: `count(*) WHERE handover_date IS NULL` trends toward 0; whatever remains has no verifiable source and correctly renders as "Coming soon" rather than a fake date.
