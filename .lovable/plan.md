# AI Home Finder — Budget Logic + Icon Theming Fix

## 1. Smarter Budget Matching (`MatchCriteriaTable.tsx`)

Current logic treats `price_from` as the project's only price and marks anything below the budget min as "miss" (e.g. Vida starts at AED 2.7M → flagged "miss" against a 5–10M budget). Per your direction, a project should match whenever its inventory plausibly overlaps the chosen budget, judged from its starting price.

**New rule (per budget bucket with max = M):**
- **Match** when `price_from <= budgetMax` — they almost certainly have units inside the band (cheaper starting price means more units up to that ceiling).
- **Close** when `price_from` sits within ~20% above `budgetMax` (some units may still land inside with negotiation/smaller layouts).
- **Miss** only when `price_from > budgetMax * 1.2` (truly above the budget — nothing they offer fits).

For `10m-plus` (open-ended), keep `match` if `price_from >= 6m` (likely has 10M+ units), `close` between 4–6M, `miss` below.

**Display tweak:** the cell now shows `From AED 2.7M` (and `– AED 15M` when `price_to` exists) so the user understands it's a starting price, not the whole range.

## 2. Heart + Shortlist Icon Theming on Results

The scoped CSS in `QuizResults.tsx` targets `[data-favorite-button]` / `[data-shortlist-button]`, but `FavoriteButton.tsx` actually renders buttons with class `jj-favorite-trigger` and no such data-attr — so the champagne styling shows through.

Update the `.aihf-results` scoped CSS block (no change to the shared `FavoriteButton.tsx` component, keeping the rest of the app intact) to target the real selectors:

- `.aihf-results .jj-favorite-trigger` → transparent navy fill (`rgba(8,30,28,.6)`), cyan hairline border (`rgba(103,232,249,.45)`), cyan glow on hover.
- `.aihf-results .jj-favorite-trigger svg` → cyan stroke `#67E8F9` at rest; favorited heart keeps the red fill (Tiffany red-pink `#FF6B8A`) so "saved" state stays legible.
- `.aihf-results [data-aihf-menu]` already exists — verify the "Add Badge" trigger button (rendered by `ShortlistBadgeButton`) gets the same navy/cyan treatment by adding a rule for `.aihf-results .jj-favorite-trigger + *, .aihf-results button:has(> svg.lucide-award)` (or a small `data-aihf-badge` attr on the trigger if cleaner).

No component logic changes — only CSS scoped to `.aihf-results` so other pages stay untouched.

## Files Touched
- `src/components/matchmaker/MatchCriteriaTable.tsx` — rewrite `priceVerdict` + cell display.
- `src/pages/QuizResults.tsx` — extend the scoped style block with correct selectors for `.jj-favorite-trigger` and the badge trigger.

## Verification
- Re-run the quiz with budget 5–10M; Vida / Luxury Canal Tower / Taormina should now show ✓ on the Budget row (cell text: `From AED 2.7M`).
- A project with `price_from = 18M` against the same budget still shows ✗.
- Heart + shortlist + Add Badge buttons render in cyan-on-navy on `/quiz/results`, while the rest of the site keeps the champagne styling.
