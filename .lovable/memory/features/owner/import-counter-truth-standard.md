---
name: Import Counter Truth (LOCKED)
description: Every owner review/import counter must show real DB totals — paginate past Supabase's 1000-row cap and keep Found = the headline number.
type: feature
---

# Import Counter Truth (LOCKED)

- Supabase returns at most 1000 rows per request. Any owner queue that counts rows
  client-side MUST paginate with `.range()` until the table is exhausted
  (`fetchAllRows` in `src/pages/owner/MarketDataImportHub.tsx`). Never show a
  count derived from a capped page — it silently lies (1000 instead of 1749).
- Every stat card shows three chips: **Found** (in the market source),
  **Published** (live on JBJ), **Remaining** (found − published).
- The headline number on a card must equal its **Found** chip. Never mix a
  run-stats metric (e.g. "fields filled") into the headline position.
- Applies to Market Import Review, enrichment review and any future import queue.
