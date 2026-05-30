I will fix this as a system-level regression, not one button at a time.

Plan:

1. Restore the CTA contrast primitives
- Remove the broad late CSS rules that infer foreground from `hover:bg-*`, force every descendant color, and globally rewrite transition durations.
- Keep only explicit surface/CTA contracts: dark/fiberglass = white text/icons; champagne/light/gold = ink text/icons.
- Add a locked `fiberglass` CTA primitive for dark image/hero overlays so it does not get turned blue or champagne by global rules.

2. Fix the directly broken homepage controls
- Homepage hero `Free Consultation`: restore the previous dark/fiberglass translucent look with white title, not blue/navy.
- `Get Verified`: keep champagne/light button with black title and black arrow in idle, hover, focus, and active states.
- Search button: keep black/ink text on its light search surface.
- Cookie/tour controls: fix the visible Welcome Guide button regression where the light button currently has white unreadable text.

3. Fix listing-card action buttons/icons
- Update the ProjectCard Email / Call / Chat actions so the button surface and icon/text color are explicit.
- If the action tile is dark, icon and label are white. If the action tile is champagne, icon and label are ink. No black icon boxes with invisible icons.

4. Fix service and Royal Tools tab/hero panels
- Active `Buy Property` and active `Property Evaluator` tabs: champagne/cream background with black text and black icon.
- Inactive tabs: dark/fiberglass/navy background with white text and white icon.
- Image-panel copy (`AI-powered property valuation...`, service descriptions): white, readable, and shadowed on the dark overlay.
- `Explore Now` and `Get Evaluation`: fiberglass/dark translucent CTA with white text and white arrow in all states.

5. Fix Continue Searching motion
- Remove the fast requestAnimationFrame marquee/translate loop.
- Replace it with a stable native horizontal rail/snap layout that a normal user can read at rest.
- Remove drag-style behavior to comply with the non-draggable UI rule.

6. Fix spacing/loading/layout regressions
- Mortgage calculator card: remove the forced 1050px minimum height that creates the large empty gap under the CTA buttons.
- Top Areas images: make the visible three area photos load eagerly with stable dimensions so they appear faster and do not shift.
- Ready to Get Started: make the section full width to match Top Areas in Dubai.

7. Broker vertical sidebar exception
- In the expanded broker sidebar only, category labels render gold by default.
- On hover they become black.
- Collapsed sidebar/icon-only behavior remains stable and readable.

8. Visual validation before calling it done
- Test desktop and mobile live preview.
- Check homepage hero/search, Get Verified, property cards, Continue Searching, guides/books, Explore Services, JBJ Royal Tools Hub, mortgage card, Top Areas, Ready to Get Started, floating Contact Us/Web Developer widgets, cookie/tour controls, and broker sidebar.
- For each: idle, hover, focus, after scroll, and after a 5-second wait.
- I will only report completion after the live preview confirms no flicker and no unreadable text/icons.