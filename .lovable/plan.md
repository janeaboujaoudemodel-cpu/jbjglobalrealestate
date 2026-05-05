## Goal

Three improvements to the **UAE Brokerage & Developer Directory · Background sync** card on the CRM brokerages tab:

1. Collapse the whole card by default — only the title row and **Refresh now** button stay visible. A chevron toggle reveals the description, three-status grid and recent jobs list.
2. Make **Refresh now** truly idempotent: it must be the *only* action available, and it cannot trigger a second sync while one is already running. Currently the user can click it repeatedly and stack up cron-style runs.
3. Speed up "all the brokerage agencies across the UAE". The runner currently processes one chunk of 12 rows sequentially per HTTP continuation, against 7 emirates, which is why a full sweep takes a long time. We will parallelise the seed runs across emirates and raise the per-chunk concurrency for enrichment.

## Files to change

- `src/components/crm/DirectoryToolsPanel.tsx` — collapse-by-default UI + active-job lockout for the Refresh button.
- `supabase/functions/directory-job-runner/index.ts` — fan out across all 7 emirates on a single `cron` call, and process enrich rows in parallel.

## Detailed changes

### 1. `DirectoryToolsPanel.tsx` — collapsed shell

- Add `const [expanded, setExpanded] = useState(false)`.
- Header row keeps: `Globe2` icon, the short title `UAE Brokerage & Developer Directory`, an `Auto-runs daily` badge, a single live status badge (`Syncing…` while jobs are running, `Up to date` / `Up to date · new data` / `Needs attention` when idle), the **Refresh now** button, and a chevron toggle (`ChevronDown` / `ChevronUp`).
- Remove the long "Each day the system…" paragraph, the three-status grid, and the recent jobs list from the always-visible area. Render them only when `expanded`.
- Lower the polling rate from 5 s to 15 s when collapsed (4 s when expanded) — keeps the page light when nobody is looking.
- **Refresh-now lockout**: compute `anyActive = jobs.some(j => j.status === "running" || j.status === "queued")`. The button is disabled while `refreshing || anyActive` and its label switches to `Running…` so the user can see why. Clicking while active shows a toast `"A background sync is already running."` and is a no-op.
- Tighten card padding from `p-5 space-y-4` to `p-4 space-y-3` so the collapsed state is a slim single-line card.

### 2. `directory-job-runner/index.ts` — faster sync

- **Cron action (`action === "cron"`)** today only enqueues 1 seed job for the day's emirate plus 2 enrich jobs. Replace with: enqueue **one `brokerage_seed` job per emirate (all 7)** + 1 `brokerage_enrich` + 1 `developer_enrich`. This way a single Refresh now sweeps the whole UAE in parallel instead of one emirate per day.
- After insert, call `scheduleNext(j.id)` for every created job (already done in a loop) — they now run concurrently because each chunk lives in its own `EdgeRuntime.waitUntil` task.
- **`runEnrichChunk`** currently awaits `pplxFacts` then `update` for each row sequentially (12 sequential network round-trips). Replace the `for (const r of list)` loop with `Promise.all(list.map(async (r) => { … }))` so all 12 rows are enriched in parallel within one chunk. Keep the existing per-row patch logic and the final `crm_directory_jobs` update.
- Raise `CHUNK_SIZE` from `12` to `24` for enrich jobs (kept at 12 for seed which is bounded by Perplexity list size). The hard cap stays at `30 * CHUNK_SIZE` rows per run.
- Keep all existing safeguards: dedup by `company_name + emirate`, "fill-only never overwrite curated values", `last_verified_at` always stamped, `requireOwnerAuth` for non-cron actions, internal token for `continue`.

### Out of scope / preserved

- No DB schema or RLS changes.
- No removal of features: the description, three-status grid, and recent jobs list still exist — they're just behind the chevron now (No-Removal policy).
- pg_cron schedule, owner attribution, and audit rows untouched.

## Verification

1. Open Owner → CRM → Brokerages. The directory card now shows a single line with the title, "Auto-runs daily" badge, **Refresh now**, and a chevron.
2. Click the chevron → description, three status cards, and recent job list expand.
3. Click **Refresh now** → 7 seed jobs (one per emirate) + 2 enrich jobs are created and start running in parallel. The button instantly switches to "Running…" and is disabled until all jobs reach `completed`/`failed`.
4. Try clicking **Refresh now** again while it says "Running…" — nothing happens, toast says "A background sync is already running."
5. Watch the "Discovering brokerages" job advance much faster than before (Promise.all + parallel emirates).