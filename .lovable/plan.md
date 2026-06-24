## Goal

Make the AI Home Finder hero card visually identical in chrome to the homepage's AI Property Comparison widget, then apply the same chrome to similar hero/intro cards site-wide (homepage stays locked).

## Reference style (from `src/components/AIComparisonWidget.tsx`)

- **Outer shell**: `bg-[#F7F2EA] rounded-2xl p-8 md:p-10 relative overflow-hidden` + two champagne blur orbs. **No gold border.** Already encapsulated as `<AIShellCard>`.
- **Label pill (top-left, not centered)**: emerald-soft pill — `jj-surface-emerald-soft` with `Sparkles` icon + uppercase tracked label (e.g. "AI Powered" / "Completely Free").
- **Identity tile (top-right)**: emerald solid `jj-surface-emerald` 64×64 rounded-2xl with WHITE icon (`data-surface="emerald" data-emerald-ok="icon"`).
- **Feature row**: 3 horizontal tiles in a `md:grid-cols-3` grid — each tile is `bg-[#F7F2EA] border border-[#B89555]/20 rounded-xl`, icon in a soft champagne square `bg-[#EFE6D6]/20`, label + tiny description. **Replaces** the vertical gold-circle-tick list.
- **CTA**: dark navy primary + champagne secondary (already standard).

## Fix Plan

### 1. AI Home Finder hero (`src/pages/Quiz.tsx`, intro block lines ~895-1005)

Replace the current gold-bordered champagne card with the AIComparisonWidget chrome:

- Drop the inline `border: "1px solid rgba(184,149,85,0.45)"` outer card → use `<AIShellCard>` (or its raw classes).
- Replace centered gold-tinted "Completely Free" pill → top-left `jj-surface-emerald-soft` pill with `Sparkles` icon.
- Replace the standalone wand circle → top-right emerald 64×64 tile with white `Wand2` icon.
- Replace the "FREE Access" sub-card with 3 gold-checkmark list → 3-column feature grid matching AIComparisonWidget (Unlimited AI Home Matches / AI Comparison Reports / Download Excel Report), each with champagne icon tile + label + short description.
- Keep the `~60 seconds / AI-Powered / 100% Free` meta row but restyle to inherit the same tile chrome (subtle, no gold border).
- Keep the existing dark CTA "Find My Property" and trailing helper line.

### 2. Sweep similar hero cards (excluding `src/pages/Index.tsx` and `src/components/home/**`)

Audit the 6 files currently using `1px solid rgba(184,149,85,0.45)` or stronger as the outer card frame and re-chrome them to match:

- `src/pages/QuizResults.tsx` — results hero card
- `src/pages/RentalIndex.tsx` — top intro/landing card
- `src/pages/Guides.tsx` — hub intro card
- `src/pages/PropertyMeasurement.tsx` — tool intro card
- `src/pages/DeveloperDashboard.tsx` — dashboard greeter card (only if it's a public/hero intro; skip if it's an internal CRM panel)

For each: drop the gold outer border, wrap in `<AIShellCard>`, normalize the label pill to `jj-surface-emerald-soft + Sparkles`, normalize the identity tile to `jj-surface-emerald` with white icon, and convert any vertical "gold-circle checkmark" list into the 3-column feature grid pattern when there are 3 short bullets.

### 3. Inner gold-bordered sub-cards

Leave inner content boxes inside tool flows (form fields, result panels) untouched unless they are themselves a hero intro. Scope is hero/intro cards only this turn.

### 4. Validation

After edits, run Playwright over: `/ai-home-finder`, `/ai-home-finder/results` (if reachable without state), `/rental-index`, `/guides`, `/property-measurement`. Capture one screenshot per page and confirm:
- No double-border / gold outline on the outer card
- Emerald pill + emerald identity tile present
- 3-column feature grid renders (where applicable)
- Existing CTAs and copy unchanged

## Out of Scope

- Homepage (`src/pages/Index.tsx`, `src/components/home/**`) — locked.
- Owner CRM, broker portal, developer hub internals — only public/tool hero cards in this batch.
- Functional behavior — visual chrome only.

## Technical Notes

- Canonical primitives: `AIShellCard` (`src/components/ui/ai-shell-card.tsx`), `jj-surface-emerald` / `jj-surface-emerald-soft` (already in `index.css`).
- Champagne palette only — `#F7F2EA`, `#EFE6D6`, `#FDFBF7`, `#B89555` hairline at `/20` for inner tiles, never as a full outer border on hero cards.
- Preserve all `data-allow-dark-cta` / `data-no-contrast-guard` attributes on the dark primary CTA.
