## Problem

Three concrete bugs from the screenshot and message:

1. **Error overlay shows a black full-screen backdrop** behind the champagne card (`background: "#0a0a0a"` in `AppErrorBoundary.tsx`). User says this should never have a black background.
2. **"Go to Homepage" button** renders effectively white-on-champagne — `background: transparent` over a champagne card with a faint gold border, low contrast and unreadable until hover.
3. **"Coming Soon" pills** on Instagram / Facebook / LinkedIn / Snapchat tiles in Comm Hub. User wants honest backend-driven status: **"Not Connected"** instead of "Coming Soon", because connection availability is determined by backend state, not a future promise.
4. **Why is the error boundary even showing?** It triggers on any React render error, including transient chunk-loading hiccups during preview. Currently it auto-retries chunk errors but still flashes the full overlay before retry. The overlay should be silent for transient chunk errors (no UI flash) and only show after retries are exhausted.

## Fixes

### 1. `src/components/AppErrorBoundary.tsx`

- Replace outer wrapper `background: "#0a0a0a"` → champagne page color `#FDFBF7` so the screen never goes black.
- "Go to Homepage" button: change from `transparent` background to a solid high-contrast surface — `background: "#1A1A1A"` (ink) with `color: "#FDFBF7"` (champagne text). Keep gold border for brand accent. This guarantees readable contrast on the champagne card.
- Suppress the visible overlay during chunk-error retry: if `isChunkError && retryCount < 3`, render `null` (or a tiny invisible placeholder) instead of the full card. The card only renders for genuine, non-recoverable errors after retries exhausted.
- Add `data-no-contrast-guard` on the buttons so the runtime guard doesn't fight the explicit ink/champagne styling.

### 2. `src/hooks/useCommChannels.ts`

- Drop the `coming_soon` status entirely from the `ChannelStatus` union.
- Remove `comingSoon: true` from Instagram/Facebook/LinkedIn/Snapchat provider entries.
- Update their `description` to "Not connected — provider not linked yet" so the copy matches the new pill.
- All four social providers fall through to the standard `not_linked` status.

### 3. `src/components/owner-comm/ChannelTile.tsx`

- Remove the `coming_soon` branch from `statusPill` and from the action button block.
- Social tiles now show the existing **"Not Connected"** badge and a disabled gold-outline `Connect` button with tooltip "Backend integration pending — contact admin" so the user sees true status, not a marketing label.

## Technical details

- `AppErrorBoundary.tsx` outer `<div>` style change: `background: "#FDFBF7"` (was `#0a0a0a`).
- "Go to Homepage" button: `background: "#1A1A1A"`, `color: "#FDFBF7"`, `border: "2px solid rgba(200,167,102,0.6)"`.
- Chunk-retry path: replace `return (...)` with `return null` when `isChunkError && retryCount < 3`. Genuine errors still get the visible card.
- `ChannelStatus` becomes `"connected" | "available" | "not_linked"`. Type narrowing in `ChannelTile.tsx` and `ChannelGrid.tsx` updated accordingly.
- No DB or migration changes needed — `coming_soon` was a UI-only label.
- Same-tone CI guard already passes; ink-on-champagne button is high-contrast.

## Files touched

- `src/components/AppErrorBoundary.tsx` (background, button contrast, silent chunk retry)
- `src/hooks/useCommChannels.ts` (remove `coming_soon`, update social provider descriptions)
- `src/components/owner-comm/ChannelTile.tsx` (remove `coming_soon` branches)

No new components, no migration, no edge functions touched.
