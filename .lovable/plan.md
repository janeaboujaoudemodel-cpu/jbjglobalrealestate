## Plan: Dubai South Area page repair with screenshot proof

1. **Lock the no-gold-border rule in project memory**
   - Add a permanent memory rule: emerald surfaces/buttons/cards must never use gold/champagne borders or gold divider lines.
   - Apply it to this repair so hero buttons, filter bar, market cards, AI cards, and emerald CTAs use white/emerald hairlines only.

2. **Hero stat buttons**
   - Remove the gold border from the Projects and Developers hero buttons.
   - Keep them balanced and premium, but use emerald-metallic background, white text/icons, white translucent hairline, and no champagne/gold stroke.

3. **Rebuild the Area filter to match the Projects page pattern**
   - Replace connected Area / Emirate / Community / Developer / Project Name chips with separate normal buttons.
   - Each button opens a premium dropdown rather than behaving like a connected segmented control.
   - Keep the bar sticky on scroll and align its height, spacing, emerald gradient, shadow, button shape, and dropdown behavior with the Projects page filter style.
   - Remove all gold dividers/borders from the filter; use subtle white/emerald separators only if needed.

4. **Developer logos performance and no fallback violation**
   - Update Developers in Dubai South and Developer Landscape to query/link real developer logos more reliably.
   - Stop rendering the “JBJ” fallback in Developer Landscape; if a logo is missing, show a neutral logo placeholder/icon without JBJ initials.
   - Keep logos eager/high-priority in the visible developer strips.

5. **Dubai Market Intelligence section**
   - Make the section background premium gold champagne.
   - Force the section title, subtitle, stats, labels, numbers, row text, arrows, percentages, and controls to pure white wherever they sit on emerald/dark cards.
   - Rebuild “Top 10 Areas by Transactions” rows with a strict grid so rank, area name, transaction number, percentage, and arrow align cleanly.

6. **JBJ AI Area Intelligence section**
   - Make the section background premium gold champagne.
   - Restyle the AI cards that are emerald/dark so every heading, number, metric label, paragraph, icon, chart label, and developer item is pure white.
   - Fix the Investment Rating card so the 8.4 score is readable and follows the premium champagne/emerald brand, not broken silver/white-on-light.
   - Restyle Price Per Sqft, Supply vs Demand, Investment Metrics, and Developer Landscape cards consistently.

7. **Explore More + Similar Areas + Final CTA text contrast**
   - Force “Explore More in Dubai” heading to black on champagne.
   - Force similar area card names and project-count badges to pure white over image overlays.
   - Keep “Explore Dubai South Properties?” / Get in Touch card emerald background, but make every title, subtitle, icon, label, value, input text, and button text pure white.

8. **Validation requirement before claiming completion**
   - Run Playwright visual validation at `/area/dubai-south` with desktop viewport.
   - Capture screenshots for: hero buttons, sticky filter/dropdowns, Dubai Market Intelligence, JBJ AI Area Intelligence, Developer Landscape/logos, Explore More/Similar Areas, and final Get in Touch CTA.
   - Inspect screenshots before responding. If the screenshot tool fails, I will say it failed and will not claim the UI is fixed.