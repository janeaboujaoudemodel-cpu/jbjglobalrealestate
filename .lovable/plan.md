# Backfill real handover dates for all projects

## Current state
- 2,778 total projects, **1,330 missing `handover_date`** (1,056 of them are published).
- Only ~36 are recoverable from existing text fields via regex.
- 1,329 of the missing rows have a `source_url`; 1,053 have a `developer_name`.
- 175 rows have `construction_status` indicating Ready/Completed but no handover.

So a regex-only pass is not enough. We need a 3-stage backfill that always writes a real, sourced value.

## Goal
Eliminate all "Coming soon" / TBA fallbacks on cards by populating `handover_date` (+ mirror to `expected_completion`) for every project, using **only verified signals** — never invented dates.

## Stages (run in order, idempotent, batched)

### Stage 1 — Local regex sweep (fast, free)
Sweep all rows where `handover_date IS NULL`. For each row, scan `description`, `payment_plan`, `payment_breakdown`, `status_label`, `construction_status`:
1. `Q[1-4] YYYY` → `Q# YYYY`
2. Earliest future bare year `20YY` (≥ current year) → `YYYY`
3. If `construction_status` matches `ready|complet|handed.?over` → `"Ready"`

Writes `handover_date` and `expected_completion`. Expected to fix ~36 + ~175 Ready rows.

### Stage 2 — Source-URL scrape via Firecrawl (real data)
For remaining missing rows that have `source_url`:
- New edge function `backfill-handover-dates` (batched, 20 rows / call).
- For each project, call Firecrawl `/v2/scrape` with `formats: ['markdown', { type: 'json', prompt: '...handover/completion date...', schema: { handover_date: string|null, status: 'Ready'|'Under Construction'|'Presale'|null } }]` against `source_url`.
- Accept only values matching `^(Q[1-4] 20\d{2}|20\d{2}|Ready)$`. Reject anything else (no invention).
- Persist on success; on failure leave row for Stage 3.

### Stage 3 — AI inference fallback (Lovable AI Gateway)
For rows still missing after Stage 2 but with `name` + `developer_name`:
- Reuse pattern from `ai-enrich-drafts` but `model: google/gemini-2.5-pro` with explicit instruction: "Return null unless you are confident this is a real, verifiable Dubai/UAE project handover quarter or year." Strict regex validation on output before persist.

### Orchestration
- New edge function `backfill-handover-dates` exposes `POST` with body `{ stage: 1|2|3, batch_size, dry_run }`.
- Owner-only (uses `requireOwnerAuth`).
- Returns `{ updated, skipped, failed, details[] }`.
- Run sequentially from a small admin trigger button on the existing **Provident Portal** enrichment hub (no new page). Button: "Backfill Handover Dates" with progress toast; loops calling stage 1 → 2 → 3 until `updated === 0` per stage.

## Validation rules (applied at every stage before write)
- Allow: `^Q[1-4] 20\d{2}$`, `^20\d{2}$`, `^Ready$`.
- Reject: empty, "TBA", "To be announced", "soon", anything outside the regex.
- Always mirror value into `expected_completion`.
- Never overwrite an existing non-null `handover_date`.

## Files

### New
- `supabase/functions/backfill-handover-dates/index.ts` — orchestrator (3 stages, owner-auth, batched).

### Edited
- `src/pages/ProvidentPortal.tsx` (or the enrichment hub it renders) — add "Backfill Handover Dates" admin button that loops the function and shows progress.
- `src/utils/handoverDerivation.ts` — extend `deriveHandover` to also recognize Ready/Completed `construction_status` (kept in sync with Stage 1 logic so cards render consistently between renders and DB writes).

### Secrets
- Requires `FIRECRAWL_API_KEY` (Firecrawl connector) and `LOVABLE_API_KEY` (already present).
- If Firecrawl is not connected, Stage 2 is skipped and we proceed to Stage 3.

## Expected outcome
- Stage 1: ~210 rows fixed instantly.
- Stage 2: bulk of the remaining ~1,120 rows fixed from real developer pages.
- Stage 3: long-tail (~50-150) inferred only when AI is confident; rest stay "Coming soon" rather than fabricated.

## Out of scope
- No schema changes (columns already exist).
- No card UI changes — premium orange handover label already shipped.
