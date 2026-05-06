## Why you only see ~504 brokerages

The `useCRMRelationships` hook fetches every brokerage in a single call:

```ts
supabase.from("crm_brokerages").select("*").order("updated_at", { ascending: false });
```

Two limits cap that result:

1. **Supabase caps every query at 1,000 rows by default.** Even though the database currently holds **4,872 brokerage rows**, a single `select("*")` will never return more than 1,000.
2. The **504** you actually see is what's left **after the active filters** (search / status / Emirate / sub-tab) are applied to the first 1,000 rows that came back — so increasing filters or scrolling will never reveal the rest, because the rest were never fetched.

So the issue is purely a data-loading bug, not RLS or UI.

## Fix

Switch the brokerage fetch to a **paginated loop** that pulls every row in 1,000-row pages until the table is exhausted, then feeds the full list into the existing UI.

```text
page 0:    rows   0 –  999
page 1:    rows 1000 – 1999
page 2:    rows 2000 – 2999
…until a page returns < 1000 rows
```

### Changes

1. **`src/hooks/useCRMRelationships.ts`** — replace the single `select("*")` with a `while` loop using `.range(from, from + 999)`, accumulating into one array, then returning it. Same ordering (`updated_at desc`). No schema or RLS change.
2. **Lightweight progress signal** — while the loop runs, expose a `loading` / `loadedCount` value the directory header can show ("Loading 3,000 / 4,872…"), so it's visible that all agencies are being pulled. Optional, but useful given the size.
3. **Apply the same pattern to `IndividualBrokersTab.tsx`** (it currently does a single `select` on `crm_brokerage_agents`, which will hit the same 1,000-row ceiling once that table grows).

### Out of scope

- No DB migration, no RLS change, no edge function.
- No change to filters, tabs, card/Excel views, or "My Additions" logic.
- The 10,000 figure you mentioned is the long-term target; today the table actually has **4,872 rows**, and after this fix you'll see all of them.

### Files

- `src/hooks/useCRMRelationships.ts` (paginated fetch + loadedCount)
- `src/components/crm/IndividualBrokersTab.tsx` (same pagination)
- `src/pages/CRMRelationships.tsx` (only to surface the "Loading X / Y" line in the directory header — no logic change)
