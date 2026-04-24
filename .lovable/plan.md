# Fix: Page navigation arrow visibility & position

## Root Cause

The floating scroll arrows live in `src/components/PageNavigation.tsx`, mounted globally from `MainLayout`. Two problems:

1. `showScrollBottom` is initialized to `true`, so the **down arrow** appears **immediately on page load** before the user has scrolled. The user expects nothing visible at first — the arrow should only appear once the user scrolls down, and it should be the **up arrow** (to go back to top).
2. The button sits at `bottom-36` (144px), above the chat-support button at `bottom-20` (80px). The gap is there, but the user wants the arrow **closer to the chat support** without overlaying it.

## Fix

**`src/components/PageNavigation.tsx`**

1. Change the initial state so nothing shows on first paint:
   - `showScrollBottom` default → `false` (not `true`).
   - Keep `showScrollTop` default `false`.
   - Gate both arrows behind a `hasScrolled` flag that flips `true` only after the user scrolls past ~100px. Before any scroll, render nothing.

2. After the user scrolls:
   - Once `scrollY > 100`, show the **up arrow** (back to top) — this matches the user's request ("once the user scrolls down, then show him go to top").
   - The down arrow is kept only when the user is near the top AND page is scrollable — but since we now require scrolling to trigger visibility, the down arrow effectively never shows on the home idle state. Simpler: drop the down arrow entirely and only render the up arrow after scroll. This matches the explicit request.

3. Tighten the vertical position so the arrow sits just above the chat launcher:
   - Chat launcher bottom: `bottom-20` (80px), chat button height ~56px → its top edge is at ~136px.
   - Move `PageNavigation` from `bottom-36` (144px) to `bottom-[148px]` so the arrow's bottom edge sits 148px from viewport bottom — the arrow button ends right above the chat button with a consistent ~12px gap, never overlapping.
   - Keep the "chat medium" branch (`isChatMedium` → `bottom-56`) for the expanded-chat state.

4. Keep the existing "hide when chat is open" guard (`if (isChatOpen) return null`) so there is zero overlap when the chat is expanded.

## Technical Changes (single file)

```
src/components/PageNavigation.tsx
```

- `const [showScrollBottom, setShowScrollBottom] = useState(false);` (was `true`)
- Remove the down-arrow button (or keep but gate behind `hasScrolled && scrollY < 100 && isScrollable`; simpler: remove).
- In `handleScroll`, set `showScrollTop = scrollTop > 200` as before.
- Position classes: `isChatMedium ? "bottom-56" : "bottom-[148px]"`.

## Result

- On page load → no arrow visible anywhere on the screen.
- User scrolls down past ~200px → up arrow fades in, sits just above (≈12px gap) the chat-support button on the right.
- Tapping the up arrow smoothly scrolls to top.
- Chat support button is never overlayed; when the chat is opened, the arrow is hidden entirely.
- RTL mirroring (`left-4` vs `right-6`) is preserved.
