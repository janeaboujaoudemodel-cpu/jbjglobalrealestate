I will implement this in controlled batches and verify each batch in the browser before moving on.

Batch 1 — Billing & Subscriptions fully wired
- Create/upgrade the Billing & Subscriptions page into a real account page with SEO metadata.
- Keep `/account/billing` behind login and keep `/billing` redirecting to it.
- Fix the vertical sidebar MY ACCOUNT behavior so Billing & Subscriptions and Brand Update stay visible when MY ACCOUNT is expanded.
- Remove the current rule that collapses MY ACCOUNT immediately after clicking one of its entries.
- Add Billing & Subscriptions to sitemap and SEO config.
- Validate by opening the expanded vertical sidebar and clicking Billing & Subscriptions.

Batch 2 — Remove white page gutters and restore full edge-to-edge layers
- Fix the main layout wrapper so public pages no longer sit inside the extra white/champagne gutter container.
- Make the page layer stretch from the vertical sidebar line to the right edge.
- Keep individual cards at their existing widths; only the background layer/strap expands.
- Apply this to homepage and shared public-page shell without breaking standalone dashboards/portals.
- Validate hero, developer marquee, services, handpicked cards, continue searching, overseas investors, guides/reports, and footer at desktop.

Batch 3 — Homepage straps and portal color separation
- Keep Get Verified in its current dark/black style.
- Make the Mode Portal strip a distinct lighter emerald ombre, not the same tone as Get Verified and not flat green.
- Ensure these strap sections are edge-to-edge: Continue Searching, Invest in Dubai from Anywhere, Explore Our Guides & Reports.
- Preserve normal cards as padded cards.
- Validate with screenshots on homepage mid-scroll.

Batch 4 — Approved emerald lock, no random green
- Add a single approved emerald/black ombre token/class system in global CSS.
- Replace flat green title/icon/button styling with the same approved emerald ombre used by Contact Us / Explore Areas CTAs.
- Lock sidebar section accents, footer titles, titles/icons, pills, and relevant CTAs to this approved emerald style.
- Avoid changing semantic red/blue/amber data colors where they are required.

Batch 5 — Hero search contrast and CSS winner rule
- Inspect and override the rule currently fading the hero search/filter bar.
- Force visible input text, placeholders, labels, icons, and search button states.
- Keep the search bar premium and readable on the dark hero.
- Validate normal, hover, focus, and typed text states.

Batch 6 — Handpicked project contact buttons
- Fix Email / Call / Chat buttons on project cards so they are emerald ombre with white text and white icons on normal load.
- Keep hover/focus readable with the same white text/icons, not faded or inverted.
- Add a stronger winning selector if current CSS guard overrides them.
- Validate on the Handpicked For You cards.

Batch 7 — Stay in the Loop newsletter upgrade
- Upgrade the compact newsletter input to an emerald filled bar with white text.
- Add animated type/delete placeholder behavior for “Enter Your Email”.
- Add emerald neon/glow border and matching glowing submit button.
- Keep submit icon white with a subtle 3D/glow effect.
- Validate the footer/Ready section newsletter at desktop and mobile.

Batch 8 — Final E2E screenshot proof
- Test and screenshot four viewports: desktop, laptop/tablet, mobile tall, mobile small.
- Proof points: sidebar billing visible, Billing page route works, hero search contrast, edge-to-edge layers, portal color separation, project-card contact buttons, newsletter glow, footer/sidebar emerald accents.
- Report only verified results and screenshots; no claims without browser proof.