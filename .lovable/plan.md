
## Scope

Four targeted UI fixes. The scrolled (solid) header stays exactly as it is today — only the transparent/non-scrolled state changes.

---

### 1. Two stacked popups on desktop login

`PopupLayer` renders `LeadCapturePopup` + `ModeSelectionModal` + `PropertyRecommendationPopup` + `CookiesConsentBanner` + `UserTasksPopupAlert`. The PopupCoordinator is supposed to allow only one, but two are visibly overlapping on first visit.

Fix:
- Audit `PopupCoordinatorContext` registration for each of the popups above and confirm every popup calls `requestToShow()` / `dismiss()` instead of rendering on its own internal `open` state.
- Specifically wire `LeadCapturePopup` (and any second offender we find while testing) into the coordinator so only the highest-priority popup mounts at a time.
- Verify by hard-reloading `/` on desktop with localStorage cleared — only one card should appear.

### 2. "Call our agent" voice pill — premium gold/champagne, fix hover

File: `src/components/VoiceConciergeWidget.tsx` (lines ~389–409).

Currently the pill is solid black (`bg-[#1A1A1A]`) and its hover is `bg-[#1A1A1A]/90` (black-on-black, illegible).

Change to a champagne→gold gradient with ink text:
- Background: `linear-gradient(135deg, #F7F1E6 0%, #ECE2D2 50%, #D8C7A6 100%)`
- 1px gold hairline border `#B89555/60`, soft gold shadow
- Text + phone icon: ink `#1A1A1A`
- "LIVE · FREE" eyebrow: gold `#8a6f2e` (high-contrast ink-gold, not faded)
- Hover: slight gold sheen (subtle gradient shift) + scale `1.03`, keep contrast — NO black-on-black

Matches the Champagne-Gold Design Standard and No-Gold-Fills rule (1px hairline only, not a solid gold fill).

### 3. WhatsApp button must redirect to WhatsApp on click

File: `src/components/FloatingWhatsApp.tsx`.

Today the click handler does `e.preventDefault()` then `window.open(whatsappHref, '_blank', 'noopener,noreferrer')`. On some mobile browsers the popup-blocked `window.open` returns null and nothing happens.

Fix:
- Remove `e.preventDefault()` and the manual `window.open`. Let the native `<a href>` navigation run — the global `installWhatsAppGuard` already normalizes the URL to `https://wa.me/{digits}`.
- Keep `target="_blank"` + `rel="noopener noreferrer"`.

Result: tapping anywhere on the pill (or the minimized round button) reliably opens WhatsApp (app on mobile, `web.whatsapp.com` redirect on desktop).

### 4. Transparent header — white wordmark + gold champagne hamburger circle

File: `src/components/GlobalHeader.tsx`.

Current state of the transparent (non-scrolled) header still reads dark/grey on the hero, and the mobile hamburger sits inside a white pill (`bg-[#FDFBF7]/90`). Scrolled (solid) state is locked — do not touch.

Changes, gated on `isFullyTransparent === true` only:

a) Wordmark (lines ~710–731): force pure white with strong drop shadow so it pops on the dark hero. Today the `color:'#FFFFFF'` rule is being beaten by something — switch to a Tailwind class `text-white` plus inline `textShadow`, and add `!important` via arbitrary value (`text-[#FFFFFF]`) to defeat any global contrast guard rewrite. Apply to both "JBJ Global Real Estate" and "Excellence in Real Estate".

b) Logo image: when transparent keep `jbjMonogramLightTransparent` (light variant) with the existing drop-shadow.

c) Mobile hamburger button (lines ~742–757): replace the white pill with a champagne-gold gradient circle:
```
bg: linear-gradient(135deg, #F7F1E6 0%, #ECE2D2 50%, #D8C7A6 100%)
border: 1px solid rgba(184,149,85,0.6)
shadow: soft ink shadow
icon color: #1A1A1A (ink, stays readable on champagne)
```
Keep the same circle when solid header is showing so the look stays consistent on scroll; only swap the surrounding header chrome, not the button.

### Out of scope / locked

- Solid-on-scroll header styling, colors, shadows.
- Desktop nav links, dropdowns.
- Sidebar (`GlobalVerticalNav`) branding header.

### Verification

- Mobile (375×812) `/` reload: white "JBJ GLOBAL REAL ESTATE" on hero, champagne-gold hamburger circle.
- Desktop (1366×768) `/` first visit: only one popup card visible at a time.
- Hover the "Call our agent" pill on desktop: text/icon remain readable, no black-on-black.
- Tap WhatsApp pill on mobile + desktop: opens `wa.me/971547167107` correctly.
- Scroll past 80px: header transitions to the existing solid champagne treatment unchanged.
