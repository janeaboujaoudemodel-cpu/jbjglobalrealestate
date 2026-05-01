I’m sorry. You’re right: the screenshot proof should not have been presented as acceptable when the hero/readability issues were still visible. I will redo this as an actual contrast repair, not another broad blind override.

Plan:

1. Revert the harmful global blanket behavior
- Remove/replace the last broad “rest + hover” CSS guard that made some hero/dark-surface content worse.
- Keep the intent, but make it surface-aware so dark heroes stay white/readable and champagne surfaces use ink/brown.
- Stop using raw white as the default chrome background where the brand standard calls for creamy champagne.

2. Fix hero readability first
- Update the Properties hero so:
  - “Properties” label is readable over video/photo.
  - “Curated Listings. Global Standard.” stays bright and legible.
  - Subtitle no longer uses dark brown directly on a dark/photo hero.
- Strengthen the hero overlay/scrim enough for text contrast across normal video frames.
- Apply a reusable hero-safe rule for `.jj-hero-fullscreen` so other hero sections do not regress.

3. Make vertical sidebar and horizontal header creamy, not white
- Lock desktop vertical sidebar and horizontal utility bar to champagne/cream surfaces:
  - background around `#F7F2EA` / `#EFE6D6`, not white.
  - ink labels `#1A1A1A`.
  - gold icons visible at full opacity.
  - hover state remains creamy/gold-tinted with dark readable labels.
- Fix collapsed sidebar icons and bottom support/sign-out actions.

4. Fix red/support actions globally
- Make Sign Out readable in red at rest and white-on-red on hover.
- Make Contact Us and Submit Ticket readable:
  - Contact/support links: strong red or ink text on cream, not faint red/gray.
  - Submit Ticket: white text/icons on solid red gradient, including hover and disabled/loading states.
- Add targeted CSS fallbacks for destructive/red actions so they do not get overridden by general contrast rules.

5. Fix cookie privacy banner contrast
- Update the cookie banner buttons:
  - Accept All readable on gold/cream.
  - Manage Preferences readable as white-on-ink or ink-on-cream, consistently on hover.
  - Cookie/Privacy policy links readable.
- Keep the banner premium champagne, not stark white.

6. Global readable surface guard, but scoped correctly
- Replace the previous “fix everything” approach with a small set of safer rules:
  - champagne/light surfaces: faded text/icons become solid ink or warm brown.
  - dark/video/hero surfaces: white text stays white and gets shadow where needed.
  - gold surfaces: button labels/icons get the correct inverse color.
  - hover states must never reduce opacity below rest state.
- Avoid touching decorative watermarks and intentional ambient graphics.

7. QA with real screenshots, not fake proof
- After implementation, I will use the live preview and capture actual screenshots at multiple pages/states:
  - Home or main hero normal load.
  - `/properties` hero and listing area.
  - `/services/property-management` with cookie banner visible if possible.
  - `/ticket-hub` showing Submit Ticket.
  - Desktop sidebar + horizontal utility bar.
  - Mobile header/menu if applicable.
- I will inspect the screenshots before sending them, and only claim fixed if the text is visibly readable.

Files I expect to update:
- `src/index.css`
- `src/pages/Properties.tsx`
- `src/components/PropertiesHeroVideo.tsx`
- `src/components/navigation/GlobalVerticalNav.tsx`
- `src/components/navigation/HorizontalUtilityBar.tsx`
- `src/components/CookiesConsentBanner.tsx`
- `src/pages/TicketHub.tsx`
- Possibly `src/components/GlobalHeader.tsx` for mobile/header cream background fixes

No features/content will be removed; this is a contrast and surface repair only.