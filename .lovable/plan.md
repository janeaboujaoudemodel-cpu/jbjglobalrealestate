# Single-Source CTA Contract — Emerald Primary / Champagne Secondary

Lock the platform to exactly two CTA primitives, remove every duplicated/conflicting rule, and validate live.

## The contract (one rule, no exceptions)

- **Primary CTA → emerald-filled, pure white text + pure white icon.**
  Applies to every primary action across every page, regardless of label (Request Call Back, Book Now, Download, Submit, Ask, Save, Continue, etc.).
- **Secondary CTA → champagne-filled, emerald text + emerald icon, 1px gold hairline.**
- **Hero CTA on dark imagery** stays the existing ghost/white-border variant — out of scope, not a "primary CTA".
- **Gold metallic CTA** (`.jj-cta-gold-metallic`) stays as-is — it is a separately documented primitive, not a primary.

## Root cause to remove

`src/index.css` has the same primitive (`.jj-cta-champagne`, `[data-cta="champagne"]`) defined in two places with opposite intents:

- Line ~4527 + ~4879 + ~4908: champagne bg + ink text (secondary)
- Line ~10357: emerald gradient bg (primary)

The earlier ink-text rule wins specificity for color, the later emerald rule wins for background → emerald button with black text. Every other "duplicate" symptom (Project page mortgage CTA, Ask, Download Report, segmented tab, etc.) traces to this collision.

## Workstream 1 — Collapse to one primitive each

1. Make `.jj-cta-primary` / `[data-cta="primary"]` / `.btn-primary` / `button[type=submit]` (with documented opt-outs) the **only** selectors that paint the emerald gradient.
2. Make `.jj-cta-champagne` / `[data-cta="champagne"]` / `.jj-cta-outline` / `[data-cta="outline"]` the **only** selectors that paint champagne with emerald ink.
3. Delete every redundant block in `src/index.css` that re-asserts either primitive (`.jj-emerald-solid`, `.jj-pill-emerald`, `.jj-surface-emerald` re-declarations, `.jj-official-emerald`, the gate-1/gate-2 promotion blocks, etc.) and forward all of them to alias `.jj-cta-primary` in one place.
4. Inside the primary rule, force `color`, `-webkit-text-fill-color`, and `stroke` to `#FFFFFF` on the button **and** on descendants (`span`, `svg`, `[class*="lucide"]`) at the same specificity used by the older ink-text rule, so it wins deterministically without relying on `!important` stacking.
5. Remove the `.jj-cta-champagne` entry from the older "light own-surfaces" ink-text contract (line ~4908) because that primitive's color now lives in the single secondary rule.

## Workstream 2 — Global enforcement net

Add one final guard at the end of `index.css`:

```css
/* Any element whose computed emerald primitive is active MUST render white. */
.jj-cta-primary, [data-cta="primary"], .jj-cta-primary *, [data-cta="primary"] *,
.jj-surface-emerald, .jj-surface-emerald *,
.jj-emerald-solid, .jj-emerald-solid *,
[data-surface="emerald"], [data-surface="emerald"] * {
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
  stroke: #FFFFFF !important;
  fill: currentColor;
}
```

This catches any future button on any page (Book Now, Call Back, Reserve, anything) the moment it lands on an emerald primitive — no per-page patch needed.

## Workstream 3 — Component sweep

For each consumer that currently paints emerald via a hardcoded class or inline style instead of the primitive:

- Replace `bg-[#064E3B]`, `bg-emerald-*`, inline `style={{background:'#064E3B'}}`, and one-off gradients with `className="jj-cta-primary"` (or keep their existing class but add `data-cta="primary"`).
- Verify Button.tsx variant map: every variant the design system considers "primary" must emit `data-cta="primary"`; everything else must emit `data-cta="champagne"` or `data-cta="outline"` or `data-cta="dark"`.
- No component should set `color` inline on a primary CTA — the global rule owns it.

Files to audit (grep + visual): `src/components/ui/button.tsx`, `src/components/ui/emerald/EmeraldButton.tsx`, `src/components/tools/PrimaryCTA.tsx`, every `ContactButton`, `BookingButton`, `RequestCallback*`, `Download*Button`, `Ask*Button`, `Reserve*Button`, project-detail CTAs, news/intel hub CTAs.

## Workstream 4 — Publish + live audit

1. Publish the build so the live bundle matches source.
2. Re-run the Playwright audit against `jbjglobalrealestate.lovable.app` on `/`, `/properties`, `/project/:slug`, `/tools`, `/news`, `/broker`, `/owner`, `/compare`, `/favorites`, `/contact`.
3. Per route, fail on any element whose computed background is emerald (`rgb(6,78,59)` or close) AND whose text/svg color is not pure white.
4. Deliver the screenshots + a zero-violation report. Do not claim done until the live audit returns 0 across all routes.

## Out of scope

- No business logic, no data, no backend.
- No changes to hero ghost CTAs, gold metallic CTA, or dark/navy CTA primitives.
- No new colors or tokens.

## Definition of Done

1. Exactly one CSS rule defines the emerald primary; exactly one defines the champagne secondary. No conflicting re-declarations remain in `src/index.css`.
2. Every primary CTA across every page renders emerald fill + pure white text + pure white icon — verified by Playwright on the published bundle.
3. Zero black/ink text on any emerald surface anywhere in the audited routes.
4. Screenshots delivered per route as proof.
