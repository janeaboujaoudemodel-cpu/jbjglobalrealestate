

# Fix: Stats Counter Layout Shift + Sold Out Sort Logic

## Two Issues

---

## 1. Stats Counter Card Layout Shift (Track Record Section)

**Problem:** The "Social Followers" stat counts from 0 to 1,000,000. During the animation, intermediate values like "900,000" (7 characters) are much wider than the final "1M+" (3 characters). This causes the card to expand during counting and then shrink when it reaches 1M, creating an ugly layout jump.

**Fix:** Always format the number using the abbreviated "M" format once it reaches 1,000,000 target. But the real fix is to **always display the final format** during counting too. Since the end value is 1,000,000, the counter should count in the abbreviated format from the start: "0M" -> "0.1M" -> "0.5M" -> "0.9M" -> "1M+". This keeps the card width stable throughout the animation.

Additionally, set a `min-width` on the counter value container so the card never changes size during animation.

**Changes in `src/components/StatsCounter.tsx`:**
- Update `formatNumber` to always use the abbreviated "M" format when the **target** (`end`) is >= 1,000,000, not just when the current count reaches it
- Pass `end` into the formatting logic so it knows the target scale
- Add `min-w-[80px]` or similar to the counter value div to stabilize width

---

## 2. Sold Out Sort -- Remove the Condition

**Problem:** The current code wraps the sold-out sort in `if (!filters.hideSoldOut)`. The user never asked to skip the sort -- they want sold-out projects **always pushed to the bottom**. The `hideSoldOut` filter already removes sold-out projects entirely before sorting, so the condition is redundant. But more importantly, the user explicitly said: do NOT hide sold out projects. Just push them down. The filter toggle should still work independently.

**Fix:** Remove the `if (!filters.hideSoldOut)` wrapper. The sort should always run unconditionally. When `hideSoldOut` is true, the sold-out projects are already filtered out before the sort runs, so the sort simply has no effect (no sold-out projects in the list to push down). When `hideSoldOut` is false, the sort correctly pushes them to the bottom.

**Changes in `src/pages/PropertiesReelly.tsx`:**
- Remove the `if (!filters.hideSoldOut)` condition on lines 227 and 236
- Keep the sort logic itself unchanged -- it always runs

---

## Technical Summary

| File | Change |
|------|--------|
| `src/components/StatsCounter.tsx` | Format counter using target scale (M format throughout animation); add min-width for stability |
| `src/pages/PropertiesReelly.tsx` | Remove `if (!filters.hideSoldOut)` wrapper -- sort always runs |

