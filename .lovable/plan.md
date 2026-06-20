## Plan to fix the global contrast system

1. **Remove the conflicting late CSS layers**
   - Clean the duplicate/fighting rules at the end of `src/index.css`:
     - `TRUE FINAL LIGHT-OWN-BACKGROUND LOCK`
     - `STABLE SURFACE CONTRACT`
     - broad `[data-on-dark]` / `.allow-white` repaint behavior where it can win on light surfaces.
   - Keep contrast decisions based on the rendered/declared surface, not permission flags.

2. **Replace them with one final contract**
   - Add one final static CSS block with this strict polarity:
     - Light own surface: champagne / cream / white / gold / muted / card / popover / secondary / accent → ink text/icons.
     - Dark own surface: black / ink / dark / navy / dark CTA → white text/icons.
     - Nested surfaces override their parent, so a light card inside a dark section stays ink, and a dark button inside a light card stays white.
   - Include SVG/icon stroke/fill handling so the i-icon and Lucide icons follow the same contrast rule.
   - Remove broad `div`/generic descendant repaint where it causes black-on-black or white-on-light leaks.

3. **Strengthen automated detection**
   - Update the contrast architecture script so it fails if future CSS reintroduces multiple final contrast contracts, broad `data-on-dark` repaint rules, or generic unscoped `color: #FFFFFF !important` / `color: #1A1A1A !important` sweeps.
   - Update the visible contrast scanner to flag:
     - white/light foreground on champagne/white/gold/light gradients,
     - black/dark foreground on black/dark/navy/green/purple surfaces,
     - SVG stroke contrast, not just text color.

4. **Visual validation only after the CSS change**
   - Use the browser preview and rendered scans across key front/back-office routes: `/`, `/properties`, `/developers`, `/market-intelligence`, `/market-report`, `/guides`, `/faq`, `/list-property`, `/owner`, `/owner/crm`, `/admin`.
   - Check desktop and mobile viewport sizes.
   - Do not mark complete unless the visible screenshots/scanner show no white-on-light or black-on-dark failures on the tested routes.

5. **Report honestly**
   - If any route requires login or cannot be fully validated from the preview session, state that clearly instead of claiming full E2E coverage.