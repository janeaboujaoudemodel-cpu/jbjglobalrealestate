Plan:

1. Simplify the recorder to a one-action flow
- Replace the current Start/Pause/Continue/Stop/Cancel/Re-record controls with a clean phone-style flow:
  - Idle: one navy button, `Start recording`
  - Recording: one navy button, `Done`
  - Stopped: one navy button, `Save call log`
  - Saving: locked navy button, `Saving…`
- Remove pause/resume/cancel/re-record from the call recorder UI.
- Keep the recording finalization stable: clicking `Done` stops the recorder, flushes the audio blob, sets duration, then shows only `Save call log`.

2. Fix call-recorder contrast locally
- Make Start recording, Done, Stop-equivalent, Save call log, and Saving states use approved navy `#102540` / hover `#1a3d63`.
- Force text and icons to white only on those navy buttons.
- Make every cream/champagne button, label, badge, and card text use ink `#1A1A1A`, never white.

3. Fix global button contrast across the site
- Strengthen the global CSS guard so:
  - Any button/link with navy `#102540` or navy hover keeps white text/icons on normal and hover.
  - Any button/link/card on champagne, cream, gold, or light surfaces forces ink text/icons, not white.
  - The rule applies to direct children and nested spans/icons, including lucide SVG strokes.
- Keep the existing opt-outs for true dark surfaces and AI purple elements.

4. Remove points from call logging
- Delete the +10 points side-effect from broker call save.
- Stop inserting `points_transactions` for `call_logged`.
- Keep `calls_made` incrementing in broker activity stats if the table is used for activity count, but set `points_earned` unchanged / no points added.
- Change the success toast from `Call logged successfully — +10 points` to `Call logged successfully`.
- Update empty-state copy so it no longer says calls award points.

5. Improve Calls made layout
- Replace the touching divider/list highlight with premium separated call cards:
  - `space-y-2` list instead of touching `divide-y`
  - each call row gets its own champagne/raised surface, 1px gold hairline, comfortable padding, and hover state
  - badges (Recording, AI, Score) remain ink-on-champagne/gold hairline, never white
- Add visible AI score pill in the calls list when `ai_score` exists.

6. Improve AI scoring presentation
- Keep the existing backend AI processing that writes `ai_score`, `ai_summary`, `ai_next_step`, and matches.
- Surface AI scoring more clearly in the call detail sheet and call row:
  - Score pill
  - Summary
  - Next step
  - Recommended properties when available
- If a recording has not processed yet, show a clean pending state without implying it failed.

7. Validate after implementation
- Open `/broker/crm`, open Log a call, verify idle/recording/stopped/saving button contrast at normal and hover.
- Verify saving no longer awards points or shows +10 points.
- Open Calls tab and verify call cards have spacing and premium borders, with no touching highlights.
- Run a targeted test/check for routing or obvious regressions if available.