I will treat this as a Gate 1 blocker and will not move to anything else.

Plan:

1. Build a rendered visual audit, not a CSS-only audit
   - Use Playwright against the running preview.
   - Visit the public website, owner/admin routes, broker portal, developers portal, tools, forms, labels, badges, CTAs, floating buttons, icon buttons, sidebar/nav pills, and modal surfaces.
   - Detect every visible emerald/green surface by rendered background color/gradient, not by class name only.
   - For each emerald surface, inspect descendant text and SVG pixels/styles and flag any icon/text that renders black, ink, gray, transparent, faded, or non-white.

2. Remove bypasses instead of adding another isolated override
   - Sweep all React/CSS for:
     - raw `jj-emerald-solid`
     - raw `bg-emerald-*`, `bg-green-*`, `bg-teal-*`
     - manual emerald gradients
     - hardcoded dark foregrounds inside emerald surfaces
     - icon-specific `text-[#1A1A1A]`, `stroke-[#1A1A1A]`, black/gray/faded classes
     - CTA/button/badge/form-label components bypassing shared primitives
   - Replace them with the approved shared primitives: `Button`/`EmeraldButton`, `Badge`, `IconTile`, and locked emerald surface attributes.

3. Fix the shared primitives permanently
   - Make `IconTile tone="emerald"` pass white directly to the icon component, not only through inherited CSS.
   - Make `Button` primary/emerald variants pass white directly to text/icons and mark the surface consistently.
   - Make `Badge`, labels, form section chips, nav pills, floating buttons, and CTA wrappers use one emerald contract: emerald background = `#FFFFFF` text + `#FFFFFF` SVG stroke + full opacity.
   - Remove conflicting primitive behavior such as dark icon overrides inside emerald parents.

4. Lock the rule in the system
   - Add/strengthen a static audit script so future emerald surfaces with non-white content are caught.
   - Keep the project memory rule as the governing contract: every emerald/dark fill uses white text/icons at rest and hover.
   - Avoid reintroducing runtime repaint/enforcer behavior unless absolutely necessary; the fix should live in shared primitives and static contracts.

5. Visual proof before claiming completion
   - Re-run the rendered audit after changes until it reports zero black/dark/gray/transparent content on emerald surfaces.
   - Capture screenshots and zoomed crops from multiple areas, including:
     - Home/public routes
     - Properties/project pages
     - AI tools/tool pages
     - Contact/forms
     - Owner/admin portal
     - Broker portal
     - Developers portal
     - Navigation/sidebar/header pills
     - Badges, labels, CTA buttons, floating/icon buttons
   - Send the screenshots only after the rendered visual audit is clean.