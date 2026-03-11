

## Plan: Fix Hunting Dashboard Layout, AI Home Finder Post-Quiz Flow, and Quiz Results Card Styling

### Issues Identified

1. **Hunting Dashboard broken layout** — Content not centered, colors off, `variant="primary"` on Button may cause issues, needs champagne styling, premium borders, and proper centering within the HR Dashboard parent container.

2. **AI Home Finder (Quiz) post-completion flow** — After quiz finishes, user sees black screen → monogram loading → then jumps to results page without context. User wants:
   - A clear "Your results are ready!" popup/transition instead of black screen
   - Lead capture form shown prominently before seeing results
   - Download report button actually working (currently generates HTML blob — works but may not be obvious)
   - Share with consultant showing actual property names in the modal
   - A prompt to also download the market report book

3. **Quiz Results "Want More AI Power?" cards** — Icon frames use old yellow gold (`#C9A84C` → `#B8973F` gradient). Must use champagne active color (`from-[#F5EBD7] to-[#D4C4A8]`). Card content alignment needs fixing. AI Home Finder icon (RefreshCw) is generic — needs a smarter icon.

### Changes

**File 1: `src/components/hr/hunting/HuntingDashboard.tsx`**
- Wrap entire dashboard in a champagne-bordered container (`border-2 border-gold/30 rounded-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] p-6`)
- Center the header text
- Fix `variant="primary"` → `variant="default"` on sub-navigation buttons (or use champagne active styling)
- Apply champagne active state to Campaigns/Prospects/Outreach buttons
- Stats cards: add gold borders (`border border-gold/20`)
- TabsList: already has champagne — keep but ensure `max-w-md mx-auto` for centering

**File 2: `src/pages/QuizResults.tsx`**
- **"Want More AI Power?" section (lines 436-511):**
  - Change icon frame backgrounds from `bg-gradient-to-br from-[#C9A84C] to-[#B8973F]` → `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]`
  - Change icon colors from `text-black` → `text-gold` (since background is now light champagne)
  - Change shadow from `shadow-[#C9A84C]/30` → `shadow-gold/20`
  - AI Home Finder icon: Replace `RefreshCw` with `Brain` (smarter AI icon)
  - Align all 3 card contents consistently: icon+title row, description, button — all with equal padding
- **Results announcement:** Add a welcome banner at the top: "Your AI-Selected Properties Are Ready!" with a prominent message telling user to download/share
- **Download Report button:** Add `toast.info` feedback so user knows download started
- **Share modal:** Already shows property names — just needs the properties list to be more visible

**File 3: `src/pages/Quiz.tsx` (post-quiz transition)**
- Before navigating to `/quiz-results`, add a brief toast notification: "Your results are ready! Redirecting..."
- This addresses the "black screen" perception during navigation transition

### Summary

| File | Changes |
|------|---------|
| `HuntingDashboard.tsx` | Champagne container, centered layout, fix button variants, gold borders on cards |
| `QuizResults.tsx` | Champagne icon frames (not yellow gold), Brain icon for AI Finder, content alignment, welcome banner |
| `Quiz.tsx` | Add transition toast before navigating to results |

