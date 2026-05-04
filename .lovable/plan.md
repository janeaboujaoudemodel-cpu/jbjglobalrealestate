
## Goal

You should never click anything to "sync" or "enrich batch of 5". When you open
**Relationships → Brokerages** (and **Developers**), the table is already
fully populated for every emirate with: company name, office address +
Google-Maps link, phone (clickable `tel:`), email (clickable `mailto:`),
website (clickable), Instagram (clickable), logo, and any other available
public info. The system keeps itself fresh in the background.

## Why it fails today

1. `seed-uae-brokerage-directory` runs Perplexity calls **inside the HTTP
   request** for every emirate. Last run took **110 seconds** server-side →
   the client/proxy aborts → toast says "returned edge function" even though
   the function actually finished with HTTP 200.
2. `Sync` / `Enrich batch of 5` buttons are manual, slow, and limited to 5
   rows per click — that's why the table shows partial data (182 brokerages
   total, only ~60 with website/email).
3. Disabled-state styling on those buttons isn't defined, so they fade and
   look broken while loading.

## What I'll change

### 1. Convert seed + enrich into a real background job (fire-and-forget)

New table `crm_directory_jobs` (job_id, kind, emirate, status, progress,
counts, started_at, finished_at, error). New edge functions:

- `directory-job-start` — owner-only, JWT-validated. Inserts a `queued` job
  row, kicks off processing via `EdgeRuntime.waitUntil(...)` so the HTTP
  response returns in <1s. Returns `{ jobId }`.
- `directory-job-status` — returns the current row for a `jobId` (used for
  the progress bar in the UI).
- `directory-job-worker` — does the actual Perplexity + enrichment work in
  small chunks (1 emirate × 25 firms per loop), updates `progress`,
  resumable. Pre-existing curated rows are never overwritten — only blanks
  are filled. Each loop iteration: fetch, dedupe, upsert, bump `progress`,
  and either continue or schedule the next iteration via
  `directory-job-worker?continue=<jobId>` so we never hit the wall-clock
  limit.

Same pattern reused for the developer registry (one job per kind:
`brokerage_seed`, `brokerage_enrich`, `developer_enrich`).

### 2. Auto-run via pg_cron (no buttons needed)

Schedule (Asia/Dubai):

- Every day 02:00 → `directory-job-start` with `kind=brokerage_seed`,
  rotating through all 7 emirates over 7 days (1 emirate per night ≈ a
  few hundred firms).
- Every day 03:00 → `directory-job-start` with `kind=brokerage_enrich`
  (fills missing phone / email / website / IG / logo / office_address /
  google maps URL on rows where any of those is null).
- Every day 03:30 → `directory-job-start` with `kind=developer_enrich`
  (same idea on `crm_developer_registry`).

Also: trigger one `brokerage_seed` and one `*_enrich` job **immediately on
deploy** so you don't have to wait until tomorrow.

### 3. Backfill what's missing right now

Worker fields it now writes when blank:
- `phone` (E.164, normalized)
- `email`
- `website` (https-normalized)
- `instagram_url` (NEW: queried explicitly from official handle)
- `office_address` (full street)
- `office_map_url` (Google Maps link auto-built from address if missing —
  `https://www.google.com/maps/search/?api=1&query=<urlencoded address>`)
- `logo_url` (best-effort from website favicon/og:image; bucket
  `crm-brokerage-logos`, public)
- `last_directory_sync_at`, `confidence`, `field_sources`

Curated rows (`entry_source = 'manual'` or non-null `last_verified_at`) are
**never overwritten** — only nulls are filled.

### 4. UI changes — `OwnerCRMRelationships` Brokerages tab

- Remove the "Sync UAE brokerage directory", "Enrich brokerages (batch of
  5)" and "Enrich developers (batch of 5)" buttons.
- Replace the entire `DirectoryToolsPanel` with a slim **Directory health
  card**:
  - Last sync timestamp (Asia/Dubai), per-emirate counts, % with
    phone/email/website/IG/logo.
  - A small "Refresh now" link (owner-only) that just calls
    `directory-job-start` and then polls `directory-job-status` every 5s,
    showing `Syncing… 47/180 (Dubai)` inline. Never blocks the UI.
- Brokerage row rendering already uses the existing detail drawer; I'll
  ensure every contact field renders as a real anchor:
  - `phone` → `<a href="tel:+9714...">`
  - `email` → `<a href="mailto:...">`
  - `website` → `<a target="_blank" rel="noopener">` (display clean
    domain)
  - `instagram_url` → `<a target="_blank">@handle</a>`
  - `office_address` → text + adjacent map-pin icon link to
    `office_map_url`
- Same treatment in the Developers tab.
- Fix the loading-button styling globally: add
  `disabled:opacity-100 disabled:bg-[#1A1A1A] disabled:text-white
  disabled:cursor-wait` on the affected buttons so they don't go faded
  during work. (This stays for any remaining owner-only "Refresh now"
  link.)

### 5. Acceptance check (I'll run after build)

- Hit `directory-job-start` from the preview session → response < 1s,
  returns `jobId`.
- Poll `directory-job-status` → see progress climbing.
- After the first immediate run completes, query
  `select count(*) filter (where phone is not null)` etc. on
  `crm_brokerages` and confirm the populated counts are materially higher
  than the current 60/180.
- Open `/owner/crm/relationships` → Brokerages tab loads with no manual
  buttons, all rows have clickable phone/email/website/IG, address shows a
  Maps icon that opens Google Maps to the office.

## What I will NOT touch

- Existing `crm_brokerages` / `crm_developer_registry` schemas — only
  additive columns (`instagram_url` already exists; `office_map_url`
  already exists).
- Existing `rel_*` system from the earlier Master Recreation prompt — that
  stays as-is.
- Curated/manual rows are never overwritten.

## Secrets needed

- `PERPLEXITY_API_KEY` — already configured (the current function uses it).
  I'll verify via `fetch_secrets` before deploying.

## Technical notes

- Background continuation uses Deno's
  `EdgeRuntime.waitUntil(processChunk(jobId))` to avoid HTTP timeout.
  Each chunk re-invokes the worker function via `fetch` to get a fresh
  150s window — chained jobs, never a single 110s synchronous call.
- `pg_cron` + `pg_net` schedule the daily kickoff (already enabled in
  this project).
- All new edge functions: JWT-verified, owner-only via the existing
  `requireOwnerAuth` helper pattern.
- `directory-job-status` is read-only and safe to call from the client
  every 5s.

