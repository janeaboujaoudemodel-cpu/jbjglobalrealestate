I found the remaining winning conflicts. They are not backend issues; they are frontend CSS/component conflicts.

What is still winning and why:

1. `src/index.css` lines 1021–1029
   - Selector: `[data-marketing-page] section[class~="bg-[#1A1A1A]"] [class~="text-white"]`
   - It turns every `text-white` inside a marketing page section with `bg-[#1A1A1A]` into ink.
   - This is why dark overlay cards and CTA text become black/dark when they should remain white.
   - It also defeats local component intent because it is later/global and targets raw Tailwind classes.

2. `src/index.css` lines 2866–2935
   - Selectors using `a:has(.lucide)`, `button:has(.lucide)`, `[role="button"]:has(.lucide)`, and `.icon-tile`.
   - The problem is `.icon-tile` is used on whole cards in `About.tsx`, not only icon tiles.
   - On focus/active/hover it forces icon/card foreground to generic foreground/accent colors, which explains several black-on-dark icon and card regressions.

3. `src/pages/About.tsx`
   - The About page contains local hardcoded conflicts:
     - Hero body paragraph uses `text-[#1A1A1A]/70` inside a dark hero.
     - Hero CTA arrows use `text-[#1A1A1A]` on a dark/transparent CTA.
     - Overlay market cards use `bg-[#1A1A1A]/85` + `text-white`, but the marketing-page remap can flip them.
     - `FeatureCard` uses `.icon-tile` on the full card, causing global icon-tile interaction rules to treat the entire card like an icon tile.

4. `src/components/market-intelligence/*`
   - The navy icon boxes intentionally use white icons, but broad lucide/CTA/global rules can override these because they only use `allow-white` and `data-no-contrast-guard`, not the locked CTA primitive.
   - The source of the issue is not the Market Intelligence page content itself; it is the remaining global icon/marketing remap rules winning against these local icons.

5. `src/components/SupportTicketBox.tsx`
   - The button is raw `bg-[#1A1A1A] text-white`, not the locked `.jj-cta-dark` primitive.
   - The support button can therefore still be affected by global icon/color rules, especially because it contains an icon and nested spans.

Cleanup plan — no new architecture, no new broad rules:

1. Remove the remaining broad marketing-page foreground repaint.
   - Delete only the descendant color flips at `src/index.css` lines 1024–1029.
   - Keep the section background remap if needed, but stop it from repainting `text-white` descendants.
   - This directly addresses black/dark text appearing on dark overlay cards.

2. Narrow the global lucide/icon interaction block.
   - Remove `a:has(.lucide)`, `button:has(.lucide)`, and `[role="button"]:has(.lucide)` from hover/active/focus color-changing rules.
   - Keep only non-color transition basics if harmless, and keep `.icon-tile` behavior only for actual icon tiles.
   - Do not touch the vertical sidebar-specific rules; it stays locked as-is.

3. Fix misuse of `.icon-tile` in About cards.
   - Remove `.icon-tile` from full `FeatureCard` containers in `src/pages/About.tsx`.
   - The full card is not an icon tile; only the small icon square should carry icon styling.
   - This is cleanup, not a new rule.

4. Correct the hardcoded About-page contradictions.
   - Dark hero paragraph and transparent hero CTA arrows must be white on the dark image.
   - Champagne-hover button text must be ink only on hover/filled champagne state.
   - Dark overlay market cards must keep white text/icons.
   - No homepage changes.

5. Convert affected raw dark buttons/icons to existing primitives only.
   - For SupportTicketBox and similar visible raw dark CTAs, use the already-existing `.jj-cta-dark` primitive instead of raw `bg-[#1A1A1A] text-white`.
   - This is not adding a rule; it uses the existing locked primitive.

6. Verify visually before saying fixed.
   - Capture screenshots of `/about`, `/market-intelligence`, and `/contact` at the same 1178×891 viewport.
   - Check the exact marked areas:
     - About market overlay cards: white on dark.
     - About service icon squares: white icon on dark, card text ink on champagne.
     - About hero CTAs: readable in idle and hover states.
     - Market Intelligence icon boxes: white icons on navy.
     - Contact consultation icon and support CTA icon/text: readable.
   - Do not change vertical sidebar or homepage contrast.

Files expected to change:
- `src/index.css`
- `src/pages/About.tsx`
- `src/components/SupportTicketBox.tsx`
- Possibly `src/components/market-intelligence/MarketOverviewDashboard.tsx`, `AIMarketInsights.tsx`, and `DataSourcesPanel.tsx` only if visual inspection confirms their icon boxes are still being overridden after the CSS cleanup.