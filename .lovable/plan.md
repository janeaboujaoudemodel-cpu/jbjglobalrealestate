# Pass 8 — Kill Tiffany Cyan/Teal + Dark-Navy Hero on Public Pages

The earlier navy→black flip (#102540) didn't catch a second dark theme: a deep teal/navy background (`#031E18` / `#0F1C18` / `#022C22`) paired with Tiffany cyan accents (`#5EEAD4`, `#22D3EE`, `#67E8F9`, `#0E7490`). The `/quiz-results` screenshot is one example. This pass removes that theme from public marketing pages and folds it into the locked palette.

## Files in scope (public only, 9 files)

| File | What's wrong |
|---|---|
| `src/pages/QuizResults.tsx` | Full dark-teal hero, cyan gradient cards/badges/buttons, cyan medal pills, PDF report uses navy+cyan |
| `src/pages/Quiz.tsx` | Same cyan/teal accents on the quiz flow |
| `src/pages/MortgageCalculator.tsx` | Cyan accents |
| `src/pages/News.tsx` | Cyan accents |
| `src/pages/InteriorDesignAI.tsx` | Cyan accents (public AI tool) |
| `src/components/matchmaker/MatchCriteriaTable.tsx` | Cyan match table (used inside QuizResults) |
| `src/index.css` | Any leftover cyan/teal token rules |
| `src/components/tools/toolThemes.ts` | Cyan tool theme preset (only public tool entries) |
| `src/pages/owner/AIHomeFinderSubmissionsPage.tsx` | Owner page — **leave unchanged** (out of scope: owner dashboard) |

## Replacement map (locked palette)

| Current | Replace with |
|---|---|
| `#031E18` / `#0F1C18` / `#022C22` / `#04161C` (dark teal bg) | `#FDFBF7` page or `#F7F2EA` champagne band |
| `from-[#5EEAD4] to-[#22D3EE]` (cyan gradient pill/CTA) | Solid black `#0A0A0A` + white text + 1px gold `#B89555` hairline (`.jj-cta-dark` primitive) |
| Cyan border / ring (`#67E8F9`, `#5EEAD4`) | Gold hairline `rgba(184,149,85,.55)` |
| Cyan text on dark | Ink `#1A1A1A` on champagne |
| `shadow-cyan-400/20` glows | Removed (no neon glows in palette) |
| Top1/Top2/Top3 medal pills | Champagne pill `#EFE6D6` + ink text + gold hairline; "#1 Best Match" pill becomes `.jj-pill-active` |
| PDF report navy+cyan letterhead | Black `#0A0A0A` + gold `#B89555` (already standard for JBJ exports) |

## Passes

1. **QuizResults.tsx** — replace hero band, 3 medal tiers, "#1 Best Match" badge, circular icon tiles (3×), download/share/restart CTAs, and the jsPDF `navy`/`cyan` tuples → black `[10,10,10]` + gold `[184,149,85]`.
2. **Quiz.tsx, MortgageCalculator.tsx, News.tsx, InteriorDesignAI.tsx, MatchCriteriaTable.tsx** — same cyan→gold-hairline / dark-teal→champagne swap. No layout/copy changes.
3. **toolThemes.ts** — only `cyan` preset entries used by public tool pages get re-pointed to the gold/champagne preset. Owner-internal entries untouched.
4. **index.css** — remove any cyan/teal rule blocks introduced for this theme; no new tokens needed.
5. **CI guard** — extend `scripts/contrast/check-no-blue.mjs` (or add `check-no-cyan.mjs`) to fail on raw `#5EEAD4|#22D3EE|#67E8F9|#0E7490|#031E18|#0F1C18|#022C22` in `src/pages/**` and `src/components/**` excluding the owner dashboard / CRM / portal trees.
6. **Visual validation** — desktop (1440) screenshots of `/quiz-results` (with the same query string), `/quiz`, `/mortgage-calculator`, `/news`, `/interior-design-ai` after the swap.

## Out of scope
- Owner dashboard, CRM, broker/developer portal, admin pages (memory: public-only sweep).
- Data-viz semantic colors (Emerald/Red/Blue/Amber on charts/KPIs).
- AI premium purple on owner-only AI tools.
- Content, copy, business logic, backend, database.

## Memory updates
- Extend `mem://constraints/no-bright-yellow-gold` sibling: add `mem://constraints/no-tiffany-cyan-public` banning `#5EEAD4|#22D3EE|#67E8F9|#0E7490` and dark-teal backgrounds on public pages.
- Add a one-liner to `mem://index.md` Core: "No Tiffany cyan/teal on public pages. Cyan accents → gold hairline; dark-teal bg → champagne."
