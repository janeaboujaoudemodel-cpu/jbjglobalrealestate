I will make the requested visual corrections only on non-homepage content and validate them with screenshots before making any completion claim.

Scope locks:
- Do not touch the homepage.
- Do not touch the vertical sidebar.
- Do not touch the horizontal header.
- Do not touch the footer.
- Keep existing card/content padding rules intact; only hero media bands go edge-to-edge.

Implementation plan:
1. Fix the project hero width source
   - Update the winning CSS that currently neutralizes full-bleed behavior at the end of `src/index.css`.
   - The issue is that the final `section.jj-project-hero` rule overrides the earlier full-bleed breakout by forcing `width: 100%` and `margin: 0`, so the hero stays inset inside the content area instead of expanding to the post-sidebar viewport edge.
   - Replace it with a higher-specificity rule that uses the existing sidebar-aware gutter variables: negative left/right margins and `width: auto`, so the photo starts immediately after the sidebar and reaches the right edge.
   - Apply the same final lock to `jj-hero-fullscreen` / hero-marked sections on non-homepage pages, without changing normal cards.

2. Fix only contrast rules that are still winning incorrectly
   - Add a final, explicit surface contract in `src/index.css`:
     - Emerald backgrounds/surfaces/buttons/tabs/badges: pure white text and icons.
     - Champagne/gold backgrounds/surfaces/cards: black ink text and icons.
   - Make the selectors target surfaces and their children so black text inside emerald controls and white text inside champagne/gold cards cannot win from older Tailwind/component classes.
   - Preserve dark/photo hero white text and opt-out attributes already used in the project hero.

3. Scan affected non-homepage pages/components for direct broken classes
   - Search for remaining `text-white` on champagne/gold surfaces and black/ink text on emerald surfaces.
   - Patch only clear offenders related to the requested contrast issue.
   - Do not refactor unrelated UI or change navigation/footer/homepage code.

4. Visual validation before reporting
   - Use Playwright at the requested route `/project/elwood-sobha-realty-dubailand` and at least one additional non-homepage hero route.
   - Capture screenshots for desktop/laptop/tablet/phone sizes.
   - Check the rendered DOM measurements: hero left edge equals the post-sidebar content edge, hero right edge equals viewport right edge, and no card sections were expanded edge-to-edge.
   - Check contrast samples from emerald and champagne/gold surfaces using computed styles.
   - If any screenshot still shows inset hero media or wrong contrast, continue patching before reporting.