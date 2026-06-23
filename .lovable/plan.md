## Plan: project page layout + contrast repair

### 1) Stop the hero contrast from being overridden
- Convert the project hero section into a locked dark hero surface by adding the correct hero class/attributes on the actual `<section>`.
- Add a targeted final CSS lock for project-detail heroes so all hero text, icons, breadcrumbs, links, and CTA labels render pure white over the photo.
- Remove/override any stray white line or broken underlines inside the hero CTA area so only intentional white CTA borders remain.

### 2) Fix the sidebar-safe global content padding
- Update the project detail main content wrapper to use the existing global `.jj-page` / rail-safe spacing contract instead of bespoke `px-*` padding.
- Ensure the content width is calculated inside the already-offset `<main>`, so sections do not slide under the vertical sidebar when the sidebar is open or collapsed.
- Apply the same wrapper to lower project sections: inquiry form, ready CTA, recommended projects, and any full-width project-detail band that currently uses smaller hard-coded padding.

### 3) Repair affected project-detail sections
- Wrap/normalize these sections so cards never touch the viewport or sidebar edge:
  - quick stats cards
  - QuickFactsBar
  - About / Gallery / Unit inventory / Construction / Developer / USP / House details / Floor plans / Amenities / Media / Location / Master plan
  - Payment plan
  - Brochure
  - Generate Presentation
  - Project Documents
  - Mortgage / AI Analyzer
  - DLD widget, buyer nationality insights, more-from-developer, investment, FAQ, report issue
- For components that internally render wide grids/cards, add local max-width/overflow guards so they cannot exceed the page shell.

### 4) Fix payment-plan and document contrast
- Update `PaymentPlanVisualization` so unapproved states use the approved emerald/ink ombré tokens, not the old flat green.
- Force dark/emerald payment-plan headers and title text to pure white where the background is dark.
- Fix project brochure and generate-presentation cards so CTA text/icons use emerald/white correctly and the dark presentation card content is readable.
- Fix document request cards so labels, icons, and actions keep strong readable contrast.

### 5) Fix booking circle visibility
- Inspect the booking/meeting circle UI affected by the same contrast issue and apply the same emerald/dark-surface white-foreground contract so icons/text inside circles are visible.

### 6) Visual validation before reporting back
- Use Playwright screenshots at 1280×1800 and the user’s current narrow preview width.
- Validate `/project/elwood-sobha-realty-dubailand` at top, payment plan, brochure/presentation/documents, DLD, and lower sections.
- Validate both sidebar states: open and collapsed.
- Spot-check homepage and properties page to confirm global padding did not regress existing layout.
- Report the screenshot file paths/results after implementation.