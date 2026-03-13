

## Plan: Full Extraction Pipeline from External Source + Model Upgrades + Deploy All Functions

### Current State

1. **`daily-provident-auto-sync`** — DISABLED (returns "permanently disabled")
2. **`daily-auto-extraction`** — Only processes `pending_project_imports` with missing fields; does NOT scrape source pages
3. **`provident-full-sync`** — Full 4-step pipeline (developers → projects → detail → orchestrate) using Firecrawl + AI. Uses `gemini-2.5-flash`. Works but is never called automatically
4. **`provident-scrape-project`** — Deep single-project scraper (images, videos, PDFs, amenities). Uses `gemini-2.5-flash`
5. **`batch-extract-pending`** — Processes pending imports using shared Provident extractors
6. **`generate-listing`** — Listing portal extraction engine. Already uses `gemini-2.5-pro` for extraction
7. **65 edge functions** reference AI models — most use `gemini-2.5-flash`, some use `gemini-2.5-pro`

### What Needs to Happen

#### 1. Re-enable & Upgrade Daily Auto-Sync (Phase B Core)

**File: `supabase/functions/daily-provident-auto-sync/index.ts`**
- Remove the "DISABLED" stub
- Implement a complete daily sync pipeline that:
  1. Calls `provident-full-sync` with `step: "full_sync"` to discover and scrape all developers + projects
  2. For each newly discovered/updated project, calls `provident-scrape-project` for deep detail extraction (all images, PDFs, floor plans, videos, amenities, prices, handover, sizes)
  3. Upserts directly into `projects` table (NOT `pending_project_imports`) — these are **mirrored listings**, not drafts
  4. Sets `is_published: true`, `source: 'provident'` (admin-only field), strips source attribution from all public-facing fields
  5. Logs run results to `extraction_job_logs`
- Upgrade model to `google/gemini-3-flash-preview` for extraction calls
- No "Fix" or "Repair" step — extract completely the first time

#### 2. Upgrade `provident-full-sync` Model

**File: `supabase/functions/provident-full-sync/index.ts`**
- Line 74: Change `gemini-2.5-flash` → `google/gemini-3-flash-preview`
- Replace `serve()` import with `Deno.serve()` pattern (fix potential runtime errors)

#### 3. Upgrade `provident-scrape-project` Model

**File: `supabase/functions/provident-scrape-project/index.ts`**
- Line 188: Change `gemini-2.5-flash` → `google/gemini-3-flash-preview`
- Replace `serve()` import with `Deno.serve()` pattern

#### 4. Upgrade `generate-listing` (Listing Portal Engine)

**File: `supabase/functions/generate-listing/index.ts`**
- Line 360, 390, 453: Already uses `gemini-2.5-pro` — upgrade to `google/gemini-3-flash-preview` for speed, keep `gemini-2.5-pro` as fallback
- Replace `serve()` import with `Deno.serve()` pattern

#### 5. Upgrade `ai-listing-extractor`

**File: `supabase/functions/ai-listing-extractor/index.ts`**
- Replace `serve()` import with `Deno.serve()`
- Upgrade model references

#### 6. Upgrade `batch-extract-pending`

**File: `supabase/functions/batch-extract-pending/index.ts`**
- Replace `serve()` import with `Deno.serve()`

#### 7. Upgrade `daily-auto-extraction` to Chain with Provident Sync

**File: `supabase/functions/daily-auto-extraction/index.ts`**
- After processing pending imports, also trigger `daily-provident-auto-sync` for the full source mirror
- This makes `daily-auto-extraction` the single daily cron entry point

#### 8. Remove "Fix All" / "Repair" Language from Admin UI

**File: `src/components/listing-admin/SyncDashboard.tsx`**
- Change "Extract Missing Data" (formerly "Fix All") to "Run Daily Sync Now" as manual trigger
- Show last sync timestamp and results from `extraction_job_logs`

### Model Upgrade Strategy

| Function | Current Model | New Model |
|----------|--------------|-----------|
| `provident-full-sync` | `gemini-2.5-flash` | `gemini-3-flash-preview` |
| `provident-scrape-project` | `gemini-2.5-flash` | `gemini-3-flash-preview` |
| `generate-listing` | `gemini-2.5-pro` | `gemini-2.5-pro` (keep — already best) |
| `ai-listing-extractor` | implied `gemini-2.5-flash` | `gemini-3-flash-preview` |
| `daily-provident-auto-sync` | N/A (disabled) | `gemini-3-flash-preview` |

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/daily-provident-auto-sync/index.ts` | Rewrite: full sync pipeline with deep extraction |
| `supabase/functions/provident-full-sync/index.ts` | Upgrade model + Deno.serve() |
| `supabase/functions/provident-scrape-project/index.ts` | Upgrade model + Deno.serve() |
| `supabase/functions/generate-listing/index.ts` | Deno.serve() migration |
| `supabase/functions/ai-listing-extractor/index.ts` | Upgrade model + Deno.serve() |
| `supabase/functions/batch-extract-pending/index.ts` | Deno.serve() migration |
| `supabase/functions/daily-auto-extraction/index.ts` | Chain provident sync |
| `src/components/listing-admin/SyncDashboard.tsx` | Remove repair/fix language, add sync status |

