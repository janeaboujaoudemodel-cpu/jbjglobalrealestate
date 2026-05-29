---
name: Web Developer Dock Standard
description: Owner-only inline UI tweaker — voice/screenshot/element-pick composer, live CSS preview with explicit Save/Cancel, before/after highlight overlay
type: feature
---
# JBJ Web Developer Dock — owner-only inline tweaker

## Visibility & gating
- Floating dock at bottom-right (`src/components/owner-webdev/WebDevDock.tsx`).
- Hidden for all users except `user_roles.role IN ('owner','admin')`.
- Edge functions `owner-webdev-propose` + `owner-webdev-voice` re-verify role server-side; never trust client.
- Minimize via header `–` button OR by clicking outside; floating pill at bottom-right re-opens it.

## Composer inputs
- Textarea for natural-language instruction.
- Screenshot (`html2canvas`, viewport-only, 0.6 scale).
- Element picker (overlay highlights hovered element, click locks selector).
- Voice note: `MediaRecorder` (webm/opus) → POST `owner-webdev-voice` → ElevenLabs Scribe (`scribe_v2`) → text appended to instruction.

## Live preview, explicit Save / Cancel
- `owner-webdev-propose` creates an `owner_ui_overrides` row with `status='pending'` and a matching `owner_change_requests` row with `status='ready'`.
- Pending overrides are previewed live via the `jbj:override-preview` event (owner-only scope; public visitors never see them).
- Per-request buttons:
  - **Save** → `owner_ui_overrides.status='approved'` + request `status='approved'`. Persists site-wide.
  - **Cancel** → delete override row + request `status='rejected'`. Preview is cleared.
- Never auto-save. The user must explicitly approve.

## "Take me there" + Before/After overlay
- `WebDevChangeHighlight.tsx` (mounted in `App.tsx`, owner-gated).
- Listens for `jbj:webdev-highlight` events with `{ selector, overrideId, requestId, changeLabel }`.
- After (optional) navigation:
  1. Scrolls target into view.
  2. Draws a pulsing gold ring (4s, keyframes `jbj-webdev-pulse`).
  3. Opens floating card with `Show Before / Show After` toggle (re-dispatches/clears `jbj:override-preview`), plus Save and Cancel buttons that perform the same DB mutations as the dock.
- Auto-fires immediately after a successful proposal if the change targets the current route.

## Contrast lock (Send button + voice button)
- Send and Save buttons are navy `#102540` with `text-white`. Always include `data-no-contrast-guard`, `data-allow-dark-cta`, `allow-white`, AND inline `style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}` on the wrapping span AND inner icon — the global contrast guard otherwise repaints them to ink.
- Voice-record-active state uses red `#DC2626` fill with the same white-lock pattern.

## Layout (no dead gap)
- Panel is `max-h-[min(640px,calc(100vh-3rem))]` with `flex-col` and **no fixed height** — it hugs content when history is empty.
- When `requests.length === 0`, render a compact empty-state strip (not a `flex-1` scroller); only mount the scrolling history when requests exist.

## Required secret
- `ELEVENLABS_API_KEY` (for voice transcription).

## Files
- `src/components/owner-webdev/WebDevDock.tsx`
- `src/components/owner-webdev/WebDevChangeHighlight.tsx`
- `src/components/owner-overrides/OwnerOverrideLoader.tsx` (preview CSS injector — do not modify)
- `supabase/functions/owner-webdev-propose/index.ts` — returns `{ override_id, request_id, selector, route }` flat fields for auto-highlight
- `supabase/functions/owner-webdev-voice/index.ts` — ElevenLabs Scribe transcription
