I will stop patching individual pages and fix this at the reusable design-system layer.

Implementation plan:

1. Create one canonical Emerald pill/CTA contract
- Every filled action pill must use one solid official emerald surface only.
- No split backgrounds, no half-dark/half-light overlays, no shine bands that look like a second color.
- Normal, hover, focus, active, and disabled states keep the same emerald identity.
- Text and icons inside these pills are forced white in every state.

2. Fix the Button primitive once
- Update `src/components/ui/button.tsx` so all primary/default/destructive/AI action buttons use the canonical emerald class.
- Prevent legacy classes from injecting divided gradients or dark side panels into buttons like “Explore Properties” and “AI Home Finder”.
- Keep secondary/outline buttons champagne unless they are being used as filled actions.

3. Add a global CSS guard for bad pill patterns
- In `src/index.css`, add a scoped rule for action pills/buttons that removes pseudo-element split panels, background-size gradients, before/after overlays, and mixed green/dark/gray treatments.
- Apply to frontend and backend CTA surfaces through shared selectors: `button`, links with button roles/classes, `[data-cta="primary"]`, `[data-surface="emerald"]`, `.jj-cta-primary`, `.jj-cta-emerald`, `.jj-pill-emerald`, `.jj-pill-emerald-metallic`.
- Explicitly force descendants and SVG icons to white.

4. Preserve allowed active segmented controls
- Keep square-foot / square-meter style segmented controls allowed to show a slightly lighter active emerald so the active selection is visible.
- Limit that exception to segmented/toggle components only, not normal CTA pills.

5. Remove the specific split-color source shown in the screenshot
- Find the rule/component creating the dark vertical half-panel inside “Explore Properties” and “AI Home Finder”.
- Replace it with the same canonical emerald pill system instead of a page-level patch.

6. Sweep remaining non-official greens
- Replace remaining UI green button shades such as medium emerald, teal, mint, lime, and alternate green gradients with the official emerald token.
- Keep semantic data colors only where they are not CTA/action fills.

7. Visual validation only
- Use Playwright screenshots at 1280×1800 after implementation.
- Validate `/favorites` specifically for “Explore Properties” and “AI Home Finder”: one emerald pill, white text, white icons, no split sections, normal and hover states.
- Validate representative frontend header controls and backend/admin pages to confirm the global system applies consistently.
- I will not claim completion unless the screenshots visually show the pills fixed.