## Strict ordered implementation plan

I will complete these in order and will not move to the next block until the current block is fixed and validated with screenshots.

### 1. Global form border and field surface lock
- Replace black/gray borders across form fields, selects, phone inputs, popovers, dialogs, mortgage inputs, and lead forms with soft gold borders.
- Lock all standard form surfaces to champagne/cream backgrounds with ink text.
- Fix country, nationality, language, bedroom, size, timeline, and contact-method dropdowns globally so they use premium champagne surfaces, soft-gold borders, readable row height, larger icons/flags, and no black borders.
- Validation: open project forms, country picker, nationality/select dropdowns, mortgage inputs, and capture screenshots proving no black borders remain.

### 2. Inside-page primary CTA metallic animation lock
- Apply the exact active square-foot/square-meter header metallic animation to inside-page primary CTAs only:
  - Register Interest / Register Your Interest
  - Request a Call Back / Request Callback
  - Request Consultation / Request a Consultation
  - Submit/Download/Request brochure primary actions
- Do not touch hero-section CTAs.
- Keep phone country-code trigger static/premium like a form control, not animated.
- Validation: screenshot the horizontal header active sqft/sqm chip beside inside-page primary CTAs, and verify CSS animation is running rather than frozen.

### 3. Lead forms layout and multi-select preferences
- Make Register Interest and Request Call Back forms sit on a clear premium champagne panel, not visually attached to Report Issue.
- Convert preferred bedrooms and preferred size from single-choice to multi-select chips/controls.
- Store submitted selections as joined values in the existing lead payload/notes without changing the backend schema unless needed.
- Validation: select multiple bedrooms and multiple sizes, submit the visual flow up to the non-destructive point, and screenshot selected multi-options.

### 4. Gallery duplicate and image-quality cleanup
- Remove duplicate low/high quality copies of the same image from gallery display.
- Normalize gallery image URLs through the high-resolution image utility before deduping.
- Ensure project pages show one best-quality version per image.
- Validation: open gallery/lightbox and screenshot that the duplicate pair is gone and remaining image is high quality.

### 5. Owner/User view default and visibility
- Ensure owners land in User/Public view by default, without auto-open edit UI.
- Keep an obvious Owner/User toggle available for owners.
- Ensure Owner Mode only appears after explicit user selection and persists correctly in the session.
- Validation: fresh load screenshot in User Mode with no edit chrome; switch to Owner Mode and screenshot edit controls appearing.

### 6. Location and same-area nearby projects
- Remove residual blue styling from project location/map/nearby UI and convert to champagne/gold/ink.
- Fix same-area recommendations by matching area/location/emirate and prioritizing off-plan projects.
- Hide ready/completed projects from recommendations unless the user is explicitly searching ready properties.
- Validation: screenshot location section with no blue accents and nearby/recommended projects showing same-area off-plan results.

### 7. Payment plan correctness and display
- Fix “To be decided” display so real structured payment data renders when available.
- Improve fallback display without inventing percentages; show developer-provided text clearly and premium-styled if no structured breakdown exists.
- Replace old emerald/amber/blue UI where it conflicts with the champagne/gold system, keeping semantic colors restrained only where needed.
- Validation: screenshot payment plan showing real values or a clear verified fallback, not a broken TBD state.

### 8. Brochure readability
- Improve brochure cover wordmark, project name, and location readability with stronger premium contrast panels/scrims.
- Replace black border on brochure CTA with soft gold and apply metallic animation only if it is a primary inside-page CTA.
- Validation: screenshot brochure card proving JBJ wordmark and project name/location are readable.

### 9. More from same developer
- Fix More From Developer section visibility.
- Show real off-plan projects by the same developer, excluding current project and ready/completed recommendations unless explicitly applicable.
- Validation: screenshot section visible with real same-developer projects.

### 10. Mortgage calculator layout refresh
- Remove black borders from property price and all calculator controls.
- Rework the lower cards/residency sections into a Property Finder-inspired layout while preserving JBJ champagne/gold/ink palette.
- Validation: screenshot mortgage section desktop and mobile with soft-gold borders and clean card layout.

### 11. JBJ AI Project Intelligence performance and state
- Reduce perceived delay by opening instantly with a premium skeleton/progressive state.
- Keep the panel responsive while analysis loads.
- Validation: click/open AI analyzer and screenshot immediate visible loading state plus loaded state if available.

### 12. Dubai Market Intelligence / DLD widget refresh
- Replace old statistic/card layout and stale color usage with premium champagne/gold/ink plus restrained semantic data colors.
- Fix “Notice something incorrect” dark-red styling.
- Fix top 10 areas and buyer nationalities layout direction/alignment so it reads naturally and professionally.
- Refresh displayed “live data” state using the existing data hook/fallback path without fabricating data.
- Validation: screenshot stats, top areas, nationalities, offline/secondary visit sections, and notice section.

### 13. Rule lock and backend/function checks
- Lock the recommendation rule: default recommendations promote off-plan projects; ready/completed projects only surface when the user explicitly searches ready properties.
- Check whether any edge function controls recommendations or project enrichment; redeploy only affected functions if code changes require it.
- Keep the existing scraping allowlist rules intact.
- Validation: technical check of filters/functions plus visual screenshot confirming no “Ready” recommendations in default project recommendations.

### 14. Full E2E validation package
- Navigate as a public user through project page sections in order.
- Validate forms, dropdowns, gallery, owner/user toggle, location/nearby, payment plan, brochure, developer strip, mortgage, AI intelligence, and DLD widget.
- Capture desktop and mobile screenshots for each completed block.
- Only then mark the work complete.