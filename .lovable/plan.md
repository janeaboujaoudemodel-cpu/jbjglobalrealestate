I checked the current files and your complaint is correct: the previous implementation did not actually restyle AI Property Finder (`/quiz`), Mortgage Calculator, or Interior Design AI. Only partial changes were made around access gating and a few tool pages. I will not mark anything done until it is visually checked.

## Full task list extracted from your message

1. Rebuild the AI tool pages to match the Property Measurement ombre logic:
   - AI Property Finder (`/quiz`)
   - Mortgage Calculator (`/mortgage-calculator`)
   - Interior Design AI (`/interior-design-ai`)
   - Business Card Scanner (`/business-card-scanner`)
   - Confirm the already-touched Rental Index / Property Evaluator also match the same standard

2. Use different per-tool color identities while keeping the same layout logic:
   - AI Property Finder: teal / cyan / black ombre
   - Mortgage Calculator: navy / blue / black ombre
   - Interior Design AI: violet / pink / Tiffany cyan / black ombre
   - Business Card Scanner: rose / magenta / black ombre
   - Rental Index: brick / dark orange / black ombre
   - Property Evaluator: amber / bronze / black ombre
   - Property Comparison: indigo / emerald / black ombre

3. Add Owner mode to the mode switcher:
   - Owner appears only when the logged-in account is verified as owner by backend role/access checks.
   - Normal users see only Investor, Broker, Developer.
   - Switching mode changes the front-end/portal perspective only.
   - Owner backend permissions remain tied to the owner account, even when previewing Developer/Broker/Investor mode.
   - Owner mode will reveal owner portal surfaces for the owner account.

4. Fix the gated access work honestly:
   - Property Comparison: owner + JBJ broker unlocked; other brokers see Request Access; investor/developer/logged-out hidden.
   - Business Card Scanner: same rule.
   - AI Property Finder, Mortgage, Rental Index, Property Evaluator, Interior Design: visible and usable for everyone.
   - Ensure Business Card Scanner and Interior Design AI are visible under Tools & Workspace.

5. Restyle News & Insights (`/news`):
   - Center the hero label, title, and subtitle.
   - Keep the neon underline language but make it more premium/flashy.
   - Wrap the news/card sections in one large animated neon border container.
   - Put smaller cards inside that wrapper with matching ombre/glow treatment.
   - Apply the same page color logic to news cards, key market statistics, top buyer nationalities, 2025 full-year recap, and top 10 areas.
   - Move “Top 10 Areas by Transaction” under “Top Buyer Nationalities.”
   - Fix contrast throughout.

6. Restyle Market Intelligence (`/market-intelligence`):
   - Use the AI Hub neon animated hero logic, adapted to market intelligence.
   - Keep readable market data hierarchy.
   - Replace static-feeling hero treatment with always-visible motion layers/glows.
   - Apply matching neon/ombre card styling through downstream sections where practical without breaking data components.

7. Restyle Area Intelligence (`/market-intelligence/areas`):
   - Same premium neon/ombre logic with a different color balance.
   - Improve readability and card contrast.
   - Keep content structure intact.

8. Restyle Guides Library / Books / FAQ pages:
   - Use AI Hub-style animated hero logic, adapted for books/guides.
   - Remove company wordmark/title from visible book covers/cards where currently shown.
   - Keep book title centered and the book photo/cover prominent.
   - Apply the same treatment to guides/books/FAQ entry pages where the current book card system appears.

9. Restore / strengthen AI Hub hero animation:
   - Ensure animation is visible immediately, not only after a long delay.
   - Preserve the current premium pink/blue/cyan AI Hub direction.
   - Apply the reusable animated hero/card language to Insights and Guides pages, except the homepage hero.

10. Validate visually and technically:
   - Screenshot every changed route after implementation at the current preview size.
   - Check the main interactive flow as a user/broker where applicable.
   - Check sidebar visibility for owner, broker, developer/investor views where possible.
   - Run focused technical checks/tests for affected code.
   - Only then report what was verified.

## Implementation plan

### Phase 1 — Shared visual system first
Create/extend reusable frontend primitives so the work is consistent instead of one-off patches:
- Neon animated hero background layer based on the AI Hub style.
- Animated ombre border section wrapper.
- Ombre card wrapper for content sections.
- Tool-page shell that mirrors Property Measurement’s step/header/card logic.
- Keep contrast guard opt-outs only for true dark surfaces.

### Phase 2 — Fix modes and access
- Extend user mode handling to support `owner` only for verified owner accounts.
- Update ModeSwitcher so Owner is conditionally rendered only for the owner.
- Make `owner` mode front-end perspective safe: it does not grant owner access by itself.
- Update gated tool access to rely on verified owner/JBJ broker checks.
- Confirm sidebar entries for Interior Design AI and Business Card Scanner are in Tools & Workspace.

### Phase 3 — Rebuild the named AI tool pages
Work one page at a time and validate before moving on:
1. AI Property Finder (`/quiz`)
2. Mortgage Calculator
3. Interior Design AI
4. Business Card Scanner
5. Re-check Rental Index / Property Evaluator / Compare

Each page gets:
- Matching Property Measurement-style centered intro/step flow.
- Its own accent-to-black ombre palette.
- Animated border and inner dark card surfaces.
- Readable white-on-dark or ink-on-light text only.
- No champagne/gold misuse as filled CTAs.

### Phase 4 — Restyle News, Market Intelligence, Area Intelligence
- Center News hero content.
- Apply AI Hub-style animated background layers and neon underline/border motion.
- Restyle downstream content wrappers/cards with matching page palette.
- Reorder News statistics so Top 10 Areas sits under Top Buyer Nationalities.
- Keep market data readable and not overdecorated.

### Phase 5 — Restyle Guides / Books / FAQ
- Replace plain champagne guide/library sections with animated neon hero + wrapped card/grid treatment.
- Remove visible company wordmark/title from book presentation where it appears in the UI component layer.
- Keep book title centered and cover/photo dominant.
- Apply consistent treatment to FAQ/book library surfaces.

### Phase 6 — Validation before reporting complete
I will validate these routes after implementation:
- `/quiz`
- `/mortgage-calculator`
- `/interior-design-ai`
- `/business-card-scanner`
- `/rental-index`
- `/property-evaluator`
- `/compare`
- `/news`
- `/market-intelligence`
- `/market-intelligence/areas`
- `/guides`
- `/faq`
- `/education-hub`
- `/ai-hub`

Validation output will include:
- Screenshots for the changed routes.
- What was clicked/tested.
- Any remaining limitations or items not possible to verify due to login/role constraints.
- No “done/live/fixed” claim unless the route was actually checked.