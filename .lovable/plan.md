## Goal

Bring three calculator-style tools — **Rental Index**, **Property Evaluator**, **Property Comparison** — onto one shared "Tool Page Shell" with the same layout as today's Dubai Rental Index. Each tool gets its own signature ombré accent. Fix all readability/contrast bugs, remove the leftover gray frame on `/compare`, kill the Founder/Jane block, consolidate Compare into a single route, and confirm backend wiring.

---

## 1. Unified Tool Page Shell

Create `src/components/tools/ToolPageShell.tsx` with a single themable layout used by all three tools:

- **Outer page frame** — full‑bleed champagne band (`.jj-band page`) with a 1px gold hairline. No more gray section dividers anywhere on these pages.
- **Hero band** — full width, ombré gradient (per‑tool palette below), white H1 + ink‑on‑light subhead, breadcrumb + back arrow.
- **Two‑column body** (lg: 2/3 form, 1/3 sidebar):
  - Left: "Property Details" card — premium champagne surface, gold hairline, ombré accent on the section title and on the icon tile beside each label.
  - Right: stack of three cards — **How It Works**, **Data Sources**, **AI Tool Disclaimer**. All three use the same ombré accent on icon + title, ink body text on champagne surface.
- **Primary CTA** ("Get Rental Estimate" / "Run Evaluation" / "Start Comparing") — ombré gradient fill, white text, gold hairline; hover = ink→ombré reverse (black to accent), never solid flat green/blue/red.
- **Results panel** — appears under the form card; same shell, same ombré accent.

The shell takes one `theme` prop: `{ name, from, via, to, ink, hairline }`. All accent usage (icons, hairlines, hover, CTA gradient, hero gradient) is driven from that one object so palettes stay consistent and swap-safe.

### Per‑tool palettes (my recommendation)

| Tool | Ombré accent | Notes |
|---|---|---|
| Rental Index | **Emerald → Ink** (`#0F3D2E → #082018 → #000000`) | green you already use for the form borders, deepened |
| Property Evaluator | **Royal Blue → Ink** (`#102540 → #0A1830 → #000000`) | same blue family as the Get Verified banner |
| Property Comparison | **Burgundy → Ink** (`#5A0F1A → #2E0810 → #000000`) | "ombré red" you suggested; reads premium, not alarm-red |

Gold (#B89555) remains the universal 1px hairline on every card and on the hero's bottom edge so the brand reads as one family.

---

## 2. Fix the readability/contrast bugs

- **Rental Index** — labels above "Community / Area *", "Property Type *", etc. are currently faded gold on champagne. Switch to ink `#1A1A1A` with the asterisk in accent ombré start color. Same fix on Property Evaluator.
- Any title currently rendered in faded gold (`text-gold/XX` or muddy hexes) on the three tools → ink `#1A1A1A`. Subtitles → `#1A1A1A]/70`.
- Icon tiles inside form labels → `<IconTile tone="emerald|blue|rose">` matching the tool theme, never white-on-gold.
- Disclaimer/data‑source small print → ink/70, not gold.

---

## 3. `/compare` deep cleanup

- **Remove the gray internal frame** still rendering around "Welcome to Property Comparison" — replaced by the new ToolPageShell (champagne card + gold hairline, no gray anywhere).
- **Outer frame** → blue ombré (the Evaluator/Compare blue family, since Compare's signature is burgundy the outer chrome stays champagne; only the hero band carries the burgundy ombré — confirm in question 1 below).
- **Welcome card** → premium champagne ("leather" texture via subtle gold radial), H1 "Welcome to Property Comparison" in tool accent color, body copy "Thank you for exploring our exclusive AI‑powered…" in gold `#B89555`.
- **Remove Jane / Founder block entirely.** Delete both `<FounderContent>` usages in `Compare.tsx` (lines ~546 and ~656) and replace with a single small "Powered by JBJ Global Real Estate" lockup (monogram + wordmark, gold hairline above).
- **Consolidate routes** — merge `CompareManual.tsx` features into `Compare.tsx`, point `/compare-manual` as a redirect to `/compare`, and remove the duplicate file. Audit every "Start Comparing" / "Property Comparison" button across the app (`AIComparisonWidget`, `ComparisonBar`, `AdvancedBrokerToolkit`, `AIHub`, `Favorites`, `InvestorDashboard`, `InvestorHub`, `BrokerHub`, `QuizResults`, shortcut configs, registries) and rewire every CTA to `/compare`.

---

## 4. Backend / wiring verification

- Rental Index → existing `rental-estimate` edge function call path unchanged; verify Zod input still matches new form field order. Log writes to `tool_usage_log` (or current equivalent) keep firing.
- Property Evaluator → same; confirm `property-evaluator` function still receives the same payload.
- Compare → confirm `ai_comparison` save path (Compare.tsx:459) still runs after restyle; no field rename.
- Government/source links (DLD, RERA, Bayut market data, developer/area pages) — keep all current outbound integrations in the Data Sources card; verify URLs resolve.
- After edits, run the build and a smoke pass on each `/rental-index`, `/property-evaluator`, `/compare` route to confirm forms submit and results render.

---

## 5. Files touched (high‑level)

- New: `src/components/tools/ToolPageShell.tsx`, `src/components/tools/toolThemes.ts`
- Edit: `src/pages/RentalIndex.tsx`, `src/pages/PropertyEvaluator.tsx`, `src/pages/Compare.tsx`
- Delete + redirect: `src/pages/CompareManual.tsx` → route redirect in `src/routes/PublicRoutes.tsx`
- Edit (CTA rewiring): `AIComparisonWidget.tsx`, `ComparisonBar.tsx`, `AdvancedBrokerToolkit.tsx`, shortcut/registry configs that still point at `/compare-manual` or duplicate compare entry points

---

## Open question before I build

Two quick confirmations so I don't redo it:

1. **Compare hero ombré color** — you said "ombré red with black" but also mentioned blue for the outer frame. My recommendation: **burgundy ombré hero + champagne body + gold hairline** (no blue on Compare; blue stays the Evaluator's signature). OK to proceed with that, or do you want blue on Compare and a different accent on Evaluator?
2. **CompareManual deletion** — confirm I can delete `CompareManual.tsx` outright and 301 `/compare-manual` → `/compare`. Any feature there I should port into the main page first? (My read: it's a lighter manual form already covered by Compare's flow.)
