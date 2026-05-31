Plan to finish the contrast cleanup cleanly

1. Preserve the repaired locks
- Do not remove or weaken the already-fixed locks for:
  - Hero consultation CTA
  - Continue Searching/favorite trigger
  - Photo overlay text
  - Sidebar gold/ink icons
  - Cookie banner dark CTA
  - Assistant Send dark CTA
- Keep the approved CTA primitives as the source of truth: `.jj-cta-dark`, `.jj-cta-champagne`, `.jj-cta-outline`, `.jj-pill-active`, plus `data-cta`.

2. Remove the remaining winning conflicts in `src/index.css`
- Neutralize the old “GLOBAL MONOCHROME OVERRIDE — WHITE DOMINANT” block that still rewrites champagne backgrounds to white and gold/champagne text to black.
- Remove or narrow legacy broad selectors that still infer contrast from substring classes:
  - `[class*="bg-black"]`
  - `[class*="bg-[#0"]`
  - `[class*="from-[#FDFBF7]"]`
  - `[class*="from-[#F7F2EA]"]`
  - `[class*="text-[#B89555]"]`
  - `[class*="text-[#1A1A1A]"]`
- Replace them with whole-token selectors (`[class~="..."]`) or explicit surface markers only, so hover/data variant classes can no longer win accidentally.

3. Consolidate to one final contrast contract
- Keep exactly two architectural outcomes:
  - Dark/navy/ink own surface → white text/icons.
  - Champagne/page/cream/raised/light/gold own surface → ink text/icons.
- Explicitly define nested-surface precedence:
  - Light card inside dark section stays ink.
  - Navy button inside champagne section stays white.
  - Champagne button inside navy section stays ink.
- Treat gold as a light/champagne-family surface for foreground purposes, matching the project rule: gold is accent/hairline only, not a white-text fill.

4. Clean form/select/menu contrast rules
- Keep form controls readable, but stop global rules from forcing every input/select to pure white if it sits in a champagne component that should remain champagne.
- Preserve the locked phone/cmdk rules from memory.
- Ensure Radix menus/popovers default to ink on light surfaces unless they explicitly carry dark surface/CTA markers.

5. Add a small audit safety net
- Add a focused runtime/static-friendly selector contract near the end of `index.css` that wins over older blocks without adding new broad conflicts.
- The final lock will avoid `.allow-white` as a contrast decision on light surfaces; own background/surface must decide contrast.

6. Validate visually and with computed styles
- Capture screenshots at the current viewport for:
  - `/join` because that is the current broken context.
  - `/` homepage repaired sections.
  - `/ai-broker-workspace` sidebar + dark CTA regression area.
  - `/ai-hub` and `/toolkit` AI/tool cards.
  - `/properties`, `/developers`, `/areas` listing/card pages.
- Run computed-style checks for:
  - white-on-champagne/light/gold count = 0
  - dark-on-navy/dark count = 0
  - sidebar white-icon count = 0
  - dark CTA text/icon white on navy = true
  - champagne CTA text/icon ink = true

Files expected to change
- `src/index.css` primarily.
- Only if validation reveals a component with wrong surface metadata, make minimal component fixes to add the correct `data-surface`/`data-cta` marker, without redesigning or removing features.