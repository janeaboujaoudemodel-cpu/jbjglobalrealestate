I will fix this in two tracks: authentication stability first, then the shared hero standardization.

## 1. Stop the unexpected logout / auth race

I found multiple places that can make the app appear logged out even when the user did not intentionally log out:

- `SiteAccessGate` runs its own direct backend session checks separately from `AuthContext`, so it can redirect before the main auth state finishes restoring.
- `AuthContext` subscribes to auth events and then calls `getSession()`, which can allow an early empty auth event to briefly set `user = null` before storage restoration finishes.
- Google login redirects to `/welcome`, which adds an unnecessary extra step and can lose the exact page the user came from.
- Broker/session tracking can force sign-out on a 403 response; I will keep that only for truly explicit blocked/revoked cases, not transient failures.

Implementation:
- Make `AuthContext` perform a deterministic initial restore: wait for stored session first, ignore premature null initial events until bootstrap completes, then listen for later changes.
- Convert `SiteAccessGate` to rely on `useAuth()` instead of running a second independent session check.
- Keep the user on protected routes until auth is known; no redirect while auth is still restoring.
- Preserve the intended route through login using `returnTo`/session storage consistently.
- Change Google sign-in to use a public same-origin redirect and navigate only after the session is confirmed.

## 2. Make re-login faster and simpler

Implementation:
- Add a remembered-account strip/card on `/auth` that stores recent successful login emails locally on that browser.
- Tapping a remembered email pre-fills the email field immediately.
- Keep “Continue with Google” prominent so users who do not know their password can use Google without going through password reset.
- Add Google `prompt: select_account` so Google shows the account chooser whenever possible.
- Make clear in the app flow that Google’s external chooser/“continue to jbj.ae” screen is controlled by Google/OAuth branding, while the JBJ-controlled `/auth` card will be fully branded.

## 3. Fix Property Management hero to match Market Intelligence exactly

Implementation:
- Remove the current custom Property Management hero markup.
- Replace it with the same canonical MI hero component/structure used by Market Intelligence.
- Remove the bottom gold divider/hairline under the hero.
- Remove internal decorative lines/patterns/grid overlays from the hero.
- Match MI CTA buttons: emerald/black gradient, no gold borders around CTAs.
- Reduce title wrapping with responsive title width/font rules so it does not become a huge four-line title.

## 4. Standardize the hero for the requested page families

Scope to standardize using the shared MI hero contract:
- Guides pages
- Insights pages
- Services pages
- Company pages
- My Account/account pages that use public shell styling
- Vehicle/tool pages where this same public/content shell is used
- Help & Support / FAQ pages

Implementation:
- Update the shared hero primitives instead of manually editing every page one by one:
  - `PremiumEmeraldHero`
  - `GuideHero`
  - `FAQHero`
  - `MIPageShell`
- Remove shared hero gold divider/hairline and title-rule line from those components.
- Remove shared marble/grain/line overlays that create the unwanted hero lines.
- Align hero typography and CTA styling with the current Market Intelligence hero.
- Keep the vertical sidebar boundary safe: heroes must start after the left sidebar and never go behind it.

## 5. Validation before reporting completion

I will validate with Playwright and screenshots, not just code inspection:
- Auth restore on refresh while logged in.
- Protected route refresh does not bounce to `/access` or `/auth` during session restore.
- `/auth` shows the branded card and remembered account choices.
- Google button starts the correct Google account chooser flow with account selection requested.
- Property Management hero screenshot: no gold divider, no lines, no CTA gold border, title wraps correctly.
- Representative screenshots across:
  - `/market-intelligence`
  - `/services/property-management`
  - `/guides/golden-visa-uae`
  - `/faq`
  - `/about` or `/company-profile`
  - `/my-account` or `/account/passkeys` if authenticated session is available
- Record geometry checks for sidebar-safe hero boundaries and screenshot paths.