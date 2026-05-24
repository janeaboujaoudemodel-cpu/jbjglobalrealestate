## Recommendation (asked: white vs crystal-transparent search bar?)

**Crystal-transparent wins.** On a photographic / textured hero it reads more premium because the underlying image bleeds through and the bar feels like cut glass, while the white pill currently fights the hero photo and creates that split where the input half looks chalky white and the Search half looks like a separate dark sticker glued in the middle. Going fully transparent crystal also unifies the bar with the inline CTAs, the Concierge drawer and the Support panel — they're all the same champagne-glass family, so the hero stops looking like three different components stitched together.

That is what this plan implements.

## 1. Vertical sidebar — default collapsed + instant expand tooltip + onboarding hint

`src/components/navigation/GlobalVerticalNav.tsx`

- Change the `collapsed` initial state so the sidebar **defaults to collapsed for everyone on first load** (only override when the user explicitly toggled it before). New logic: read `localStorage.jj_nav_collapsed`; if absent, default to `'1'` (collapsed) and write it back, so the chrome stays narrow until the user opens it.
- Wrap the bottom "Expand navigation" button in a real `<Tooltip>` (Radix) instead of relying on the native `title` attribute (which has a ~700 ms browser delay). Set `delayDuration={0}` on a local `<TooltipProvider>` around just this trigger so the "Expand navigation" label appears the instant the cursor enters — no waiting. Keep `side="right"` so the tooltip floats out into the page, not behind the nav.
- Tag the button with `data-tour-target="sidebar-expand"` so the onboarding tour can spotlight it.
- Add an idle gold pulse ring around the expand button while the sidebar is collapsed AND the onboarding tour hasn't been completed (`localStorage.jj_tour_completed !== '1'`). The pulse stops the first time the user hovers/clicks it.

`src/components/GuidedTour.tsx`

- Prepend a new spotlight step at the start of `SPOTLIGHT_STEPS`:
  - `target: '[data-tour-target="sidebar-expand"]'`
  - Title: **"Open the full navigation"**
  - Description: *"This is your sidebar. It stays tucked in so the page stays clean — tap the gold arrow here any time to expand the full menu, and tap it again to tuck it back in."*
  - `pulse: true`
- No changes to tour completion logic — the existing `jj_tour_completed` key still gates the pulse and tour replay.

## 2. Floating right-edge UI — align Talk-to-us, Page nav arrow and Phone CTA into one premium stack

The "Talk to us" tag, the up/down arrow, and the Phone Call card today live in three different files, three different sizes, three different x-positions. Unify them.

`src/components/PageNavigation.tsx` (the up/down arrow)

- Rewrite the trigger as a **premium gold-ringed circular pill** that matches the dimensions and styling of the right-edge "Talk to us" launcher:
  - Same diameter as the support tag's icon area (`h-11 w-11` desktop, `h-10 w-10` mobile)
  - Champagne-glass background (`bg-[#FDFBF7]/85` with `backdrop-blur(14px) saturate(140%)`), 1px gold hairline border `border-[#B89555]/65`, gold icon `text-[#B89555]`, soft shadow.
  - Hover: border tightens to `border-[#B89555]`, background lifts to `#EFE6D6`, icon stays gold, lifts 1px (no color flip to ink — keep the gold premium).
  - Active/click ripple just scales 0.96.
- Fix vertical alignment: pin it at `right-4` (matches the support tag's right offset) and `bottom-24` so it sits **directly under** the right-edge support stack instead of floating at an unrelated offset. RTL mirrors to `left-4`.
- Fix the "not working" arrow: the click handler is fine, but the small icon + transparent button made it look unresponsive. The new larger pill click target plus visible hover state will make the click obvious. Also bump the visibility threshold from `> 200` to `> 120` px scrollable so it appears sooner on shorter pages, and switch the direction flip from `0.6` to `0.5` so it's predictable.
- Keep the auto-hide-when-drawer-open behavior intact.

`src/components/support/SupportLauncher.tsx`

- Add a single shared right-edge column wrapper so the launcher tag, the up/down arrow, and (when the panel opens) the Phone card are all anchored to the same `right-4` axis. No layout rewrite — just normalize `right` offsets and z-index so PageNavigation and SupportLauncher visually share a stack.
- Keep the existing "Talk to us" vertical tag, but make sure its hover state mirrors the new arrow (gold ring tightens, no color flip, gold stays gold).

## 3. Hero search bar — full-transparent crystal, full-bleed Search, premium hover

`src/components/home/HomeHeroSearch.tsx`

- Replace the current white→champagne gradient on the outer shell with a **single uniform crystal-glass** background that matches the page hero:
  - `background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 100%)`
  - `backdrop-filter: blur(18px) saturate(160%)`
  - 1px gold hairline border `border-[#B89555]/55`
  - inset highlight on top and faint gold hairline on bottom for the cut-glass feel
- Make the input transparent end-to-end: `bg-transparent`, text white `#FDFBF7`, placeholder `rgba(253,251,247,0.65)`. (Hero is dark photo, so white text is correct here and the universal contrast guard already exempts `data-no-contrast-guard`.)
- **Search button** — make it actually look like a full-edge segment, not a pin:
  - Stretch with `h-full w-auto self-stretch px-6 lg:px-8` and remove the inner gradient halo that made it look like a sticker. Use a flat obsidian `#1A1A1A` with a 1px inner gold hairline on the left edge (`shadow-[inset_1px_0_0_rgba(184,149,85,0.45)]`).
  - Round only the right corners to match the shell: `rounded-r-2xl`.
  - Text white, arrow white, forced inline `color: #FFFFFF` (keep what's there).
  - Hover: keep the obsidian background but pull a **gold underline** under "Search" and shift the arrow 2px right. No fading — title stays solid white, gold accent appears.
- **Book a Free Consultation** pill — fully transparent crystal segment (`bg-transparent`, gold left hairline divider), ink text. Hover: text turns gold `#B89555` (not faded), background lifts to `rgba(239,230,214,0.18)`, gold left hairline brightens. Icon stays gold both states.
- **Ask Concierge** pill — shrink to a more discreet premium chip:
  - Rename label to **"Concierge"** (per project memory: "never AI Concierge — always just Concierge or JBJ Concierge"). The full "Ask Concierge" string takes too much room on a one-line bar.
  - Smaller font (`text-[12px] lg:text-[12.5px]`), tighter padding (`px-3 lg:px-4`), `Sparkles` icon stays gold.
  - Same transparent crystal segment as Book button, rounded right corners.
  - Hover: text turns gold, faint gold ring inside the segment animates in. Title NEVER fades.
- Divider rules between segments use 1px `border-[#B89555]/55` left-hairlines so the bar visually reads as one continuous crystal pill divided by gold seams — no color split, no white half / dark half mismatch.
- Mobile stacked fallback row (visible `sm:hidden`) gets the same hover treatment: title color goes gold on hover, background lifts to cream, never fades.

## 4. Global hover rule going forward

Add a short comment block at the top of `HomeHeroSearch.tsx` documenting the project rule we're applying: **"Hover states must keep the title visible. Use gold (`#B89555`) or ink (`#1A1A1A`) to elevate the label — never fade or hide it."** This is a code-level note so future edits don't regress.

## Files changed

- `src/components/navigation/GlobalVerticalNav.tsx` — default-collapsed, instant tooltip on expand button, `data-tour-target` hook, conditional pulse.
- `src/components/GuidedTour.tsx` — new first spotlight step for the sidebar expand control.
- `src/components/PageNavigation.tsx` — rebuilt as premium gold-ringed circular pill, aligned with support stack.
- `src/components/support/SupportLauncher.tsx` — minor offset normalization so the right-edge stack lines up; hover parity.
- `src/components/home/HomeHeroSearch.tsx` — full-transparent crystal shell, full-bleed Search segment, smaller "Concierge" pill, fixed hover states.

No schema changes. No new routes. No memory writes required.

## Verification

1. Hard-reload home page → vertical sidebar is collapsed. Hover the gold expand arrow at the bottom of the sidebar → "Expand navigation" tooltip appears with **zero delay**. A subtle gold pulse ring draws attention to it until the tour is completed.
2. First-visit users: the guided tour opens with the **sidebar expand button** as the first spotlight step.
3. Scroll the home page down 300 px → the up/down floating arrow appears, gold ring, same right-edge column as the "Talk to us" tag, hover keeps the gold solid (no fade), click smoothly scrolls.
4. Hero search bar reads as one continuous crystal pill with gold hairline seams; no white-vs-dark split. Search button fills the right edge full height. "Concierge" is a compact premium pill. Hover any of the inline CTAs → title turns gold, never disappears.
