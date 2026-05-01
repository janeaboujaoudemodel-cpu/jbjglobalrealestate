## Problem

The "Handpicked For You" section is rendering only 1 card (should be 8). Root cause confirmed by querying the database:

The current `useFeaturedProjects` hook does a single query: `.in("developer_name", ELITE)` ordered by `created_at desc` with `.limit(40)`. Out of those 40 most-recent rows, only **5 of the 9 elite developers appear** — Emaar, Sobha, DAMAC, and ALDAR are completely missing because their projects weren't among the latest 40 inserts globally. After the unique-developer dedup, only a handful of cards survive.

Database evidence (from the published projects table):
- 9 elite developers each have 15–72 published projects (plenty of supply).
- The latest-40-by-created_at slice covers only Meraas, Nakheel, Omniyat, Binghatti, Dubai Properties.

## Fix

Replace the single global query with a **parallel per-developer fetch** in `src/components/home/FeaturedListings.tsx` (`useFeaturedProjects`). This guarantees one card per elite developer.

### Updated query strategy

For each name in `ELITE_DEVELOPERS`, run a small Supabase query in parallel:

```ts
ELITE_DEVELOPERS.map(dev =>
  supabase.from("projects")
    .select(SELECT)
    .eq("developer_name", dev)
    .eq("is_published", true)
    .order("price_from", { ascending: false, nullsFirst: false })
    .limit(8)
)
```

`Promise.all` collects the results; `.flat()` produces the candidate pool. The existing dedup logic (`byDev`, `usedIds`, `usedDevs`, `addOne(...)`) is reused unchanged — it already prefers priced projects and enforces unique developers.

### Selection order preserved

Keep the explicit `addOne(...)` ordering already in place so the homepage feels curated:
DAMAC → Emaar → Nakheel → Sobha → Meraas → Binghatti → ALDAR → Omniyat. (Dubai Properties stays in `ELITE_DEVELOPERS` as a fallback bench.)

### Cache key

Bump `queryKey` from `featured-projects-elite-v3` → `v4` so users see fresh data immediately.

## Files touched

- `src/components/home/FeaturedListings.tsx` — only the `useFeaturedProjects` query body. The card rendering, dedup, and ordering logic stay identical.

## QA after

- Homepage "Handpicked For You" shows 8 cards in a 4-col grid.
- All 8 cards have different developer names (no repeats).
- Each card shows a real price (price-orange pill on the photo) for elite developers.