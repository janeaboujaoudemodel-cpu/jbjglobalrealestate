
I will implement this as a single global visual repair, not one-off patches.

Tasks to complete one by one:

1. Lock the correct emerald source globally
- Use the same dark emerald gradient already approved on EOI, handover date, Email / Call / Chat, and the horizontal header Search / Filter / Heart controls.
- Remove the restricted lighter green from heart, shortlist, ad badge, payment-plan TBD, mortgage, report, brochure, presentation, and CTA surfaces.
- Ensure normal state uses the darker approved emerald, and hover never switches to black text or restricted green.
- Remove white borders/rings around emerald circles.

2. Fix favorite / shortlist / heart icons globally
- Update all card favorite and shortlist controls to be rounded emerald circles with no border.
- Force every heart, shortlist, check, and related SVG inside emerald surfaces to pure white at idle, hover, focus, active, and disabled states.
- Include project cards, recently viewed / Continue Searching cards, homepage sections, properties grid, and project-detail recommendations if present.

3. Fix Continue Searching section
- Make the history circle before "Continue Searching for Your Dream Property" filled with the approved emerald.
- Make the History icon pure white.
- Make the heart icon in Continue Searching cards pure white on emerald.

4. Restyle project-detail hero CTAs
- Download Brochure: approved emerald fill, white icon, white text, no restricted green.
- Register Interest: approved emerald fill, white text/icon behavior.
- Download branded presentation: remove the pill-like broken style and make it premium, clean, and contrast-safe.
- Keep these visually consistent with the approved horizontal header emerald controls.

5. Fix brochure and presentation checklist icons
- In Project Brochure checklist: fill the tick circles with approved emerald and make ticks pure white.
- In Generate Presentation checklist: same emerald circle + white tick treatment.
- Fix the "Brochure" and "Generate Presentation" labels so their contrast is clean and not black-on-emerald or restricted green.

6. Fix Generate Presentation card
- Repair the broken contrast of "Click to start", "Generate Presentation", and "Custom PDF deck · ~30 seconds".
- Restyle the card surface so it looks intentional and premium, not visually broken.
- Use approved emerald only where the surface is emerald, with pure white foreground.

7. Fix Payment Plan TBD
- Replace the restricted green on "Payment Plan (TBD)" with the approved emerald style.
- Ensure icon and text are white where the tab/button is emerald.

8. Fix Mortgage Calculator section
- Replace all restricted green with approved emerald.
- Fix mortgage icon tiles, title accents, cards, sliders/metrics, "Compared to bank rate", and CTA surfaces.
- Swap the current states for Request Mortgage Introduction / Prefer Mortgage Advisor style: darker approved emerald on normal load, lighter/softer state only on hover if needed.
- Ensure title/text on emerald areas is white, not black.

9. Fix Live Market Data / Dubai Market Intelligence
- Make Download Report approved emerald with white text and icon.
- Fix any black text on emerald in the market widget.
- Repair the broken layout/overflow so it does not cross or collide with the vertical sidebar.

10. Fix global project-page spacing and sticky bars
- Repair the project page layout where cards/sections are touching screen edges.
- Only the background layer can be full-width to the sidebar; cards/content must always have safe padding.
- Fix both horizontal filter bars: Price / Payments / Handover / Property Type etc. and Details / Gallery / Progress / Developer / Location / Brochure / Payment Plan etc.
- Ensure they stop correctly at the vertical sidebar and do not look glued together.
- Apply this globally across desktop, tablet, and phone.

11. Visual validation proof
- Navigate as a user through:
  - Homepage cards and Continue Searching
  - Properties / All Projects cards
  - The selected project detail page
  - Brochure section
  - Generate Presentation section
  - Mortgage Calculator section
  - Live Market Data section
- Capture screenshots after the fix proving:
  - heart/shortlist/history icons are white on emerald
  - no restricted green is visible on the affected controls
  - project cards and sections no longer touch borders
  - sticky bars and market widget no longer cross the sidebar
  - Download Brochure / Register Interest / Download branded presentation / Download Report have correct contrast

Technical approach:
- Centralize the approved emerald styling in the global CSS terminal lock so later rules cannot repaint emerald icons black.
- Add or normalize component data attributes/classes only where needed so the global emerald contract can detect affected controls.
- Fix spacing at the project layout shell/container level instead of adding random per-card margins.
- Validate with Playwright screenshots using desktop viewport first, then responsive checks for tablet/phone-safe padding.
