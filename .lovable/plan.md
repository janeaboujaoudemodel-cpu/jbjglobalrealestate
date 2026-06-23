## Gate 1 Emerald Fix Plan

1. **Replace the remaining light-green sources globally**
   - Remove/override every remaining `#047857`, `#059669`, `#10b981`, `#34d399`, `emerald-300`, and light emerald gradient use on interactive emerald surfaces.
   - Set the single official primitive to the dark Mode Broker/AED style only: dark emerald into near-black/black.
   - Make `--jj-emerald-ombre`, `--jj-emerald-ombre-hover`, `--jj-emerald-light-ombre`, `--gradient-emerald`, and all legacy emerald helpers resolve to the same dark primitive, not a lighter hover variant.

2. **Hard-lock the specific failed items from the screenshots**
   - Heart button.
   - Shortlist button.
   - Add Badge button.
   - Email / Call / Chat card buttons.
   - Explore Our Guides book icon.
   - View Library / View Full Library.
   - AI Property Comparison icon tile.
   - Mortgage slider filled track, knob, and “Try Our AI Mortgage Calculator”.
   - Sidebar collapsed hover state.
   - Ready To Get Started WhatsApp / Call Us / Email cards.

3. **Make Ready To Get Started contact cards metallic animated**
   - Apply the same official dark emerald primitive.
   - Add one clean metallic sweep animation using the existing emerald metallic primitive pattern.
   - Keep white icons/text at rest and hover.

4. **Fix component-level inline overrides that beat CSS**
   - Remove or replace inline styles still forcing light emerald gradients/backgrounds in affected components.
   - Use the official `jj-emerald` / `jj-emerald-metallic` primitive classes only.
   - Ensure no `data-no-contrast-guard` or inline icon color causes black icons on emerald surfaces.

5. **Visual validation only after edits**
   - Use Playwright screenshots after refreshing the live preview.
   - Capture zoomed screenshots for each circled group: property card actions, guide section, AI comparison card, mortgage slider/CTA, footer Ready To Get Started cards, and sidebar collapsed hover.
   - Inspect computed backgrounds and screenshot pixels; repeat fixes until no light/static green remains on emerald controls.

## Technical scope

- Primary files likely affected: `src/index.css`, `src/components/home/HomepageBookMarquee.tsx`, `src/components/tools/AnimatedShineCTA.tsx`, `src/components/support/ChannelCard.tsx`, and any component discovered with inline light-green overrides for the circled controls.
- No new emerald variants will be created. Existing legacy names will be aliased to the single official primitive.