I will fix this as a shared design-system/navigation repair, not as isolated page patches.

1. Global CTA/button contract
- Replace the current over-aggressive `width: max-content` button rule with a safer global rule:
  - labels never clip or truncate
  - buttons can still fit inside cards, grids, and the horizontal header
  - mobile `w-full` buttons still fill their row
  - icons stay visible and white on emerald/dark CTAs
- Standardize primary CTAs to the approved emerald-to-black gradient with pure white text/icons.
- Remove/neutralize old navy/blue/black button remnants that are causing faded text or blue buttons.

2. Global icon tile contract
- Enforce one reusable icon visual: dark emerald/black gradient container, pure white icon.
- Replace local champagne/white icon boxes in Market Intelligence and Careers with `IconTile`.
- Scope exceptions only to semantic data states where required; normal UI icons will not use pale/blue/gold boxes.

3. Vertical sidebar active-state repair
- Fix active-section logic so only the actual current route/section is highlighted.
- Stop both `Insights & Guides` and `Broker & Academy` from appearing active at the same time.
- Fix cropped sidebar labels/lines by adjusting expanded item sizing, wrapping, and overflow rules.
- Change navigation icons as requested:
  - Careers: suitcase/briefcase-style icon
  - Services: concierge/support-style icon, not suitcase
  - Broker & Academy: keep graduation cap icon

4. Horizontal header repair
- Rebalance utility pills (`sq ft`, `sq m`, currency, Mode) so they do not compress the account/profile button.
- Ensure the profile/account control is visible after `Mode: Broker` instead of being squeezed out.
- Keep the header responsive without full-page layout breakage.

5. Dropdown/select/popover repair
- Fix country picker and global dropdown hover/selected states:
  - champagne dropdown surface = readable black text
  - hover/selected state = approved emerald/black gradient with white text/icons
  - no faded white-on-champagne rows
- Audit shared Radix/select/cmdk rules so the same issue does not recur in other dropdowns.

6. Market Intelligence rebuild pass
- Replace local icon boxes in dashboard KPI cards, quarterly trends, area cards, and AI narrative card with the global emerald `IconTile`.
- Fix KPI change badges so they do not touch or overlap icons.
- Align area-card buttons to the bottom consistently and keep `View Area Details` readable.
- Remove fake/extra green dividers between sections; retain only approved champagne/gold surfaces and spacing.

7. Careers page rebuild pass
- Fix hero CTAs (`Explore Open Positions`, `Chat with Jessica`) so emerald CTAs have pure white text/icons and champagne CTAs have ink text.
- Fix `Meet Jessica` avatar circle and CTA contrast.
- Fix Open Positions dark emerald section so headings, chips, count pill, selected/apply buttons, and search stay readable.
- Fix selected state so `Selected` is not a compressed broken pill.
- Add/restore the Continue arrow icon on the right and keep it white.
- Fix application step chips/buttons and phone dropdown readability.
- Fix Broker Growth Ecosystem cards: emerald icon tiles with white icons, no pale icon boxes.
- Fix FAQ/question expansion arrow/icon contrast and alignment.

8. Services, Guides, and Insights alignment pass
- Apply the same shared card/button/icon primitives to visible service/guide/insight card grids.
- Fix card content alignment where text/buttons are drifting or clipped.
- Ensure no old blue/purple UI styling remains on these public pages.

9. Validation before reporting complete
- Use Playwright as a real user on desktop/tablet/mobile routes:
  - `/`
  - `/careers` or `/join`
  - `/market-intelligence`
  - `/market-intelligence/overview`
  - `/market-intelligence/areas`
  - `/services`
  - `/guides`
  - FAQ section on careers
- Capture screenshots of the repaired areas.
- Check computed contrast for emerald CTAs/icons and champagne surfaces.
- Verify no button label clipping, no missing account/profile in header, no duplicate sidebar active state, and dropdown rows remain readable in idle/hover/selected states.