# AI Home Finder — Price Hover + Off-Plan Priority

## 1. Price Pill Hover Bug

Global `src/index.css` (line 3966–3985) defines a card-hover rule that repaints `.price-pill-premium` to a champagne-white background and ink text whenever its parent `.group` is hovered or the pill itself is hovered. Inside the AI Home Finder dark results page that's where the "white faded" flash on hover comes from.

**Fix:** in the scoped `AIHF_RESULTS_STYLE` block in `src/pages/QuizResults.tsx`, add hover/focus overrides that keep the navy glass treatment intact:

```
.aihf-results .group:hover .price-pill-premium,
.aihf-results .group:focus-within .price-pill-premium,
.aihf-results .price-pill-premium:hover,
.aihf-results .price-pill-premium:focus-visible {
  background: linear-gradient(135deg, rgba(2,17,15,0.95), rgba(3,30,24,0.95)) !important;
  border-color: rgba(94,234,212,0.85) !important;
  box-shadow: 0 10px 26px rgba(34,211,238,0.30), inset 0 0 18px rgba(103,232,249,0.12) !important;
}
.aihf-results .group:hover .price-pill-premium .price-pill-eyebrow,
.aihf-results .price-pill-premium:hover .price-pill-eyebrow {
  color: #67E8F9 !important;
  -webkit-text-fill-color: #67E8F9 !important;
}
.aihf-results .group:hover .price-pill-premium .price-pill-value,
.aihf-results .price-pill-premium:hover .price-pill-value {
  color: var(--price-orange) !important;
  -webkit-text-fill-color: var(--price-orange) !important;
}
```

No change to the shared `PricePill` component or global rule — only a scoped override.

## 2. Filter Sold-Out + Prioritise Off-Plan

The matchmaker in `src/pages/Quiz.tsx` (`pickProjects`) already drops `is_sold_out` and `sale_status: sold/out_of_stock`. We strengthen this and add an off-plan-first preference:

**a) Stronger sold-out filter** — also reject `sold_out`, `sold out`, `unavailable`, and the existing `construction_status` value when it reads `cancelled`.

**b) Off-plan priority logic** — derive helpers:

```ts
const isReady = (p) => {
  const h = (p.handover_date || "").toLowerCase();
  const cs = (p.construction_status || "").toLowerCase();
  const ss = (p.sale_status || "").toLowerCase();
  return h.includes("ready") || cs.includes("ready") || cs.includes("completed") || ss.includes("ready");
};
const isOffPlan = (p) => !isReady(p);
```

Update `tryTier` to accept an additional `offPlanOnly: boolean` filter, then change the cascading tier loop:

- If `answers.timeline === "ready"` → keep current behaviour (ready preferred via existing `matchesTimeline`).
- Otherwise (any other timeline OR `flexible`) → run each tier first with `offPlanOnly = true`. Only when that returns `< 3` results, re-run the same tier with `offPlanOnly = false` so ready projects fill the gap.

This way the user sees off-plan whenever it's available, and ready ones appear only as a fallback — never sold-out.

## Files Touched

- `src/pages/QuizResults.tsx` — extend scoped style block (hover overrides only).
- `src/pages/Quiz.tsx` — add `isReady` / `isOffPlan` helpers, `offPlanOnly` param to `tryTier`, off-plan-first cascade, tighter sold-out check.

## Verification

- Hover any property card on `/quiz/results`: price pill stays navy glass with cyan "From" + orange value — no white flash.
- Re-run the quiz selecting a future timeline (2026 / 2027+ / Flexible): only off-plan projects appear; if fewer than 3 off-plan match, ready projects are appended at the end.
- A project flagged `is_sold_out = true` or `sale_status` containing "sold" never appears in the results.
