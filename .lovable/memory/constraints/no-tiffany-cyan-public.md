---
name: No Tiffany Cyan/Teal on Public Pages
description: Bans Tiffany cyan/teal accents (#5EEAD4 #22D3EE #67E8F9 #0E7490) and dark-teal hero backgrounds (#031E18 #04161C #02110F) on public marketing pages
type: constraint
---
Forbidden on public pages (Quiz, QuizResults, MortgageCalculator, InteriorDesignAI, MatchCriteriaTable, public tool pages):
- Hex: `#5EEAD4`, `#22D3EE`, `#67E8F9`, `#0E7490`, `#2DD4BF`, `#06B6D4`
- Dark-teal hero bgs: `#031E18`, `#04161C`, `#02110F`, `#020B0A`, `#051C18`, `#062821`

Replacements:
- Cyan gradient pill/CTA → solid black `#0A0A0A` + white text + 1px gold `#B89555` hairline
- Cyan border/ring → `rgba(184,149,85,0.55)` gold hairline
- Cyan accent text → `#1A1A1A` ink, or `#B89555` gold for emphasis
- Dark-teal section bg → `#FDFBF7` page or `#F7F2EA` champagne band
- Verdict semantics (Match/Close/Miss) → Emerald `#047857` / Amber `#B45309` / Red `#B23A48`

**Exempt:** Neon Page Shell pages (News, Market Intelligence, Guides, FAQ subpages) marked `data-neon-page` keep cyan/violet/magenta per `mem://ui-ux/visual-standards/neon-page-shell-standard`.

**Why:** The earlier navy→black flip (#102540) only caught one dark theme. This second Tiffany cyan + dark-teal theme leaked into the quiz flow and broke palette consistency.
