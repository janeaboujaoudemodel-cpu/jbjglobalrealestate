## Plan

1. **Replace the scattered project-page patches with one global project detail shell rule**
   - Make `.jj-project-band > .jj-project-shell` the single constrained content container.
   - Match homepage section gutters on mobile, tablet, desktop, sidebar-open, and sidebar-collapsed states.
   - Keep only background bands full-bleed; cards/widgets never touch the viewport or cross the sidebar.

2. **Fix the project hero contrast and white-line artifact**
   - Strengthen the hero bottom overlay and remove the visible stray white divider/line from hero CTA/breadcrumb/link states.
   - Keep all hero title, price label, developer, metadata, icons, breadcrumbs, and CTAs pure white on the dark/photo hero.
   - Preserve the approved photo-led hero, not a card-based hero.

3. **Restyle Payment Plan as locked emerald**
   - Convert the Payment Plan title/header area to dark emerald/black ombre with pure white title and icon.
   - Replace unapproved green/bright utility classes in the payment progress bar, booking circle, milestone dots, and verification badges with approved emerald tokens.
   - Ensure any percentage/circle content inside emerald is pure white and visibly centered.

4. **Repair brochure and presentation CTAs/cards**
   - Make Project Brochure / Generate Presentation action surfaces use approved emerald gradient with pure white text/icons.
   - Fix the Generate Presentation card readability by removing competing gold/black text rules on the dark card and using the same premium button animation as the homepage.

5. **Fix Project Documents, DLD, and affected lower sections globally**
   - Wrap/normalize nested full-width sections so Project Documents, DLD Market Widget, Register Interest, and bottom related sections respect the same global project gutter.
   - Remove local `w-full px-*` layout overrides that bypass the global container.
   - Prevent horizontal overflow and sidebar overlap in both expanded and collapsed vertical navigation modes.

6. **Manual visual validation**
   - Use Playwright as a real user on `/project/:slug`.
   - Capture screenshots for: hero, quick facts/first content band, payment plan, project documents/generate presentation, DLD/lower sections, and sidebar collapsed/open layout.
   - Check rendered contrast by scanning emerald/dark surfaces for non-white text/icons where white is required, and check horizontal overflow/card edge collisions before reporting completion.