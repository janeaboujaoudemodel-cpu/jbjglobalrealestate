Plan:

1. Mobile homepage header background
   - Update `GlobalHeader` so the phone-only at-rest header uses the exact same fiberglass styling as the mobile `Free Consultation` pill:
     - `linear-gradient(180deg, rgba(16,37,64,0.48) 0%, rgba(16,37,64,0.30) 100%)`
     - `blur(16px) saturate(145%)`
     - matching subtle inner highlight/shadow.
   - Apply this only when:
     - viewport is phone/mobile header,
     - route is `/` or `/index`,
     - page is at normal load / not scrolled.
   - Keep the scrolled header locked as it is now.
   - Do not change the hamburger, logo, or wordmark structure.

2. Remove the white mobile header override source
   - Make the phone header paint its own fiberglass layer directly instead of relying on fragile body attributes.
   - Keep the champagne layer active only after scroll or on non-home routes.

3. Web Developer public visibility
   - Change `WebDevDock` to fail closed and render only for the verified owner from the existing owner verification context/hook.
   - Replace the closed dock label with a star-only button: no “Web Developer” text in the minimized public/owner viewport.
   - Keep the full panel available only after the owner opens it.

4. Visual validation after implementation
   - Take a phone screenshot at homepage normal load proving the header background matches the Free Consultation fiberglass pill.
   - Scroll down and take a second phone screenshot proving the scrolled header remains unchanged.
   - Take a public/non-owner validation screenshot or DOM check proving the Web Developer dock does not appear publicly.
   - Take an owner-state visual check proving only the star button appears, not the “Web Developer” label.