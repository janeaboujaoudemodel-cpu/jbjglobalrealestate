Plan to fix and validate the emerald issues:

1. Lock the approved emerald source of truth
- Use the same approved emerald treatment as the Email / Call / Chat buttons: `var(--jj-emerald-ombre)` / `var(--jj-emerald-ombre-hover)`.
- Add a final high-specificity CSS lock at the bottom of `src/index.css` so emerald action buttons, icon circles, badges, labels, and mortgage controls render:
  - approved emerald background only
  - pure white text/icons
  - no visible border/ring/outline
  - deeper emerald at rest, lighter emerald on hover

2. Fix project card heart / shortlist / add-badge directly
- Update `FavoriteButton.tsx`, `ShortlistBadgeButton.tsx`, and `DesignFavoriteButton.tsx` so they do not rely on old green utility classes or old bordered pill styling.
- Force the button circles to approved emerald, white heart/list/award/check icons, and no border.
- Ensure the add-badge button on project cards is the same approved emerald and not restricted green.

3. Fix all project-card labels and card CTAs
- Replace the EOI / handover inline restricted-green gradients in `ProjectCard.tsx` with the approved emerald variable.
- Remove the white border from those labels.
- Ensure Email / Call / Chat, Register Interest, Download Brochure, Download Branded Presentation, and similar emerald CTAs use the same approved emerald + white content + no border.

4. Fix Continue Searching section
- Ensure the history icon circle and property-card heart in `ContinueSearching.tsx` use the same approved emerald and white icon.
- Remove remaining border styling from those emerald controls.

5. Fix mortgage calculator / compare bank rates
- Replace any bank-rate slider green, mortgage range track/thumb green leaks, and “Try our / AI mortgage calculator” green CTA styles with approved emerald.
- Remove borders from emerald mortgage buttons/pickers.
- Keep text/icons pure white on emerald states.

6. Sweep restricted green globally
- Search and replace remaining restricted green sources in touched UI areas:
  - `bg-green-*`, `from-green-*`, `text-green-*`, `border-green-*`
  - light `emerald-300/400/500/600` utilities
  - direct restricted hexes such as `#047857`, `#059669`, `#10B981`, `#34D399` where they paint visible buttons, labels, badges, or icon circles.
- Preserve semantic data colors only where they are clearly not requested CTA/icon/label surfaces.

7. Visual validation before reporting back
- Use Playwright after changes and only send screenshots that pass visual checks.
- Validate these pages/areas:
  - `/` Continue Searching section: history circle + heart icon
  - `/properties`: project card heart, shortlist, add badge, EOI/handover labels, Email/Call/Chat
  - one `/project/:slug`: project-detail badge/actions where visible
  - `/mortgage-calculator`: compare bank rates picker and mortgage CTA
- In the validation script, also inspect computed styles for the target elements and confirm:
  - background is the approved emerald gradient or `#064E3B` fallback
  - icon/text color is white
  - border width is `0px` or visually none
- Save screenshots/crops and report only after the checks pass.