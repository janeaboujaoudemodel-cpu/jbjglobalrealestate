## Plan to fix the scroll correctly

1. **Remove the artificial scroll boost**
   - Update `src/hooks/useScrollUnlocker.ts` so wheel events are not manually amplified.
   - Keep only the safe scroll-lock cleanup for stuck `overflow: hidden`, `position: fixed`, and modal leftovers.
   - This addresses the current bug where a small wheel/trackpad movement jumps down too far.

2. **Keep legitimate modal protection**
   - Continue respecting real open modals/dialogs so the page does not scroll behind popups.
   - Preserve local scrolling inside maps, document studio overlays, textareas, and scrollable panels.

3. **Preserve normal anchor/button smooth scrolling only**
   - Keep global `html` scrolling as `auto` so user wheel/trackpad scrolling is native and responsive.
   - Leave explicit button actions like “scroll to bottom/top” using `behavior: "smooth"` where intended.

4. **Validate as a real user**
   - Test repeated small wheel scrolls on the homepage at the current desktop viewport.
   - Confirm each small scroll moves naturally, without freezing and without jumping a large distance.
   - Test `/projects`, `/developers`, and `/faq` to make sure the fix is global.

5. **Add a regression guard**
   - Add/adjust a focused scroll QA script or test so future changes cannot reintroduce wheel boosting or global scroll throttling.