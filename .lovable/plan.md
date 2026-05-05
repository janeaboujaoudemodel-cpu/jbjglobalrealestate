## Relationships Hub — speed + UAE-wide directory fix

I dug into the data and the page. The real problems are different from "the panel needs to be more minimized" — that's already done. Three concrete bugs:

### What I found

1. **Directory only ever seeds Umm Al Quwain.** The last 12 cron runs each contain exactly **1** `brokerage_seed` job, and it's always the last emirate (UAQ). The fan-out-to-all-7-emirates code exists in `directory-job-runner` but the deployed function isn't running it — it needs a fresh deploy.
2. **"0 new" forever.** Perplexity returns the same first ~100 firms every call, so re-running with `offset=0` is a no-op. We need to walk multiple offset pages so each cron actually discovers the tail.
3. **Relationships page feels slow on tab open.** Developer Registry tab is mounted only after click, then paginates `crm_developer_registry` (774 rows) in 1000-row pages. We can prefetch it during browser idle so the click is instant.

Current totals confirm the gap:
- `crm_brokerages`: 341 rows (Dubai only 40, Abu Dhabi 30 — way too low for UAE)
- `crm_developer_registry`: 774, `developers` master: 633 — 327 dev rows missing contact info, 210 brokerage rows missing contact info.

### Fix plan

**A. `supabase/functions/directory-job-runner/index.ts`**
- Bump `CHUNK_SIZE` 12 → 25 and `ENRICH_CHUNK_SIZE` 24 → 30 so each chunk does meaningful work.
- Add a `SEED_OFFSETS = [0, 100, 250, 500]` rotation: in the `cron` action, create one seed job per `(emirate × offset)` so a single sweep covers all 7 emirates at 4 depths = 28 seed jobs in parallel, instead of 1.
- Initialize each seed job's `progress` field to its starting offset so `pplxList(emirate, offset, …)` actually skips the firms we already have.
- Tighten `pplxList` prompt to require firms _after_ the offset and to skip any firm whose name appears in a "do not repeat" list (we'll pass the 50 newest names already in `crm_brokerages` for that emirate).
- Redeploy.

**B. `src/pages/CRMRelationships.tsx` — instant tab switching**
- Eagerly add `"developers"` to the `mounted` set inside a `requestIdleCallback` after the page renders, so the registry data is fetched and ready before the user clicks the tab. (The query is already cached for 60s, so the second click is free.)
- Same trick for the brokerages tab when the user lands on developers first.

**C. `src/components/crm/DirectoryToolsPanel.tsx`** is already collapsed-by-default with the lockout — no change needed.

**D. Backfill the missing UAE data right now (one-time):**
- Trigger the cron action with the new fan-out so all 28 seed jobs and the two enrich jobs run in parallel.
- After it completes you'll see Dubai/Abu Dhabi numbers jump from 40/30 into the hundreds, and the "0 new" badge will turn into "+N new".

### Files to change
- `supabase/functions/directory-job-runner/index.ts` (logic + deploy)
- `src/pages/CRMRelationships.tsx` (idle-prefetch developers tab)

Nothing is removed; the panel stays minimized; manual "Refresh now" remains the only one-click control and it auto-locks while running.