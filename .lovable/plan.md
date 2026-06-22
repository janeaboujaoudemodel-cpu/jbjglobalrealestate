## Plan

1. **Restore the global contrast contract**
   - Update `src/index.css` so any emerald, black, dark, ink, or dark-gradient own-surface forces **white text and white icons** at rest, hover, focus, active, and disabled.
   - Remove/neutralize the late “champagne parent” rules that currently repaint descendants black inside emerald/dark surfaces.
   - Keep champagne/light/gold own-surfaces as ink text only when the element itself is genuinely light, not when it sits inside a dark/emerald button or section.

2. **Fix the exact sections shown in the screenshots**
   - Header utility pills and avatar/menu buttons.
   - Vertical sidebar highlight buttons, active sections, contact/support, and collapse controls.
   - Services/Royal Tools dark emerald bands and tab rows.
   - “Get Verified” dark banner.
   - Listing card Email/Call/Chat buttons.
   - AI Property Comparison card/buttons/icon tiles.
   - Guides/report book covers and recently viewed overlay captions.

3. **Patch component markup only where CSS cannot infer the surface**
   - Add/adjust `data-emerald`, `data-surface="dark"`, `data-on-dark`, `allow-white`, or existing emerald primitives on the affected components instead of changing feature logic.
   - Preserve all existing content and functionality; this is contrast/restyle only.

4. **Technical validation**
   - Use computed-style checks in Playwright to scan representative pages for black text/icons inside emerald/dark surfaces.
   - Confirm no new CSS rule repaints emerald/dark surfaces back to ink.

5. **Visual validation screenshots**
   - Capture screenshots for the homepage hero/header/sidebar.
   - Capture the services band, verified banner, listing cards, tools hub, AI Property Comparison, guides/reports, and recently viewed sections.
   - Hover representative emerald buttons and capture at least one hover screenshot to confirm white foreground remains white.