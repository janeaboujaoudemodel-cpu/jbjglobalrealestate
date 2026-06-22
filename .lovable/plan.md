I will fix only the remaining visual/contrast issues you listed, with screenshot validation after each group before moving to the next.

## Task breakdown

1. **Visual baseline first**
   - Capture current screenshots of: homepage hero/header/sidebar, homepage guides/books, mortgage calculator, careers application form, careers benefits, broker growth ecosystem, and careers FAQ.
   - Use those screenshots as the before-state so the implementation is based on the real rendered app, not assumptions.

2. **Global contrast contract**
   - Harden `src/index.css` so every actual emerald/dark/black filled surface keeps white text and white icons at rest and hover.
   - Prevent champagne/light rules from repainting descendants black when they are inside emerald/dark buttons.
   - Keep champagne/light cards with black text, not white.
   - Replace remaining blue focus/active/accent styling in the affected public/careers/mortgage surfaces with emerald.

3. **Vertical sidebar minimal restyle**
   - For the four top links: **AI Home Finder**, **List Your Property**, **Careers**, **Resale Properties**:
     - Remove the filled/highlighted label boxes and borders.
     - Keep title text black.
     - Keep the icon tile style consistent with subcategory rows, but make the icon glyph white inside the tile.
     - Do not make categories/subcategories green-filled.
   - For **Contact** and **Support**:
     - Remove full emerald fill.
     - Use clean basic outline treatment: emerald border, emerald icon, emerald title, no filled box at rest or hover.
   - Ensure all sidebar category/subcategory titles are black, with no green filled rows except locked structural controls like collapse if already intentional.

4. **Homepage header + hero + book strip**
   - Fix the faded homepage hero title so it is readable over the video/image.
   - Fix remaining half-broken horizontal header pills/icons so dark/emerald surfaces have white text/icons.
   - Keep the books UI/UX/logic unchanged; only force book cover titles to white/readable.
   - Keep **View Library →** emerald.

5. **Mortgage calculator fixes**
   - Make **Try Our AI Mortgage Calculator** a full premium emerald CTA with white text/icons, matching the collapse-button emerald direction.
   - Fill the **Compare to Bank Rates** slider progress behind the thumb with emerald so it is not visually empty.
   - Preserve the mortgage calculator logic and slider behavior.

6. **Careers page emerald consistency**
   - Application progress:
     - Replace black/blue mixed active progress with emerald gradient.
     - Fix **Continue** button text/icon contrast.
     - Make step pills, borders, active states, and hover states premium emerald/gold-champagne without blue.
   - **Built for the top 1%** cards:
     - Replace black/blue hover/normal icon treatments with emerald accents.
     - Keep cards readable on champagne.
   - **Broker Growth Ecosystem**:
     - Apply the same premium emerald accent system to icons, borders, card hover, and section badges.
   - **Questions, answered**:
     - Match accordion open/closed buttons and section accents to emerald styling.

7. **AI Home Finder labels / hover / loader items**
   - Inspect the AI Home Finder page and the four title/label areas the user called out.
   - Replace remaining blue/black-on-dark/low-contrast hover and loading states with emerald/dark surfaces using white foreground where filled.

8. **Validation gates**
   - After each task group, run Playwright visual checks and capture screenshots.
   - Final proof set will include screenshots for:
     - Homepage hero/header/sidebar
     - Expanded sidebar top links + Contact/Support
     - Homepage guides/books + View Library
     - Mortgage calculator CTA + bank-rate slider
     - Careers application form/progress/Continue
     - Careers benefits cards
     - Broker growth ecosystem
     - Careers FAQ
     - AI Home Finder affected titles/hover/loading state where reachable
   - I will not claim completion unless the screenshots show the corrected contrast.