Plan to fix the Broker Toolkit properly:

1. Simplify the Broker Toolkit page
- Remove the oversized/duplicated “Discover All Free Tools”, category-repeat grids, “Unlock More with Broker Hub”, referral promo, and extra bulky sections that make the page huge.
- Keep the page focused on brokers: hero, compact stats, one clean tools grid, training/academy summary, CRM/portal CTA, and final join/access CTA.
- Replace all dark neon/purple/blue/green card layers with the approved champagne/gold/ink design system.

2. Make broker tools match the vertical sidebar exactly
- Use only the tools currently shown under vertical sidebar “Tools & Workspace”:
  - AI Home Finder
  - Property Comparison
  - Mortgage Calculator
  - Property Evaluator
  - Rental Index
  - Property Measurement
  - List Property for Sale
  - List Property for Rent
- Remove the old broker-toolkit-only tools from the broker page: Design Studio, Video Builder, Video Meet, Documents, Spreadsheet, E-Sign, CRM shortcut, social tools, photo tools, etc.

3. Connect the broker toolkit to backend visibility control
- Add/confirm visibility rows in `ai_tool_visibility` for the exact sidebar broker tools.
- Update the broker toolkit tools grid to use `useToolVisibility()` so only tools marked `public` appear.
- Keep owner control inside the existing owner AI Tools Control Panel only; no visibility toggle will appear on the public broker toolkit page.
- If the owner hides a tool, it disappears from Broker Toolkit; if set public, it appears.

4. Fix contrast and alignment everywhere
- Rebuild broker cards with consistent fixed height, left-aligned text, equal spacing, readable ink text, gold IconTile icons, and non-faded descriptions.
- Fix section titles, badges, CTAs, and card content so there is no white-on-light, ink-on-dark, faded gold, or raw gray.
- Use standardized CTA primitives (`jj-cta-dark`, `jj-cta-outline`, `jj-pill-active`) and approved colors only.

5. Clean navigation and section flow
- Update in-page navigation to only real sections: Tools, Academy, CRM, Growth.
- Remove links/buttons pointing to deleted/duplicated concepts like Broker Hub.
- Make Broker Portal CTAs route to `/broker/portal` and JBJ Academy text stay consistent.

6. Technical files expected to change
- `src/components/broker-toolkit/BrokerToolkitTools.tsx` — replace with compact visibility-filtered tool grid.
- `src/pages/BrokerToolkit.tsx` — remove redundant section list and reorder sections.
- `src/components/broker-toolkit/BrokerToolkitNavigation.tsx` — reduce navigation to the remaining sections.
- `src/components/broker-toolkit/BrokerToolkitStats.tsx` — update counts to match the real visible tools.
- `src/components/broker-toolkit/BrokerToolkitEducation.tsx`, `BrokerToolkitAcademy.tsx`, `BrokerToolkitCRM.tsx`, `BrokerToolkitGrowth.tsx`, `BrokerToolkitCTA.tsx` — clean contrast and spacing or simplify where needed.
- `src/components/navigation/GlobalVerticalNav.tsx` and/or shared config — prevent future mismatch between sidebar tools and broker toolkit tools.
- A database migration only if needed to seed/normalize the exact broker tool visibility IDs.

7. Validation
- Visual check `/broker-toolkit` desktop and mobile.
- Confirm only the sidebar Tools & Workspace tools appear on Broker Toolkit.
- Confirm hidden tools are filtered by backend visibility.
- Confirm contrast/readability and card alignment across hero, stats, tools, academy, CRM, growth, and final CTA.
- Check console/network for errors after the changes.