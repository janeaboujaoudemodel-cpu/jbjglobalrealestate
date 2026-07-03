## Problem

`/ai-hub` lists 20+ AI tool cards, but almost every tool link (`/ai-price-predictor`, `/ai-property-analyzer`, `/ai-neighborhood-insights`, `/ai-roi-calculator`, `/ai-market-report`, `/ai-lead-qualification`, `/ai-competitor-analysis`, `/ai-objection-handler`, `/ai-followup-scheduler`, `/ai-meeting-summarizer`, `/ai-translation-hub`, `/ai-contract-reviewer`, `/ai-document-generator`, `/ai-call-summarizer`, `/ai-client-matcher`, `/ai-email-generator`, `/ai-social-media`, `/ai-investment-report`, `/ai-description-writer`, `/ai-calendar`, `/ai-budget-planner`, `/ai-personal-shopper`) currently redirects **back to `/ai-hub`** — clicking any card loops. The page files exist (`AIPricePredictorPage.tsx`, etc.) and their underlying tool components exist (`AIPricePredictorPremium`, etc.), but the routes are neutered.

You want every tool to look and behave like `/mortgage-calculator` — same responsive shell, same emerald surfaces, same dropdown/pill/disclaimer rules.

## Solution

For each AI tool: unblock its route, wrap its existing tool component in `PremiumToolShell` with `toolThemes.emerald` (the same shell Mortgage Calculator uses), and inherit the locked global CSS rules (PASS 203 / 204 / 205 — emerald hover, no blue, hover ≠ selected, disclaimer button parity).

## Delivery approach — one tool per turn

I will ship the tools in the order below, ONE per turn, with desktop + mobile screenshot proof each turn. This keeps each change reviewable and lets you redirect priorities between turns without waste.

### Batch A — Property intelligence (5 tools)
1. AI Price Predictor
2. AI Property Analyzer
3. AI Neighborhood Insights
4. AI ROI Calculator
5. AI Market Report

### Batch B — Lead & CRM (5 tools)
6. AI Lead Qualification
7. AI Client Matcher
8. AI Objection Handler
9. AI Followup Scheduler
10. AI Competitor Analysis

### Batch C — Content & Comms (6 tools)
11. AI Description Writer
12. AI Email Generator
13. AI Social Media
14. AI Translation Hub
15. AI Meeting Summarizer
16. AI Call Summarizer

### Batch D — Legal & Docs (4 tools)
17. AI Contract Reviewer
18. AI Document Generator
19. AI Investment Report
20. AI Calendar

### Kept as-is
`/ai-video-tour-script` → `/toolkit/video-suite` (correct redirect, video suite is the canonical home).
`/ai-financial-advisor` → `/ai-budget-planner` (correct alias).

## Per-tool change per turn

Two files touched per tool:

1. `src/routes/AIToolRoutes.tsx` — replace `<Navigate to="/ai-hub" replace />` with the real element (`<AIPricePredictorPage />`, etc.).
2. `src/pages/AI<Tool>Page.tsx` — wrap the underlying tool component in `<PremiumToolShell theme={toolThemes.emerald} eyebrowIcon={…} eyebrow="AI-Powered <Category>" title="<Tool Name>" subtitle="…"><SEOHead …/><ToolComponent /></PremiumToolShell>`.

Global CSS locks already in place (from earlier passes) automatically apply:
- Dropdowns: emerald hover, hover ≠ selected, no blue (PASS 203)
- Disclaimer buttons: solid emerald + white ink (PASS 204)
- Bank picker style: full text, white ink, no ellipsis (PASS 205)
- Active pill: animated conic emerald ring (locked memory)

## Verification per turn

- Desktop 1280×1600 screenshot of the tool page hero + input card.
- Mobile 390×1600 screenshot of the same page collapsed to single column.
- Confirm no route loop, confirm the tool's own dropdowns/pills/buttons obey the global rules.

## Out of scope for this plan (call out separately if needed)

- Foldable phone / landscape tablet screenshots (would double the verification time per turn — flag if you want that added).
- Rewriting the internal tool components themselves (e.g., `AIPricePredictorPremium`'s form fields) — this plan only re-shells them. If a specific tool's internal fields have alignment/hover bugs after re-shelling, we fix per-tool as a follow-up.
- Backend admin calendar deep-dive — global calendar CSS is already updated, but a manual sweep of every admin page's inline `bg-blue-*` classes would be a separate cleanup task.

## Effort

20 tools × 1 turn each = ~20 turns to complete Batches A–D. Batch A alone (5 turns) restores the highest-value property-intelligence tools.

**Awaiting your go-ahead** — approve this plan and I start with tool #1 (AI Price Predictor) on the next turn.
