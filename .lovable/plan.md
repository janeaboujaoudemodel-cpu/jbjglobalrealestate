I will treat `/property-measurement` as the exact source of truth and fix the unfinished pages instead of only wrapping old content.

Tasks I extracted and will complete:

1. Property Measurement source-of-truth fix
- Keep the existing dark emerald/black ombre layout.
- Fix the Property Name input placeholder/value contrast so “e.g., My Dubai Marina Apartment” is white/readable on the dark field.
- Keep the same centered hero, benefit cards, step dots, glowing dark card, and button logic as the template for all tools.

2. Shared fullscreen tool behavior
- Add app-level fullscreen/presentation mode for tool pages so opening a tool from Tools & Workspace shows it full-edge/full-screen inside the app.
- Add a visible “Exit Full Screen” / X control on tool pages.
- Make X exit fullscreen rather than close the tool.
- Keep it responsive for desktop, tablet, and mobile.
- Note: browser-native fullscreen cannot be forced without a user gesture by browser security, so I will implement reliable app-level fullscreen and trigger native fullscreen only when the click path allows it.

3. Mortgage Calculator rebuild
- Replace the current champagne/gold calculator body with a navy/blue/black ombre UI matching Property Measurement’s structure.
- Rebuild the calculator controls/results as dark glowing panels, white readable text, blue accent sliders/buttons, centered hero, and no champagne/gold inside the tool.
- Remove the old “advisor/banks/CTA” champagne sections from the fullscreen tool experience or restyle them into the same dark navy tool language if they remain visible.

4. AI Property Finder `/quiz`
- Replace the old champagne intro/card style with a teal/cyan/black ombre tool shell matching Property Measurement.
- Restyle question cards, options, progress, lead form, and buttons with teal dark-card logic and readable white text.

5. Interior Design AI
- Sweep remaining gold/amber tokens in inputs, buttons, badges, chat, upload states, cards, and history panels.
- Use violet/pink/Tiffany/black ombre throughout, matching the same Property Measurement layout logic.

6. Business Card Scanner
- Sweep remaining amber/gold tokens to rose/magenta/black.
- Restyle privacy notice, header, badges, alerts, tabs, scanner/results cards, action bar, and dialog accents into the same dark rose tool UI.

7. Remaining tool consistency
- Re-check Rental Index, Property Evaluator, Property Comparison, and any Tools & Workspace entries for champagne/gold regressions.
- Apply the same dark ombre tool standard with each tool’s own accent color.
- Keep Interior Design AI under Tools & Workspace in the vertical sidebar and visible to all users.

8. News & Insights
- Keep the centered hero but finish the downstream work.
- Add the large animated neon wrapping frame around the content sections.
- Reorder “Top 10 Areas by Transaction” under “Top Buyer Nationalities”.
- Remove champagne/gold visual language from the neon intelligence area where it conflicts with the requested style.

9. Market Intelligence + Area Intelligence
- Restyle both with AI Hub-style neon/ombre motion and readable dark-card content.
- Remove old gold/champagne dividers/glows from these intelligence pages where they are part of the neon restyle.
- Keep data dense and readable.

10. Guides / Books / FAQ
- Apply animated neon hero treatment consistent with AI Hub.
- Clean book covers so the company wordmark/title is not visibly duplicated on covers; keep the book title centered and prominent.
- Restyle FAQ hero/content accents to match the neon treatment while preserving all content.

11. AI Hub hero animation timing
- Make the neon/video animation visible immediately on load, not delayed/static-looking.
- Preserve the existing pink/blue/cyan premium direction.

12. Responsive and technical validation
- Take screenshots after each completed route at the current viewport size: 1178×891.
- Also test a mobile viewport for representative tool pages.
- Validate these routes visually and technically: `/property-measurement`, `/mortgage-calculator`, `/quiz`, `/interior-design-ai`, `/business-card-scanner`, `/rental-index`, `/property-evaluator`, `/compare`, `/news`, `/market-intelligence`, `/market-intelligence/areas`, `/guides`, `/faq`, `/education-hub`, `/ai-hub`.
- Check console/runtime errors and obvious overflow/contrast issues before saying anything is fixed.

Technical approach:
- First create/enhance reusable dark tool primitives rather than repeating one-off styles: a tool fullscreen controller, shared ombre shell helpers, and accent theme utilities.
- Then rebuild pages in batches: core tool pages first, then News/Market/Area, then Guides/FAQ/AI Hub.
- Use Property Measurement’s exact UI language as the reference: dark gradient page, centered hero, glowing benefit cards, step/progress visual, dark cards, white body text, accent-only highlights, and no champagne/gold tool interiors.