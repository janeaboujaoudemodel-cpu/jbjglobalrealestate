# Fix cookies banner + mobile overlay chaos

Two issues from the mobile screenshots on `/index`:

1. **Cookies banner is missing a "Reject All" button.** Only "Accept All" and "Manage Preferences" are shown — GDPR/UX best practice (and what the user is asking for) requires a one-tap reject.
2. **Floating widgets stack on top of content on mobile.** The "Call our agent" pill, chat bubble, and notification badge sit directly over the cookies banner buttons and over the mode card's "Continue" arrow. Layout looks broken at 390–440px widths.

## What to change

### 1. CookiesConsentBanner.tsx
- Add a third button: **Reject All** → calls existing `handleRejectNonEssential` (already wired to save `essential` status with analytics/marketing off).
- Order on mobile (stacked) and desktop (row): Accept All · Reject All · Manage Preferences.
- Style Reject All as a neutral outline button (cream surface, ink border) so it reads as a real choice, not a trap.

### 2. Mobile floating-widget collision
The cookie banner is fixed at `bottom: 0` and is the highest-priority popup. While it's visible, the floating widgets below must move out of the way (or hide). Plan:
- Add a `body[data-cookie-banner="open"]` flag toggled by `CookiesConsentBanner` while visible.
- Update the floating launchers (Call-agent pill, support chat bubble, notification badge) to either:
  - shift their `bottom` offset up by the banner height on mobile (`< 640px`), OR
  - hide entirely on mobile while the banner is open.
  
  Hiding is cleaner — they reappear the moment the user accepts/rejects.
- Also bump the cookie banner's own `bottom` padding so its buttons are never under the iOS home-indicator / browser chrome (already partially handled via `env(safe-area-inset-bottom)`, verify it's enough at 390×844).

### 3. Mode card "Continue" affordance
On the investor card the floating chat bubble overlaps the "Continue" arrow. Once the floating widgets are hidden behind the cookie gate (step 2), this resolves automatically. No layout change needed to the card itself.

## Files to touch

- `src/components/CookiesConsentBanner.tsx` — add Reject All button, set/clear `body[data-cookie-banner]` flag.
- The floating widget components (call-agent pill, support chat bubble, unread badge) — find them and add a `hidden when data-cookie-banner=open` rule, scoped to mobile. I will locate the exact components during implementation (likely `LiveAgentCallPill`, `SupportWidget`/`UnifiedSupportEcosystem`, and the notification badge).

## Out of scope

- No changes to the mode-selection cards, header, or page content.
- No changes to popup priority logic in `PopupCoordinatorContext`.
- No business-logic changes; consent persistence stays identical.
