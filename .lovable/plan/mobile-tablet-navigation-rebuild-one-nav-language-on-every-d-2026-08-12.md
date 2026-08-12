# Mobile + tablet navigation rebuild — one nav language on every device

## What is actually wrong today (verified in code)

- The desktop chrome (vertical sidebar + utility bar) is mounted only from 1024px up (`hidden lg:block`), and the rail markup itself is additionally `hidden sm:flex`. So phone and tablet get a completely different navigation built from different markup.
- The phone/tablet menu is a separate, hand-written full-screen drawer inside the global header. Its surfaces, ink and borders are hardcoded champagne/black hex values instead of the Sun/Moon theme tokens, so in Moon the site-wide white-ink contract paints white labels on a champagne panel — exactly the washed-out menu in the screenshot.
- Because that drawer and the header are separate from the sidebar layering system, on some pages page content and overlays sit above them, which is why navigation disappears behind content.

## What will change

1. **One nav source of truth.** The phone/tablet menu will be rebuilt to render the same navigation component and the same section/route data as the desktop sidebar, presented as a left slide-in drawer instead of a second hand-written menu. Same order, same groups, same icons, same labels, same active-row treatment.

2. **Sun/Moon parity on every screen size.** The mobile drawer, its header band (monogram + wordmark), quick-action row, group headers, rows, dividers and footer (Sign Out / account) will use the same theme tokens and emerald/champagne surfaces as the desktop rail — emerald ombré with pure white ink in Moon, champagne with black ink in Sun. No hardcoded champagne or black values left in the mobile menu.

3. **Header identity fixed on phone.** The monogram and company wordmark in the mobile header get the same size, spacing and skin-aware ink as the desktop rail brand band, so the wordmark never sits washed out or clipped, and the hamburger/close mark follows the same ink rule.

4. **Tablet (iPad) behaviour.** Tablet portrait keeps the drawer; tablet landscape and above get the real collapsed rail so an iPad looks like the laptop rather than like a phone. The breakpoint switch happens in one place.

5. **Layering fix, site-wide.** Mobile header, drawer and backdrop move onto the same documented layer scale as the desktop sidebar, above page content and section overlays, with body scroll locked while open and safe-area padding at the bottom. This removes the "nav hidden behind content" pages.

6. **Mobile-friendly polish.** Minimum 44px touch targets on every nav row and quick action, no cropped or ellipsised labels, drawer scrolls with momentum inside itself only, tapping a row closes the drawer, and the theme (Sun/Moon) control is available in the drawer with the same premium treatment as the sidebar.

## Validation

Screenshot proof via the project QA screenshot script at phone (390px), tablet portrait/landscape (768/1024px) and desktop widths, in both Sun and Moon: closed header, open drawer, an expanded group, and two pages that previously hid the nav. Computed-colour probes confirm ink/surface pairs on the drawer in both skins.

## Technical notes

- Changes stay in presentation/navigation layers: the global header's mobile menu block, the vertical nav component's responsive branches, the layout shell's chrome wrappers, and a new scoped stylesheet pass for mobile parity.
- Navigation items come from the existing sidebar section config — no duplicated link lists.
- No database, auth or business-logic changes.
