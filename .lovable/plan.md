I verified the live preview with screenshots/navigation. The current failures are real: the sidebar account entry is hidden by section behavior/scrolling, services/tool headers look merged, homepage full-bleed wrappers are creating wrong layers and huge blank lazy placeholders, the mortgage CTA route is fragile, footer/sidebar emerald accents are incomplete, and the hero search/filter contrast needs correction.

Plan:

1. Vertical sidebar: make Billing & Subscriptions actually visible
- Keep the canonical account shortcut list.
- In `GlobalVerticalNav.tsx`, change the MY ACCOUNT behavior so clicking it expands normally and does not immediately collapse on account navigation state.
- Ensure `Billing & Subscriptions` and `Brand Update` render inside the visible MY ACCOUNT section, not only in the flyout/hidden list.
- Improve MY ACCOUNT/sidebar title accents to emerald where requested, while keeping readable ink labels on champagne.

2. Services and AI tools tabs: premium emerald, not split/merged
- Update `ExploreServicesExpander.tsx` and `ToolkitShowcaseCard.tsx` so the top header and horizontal tab strip are visually separated by a soft light divider/gap.
- Remove the active-tab underline effect.
- Make active tabs a refined lighter ombre pill with distinct emerald/champagne tones, not half-black/half-green.
- Keep inactive labels/icons white on emerald.
- Remove any “Buy Property” underline behavior and give it the requested ombre active background.

3. Homepage band/card system: one full-width layer behind padded cards
- Adjust `PremiumSectionCard`/homepage usage so only the background layer/band is edge-to-edge from the sidebar line to the right edge.
- Keep actual cards padded left/right inside the layer.
- Apply full-width behavior only to hero and named bands/straps: partners developer marquee, Get Verified/User Portal, Continue Searching, Overseas Investors, Guides/Reports, and similar full strips.
- Keep cards like Mortgage Calculator, JLT/Hub cards, Handpicked/Featured Listings, Explore Our Services, and tools inside padded content, with one background layer only.
- Remove extra visible stacked layers behind cards.

4. Get Verified / User Portal / Ready section
- Change the Investor/Broker/Developer portal strip away from champagne to a lighter emerald ombre, distinct from the dark emerald CTA.
- Make the “Ready to Get Started?” section smaller and more premium on desktop and mobile.
- Match newsletter titles/line accents to emerald styling.

5. Mortgage calculator CTA and loading/blank-section issue
- Fix “Try Our AI Mortgage Calculator” to route reliably to `/mortgage-calculator` and not feel broken.
- Reduce the huge blank placeholders from lazy sections so the page no longer appears stuck with massive empty beige areas before footer.
- Keep lazy loading but use realistic reserved heights/root margins for homepage sections.

6. Footer and sidebar emerald promotion
- Keep footer background champagne as requested.
- Change footer link/title accents to emerald.
- Apply matching emerald title accents in the vertical sidebar without making labels low contrast.

7. Hero homepage filter/search contrast
- Improve contrast inside the hero search/filter bar so text/buttons are readable and premium.
- Preserve the full-bleed hero stopping at the vertical sidebar line.

8. Verification pass after implementation
- Use browser screenshots after changes at desktop and mobile.
- Check expanded sidebar MY ACCOUNT, homepage services/tools tabs, mortgage CTA navigation, footer styling, and the blank-gap issue.
- Report exactly what was verified, without claiming anything not checked.