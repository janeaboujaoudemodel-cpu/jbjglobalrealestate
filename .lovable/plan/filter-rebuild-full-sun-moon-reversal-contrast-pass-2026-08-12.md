# Filter Rebuild + Full Sun/Moon Reversal & Contrast Pass

Two connected problems: the Devs/Tiers dropdowns are structurally broken, and the Moon (emerald) theme is applied by a generated sheet that only repaints known colour values — so anything it doesn't recognise stays black text on emerald, keeps gold borders, and flashes the wrong colours on load.

## 1. Rebuild the Devs and Tiers dropdowns

One shared picker component, used by Area, Devs and Tiers so all three behave identically.

- **Anchoring**: the panel is anchored to its own button and rendered in a portal above the page, closes on scroll, outside click and Escape. Today it detaches and floats over the page while scrolling.
- **Empty state**: "No developer found" appears because the list renders before developers load. Add a loading state, and only show the empty message when the list has actually loaded and matched nothing.
- **Rows**: fixed-height rows in a proper grid — name cell + exclude control — with real vertical spacing so the boxes never touch. Developer logo (white plate, wordmark fallback) sits at the start of each row, all the same size, so the column is aligned edge for edge.
- **Selection states**: unticked = neutral box, ticked = emerald pair fill with a white tick and **white** label (no black text on emerald), excluded = red outline + red minus and strikethrough. Nothing green — emerald only.
- **Exclude control**: a larger, properly hit-targeted button that responds on the first tap (no repeat-click delay), with an accessible label.
- **Trigger label**: the active label ("My Properties", "Emaar Properties", "All except 1") shrinks to fit its box between UAE and Tiers instead of being cropped, and never splits a word.
- Tiers gets the exact same treatment — currently it's inline ad-hoc markup, which is why it looks unlike the others.

## 2. Reverse the Sun/Moon logic properly

Sun stays as it is: champagne dominant, emerald accent. Moon inverts it, section by section — not by string-matching hex values.

- Replace the generated hex-sniping sheet with a token-driven Moon layer: every surface, ink, border and icon colour resolves from semantic tokens, so a component painted champagne in Sun becomes emerald in Moon and vice versa, automatically, on every page.
- **Reversal list**: partners marquee, Explore Our Services cards, Royal Tools cards, Top Areas, active bid cards, project cards, gated portal, chat support, footer, account dropdown — anything emerald in Sun becomes champagne (with black ink) in Moon, anything champagne becomes emerald (with pure white ink).
- **Emerald gradient balance**: the page-level emerald is an even, balanced emerald from top to bottom instead of ramping light-to-dark down a very long page. Applies to every page in Moon.
- **No gold on emerald, ever**: gold borders, dividers and hairlines on emerald surfaces become clean white at low opacity. Covers filter segments, dropdown panels, developer project cards, account dropdown, footer.
- **Load flash**: the Moon layer is applied before first paint so the page doesn't show emerald-everywhere and then settle.
- Backend/owner shell stays on its existing skin, unchanged.

## 3. Contrast fixes

- White circles in "How We Build A Property Decision" — numbers inside become solid emerald ink, not faded.
- Explore Our Services, Royal Tools, active bid cards — real ink tokens instead of inherited faded colours.
- Footer: pure white ink on emerald in Moon; black ink on champagne in Sun.
- Titles and badge content on champagne backgrounds (Top Areas and similar) render black, not white.
- AI Property Comparison: the icon beside "Compare up to 10 projects" matches the Excel / Premium Table / ROI Projection cards.
- Hero search input: remove the emerald rectangle highlight around the typing text — plain text, no highlight box.

## 4. Sidebar and buttons

- Monogram in the vertical sidebar header renders white in Moon (the J is currently black).
- Remove the rectangular highlight plates around sidebar section labels (Tools, Workspace, all main pages) and around the in-guide scroll navigator — icons and words sit free, active state shown by ink weight and a thin marker instead.
- All sidebar page and sub-page labels: pure white in Moon.
- Reverse the two action buttons: Collapse becomes champagne, Sign Out becomes emerald with a clean premium red on hover.

## 5. Developer logo and card treatment

- Partners With Dubai's Leading Developers: remove the border boxes around each logo in both Sun and Moon — logo only.
- Developer project cards: gold borders replaced with an animated emerald hairline.
- Email / Call / WhatsApp buttons flip to emerald.

## 6. Verification

Every item above is proven with Playwright screenshots via `scripts/qa/shot.py`, in **both** Sun and Moon, at desktop and mobile, plus an automated contrast check that fails on any dark-ink-on-emerald or white-ink-on-champagne pairing. From here on, every visual edit is applied to both themes in the same change.

## Technical notes

- New `src/components/search/FilterMultiSelect.tsx` (portal + shared row/state logic) consumed by `AreaIncludeExclude`, `DeveloperIncludeExclude` and the tiers block in `PropertySearchBar.tsx`; the inline `Seg`/`Popover` wrapper moves to a scroll-dismissing anchored portal.
- `src/styles/theme-moon.css` is regenerated from `scripts/qa/gen_theme_moon.py` as a token-mapping layer (surface/ink/hairline roles) instead of per-hex attribute selectors; `ThemeModeContext` sets the theme attribute pre-hydration in `index.html` to kill the flash.
- Hardcoded champagne/emerald hex values in the affected components are replaced with the semantic tokens so both themes follow automatically.
- Contrast guard rules extended to cover sidebar, footer and popover content; `data-no-contrast-guard` escapes audited and removed where they were masking the black-on-emerald cases.
