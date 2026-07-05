I’ll fix only the issues you listed, then validate them visually with Playwright screenshots and interaction timing.

Plan:

1. Reproduce and capture the current failures first
   - Homepage: hero/filter white border, “Choose your category” section, Handpicked For You card count, project card image fit, CTA animation visibility.
   - Developer pages: /developer/damac and /developer/kingdom-by-mag filter dropdowns, payment dropdown, project card buttons, developer-name shine, map behavior.
   - Sidebar: collapsed Sign In / Sign Out button shape compared with Collapse.

2. Fix slow filter dropdown open/close at the root
   - Simplify the filter popover rendering path so Price, Payments, Property Type, and other dropdowns open/close instantly.
   - Remove conflicting/duplicated heavy contrast override blocks that are causing style recalculation and broken text colors.
   - Keep dropdown surfaces champagne with black text, and active emerald selections with pure white text.

3. Fix homepage section and border issues
   - Remove the “Choose your category” section completely from the homepage render path.
   - Remove the white border/gap above the homepage filter/hero area without changing unrelated hero content.
   - Ensure homepage/project card photos fill the image area with no visible white empty strip.

4. Restore metallic animation everywhere requested
   - Restore visible continuous metallic sweep on ProjectCard Email / Call / Chat buttons everywhere ProjectCard appears, including Handpicked For You and developer/project grids.
   - Restore the same animated effect on Ready to Get Started WhatsApp / Call Us / Email tiles wherever that shared CTA appears.
   - Add the shine/metallic effect back to developer names on project cards without reintroducing unwanted underlines.

5. Restore six Handpicked cards on desktop
   - Ensure Handpicked For You renders six project cards on desktop while keeping mobile/tablet behavior intact.
   - Verify the grid visually at desktop width.

6. Fix map loading/runtime issue
   - Address the Leaflet `_leaflet_pos` runtime error by hardening map mount/unmount and disabling the unstable zoom transition path where needed.
   - Make developer/project maps feel faster and avoid delayed/broken map interactions.

7. Fix collapsed sidebar Sign In / Sign Out shape
   - Make Sign In and Sign Out match the Collapse button size, border radius, border treatment, and edge alignment in the vertical sidebar.

8. Validate visually and technically
   - Use Playwright as a user: navigate, click dropdowns open/close, click payment/property type filters, inspect homepage, developer pages, cards, CTA section, sidebar, and maps.
   - Save screenshots for proof of: dropdown contrast/open state, no homepage category section, no white hero/filter border, six desktop cards, animated CTA/developer-name surfaces, sidebar button match, and map loaded without runtime error.