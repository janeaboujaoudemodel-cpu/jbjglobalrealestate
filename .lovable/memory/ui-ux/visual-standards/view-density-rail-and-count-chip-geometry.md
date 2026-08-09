---
name: View Density Rail & Count Chip Geometry (LOCKED)
description: Numeric/count chips (per row, per page, pagination) must be true 42px circles, never vertically squeezed ovals; Grid/List toggles match the sidebar Collapse button (42px, rounded-lg, gold hairline, emerald ombré when active).
type: design
---
Applies to every card page control rail (developers, projects/properties, news,
areas, communities, services) and every pagination number control.

- Count chips: `data-count-chip` + `data-numeric` → 42×42, `aspect-ratio:1/1`,
  `border-radius:9999px`, no padding-driven width, `flex:0 0 auto`. Word chips
  (e.g. "All") drop `data-numeric` and become a 42px-tall pill with 14px padding.
- Mode toggles: `data-view-mode-button` → 42px tall, `rounded-lg` (0.5rem),
  1px border idle / 2px `#B89555` active, emerald ombré
  `linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000)` when active with white ink.
  This mirrors the sidebar "Collapse" control exactly.
- Active/idle ink: never add `allow-white` / `data-on-dark` to an INACTIVE
  control — those attributes force white ink and make the label invisible on
  the white surface. Apply them only when `data-active="true"`.
- Section labels ("View", "Per row", "Per page") are uppercase 10px,
  `tracking-[0.16em]`, `whitespace-nowrap`, separated by `gap-x-5`.

Enforcement: `src/index.css` PASS 278 / 278b / 278c.

Why: the owner rejected vertically squeezed oval number buttons and pill-shaped
toggles; circles must match the header's circular action icons.
