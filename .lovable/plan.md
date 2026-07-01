
# Unify all AI tools to the Property Measurement emerald contract

## Goal
Every AI tool (public + owner/back-office) renders on the exact same emerald ombré surface used by Property Measurement:
- Background: deep emerald → black ombré
- Cards: dark emerald, white ink, gold hairline
- Primary CTAs: brand emerald metallic (`#065F46 → #064E3B → #04231A`) — never bright `#10B981` "restricted green"
- Selectable pills / toggles (Property Type, Unit Preference style): same emerald gradient, white text + white icon when active
- All icons/text readable, WCAG-passing contrast, zero color violations

## Scope — tools to migrate & screenshot

### Front-end (public) AI tools
1. `/property-measurement` (reference — already correct)
2. `/interior-design-ai`
3. `/ai-home-finder` (`/quiz`)
4. `/mortgage-calculator`
5. `/property-evaluator`
6. `/rental-index`
7. `/property-comparison` (Compare Projects)
8. `/list-property` (Sell Your Property)
9. `/list-property-rent`
10. AI Business Card Scanner (`/scan-sign` / toolkit route)

### Back-office / owner AI tools (routed through `AIToolPremiumLayout`)
11. Email Generator
12. ROI Calculator
13. Market Report
14. Lead Qualification
15. Neighborhood Insights
16. Contract Reviewer
17. Follow-up Scheduler
18. Objection Handler
19. Property Analyzer
20. Meeting Summarizer
21. Call Summarizer
22. Document Generator
23. Background AI (image tools)
24. AI Video Studio

## Approach

1. **Central tokens (single source of truth)**
   - Confirm `toolThemes.ts`, `PremiumToolShell`, `AIToolPremiumLayout`, `ToolAnimatedFrame` all use the brand emerald constants (no `#10B981` / `#059669` / `#047857` left).
   - Add a scoped `[data-tool-emerald]` CSS block that force-coerces any child button/pill/chip to the brand emerald ombré with white ink + white icon, so any tool page that renders inside a tool shell inherits the correct contract without per-file edits.

2. **Per-page selectable-tile primitive**
   - Extract the Property Measurement "Property Type / Unit Preference" tile pattern into a shared `<EmeraldSelectTile />` component and swap it into every tool that uses ad-hoc selector cards (Interior Design mode picker, AI Home Finder quiz options, Sell Your Property step choices, etc.) so the active state renders identically everywhere.

3. **Sweep for residual violations**
   - `rg` for `#10B981|#10b981|#059669|#047857|bg-emerald-500|bg-emerald-600|bg-green-*|from-emerald-500|to-emerald-500` inside `src/pages/**`, `src/components/ai-tools/**`, `src/components/tools/**`, `src/components/interior-design/**`, `src/components/ai-video-studio/**`, `src/pages/toolkit/**`.
   - Replace tool-surface hits with the deep emerald tokens. Leave data-viz palettes (charts, analytics) untouched.

4. **Contrast guard**
   - Extend `report-contrast.regression.test.ts` with a `tool-surface-contrast` case that fails if any tool page renders text on a background with contrast < 4.5, or if `#10B981` reappears in a tool CSS payload.

5. **Visual validation — Playwright**
   - One script that iterates every route above at desktop 1440×900, tablet 834×1112, mobile 390×844.
   - For each tool: full-viewport screenshot + close-up screenshots of (a) the primary CTA, (b) the selectable tile row, (c) any secondary button/pill.
   - Save under `/mnt/documents/tool-emerald-sweep/<tool>/<viewport>.png` and `<tool>/<viewport>-cta.png` etc.
   - Assertion pass in the script: no on-screen pixel with the banned bright green, primary CTA text luminance ≥ 0.9 on a dark bg (white ink), selectable tile icon is pure white when active.

6. **Report**
   - Deliver a summary listing each tool + a checkmark for: layout parity, CTA color, tile parity, contrast pass, screenshot path.
   - Any tool that can't reach parity in this pass is listed explicitly with the reason (I will not claim success on unverified tools).

## Non-goals
- No changes to tool business logic, form fields, copy, routing, or data.
- No changes to chart/data-viz colors (those are semantic, not brand).
- No changes to header/sidebar/marketing surfaces — this pass is scoped to tool pages only.

## Deliverables
- Updated shared primitives (`toolThemes.ts`, `PremiumToolShell`, `AIToolPremiumLayout`, new `EmeraldSelectTile`).
- Per-tool patches removing the "restricted green" and legacy selector styles.
- New Playwright validation script + regression test.
- Screenshot bundle under `/mnt/documents/tool-emerald-sweep/` (one folder per tool, three viewports each).
- Written pass/fail table in the chat reply.
