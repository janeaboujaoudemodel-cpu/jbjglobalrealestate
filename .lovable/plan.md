Status: Batch A done — (1) global form borders → champagne/gold; phone picker champagne. Batch B done — (2) `.jj-cta-gold-metallic` primitive added; (3) bedrooms + preferred size now multi-select on Register Interest and Request Consultation forms, submit buttons use metallic gold; (13) Report Issue banner + modal redesigned to champagne+gold with metallic CTA; (14) Recommended Projects defaults to off-plan only (excludes Ready/Completed/Handed Over), sale-status badges replaced with champagne+gold treatment, memory locked. Remaining: 4, 5, 6, 7, 8, 9, 10, 11, 12, 15.

Root cause: the visible problems are not one component. Some previous fixes changed the wrong or lower-level components, while global CSS, phone input styling, owner-only edit controls, recommendation filters, gallery URL de-duping, and backend enrichment still override the intended design/behavior.

I will implement this in the exact order below and validate each step before moving to the next.

1. Global form borders and field styling
   - Replace black form borders across the app with soft gold/champagne field styling through the shared form/input/select/textarea/phone-input system.
   - Keep hero-section CTAs untouched.
   - Ensure focus, hover, disabled, validation, dropdowns, textarea, and country-code controls never render black borders on champagne forms.

2. Metallic gold CTA system for inside-page CTAs
   - Add one reusable metallic champagne-gold CTA class matching the active sq ft/sq m and active section-tab treatment.
   - Apply it to inside-page primary CTAs: Register Interest, Request Consultation, Request a Call Back, Submit, Report, Download/Request document CTAs where they sit inside page sections/forms.
   - Do not change hero CTAs.

3. Register Interest and Request Callback forms
   - Make bedrooms multi-select.
   - Make preferred size multi-select.
   - Clean the phone/country-code control so it no longer appears as a black block inside light forms.
   - Put the forms on a deliberate champagne surface band/card so they do not look dropped directly under Report Issue.
   - Apply the same form UX to Request a Call Back.

4. Gallery duplicate/quality fix
   - Strengthen image de-duplication to collapse low/high versions of the same photo.
   - Keep the highest-resolution URL only.
   - Ensure the +14/fullscreen gallery shows one full-screen experience, object-contain photos, no changing background image, no broken contrast buttons.

5. Owner view vs public/user view
   - Make the owner/user toggle prominent and usable on project pages.
   - Default owner preview can switch cleanly to public user mode without edit controls automatically opening.
   - Ensure owner upload/edit sections hide when user/public mode is selected.

6. Project location and nearby projects
   - Remove blue styling from project location/map-related controls and replace with champagne/gold/ink styling.
   - Fix “Other projects in this area” so area matches work even when coordinates or exact area strings are incomplete.
   - Show nearby same-area/off-plan projects as user-friendly cards/map pins when available.

7. Payment plan section and enrichment path
   - Replace “to be decided”/weak fallback presentation with a professional pending-state layout.
   - Improve frontend rendering of available structured payment data.
   - Update the backend enrichment path to prioritize developer-direct/partner source payment plans only, and never secondary portals.
   - Redeploy the relevant edge function after code changes.

8. Brochure card readability
   - Rework brochure cover overlays so JBJ wordmark and project name are readable on any image.
   - Keep it premium champagne/gold/ink, not unreadable dark/navy overlays.
   - Keep all brochure downloads routed through the backend proxy.

9. More from same developer
   - Fix the section so it appears when the same developer has other live inventory.
   - Add clearer empty/fallback behavior only for owner/admin if there truly are no sibling projects.

10. Mortgage calculator
   - Replace black borders on property price and lower cards with soft gold/champagne styling.
   - Redesign the calculator layout closer to a professional real estate portal calculator while preserving JBJ colors.
   - Keep sliders, inputs, residency/cards, and summary sections readable on desktop/tablet/phone.

11. JBJ AI Project Intelligence speed
   - Stop blocking the visible section on a slow AI call.
   - Render a fast cached/placeholder intelligence shell first, then progressively load refreshed analysis.
   - Add clearer loading/retry state without making the page feel stuck.

12. Dubai Market Intelligence Live Data
   - Refresh the layout away from the current stale card/list look.
   - Replace old color usage with approved champagne plus semantic data tones.
   - Fix the top-10 area and nationality rows so bars/progress read left-to-right professionally.
   - Ensure live/fallback timestamps are clear and no fake freshness is shown.

13. Report Issue section
   - Replace the dark red warning banner with a premium champagne/gold issue-report panel.
   - Keep semantic caution visible, but remove the aggressive red block.
   - Style the report modal with the global form rules.

14. Recommended Projects
   - Stop promoting ready properties by default.
   - Prefer off-plan projects unless the user explicitly searches/filters for ready properties.
   - Replace orange Ready badges with the metallic champagne-gold status treatment.
   - Lock this off-plan recommendation rule in project memory.

15. Technical validation and screenshots
   - Validate desktop, tablet, and phone.
   - Navigate as public user and owner/user-preview mode.
   - Test gallery fullscreen, forms, brochure download flow, map/nearby section, mortgage calculator, AI section, market widget, report issue modal, and recommended projects.
   - Capture screenshots after each completed milestone before moving to the next one.