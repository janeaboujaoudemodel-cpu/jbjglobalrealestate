I will complete the pending items one by one and only mark each item done after browser validation.

1. Restore metallic animation on CTA buttons/cards
- Re-apply the continuous emerald metallic sweep to Email / Call / Chat buttons in ProjectCard, including the Handpicked For You section because it uses ProjectCard.
- Re-apply the same continuous metallic animation to the Ready to Get Started contact tiles in CombinedContactNewsletter and any matching global CTA tiles using DirectContactCTA where applicable.
- Ensure icons/text remain pure white on emerald.

2. Restore developer-name underline in cards
- Add back the gold underline/border under the developer name in ProjectCard / DeveloperLink only where project cards need it.
- Keep the separate developer detail page title/link underline removal unchanged unless it is part of the card display.

3. Fix filter search pill and dropdown contrast from the root
- Remove the faded/inner-filter look from the “Search area, project…” pill so it is one clean emerald pill with pure white text/placeholder and no internal extra border.
- Replace fragile contrast overrides with a single root-level filter dropdown contract:
  - Champagne dropdown surface = black text.
  - Emerald selected/active pills = pure white text/icons.
  - No black text on emerald and no faded white text on champagne.
- Apply this to Price, Payments, Handover, Property Type, Bedrooms, and advanced filter dropdowns.

4. Make dropdown opening fast site-wide
- Remove any popover animations/transitions and expensive effects used by filter dropdowns.
- Keep popovers mounted/positioned with minimal collision work where safe.
- Reduce heavy CSS/box-shadow/layout-thrashing on filter rails/dropdowns.
- Validate click-to-open timing in browser by opening Price, Payments, Handover, and Property Type and recording elapsed times.

5. Fix slow scroll and heavy card behavior
- Remove expensive hover/prefetch behavior from every ProjectCard that triggers detail-page imports on hover/focus.
- Reduce costly always-running shadows/animations where they hurt scroll performance, while keeping the requested metallic CTA/card animations.
- Validate scroll responsiveness in browser on home, developer detail, and project detail pages.

6. Fix mortgage calculator duplicate Property Price control
- Remove the emerald Property Price input/button in the full mortgage calculator layout.
- Keep only the Property Price title/value and slider.
- Align the four pickers/sliders together: Property Price, Down Payment, Interest Rate, Loan Term.

7. Match developer page logo frame animation to project page developer frame
- Make the developer page logo/frame use the same metallic frame treatment as the project page developer frame.
- Validate on `/developer/majid-al-futtaim` with screenshot.

8. Speed up brochure monogram logo loading
- Audit brochure/logo usage and replace delayed-loading logo behavior with eager/preloaded inline/local asset behavior where the brochure renders the JBJ monogram.
- Validate that the brochure view shows the monogram immediately after opening.

Validation proof I will produce after implementation
- Screenshot: Handpicked For You cards showing Email/Call/Chat metallic CTA buttons and restored developer underline.
- Screenshot: Ready to Get Started card showing metallic animated contact tiles.
- Screenshot: Project detail filter bar showing clean emerald search pill with white text/no inner border.
- Screenshot: Price, Payments, Handover, and Property Type dropdowns showing correct contrast.
- Screenshot: Mortgage calculator with four aligned sliders and no duplicate Property Price emerald input.
- Screenshot: Developer detail page showing matching metallic developer logo frame.
- Timing logs from browser validation for dropdown opening and scroll checks.