# Palette + Contrast Lock Pass

Match the rest of the chrome to the vertical sidebar's champagne gradient and replace the remaining emerald/green accents that broke contrast.

## Reference color (locked from current sidebar)

```
linear-gradient(180deg, #F7F2EA 0%, #EFE6D6 50%, #F7F2EA 100%)
hairline accent: #B89555
text/icons on this surface: #1A1A1A (true black)
```

This is the only background allowed for the four chrome regions below. No white, no emerald.

## Tasks (executed one at a time, each verified with a screenshot before moving on)

### Task A — Horizontal header background
- File: `src/components/navigation/HorizontalUtilityBar.tsx` (+ any `.jj-horizontal-utility-bar` rules in `src/index.css`).
- Replace current white/emerald bar background with the champagne gradient above.
- Keep the single gold hairline at the bottom edge.
- Verify: screenshot of header at 1440px and 1144px — must visually continue the sidebar tone with no white seam.

### Task B — Footer background + text
- File: `src/components/home/MinimalFooter.tsx`.
- Swap the current `from-[#FDFBF7] via-[#F7F2EA] to-[#F2EBDC]` for the exact sidebar gradient.
- Change every link, separator dot, and the `© 2026 JBJ GLOBAL REAL ESTATE` line from emerald `#047857` to black `#1A1A1A` (hover: `#1A1A1A` at 70% opacity).
- Keep the single gold hairline divider.
- Verify: footer screenshot — black text on champagne, no emerald.

### Task C — Bottom of vertical sidebar (Contact / Support / Collapse)
- File: `src/components/navigation/GlobalVerticalNav.tsx` lines ~1180–1270 (expanded) and the matching collapsed rail block ~1293+.
- Repaint the bottom panel from the white/`#FDFBF7` fill to the same champagne gradient so it merges with the sidebar body (currently visible white seam).
- Contact button, Support button, and Collapse toggle:
  - Text color: `#1A1A1A`
  - Icon color/stroke: `#1A1A1A`
  - Border: `#B89555` hairline (keep)
  - Hover background: `#EFE6D6` (no emerald, no gold fill)
  - Remove inline `color:'#B89555'` and emerald hover styles on these three controls.
- Sign Out stays red (unchanged).
- Verify: screenshot of sidebar bottom in both expanded and collapsed states.

### Task D — First-four-categories hover (vertical sidebar)
- File: `src/components/navigation/GlobalVerticalNav.tsx` — the "saturated colored rows" branch around line 813 and the row-background logic that paints a full emerald/green fill on hover for the first four nav items.
- Remove the full-fill hover. Replace with the same subtle hover used by the remaining categories: transparent row, only the icon tile + underline animation change (`navHoverUnderline` already defined at line 832, gold-hairline icon tile at line 844).
- No category may flash a solid green band on hover.
- Verify: hover each of the first four items in the preview, screenshot showing identical hover treatment to items 5+.

### Task E — Final regression sweep
- Take a full-page screenshot at 1440px confirming: champagne header → champagne sidebar → champagne footer form one continuous tone; bottom-of-sidebar controls render black on champagne; no green hover flash on any sidebar category.

## Guardrails
- Do not touch any other page, card, button, or CTA.
- Do not reintroduce gold fills, emerald fills, or white panels in these regions.
- After each task: visual check in the preview before starting the next.
