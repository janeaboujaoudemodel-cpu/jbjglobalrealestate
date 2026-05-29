## Web Developer Dock — fixes + new capabilities

Scope is limited to `src/components/owner-webdev/WebDevDock.tsx`, a new voice-note edge function, the existing `owner_ui_overrides` flow, and a small "before/after" overlay component. Owner-only gating is already enforced (`user_roles` check) and stays unchanged.

### 1. Visual fixes (Send button + gap)

- **"Send" label readability**: the global contrast guard is fighting the navy CTA. Lock the button with `data-allow-dark-cta` + `.allow-white` (already set) and force `color:#FFFFFF` + `WebkitTextFillColor:#FFFFFF` inline so the word stays white on navy. Add a secondary variant: when the user prefers light styling, render label in `#102540` on a champagne pill. Default stays white-on-navy but legible.
- **Big gap under the chat**: the panel uses a fixed `h-[min(640px,...)]` but the History list has `flex-1` with empty state padding `py-8` creating dead space. Switch panel to `h-auto max-h-[min(640px,...)]` so it hugs content when history is empty, and reduce empty-state padding to `py-3`. History area becomes `flex-1 min-h-[80px]` only when there are requests.

### 2. Voice note input

- Add a mic button next to Screenshot / Pick in the composer.
- Press-and-hold (or click to start / click to stop) records via `MediaRecorder` (webm/opus).
- On stop, upload blob to a new edge function `owner-webdev-voice` which calls ElevenLabs Scribe (`scribe_v2`) and returns transcribed text.
- Transcribed text is appended to the `instruction` textarea (user can edit before Send).
- Requires `ELEVENLABS_API_KEY` secret. If not set, prompt to add it.

### 3. Owner-only minimizer (always visible)

- Keep the floating launcher pill (`!open` state) — it already minimizes the dock.
- When dock is `open`, add a second always-visible **minimize chip** anchored bottom-left of the panel header (in addition to the existing top-right minus). This gives a persistent thumb-reach minimize on mobile and desktop.
- Visibility is already gated by `allowed` (owner/admin role) — no change needed.

### 4. Edit-in-place: Live preview, explicit Save / Cancel

Today, AI proposals write directly to `owner_ui_overrides` with `status='pending'` and the preview loader already injects pending CSS. Reshape the flow:

- Edge function `owner-webdev-propose` already creates a `pending` override. Keep that — it becomes the **preview-only** state.
- Add two buttons per request card (already exist as Approve/Reject, rename for clarity):
  - **Save** → flips override `status` to `approved` (persists across sessions/users).
  - **Cancel** → deletes the override row + clears the preview event (current Reject behavior).
- Pending overrides are scoped to the current owner session via the existing `jbj:override-preview` event and `OwnerOverrideLoader` — public visitors never see them until Save.
- Add a "Discard all unsaved" pill in the dock header when ≥1 pending override exists.

### 5. "Take me there" + before/after visual

- Every new request stores `route` and `selector` (already in DB).
- When a proposal lands on a different route, the existing "Take me there" button navigates. Enhance it:
  - After navigation, dispatch `jbj:webdev-highlight` with `{ selector, beforeCss, afterCss }`.
  - New small overlay component `WebDevChangeHighlight.tsx` listens, scrolls the target into view, draws a gold ring around it for 4s, and opens a floating **Before / After** card with two thumbnails:
    - **Before** = screenshot captured before the override (html2canvas of the element with override temporarily disabled).
    - **After** = screenshot with override applied.
  - User can toggle a slider between Before and After, then click Save or Cancel from the card — same actions as the dock list.

### Technical notes

- Files touched:
  - `src/components/owner-webdev/WebDevDock.tsx` — UI fixes, voice mic, Save/Cancel rename, panel sizing.
  - `src/components/owner-webdev/WebDevChangeHighlight.tsx` — **new**, mounted once in `App.tsx` (gated by owner role).
  - `supabase/functions/owner-webdev-voice/index.ts` — **new**, ElevenLabs Scribe transcription, `verify_jwt` enforced via existing `requireOwnerAuth`.
  - `src/components/owner-overrides/OwnerOverrideLoader.tsx` — no change required; pending overrides already render only for owner via existing scoping.
- No DB migration needed — `owner_ui_overrides.status` already supports `pending`/`approved`/`rejected`.
- Secret: `ELEVENLABS_API_KEY` (will request via `add_secret` if missing when implementing).
- Memory updated after build: `mem://features/owner-dashboard/web-developer-dock-standard`.

```text
┌──────────── Web Developer Dock ─────────────┐
│ ⚡ JBJ Web Developer            [_] minimize │
├──────────────────────────────────────────────┤
│ On /properties                               │
│ [screenshot chip] [target chip]              │
│ ┌────────────────────────────────────────┐  │
│ │ Describe a UI change…                  │  │
│ └────────────────────────────────────────┘  │
│ [📷 Shot] [🎯 Pick] [🎤 Voice]    [→ Send]  │
├──────────────────────────────────────────────┤
│ pending · /home                              │
│ "Increase hero padding"                      │
│ [Take me there] [✓ Save] [✕ Cancel]          │
└──────────────────────────────────────────────┘
                                  [_ minimize]
```
