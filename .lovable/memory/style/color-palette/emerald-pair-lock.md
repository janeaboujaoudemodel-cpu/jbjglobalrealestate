---
name: Emerald Pair Lock — never #064E3B alone
description: The lone flat emerald #064E3B is forbidden as a fill. It must always be paired with #042c1c (+ black) as the brand ombré gradient, exactly like the "Create your account" button.
type: constraint
---
`#064E3B` must NEVER be used alone as a background/fill anywhere on the platform
(buttons, badges, pills, labels such as "Launch"/"View", cards, bands, chips).

The only valid emerald fill is the PAIR:

```css
linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #000000 100%)
```

This is the exact recipe behind the "Create your account" button and the
"Talk to an advisor" hover state. Hover variant may lighten the first stop
(`#075c46 → #053825 → #000`) but must keep both greens.

Text colour `text-[#064E3B]` on light surfaces is allowed — this is a FILL rule.

Enforcement: `src/index.css` PASS 160 "EMERALD PAIR LOCK" repaints any element
still using a flat `#064E3B` / `bg-emerald-900` fill (class or inline style)
into the paired gradient, so the lone green cannot render.

Why: the owner rejected the single flat green as off-brand and required both
colours together, always.
