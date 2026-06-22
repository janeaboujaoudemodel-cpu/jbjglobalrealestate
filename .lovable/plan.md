Plan to fix the rejected green immediately after approval:

1. Lock the approved emerald
- Treat the normal-load Collapse button emerald as the only allowed emerald surface.
- Repoint all emerald/green variables in `src/index.css` to that exact approved dark emerald gradient, not the lighter green gradient.
- Make hover/focus/active states use the same approved emerald, not a lighter green.

2. Remove the restricted green globally
- Replace visible `#047857`, `#059669`, `#10B981`, Tailwind `bg-green-*`, `from-green-*`, and light `bg-emerald-*`/`from-emerald-*` surfaces with the approved emerald.
- Keep semantic red/blue/amber data colors untouched unless they are green surfaces.
- Remove borders from emerald buttons, icon circles, pills, and badges.

3. Fix the exact card controls shown in your screenshot
- Heart button: approved emerald background, pure white heart, no white border.
- Shortlist button: approved emerald background, pure white icon, no white border.
- Add Badge pill: approved emerald background, pure white icon/text, no border.
- Email / Call / Chat buttons: approved emerald background, pure white icon/text, no border.
- EOI and handover labels stay as the visual reference source and will not be changed away from the approved emerald.

4. Fix Continue Searching controls
- History circle before “Continue Searching for Your Dream Property”: approved emerald, white icon, no border.
- Heart on Continue Searching cards: same approved emerald, white icon, no border.

5. Fix mortgage and other visible green leaks
- Mortgage CTA/buttons, sliders, bank-rate buttons, and any remaining visible green surfaces will use the same approved emerald at rest and hover.

6. Visual validation before reporting back
- Navigate as a user to `/`, `/properties`, one `/project/:slug`, and `/mortgage-calculator`.
- Capture screenshots showing the fixed heart, shortlist, Add Badge, Email/Call/Chat, Continue Searching history circle/heart, and mortgage CTA areas.
- Inspect computed styles for the target elements: background is approved emerald, text/icons are white, border width is `0px`.
- Only report complete after screenshots confirm the corrected visuals.