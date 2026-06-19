Implementation plan, in the exact order I will follow after approval:

1. Fix the visible form picker regressions first
   - Replace the remaining black country-code trigger styling with champagne/soft-gold styling globally for JBJ forms.
   - Replace the phone country dropdown surface from white/black mix to the same champagne form surface.
   - Remove the conflicting older CSS locks that still force `[data-phone-code-trigger]` to black/white.
   - Keep phone text readable in ink, with soft gold borders and focus states.

2. Fix all remaining form borders called out by you
   - Remove the old black form trigger/dropzone/border rules from the global form token layer.
   - Make select triggers, inputs, textareas, comboboxes, and phone inputs use soft gold/champagne borders in normal, hover, focus, invalid, and dropdown states.
   - Apply this to Request Consultation / Register Interest / Request Callback style forms without touching unrelated features.

3. Make metallic CTA animation visible all the time
   - Upgrade `.jj-cta-gold-metallic` so the metallic movement/sheen runs continuously at rest, not only on hover.
   - Hover will only intensify the existing metallic animation, not be the first time it appears.
   - Apply/verify the class on Request Consultation, Register Interest, Request a Call Back, Submit Report, and in-section document/brochure request/download CTAs.
   - Hero CTAs remain excluded unless they are inside-page form/document actions.

4. Remove orange from project/listing UI touched by this flow
   - Replace `HandoverPill` orange fill with the metallic champagne-gold treatment.
   - Replace legacy `.handover-orange` orange CSS with the same metallic treatment.
   - Replace recommended-project status/handover badges still appearing orange with champagne-gold metallic styling.
   - Do not remove semantic red/emerald/blue/amber data colors elsewhere unless they are the exact orange project/listing CTA/badge issue you flagged.

5. Fix Report Issue visible styling
   - Verify the report issue banner is champagne/gold, not dark red/orange.
   - Make its action button use the always-animated metallic CTA.
   - Make the modal select/dropdown and textarea match the global champagne-gold form system.

6. Lock the rules in project memory
   - Add/update memory so future work cannot reintroduce black phone pickers, black form borders, or orange handover/project status pills.
   - Record that `.jj-cta-gold-metallic` must animate at rest continuously.

7. Visual validation before moving on
   - Open the project page as a public/user view and owner view.
   - Click Register Interest / Request Consultation / Download Brochure request flow / Report Issue.
   - Open phone country-code picker and form select dropdowns.
   - Capture screenshots for the form state, phone dropdown, CTA idle state, report issue, recommended projects, and handover pill.
   - Only then mark this first repair section complete.

8. Continue batch 4: Gallery
   - Harden duplicate image filtering and keep the highest-quality image URL.
   - Polish fullscreen gallery with stable sizing and `object-contain` so images do not crop badly or change into broken contrast states.
   - Validate desktop and mobile screenshots.

9. Continue batch 5: Owner/User toggle default
   - Make the owner toggle prominent but ensure user/public preview mode defaults cleanly without edit controls opening by mistake.
   - Validate owner mode and user-view mode step-by-step.

10. Continue batch 6: Location and nearby projects
   - Remove remaining blue location styling on the project page.
   - Improve same-area matching for “Other projects in this area” / nearby project sections.
   - Validate the visible section output on the current Vindera project page.

11. Continue remaining queued tasks after 4–6
   - Payment plan pending-state and source-safe enrichment.
   - Brochure card readability and blocked-download proxy validation.
   - More from same developer visibility.
   - Mortgage calculator border/layout refresh.
   - AI analyzer progressive load state.
   - DLD market widget refresh.
   - Final desktop/tablet/mobile screenshots and E2E checks.

Technical notes / root cause:
- The previous “form fix” only changed some token classes, but multiple later CSS blocks still overrode the phone picker back to black (`button[data-phone-code-trigger]`) and some form-specific rules still forced black borders.
- The metallic CTA class currently has the gradient at rest, but the moving shine is only triggered on hover, which is why it does not match the always-moving sqft/sqm active treatment.
- `HandoverPill` and legacy `.handover-orange` are still explicitly hardcoded to orange, so recommended/project cards can still show orange even after individual card edits.
---

UPDATE (batch progress):
- [x] (1-3) Phone trigger + dropdown surface forced champagne globally (PhoneInput default variant flipped to 'light'; `.jbj-form-popover` rewired to soft-gold; new global popper-content lock in index.css).
- [x] Metallic CTA palette now matches sqft active pill (`.jbj-shimmer-champagne`) with continuous `jbj-champagne-shimmer` + `metallicSweep` at rest.
- [x] (4) Gallery dedup hardened — every gallery URL upgraded via `getHighResImageUrl` after dedup so hi-res twin always wins.
- [x] (5) Owner toggle default flipped — `usePreviewAsVisitor()` defaults true; edit controls never auto-open on landing; choice persists explicitly.
- [x] (6) Location/Nearby files audited — no blue refs remain.
- [x] Memory locked: ui-ux/visual-standards/global-dropdown-and-cta-lock.md
