## Goal
Replace every gray scrollbar with the brand gold (#B89555) across the entire site — both the global page scrollbar and all inner scroll containers (Toolkit Showcase row, modals, sidebars, dropdowns, tables, etc.).

## Findings
- `src/index.css` defines several scrollbar utilities (`.jj-scrollbar-gold`, `.jj-scrollbar-gold-x`, `.jj-scrollbar-always-visible`, `.scrollbar-thumb-gold`, `.scrollbar-thumb-gold/60`, `.scrollbar-track-gold/10`) but every one of them is currently set to gray (`hsl(0 0% 40%)`). Despite the "gold" name, none of them actually render gold — that's why the Toolkit Showcase shows a gray scroller.
- There is no global `::-webkit-scrollbar` / `scrollbar-color` rule, so default scrollbars on body and many containers fall back to the browser's gray.

## Plan

1. Add a global scrollbar rule in `src/index.css` (top of base layer) so every scrollable element on every page defaults to gold:
   - `* { scrollbar-width: thin; scrollbar-color: #B89555 transparent; }`
   - `::-webkit-scrollbar { width: 8px; height: 8px; }`
   - `::-webkit-scrollbar-track { background: transparent; }`
   - `::-webkit-scrollbar-thumb { background: #B89555; border-radius: 999px; }`
   - `::-webkit-scrollbar-thumb:hover { background: #C9A766-equivalent → use #B89555 with brightness, keep within palette: rgba(184,149,85,0.85). }` (we'll stay on the approved gold; no banned bright yellow-gold hexes).

2. Rewrite every existing scrollbar utility in `src/index.css` (lines ~1398–1472 and ~2441–2475) to use the gold token instead of the gray HSL values — so any component already using `jj-scrollbar-gold`, `scrollbar-thumb-gold`, etc. immediately becomes truly gold. Track stays transparent / very faint champagne; thumb is `#B89555`; hover slightly more opaque.

3. Keep `.scrollbar-hide` (line 2715) untouched — it's used intentionally to hide scrollbars on certain horizontal rows.

4. Leave the Toolkit Showcase component itself alone — once the global + utility rules are gold, its scroller will inherit the brand color automatically.

5. No JS/logic changes, no removed features. Purely CSS theming, consistent with the champagne-gold standard and the no-gray rule.

## Out of scope
- Custom-painted scrollbars inside iframes / third-party embeds (browser-controlled).
- Touch devices that don't render a visible scrollbar.
