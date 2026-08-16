---
name: Moon Hero-Clear Rail
description: In Moon, the collapsed rail over a photo/video hero is fully transparent with white glyphs; emerald returns only after scrolling past the hero
type: design
---

- While `body[data-jj-hero-chrome="clear"]` and the rail is collapsed (`[data-rail-state="collapsed"]`), the vertical rail paints nothing in Moon: transparent surface, white ink/icons, one 1px white hairline on its right edge.
- PASS 310 / PASS 366 emerald rail gradients must never win over this state — any new rail rule needs a hero-clear exclusion.
- Enforced in `src/styles/pass-376-moon-hero-clear-rail.css` (registered in `src/main.tsx`).
