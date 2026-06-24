---
name: SqFt/SqM Toggle Continuous Sweep Lock
description: Locked continuous metallic emerald sweep on active measurement toggle pill
type: constraint
---
🔒 LOCKED — DO NOT MODIFY.

The active sq ft / sq m toggle pill renders a continuous metallic emerald sweep via `.jj-sqtoggle-sweep` + `jj-sqtoggle-fast-3d-metal` keyframes in `src/index.css`.

Locked specifics (never change):
- 7-stop emerald→white→emerald gradient on `background-image` only
- `background-color: transparent` (never use `background:` shorthand — it freezes the animation)
- `background-position` animates 180% → -90%, duration 1.15s, infinite linear
- `will-change: background-position`
- 3D press effect preserved: `scale(0.965) perspective(80px) rotateX(-7deg)`

Same lock applies to the developer logo metallic gold fill (`.jj-developer-logo-metallic` + `jj-developer-logo-gold-metal`) — full-box animated gold, no frame-only variant.

**Why:** User explicitly approved the current state after multiple iterations and instructed it must never be touched again.
