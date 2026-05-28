## Fix plan

### 1. Broker portal sidebar gap
- Replace the current footer-pinned sidebar behavior with a balanced full-height layout where the navigation list from Dashboard through Settings stretches to fill the available space.
- Keep Return to Site and Sign Out locked at the bottom, but remove the large empty block above them.
- Match the owner backend shell sizing: same header height, same footer treatment, same champagne/gold visual language.

### 2. Training module cards contrast and Start hover
- Fix the Start buttons so the text and play icon never turn white on champagne/gold backgrounds.
- Remove any hover state that causes white-on-light or invisible icon/text.
- Keep the cards in the highlighted champagne/gold style, but make all action states readable and consistent.

### 3. Book cover standard everywhere
- Stop using uploaded/static `/broker-covers/book-*.png` covers for the academy grid, because they are causing mixed book styles.
- Force every library book card and every modal/reader preview to use the same locked Digital Marketing / No.14 master cover system from `PremiumBookCover`.
- Ensure every book shows its real `No. X` label in the same placement/style, with no white frame and no different cover designs.

### 4. Fix the broken modal mini-book
- Replace the small broken black thumbnail with the same real book cover component.
- Remove the plain circle number overlay shown on Book 3.
- Make the modal preview look like a proper miniature of the actual academy book.

### 5. Make Start actually work
- Convert Training Modules from dead buttons into wired onboarding actions.
- Clicking Start opens a premium training/onboarding modal for that module.
- The module shows: duration, number of lessons, lesson list, progress, points reward, and a clear Continue/Complete action.

### 6. Add real progress flow
- Use the existing learning/progress tables where possible and add any missing safe backend fields/tables if needed.
- Track broker/employee progress when they start and complete academy modules.
- Lock later steps until the current one is completed, so the onboarding flow behaves like a real employee academy.
- Award points on completion and show total academy progress.

### 7. Owner visibility and notifications
- Connect completed/in-progress training events to the existing owner notification/CRM area, or add a small owner-visible academy progress surface if the current schema does not support it cleanly.
- The owner should be able to see each employee/broker’s completed modules, scores/progress, time expectations, and points earned.

### 8. Visual QA after each fix
- After implementation, run screenshot QA at the user’s current viewport size around `/broker/learning?tab=training`.
- Check specifically: no sidebar gap, readable Start button idle/hover styling, uniform book covers, fixed modal thumbnail, and Start flow opening/working.
- If browser auth blocks full QA, verify with code-level checks and clearly report what could not be visually accessed.