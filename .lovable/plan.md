I will fix the Business Card Scanner in one focused pass:

1. Privacy checkbox tick
- Replace the privacy consent checkbox styling with a locked inline SVG/check state so the checked tick is always solid black on a white/rose control.
- Add a local scanner-only CSS lock so global button/checkbox contrast rules cannot repaint it white again.

2. Remove the black block above the scanner header
- Rework the page wrapper/header spacing so the area above “AI Business Card Scanner” uses the same rose/navy scanner background instead of a separate black strip.
- Keep the whole tool inside one continuous rose-neon/dark navy surface.

3. Camera controls and camera flip
- Change the switch-camera and X/stop buttons from champagne/white to rose-neon dark controls with readable white/rose icons.
- Fix the reverse/switch camera logic so it toggles the facing mode first, fully releases the old stream, then starts the new stream using the next facing mode.
- Keep the live video preview stable and avoid mirrored/reversed capture issues by applying the correct preview/canvas transform for front camera.

4. Upload tab contrast
- Rebuild the upload drop zone, dashed border, upload icon, Select Images CTA, previews, remove buttons, and process button in the same rose-neon scanner palette.
- Fix hover states for inactive Camera/Upload tabs so they never turn champagne/white-on-white.

5. Do not add invalid photos as scanned contacts
- Add a validation helper that requires real business-card/contact evidence before adding an OCR result to Scanned Contacts.
- If the image has no name/company/email/phone/website/social/contact text, show a “not a business card” message and do not add it to the scanned list or CRM-ready list.
- Disable per-contact CRM save when contact details are missing or still need review.

6. CRM wiring inside this tool
- Convert the right-side section from only “Scanned Contacts” to a scanner-themed CRM review panel showing:
  - extracted scanner contacts,
  - CRM save status,
  - source label `business_card_scanner`,
  - clear invalid/not-ready state,
  - CRM-ready actions only when data exists.
- Keep CRM page colors unchanged elsewhere; only this embedded CRM panel gets the scanner rose-neon palette.
- Rename/save actions so they only appear when the contact can actually be saved.

7. Delete behavior safety
- Keep delete/clear inside Business Card Scanner local-only: deleting a scanned card removes it from the scanner/session list only.
- It will not delete the matching CRM lead. CRM deletion remains restricted to the CRM page/filter workflow.
- Update the UI copy/status so this rule is clear and not misleading.

8. Validation
- After implementation, validate technically with targeted checks for the touched scanner code.
- Validate visually with fresh screenshots of:
  - privacy screen checked state,
  - main scanner page,
  - camera active controls,
  - upload tab.
- I will report the visual/technical validation results after the changes are implemented.