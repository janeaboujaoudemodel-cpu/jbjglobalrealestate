# Fix: Continue Searching showing the same project twice

## Root Cause

The deduplication logic for the **history itself** is already correct in three places:

1. `useRecentSearches.trackView` — removes any prior entry with the same `type+slug` or `type+id` before inserting the new view (so viewing the same project twice only stores it once, with the latest `viewedAt`).
2. `useRecentSearches.loadItems` — dedupes by `type+slug` on load.
3. `ContinueSearching` — dedupes the hook output again by both `type+slug` AND `type+id`.

So the stored history is clean — each project only appears **once**.

The visible duplication comes from one place only:

```ts
// src/components/ContinueSearching.tsx — WalkingStrip
const duplicated = [...uniqueItems, ...uniqueItems];
```

The marquee intentionally concatenates the unique list with itself to create a seamless infinite-scroll loop. When the user has only a few recently-viewed projects (e.g. 2-4), the loop wrap is visible on-screen as "Project A, Project B, Project A, Project B" — the exact same card, same photos, same developer, right next to itself. This is what the user is reporting.

## Fix

Change the carousel behavior so an item is never visible twice at the same time:

1. **Only duplicate the list when there are enough unique items to fill the viewport width.** If the unique list already exceeds the visible strip width, the second copy is off-screen during the seamless reset and the duplication is invisible. If there are fewer items than fit on screen, disable the marquee animation entirely and render a static, centered, non-scrolling row — so each project is guaranteed to appear exactly once.

2. **Pad-by-scrolling, not pad-by-cloning.** When the list is large enough to animate, keep the existing `[...uniqueItems, ...uniqueItems]` pattern (it is required for a seamless `translateX` loop) but measure the viewport width and only start animation once `singleSetWidth > viewportWidth`. This prevents the "A B A B" visible stutter on short lists.

3. **Tighten duplicate detection across `type` boundaries.** Today a developer card and a property card for the same entity (e.g. "Emaar" developer + an Emaar project) can both be tracked. That is correct — they are different entities — but confirm the `type+slug` key stays the canonical dedup key and that the hook's normalization doesn't ever drop the `type` prefix.

## Technical Changes

**`src/components/ContinueSearching.tsx` — `WalkingStrip` component**

- Add a `ResizeObserver` on the outer wrapper to track the visible width.
- Compute `shouldAnimate = singleSetWidth > viewportWidth + 32` (small buffer).
- If `shouldAnimate` is false: render `uniqueItems` once (no `[...x, ...x]`), center them with `justify-center`, and skip the `requestAnimationFrame` loop.
- If `shouldAnimate` is true: keep the current duplicated loop + animation.
- Keep the existing `seen = new Set<\`${type}-${slug}\`>` dedup.

**No changes to:**
- `useRecentSearches.ts` (dedup is already correct).
- The top-level `ContinueSearching` dedup (already correct).
- Storage format / tracking calls on project detail pages.

## Result

- Viewing the same project twice still only creates one history entry (already true).
- With 1-5 recently-viewed items, the strip renders each card exactly once, centered, non-scrolling — no visible duplicate.
- With 6+ items that overflow the viewport, the seamless marquee continues to work, and the "second copy" used for the loop is always off-screen during the wrap.
- A different project by the same developer still appears as its own card (the dedup key is `type+slug`, not developer name).
