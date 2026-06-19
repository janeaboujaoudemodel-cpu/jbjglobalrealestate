---
name: Metallic Gold CTA Primitive
description: .jj-cta-gold-metallic class is the single source for inside-page primary CTAs (Register Interest, Request Consultation, Request a Call Back, Submit Report, Download Brochure). Animated champagne→gold→champagne metallic sheen on hover.
type: design
---

# Metallic Gold CTA Primitive — `.jj-cta-gold-metallic`

Defined in `src/index.css` alongside other CTA primitives.

Use for inside-page primary CTAs:
- Register Interest / Register Your Interest
- Request Consultation / Request a Call Back
- Submit Report / Report an Issue button
- Download Brochure / Floor Plan / Payment Plan
- Any in-section submit button on champagne forms

Never use:
- For hero CTAs (those are dark `.jj-cta-dark`)
- For destructive/critical actions
- Stacked next to itself (one metallic CTA per card)

Behavior:
- Idle: champagne→gold→champagne ombré, 1px gold hairline, ink text, subtle gold glow
- Hover: background position sweeps to opposite anchor, white shine sweeps across, slight lift, brighter gold glow
- Text and icons always ink `#1A1A1A` (locked inside the rule with `> *` + svg overrides)
- Disabled: opacity 0.55, no pointer

Markup:
```tsx
<button type="submit" className="jj-cta-gold-metallic w-full h-14 inline-flex items-center justify-center gap-2 font-semibold">
  <Icon className="w-4 h-4" /> Label
</button>
```
