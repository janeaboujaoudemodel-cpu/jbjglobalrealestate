## Plan: fix the global contrast system properly

### 1. Remove the remaining conflicting global contrast architecture

- Keep `src/utils/contrastGuard.ts` as a no-op and remove/ban any runtime repaint hooks permanently.
- Replace the broad late-stage CSS rules in `src/index.css` that target generic `button`, `a`, `span`, `div`, `[role]`, hover states, and arbitrary background classes with a narrower **surface contract**:
  - `data-surface="navy|dark|ink"`, `.surface-navy`, `.surface-dark`, `.image-overlay-dark`, `.glass-dark` → white text, white icons, stable idle/hover/focus/active.
  - `data-surface="page|light|champagne|cream|raised|gold|pearl"`, `.surface-light`, `.surface-champagne`, `.glass-light` → ink/navy text and icons, stable idle/hover/focus/active.
- Remove misleading CSS comments that still reference a runtime engine fixing contrast.
- Preserve the brand rules: champagne-dominant theme, no gray surfaces, gold only as hairline/accent, navy CTAs with white text.

### 2. Strengthen reusable primitives instead of patching one screenshot

Update the reusable components so child content inherits a stable readable foreground from the component itself:

- `Surface`: emit both `data-surface` and matching `.surface-*` class; expose foreground/icon variables for descendants.
- `Button`: replace hover text-color flips with locked variants:
  - dark/navy CTA: white foreground in every state.
  - champagne/outline CTA: ink foreground in every state.
  - hero/media button: no white-to-black foreground flip unless the component is explicitly moved to a light surface primitive.
- `Badge`, `Tabs`, `IconTile`: bind each variant to a known light/dark surface and make icon strokes follow the same foreground token.
- Add/normalize small primitives if needed for overlay cards, glass cards, light cards, and dark chips so pages do not hand-roll contrast.

### 3. Bind the affected reusable sections to those primitives

Refactor the components the user listed, using surface classes rather than `data-no-contrast-guard`, inline color hacks, or hover-only readability:

- Homepage top + `HomeHeroSearch`.
- Recently viewed/property cards and `ProjectCard` chips/buttons.
- Guide/book carousel and book covers (`GuideBookSection`, `BookCoverFace`, `PremiumBookCover`, `BookCard`, `BookShelf`).
- Broker portal preview card and homepage portal cards (`PortalShowcaseCard`, broker/developer/careers wrappers).
- Careers/JBJ visual cards.
- Floating `Contact Us` and `Web Developer` widgets.
- `VerificationBanner` / Get Verified.
- `CookiesConsentBanner` buttons and preference controls.
- Search bars/header search surfaces.
- Generated tiles/cards that reuse `Button`, `Badge`, `Tabs`, `IconTile`, or card primitives.

### 4. Replace unsafe local patterns found in the audit

Specifically address these current code smells:

- `data-no-contrast-guard` used as a visual opt-out on components that should instead declare a real surface.
- `allow-white` sprinkled on light/unknown surfaces.
- `hover:text-*`, `focus:text-*`, or `active:text-*` used without a matching stable primitive.
- Light cards using `text-white` or white SVG strokes.
- Navy/dark/glass cards using `text-foreground`, `text-[#1A1A1A]`, or low-opacity dark text.
- Cookie banner buttons that flip to dark background/white text on hover instead of staying on one readable primitive.
- Portal modules with `bg-[hsl(var(--background)/0.10)] text-white` ambiguity; make them explicit dark glass or light glass.

### 5. Add regression checks that fail automatically

Add/extend contrast scripts and wire them into `check:contrast` / `check:contrast:pr-gate`:

- Fail if `installContrastGuard()` is imported/called or if `MutationObserver`/mouseover/focusin/pointerdown route repainting is reintroduced for contrast.
- Fail on broad `!important` generic selectors in `src/index.css` that target generic `button`, `a`, `span`, `div`, `nav`, `[role]`, `[aria-*]`, `[data-active]`, or hover class matching for foreground colors.
- Fail if reusable components contain white-on-light or dark-on-dark class combinations.
- Fail if hover/focus/active changes only foreground polarity without an approved surface primitive.
- Fail if icons use white/faded strokes on light surfaces or low-opacity dark strokes on dark surfaces.

### 6. Validation before calling it complete

After implementation, I will visually verify in the live preview, not ask you to report one section at a time:

- Desktop and mobile.
- Homepage top and search bar.
- Recently viewed/property cards.
- Guide/book carousel and book covers.
- Broker portal visuals.
- Careers/JBJ visual cards.
- Get Verified banner.
- Floating Contact Us and Web Developer widgets.
- Cookie banner/buttons.
- States: idle, hover, focus, after scroll, and after waiting 5 seconds.

I will only report completion after the preview screenshots/observations show stable readable contrast across those targets.

Approved, but do not mark complete after checking only one or two sections.

&nbsp;

Important: the main issue is still global instability and wrong foreground inheritance. Fix the root CSS/primitives first, then verify all listed sections visually.

&nbsp;

Do not use runtime repainting, broad `!important` hacks, or hover-only readability. Every reusable component must have a stable surface contract: dark/navy = white text/icons, light/champagne/cream/gold/pearl = ink/navy text/icons.

&nbsp;

Completion is only accepted after live visual proof across homepage, broker visuals, careers/JBJ visuals, property cards, guide/book covers, Get Verified, cookie banner, floating widgets, search bars, idle, hover, focus, scroll, and 5-second wait.