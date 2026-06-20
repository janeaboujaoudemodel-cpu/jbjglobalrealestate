## What's wrong

1. **Dark navy frame on every tool.** `ToolAnimatedFrame` (in `src/components/tools/PremiumToolShell.tsx`) ignores its `theme` and hardcodes `#050912 → #07101F → #04070D` plus `rgba(7,16,31,0.92)` as the page + inner background. That's the navy/teal/tiffany cast the user sees in AI Home Finder, Compare, Interior Design AI, Mortgage Calculator, Business Card Scanner.
2. **Quiz pages double down on dark.** `Quiz.tsx` wraps both intro and question screens in `ToolAnimatedFrame theme={toolThemes.teal}` and renders headings as `text-white`, so the champagne flatten isn't visible.
3. **Fullscreen button** shows the full word "Fullscreen" beside the icon at rest. Should be icon-only, expanding to label on hover.
4. **Back/Next buttons** in `Quiz.tsx` use `px-8 py-6 text-lg` / `px-10 py-6 text-lg` — huge box, tiny label+arrow. Needs right-sized padding so the content fills the box.

## Fix

### 1 — Flatten `ToolAnimatedFrame` to champagne (`src/components/tools/PremiumToolShell.tsx`, lines 211–279)
- Outer wrapper bg → `radial-gradient(1200px 700px at 50% -10%, rgba(184,149,85,0.12), transparent 60%), #FDFBF7` (champagne, gold wash).
- Drop `data-tool-darkbody="true"` — frame is now light.
- Inner panel bg → `#F7F2EA` (surface champagne), inset shadow uses `rgba(184,149,85,0.45)` gold hairline.
- Keep the spinning border but driven from `theme.borderConic` (already gold via `toolThemes.ts`).

### 2 — Quiz pages adopt champagne (`src/pages/Quiz.tsx`)
- Intro section (lines 871–877): drop `data-on-dark`, set bg `#FDFBF7`. Header bar (line 880) → `bg-[#F7F2EA] border-[#B89555]/25`, Exit button + clock text → `#1A1A1A`.
- Question section (line 1164): same — header `bg-[#F7F2EA]`, Back/Question-count text → ink `#1A1A1A` (not white).
- Question heading (line 1198) and option label (line 1257): `text-[#1A1A1A]` not `text-white`.
- Preferences sidebar heading (line 1291) and body: ink `#1A1A1A`.
- Leave `toolThemes.teal` wrapper in place — it already maps to brand champagne after the brand lock in `toolThemes.ts`.

### 3 — Fullscreen button: icon-only + hover-expand (`src/components/tools/FullscreenToolToggle.tsx`)
- Default: square 40×40 rounded-full, just the `Maximize2` / `Minimize2` icon.
- On `hover` (or `focus-visible`): width animates to auto and the label slides in (`group` + `max-w` transition, or pure CSS `:hover` on the button revealing the span).
- Same clean black `#0A0A0A` fill + 1px gold `#B89555` hairline + white icon (passes black-CTA lock and `data-no-contrast-guard`).
- `title="Fullscreen"` stays for native tooltip on touch.

### 4 — Right-size Back/Next (`src/pages/Quiz.tsx` lines 1265–1285)
- Replace `px-8 py-6 text-lg` / `px-10 py-6 text-lg` with `h-11 px-5 text-sm` (Back) and `h-11 px-6 text-sm` (Next) — pill height matches the icon+label, no oversized empty box.
- Keep gold-hairline outline on Back and clean-black fill on Next.

## Files touched
- `src/components/tools/PremiumToolShell.tsx`
- `src/components/tools/FullscreenToolToggle.tsx`
- `src/pages/Quiz.tsx`

## Out of scope (won't touch this turn)
- PDF download palette — already on champagne+gold+ink (`buildPdf` in `QuizResults.tsx` uses brand tokens; the variable named `tiffany` actually holds gold `#B89555`). No visible navy/teal in the export.
- Other tool pages (Compare, Mortgage, Interior Design, Business Card Scanner) — they share `ToolAnimatedFrame`, so step 1 flattens them automatically. No per-page edits needed.

## Verification
Browser screenshots at `/ai-home-finder` and `/quiz` (intro + question 1 of 10) on desktop, plus a hover state on the Fullscreen button.