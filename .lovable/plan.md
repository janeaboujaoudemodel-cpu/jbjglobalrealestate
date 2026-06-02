## Goal

Rebuild `/compare` (Property Comparison) into a premium AI tool surface — animated Flo-style blue→pink→purple flowing gradient, no gray/silver, no boring step cards, with a live example of the comparison table, fixed button contrast, and a smarter AI engine. Verify everything end-to-end in the browser before delivery.

This is scoped as an **AI tool exception** (per the AI Premium Purple memory): the violet/blue/pink theme applies ONLY inside `/compare` and `/compare-manual`. The rest of the site keeps the champagne-gold standard.

---

## 1. New visual shell (Flo-style animated gradient)

Replace the current burgundy/champagne shell on `/compare` with a dedicated `CompareAIShell`:

- Full-bleed animated background: three soft conic/radial blobs (electric blue `#3B82F6`, hot pink `#EC4899`, deep violet `#7C3AED`) drifting on a slow 18–24s loop using `framer-motion` + CSS keyframes (GPU-accelerated `transform`/`filter: blur(80px)`). Subtle grain overlay, deep navy base `#0B1020`.
- Glassmorphic content cards: `bg-white/[0.04]` + `backdrop-blur-xl` + 1px gradient border (blue→pink→purple), no gray/silver fills anywhere.
- Hero headline uses a gradient text wipe (blue→pink) with a single light-sweep animation on mount.
- Replace `ToolAnimatedFrame theme={toolThemes.burgundy}` with the new shell. Remove all `bg-zinc-*`, `bg-gray-*`, `from-gold/*` references on this page.

## 2. Process: step-line instead of step cards

Kill the 3-card "Browse / Shortlist / Generate" grid (lines ~563–588). Replace with a horizontal **AnimatedStepLine** component:

```text
①────────②────────③────────④
Pick     Add via   AI         Get
listings link/PDF  analyzes   verdict
```

- Animated SVG path with a gradient dot that travels left→right on a loop.
- Each node: 36px circle with gradient ring, label below, micro-icon above.
- Mobile: vertical with the same animated path.

## 3. Live example of the comparison table

Directly under the step-line, render a **pre-filled "Try it — sample comparison"** panel with 3 demo projects (Emaar Beachfront / Sobha Hartland / Damac Lagoons) and a real AI-comparison table preview (5–6 rows: Price/sqft, Yield, Handover, Payment plan, Smart rating, Verdict). Static data, not a network call. Includes:

- "This is what you'll get" eyebrow chip
- Animated stat counters on viewport enter
- A "Compare your own" CTA below

This replaces the abstract feature-highlight quad (`Side-by-Side / ROI / Smart / Expert`).

## 4. CTA + button contrast pass

Every button on `/compare` audited and rebuilt against the navy/glass background:

| Button | New treatment |
|---|---|
| Start Comparing | Solid gradient (blue→pink→purple), white text+icon, 1px white/30 inner ring, lift on hover |
| Add via link/PDF (AI fill) | Glass white/10 + white text + violet icon + violet 1px border |
| Compare manually | Outline white/30 + white text, hover fills white/8 |
| Browse Properties | Same as Start Comparing variant |
| Download Report / Excel | Glass + violet accent |
| Share WhatsApp | Keep green but match new radius/height |
| Share Email | Glass dark + white text (was broken white-on-light) |

All buttons get `data-no-contrast-guard` + `data-allow-dark-cta` so the global champagne-guard doesn't repaint them to ink. Min height 48px, `rounded-xl`, consistent gap/padding.

## 5. Smarter AI engine (`smart-ai-analysis` edge function)

Upgrade the existing `supabase/functions/smart-ai-analysis`:

- Switch model from current → `openai/gpt-5.5` (state-of-the-art reasoning) with `reasoning.effort = "medium"` for the verdict pass, `google/gemini-3-flash-preview` for the fast extract pass (two-stage pipeline).
- Add new structured-output sections to `AIAnalysis`:
  - `marketContext` — micro-market trend, 12-month price delta, supply pipeline (uses existing market intel tables when available)
  - `riskScore` — 0–100 per project with weighted factors (developer track record, handover risk, oversupply, payment-plan stress)
  - `bestForPersona` — auto-detect investor / end-user / flipper from shortlist behaviour and tailor the verdict
  - `negotiationLeverage` — concrete asks the buyer can use (e.g. "ask for DLD waiver + 60/40 payment")
- Tool-calling (not free-text JSON) for guaranteed schema.
- Cache analysis by sorted shortlist-IDs hash for 24h in `ai_analysis_cache` to avoid re-billing on refresh.
- Surface 402/429 errors as toasts with clear copy.

## 6. UI surfaces for the new AI sections

Add three new sections after the existing ratings table:

- **Market Context strip** — three KPI tiles per project (price trend ▲/▼, supply heat, demand index)
- **Risk Score gauge** — circular gauge per project with the weighted breakdown on hover
- **Negotiation Leverage** — bulleted card with copy-to-clipboard per item

All themed in the new blue/pink/purple system.

## 7. End-to-end visual QA (mandatory, before sign-off)

Using the browser tool at viewport 1178×891 then 390×844:

1. Navigate to `/compare` logged-out → verify empty-state shell, step-line animation, sample table renders, all CTAs readable.
2. Add 2 demo projects via "Add via link/PDF (AI fill)" using a public Emaar URL → confirm AddProjectDialog still works on the new shell.
3. Navigate to `/properties`, shortlist 3 projects, return to `/compare` → verify projects load, table headers don't break on the navy bg, images render.
4. Click "Start Comparing" while signed in → verify edge function call, loading state, all 4 new analysis sections render with real data, no white-on-white or black-on-black.
5. Click Download Report → confirm HTML report still generates and the disclaimer is intact.
6. Click Download Excel + Share WhatsApp + Share Email → verify each fires.
7. Hover/focus every button → confirm no contrast guard flicker, no text disappearing.
8. Resize to 390px → confirm step-line goes vertical, table scrolls horizontally, CTAs stack cleanly.

Any visual regression found in QA gets fixed in the same loop before reporting back.

---

## Out of scope

- `/compare-manual` page (will inherit the new shell automatically since it sits inside the same route family — visual parity only, no logic change)
- Global theme — the blue/pink/purple stays scoped to `/compare*` and the AI tool routes that already use it
- Existing PDF report HTML (keeps current dark/gold layout — it's a downloadable deliverable, not the on-page UI)

## Technical notes (for reference)

- New files: `src/components/compare/CompareAIShell.tsx`, `src/components/compare/AnimatedStepLine.tsx`, `src/components/compare/SampleComparisonPreview.tsx`, `src/components/compare/MarketContextStrip.tsx`, `src/components/compare/RiskScoreGauge.tsx`, `src/components/compare/NegotiationLeverage.tsx`
- Edits: `src/pages/Compare.tsx` (rewrites hero + empty state + CTA cluster), `supabase/functions/smart-ai-analysis/index.ts` (two-stage pipeline + tool calling + cache)
- Migration: `ai_analysis_cache` table (shortlist_hash, payload jsonb, created_at) with TTL cleanup trigger
- Animations: `framer-motion` (already in project), no new deps
- Memory: add `mem://features/ai-intelligence/compare-tool-rebuild-standard` documenting the AI-tool blue/pink/purple exception scope

Approve and I'll switch to build mode and execute the whole thing including the browser QA loop.
