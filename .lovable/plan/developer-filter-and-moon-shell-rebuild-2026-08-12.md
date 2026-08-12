# Developer Filter and Moon Shell Rebuild

## Goal
Keep **Sun exactly as it is**, while rebuilding **Moon** as the proven JBJ Hub visual system: emerald-to-black chrome, pure-white chrome ink, white/pearl page surfaces, mint accents, and graphite content ink. Repair the developer picker and homepage partner strip at their component sources rather than adding more global overrides.

## 1. Rebuild the developer and tier pickers

- Replace the current developer rows with a compact, premium grid that opens directly below its own trigger and never shifts or detaches.
- Give every developer a fixed **square logo tile** with centered, uncropped official artwork; remove the current `micro` rectangular plate treatment.
- Make the include checkbox and exclude/minus box the **same square dimensions**, using the left checkbox size as the geometry reference.
- Preserve clear states:
  - neutral: light surface, graphite name;
  - included: emerald-pair fill with pure-white name and tick;
  - excluded: red minus/outline and red struck-through name.
- Apply the same row geometry, spacing, controls, and interaction behavior to Tiers.
- Remove expensive per-row logo probing/revalidation from the picker path, memoize stable options, and remove avoidable transitions so open, select, exclude, clear, and close respond immediately.
- Keep loading and true-empty states separate so “No developer found” never flashes while data is loading.

## 2. Clean the homepage partner marquee

- Remove every visible logo box, plate, border, shadow, and card background; render only consistently sized transparent developer wordmarks.
- Remove the animated/highlighted heading band and shimmer. The heading becomes static and high-contrast.
- Remove the divider/highlight treatment that creates the bright strip under the hero.
- Keep only the horizontal marquee movement, with reduced-motion support and no hover styling that introduces new boxes.
- Enforce correct artwork contrast by surface without turning developer names or marks black on emerald.

## 3. Remove the homepage search highlight

- Remove the animated emerald halo/glow around the homepage search bar and the green rectangle behind typed/typewriter text.
- Keep a clean white caret and readable text over the hero, with a neutral text-selection color only.
- Preserve the existing filter layout, search behavior, counts, and field alignment.

## 4. Replace Moon inversion with the JBJ Hub visual system

- Stop using the generated broad “repaint every matching colour/class” Moon rules that currently produce incomplete inversions and contrast conflicts.
- Introduce semantic Moon roles based on the existing CRM tokens:
  - vertical sidebar and horizontal header: emerald-to-black gradient;
  - chrome labels/icons/monogram: pure white;
  - content canvas and cards: white/pearl;
  - secondary surfaces: pale mint;
  - content text: graphite/black;
  - active controls: emerald pair with white ink;
  - borders/dividers on emerald: translucent white or emerald, never gold/champagne.
- Apply Moon roles to public page sections and cards by surface role, not by matching hardcoded hex strings. Components that are emerald in Sun will not remain blindly emerald in Moon; they will resolve to the white/mint CRM content family where appropriate.
- Keep Sun rendering unchanged and keep the owner backend skin unchanged.
- Remove the lazy theme flash by ensuring the selected Moon shell tokens are present before the first painted frame.

## 5. Rebuild public navigation for Moon

- Desktop Moon sidebar: mirror the JBJ Hub sidebar proportions, padding, row rhythm, active treatment, white icon/text contrast, and 56px brand header geometry.
- Desktop Moon horizontal utility header: use the same emerald-to-black chrome and white controls as the backend header.
- Mobile Moon header and hamburger drawer: replace the current champagne drawer and black controls with the same emerald Hub structure, spacing, white ink, mint/white content surfaces, and accessible active states.
- Remove rectangular highlight plates from inactive sidebar rows; reserve the Hub-style white translucent active state for the current route.
- Keep the public navigation information architecture and destinations unchanged.

## 6. Finish the backend header account area

- Keep the existing backend shell, sidebar, and content pages unchanged.
- Move the account/profile control to the far-right edge of the header and make it a visible, usable account menu instead of leaving the right side visually empty.
- Keep notifications, calendar, apps, and other utilities immediately before the account control, with stable spacing at desktop and tablet widths.

## 7. Regression protection and visual proof

- Add focused regression checks for square picker logos, equal include/exclude controls, correct active/excluded ink, no partner logo plates, no marquee shimmer, and no homepage search glow.
- Add theme assertions proving Sun is unchanged and Moon uses emerald chrome plus white/mint content surfaces with no champagne/gold leakage.
- Validate with `scripts/qa/shot.py` screenshots at desktop, tablet, and mobile for:
  - homepage Sun and Moon;
  - open Developers and Tiers pickers;
  - partner marquee and hero search;
  - desktop public sidebar/header;
  - mobile hamburger open/closed;
  - backend JBJ Hub header with the account menu at far right.
- Run contrast and no-blue/no-gold-on-emerald audits, plus interaction timing checks for picker open/close and first-click selection.

## Technical details

- Primary picker files: `src/components/search/FilterMultiSelect.tsx`, `DeveloperIncludeExclude.tsx`, `PropertySearchBar.tsx`.
- Logo geometry/performance: add a picker-specific square presentation through `DeveloperLogo.tsx` without changing approved card/logo treatments elsewhere.
- Marquee source: `src/components/DeveloperPartnersMarquee.tsx`; remove component-scoped shimmer CSS and plate-producing wrapper behavior.
- Public shell: `MainLayout.tsx`, `GlobalVerticalNav.tsx`, `GlobalHeader.tsx`, `HorizontalUtilityBar.tsx`, and their scoped styles.
- Theme source: replace the current generated hex/class-matching strategy in `scripts/qa/gen_theme_moon.py` / `src/styles/theme-moon.css` with semantic CRM-inspired shell and surface tokens.
- Backend account alignment: `src/pages/owner/crm/shell/CrmHeader.tsx` and scoped `crmShell.css` only.
