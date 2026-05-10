Plan to fix the white text/icon regression globally, without changing layout or unrelated UI:

1. Preserve the current before state
- I already captured a before screenshot of the current homepage state in preview.
- I will also capture before screenshots for the front-end homepage and the owner/CRM area where access allows. If the owner area redirects to sign-in in my browser session, I will use the accessible screen and note that owner-route verification needs you logged in in preview.

2. Repair the global contrast rules in `src/index.css`
- Remove/replace stale rules that still treat champagne/light surfaces as dark or “white dominant”.
- Make light surfaces globally resolve to ink `#1A1A1A` by default:
  - `#FDFBF7`
  - `#F7F2EA`
  - `#EFE6D6`
  - white/card/background/muted/popover equivalents
- Force `text-white`, white SVG icons, and white hover labels to ink on all light/champagne surfaces.
- Keep gold only as the existing hairline/accent system, not as a fill.

3. Restrict white to true dark contexts only
- White will remain allowed only inside explicit dark surfaces, black CTAs, dark photo/video hero overlays, or intentionally dark modals/cards.
- Light hover states, CRM shortcuts, header/sidebar buttons, stage chips, titles, icons, tabs, and filter controls will stay black or gold, not white.

4. Fix the runtime contrast guard
- Update `src/utils/contrastGuard.ts` so it cannot inject white text on bright/champagne backgrounds.
- It will only use white when the computed background is truly dark; otherwise it will restore ink black.

5. Lock the rule with an audit/check
- Add or tighten a contrast audit so light/champagne selectors cannot force white text/icons again.
- The lock will target both normal and hover states for front-end and owner/back-end screens.

6. Verify visually with after screenshots
- After implementation, I will capture after screenshots for:
  - Homepage/header/sidebar/shortcut buttons
  - Owner/CRM or sign-in-gated owner route state available in preview
- I will compare against the before screenshots and report exactly what was confirmed.

Scope guard: I will not redesign, restyle layout, remove features, or touch CRM data/count logic in this fix. This is only a global black/gold contrast repair and lock.