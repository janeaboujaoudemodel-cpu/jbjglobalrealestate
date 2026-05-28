
## What you'll get

1. The dialog button "Save call log" stops being white-on-light. Icon and label stay visible on idle, hover, focus and disabled — verified visually in the preview before delivery.
2. "Log a call" becomes a real workspace: pick (or search) a lead, start the call, record from the microphone, get live AI suggestions while you talk, then auto-save the recording, transcript, AI summary and next step into that lead's call log — with +10 points like today.
3. One unified lead form. Same dialog used to add or attach a lead. No second mini-form.
4. New project rule: never ship white text/icons on champagne/cream/gold surfaces, and always test idle + hover before saying "done".

## Scope of changes

### 1. Contrast fix — "Save call log" and rule lock-in
- `src/pages/broker/BrokerCRM.tsx` (the Log a call dialog footer): rebuild the submit button using the existing navy CTA pattern with `data-allow-dark-cta` + `data-no-contrast-guard`, explicit `text-white` on label, and explicit `text-white` on the `CheckCircle2`/`Loader2` icons. Add the same to the "Log a call" header trigger (uses `variant="outline"` champagne — we keep that but verify hover and focus stay ink-on-cream).
- Add a memory rule: "Never white text or white icons on champagne / cream / gold surfaces. Always inspect idle, hover, focus and disabled in the preview before declaring a UI fix done." This becomes a core rule so it can't be repeated.
- Verification: I will open the dialog in the preview, screenshot Save call log idle and hover, and confirm both label and icon are visible.

### 2. Unified Log-a-call dialog with lead picker
- Inside the existing `LogCallDialog`, replace the single Select with a searchable picker (input + dropdown list filtered by name, phone, email, nationality, source) so brokers can find a lead the same way they search the rest of the CRM. "Manual call / no lead" remains a pinned first option.
- The selected lead's name and phone autofill (already partly done) and stay shown above the form so the broker knows who the call is being attributed to.
- This replaces any other ad-hoc "select lead before call" surface — there's only one form.

### 3. Browser call recording + live AI co-pilot + auto-saved log
This is the new piece.

#### Recording
- Add a "Start recording" button to the dialog. It uses `navigator.mediaDevices.getUserMedia` + `MediaRecorder` (audio/webm/opus) the same way the existing meeting summarizer does. Broker puts the phone on speaker; the laptop mic captures both sides.
- Live timer drives the existing "Duration seconds" field automatically; broker can still override.
- "Stop & save" uploads the audio blob to a new private Supabase Storage bucket `call-recordings/{user_id}/{call_id}.webm`, writes the public-internal path into `broker_call_logs.recording_url`, and triggers transcription.

#### Transcription + AI evaluation
- New edge function `broker-call-process`:
  - Input: `{ call_id, lead_id }`.
  - Downloads the audio via service-role, sends it to the existing `video-transcribe` ElevenLabs Scribe path for a full transcript (with diarization).
  - Calls Lovable AI Gateway (`openai/gpt-5.5`, the same model the broker AI assistant uses) with the transcript + lead profile + JBJ inventory snapshot to produce: summary, sentiment, objections, next step, updated lead score, recommended properties.
  - Persists transcript + AI JSON into new columns on `broker_call_logs`: `transcript_text`, `transcript_segments JSONB`, `ai_summary`, `ai_next_step`, `ai_score`, `ai_matches JSONB`, `ai_processed_at`.
  - Also writes one assistant row into `broker_ai_chats` for that lead so the assistant view stays in sync.

#### Live assist while the call is in progress
- A streaming side panel inside the dialog shows live transcript chunks (every ~6s, partial-commit via `video-transcribe`) and a "Coach" panel that calls a new lightweight `broker-call-live-coach` edge function with the partial transcript so the AI tells the broker:
  - "Listen — let the client finish."
  - "Now respond: …"
  - "Recommended units that fit: …" (from `projects` table, same matching rules as `broker-ai-assistant`).
- This panel is purely advisory; no message is sent on the broker's behalf.

#### Calls tab
- The Calls list in `BrokerCRM.tsx` already shows logs. Each row gets a "View" affordance that opens a side sheet with: audio playback, transcript, AI summary, recommended properties, and "Open lead". Existing rows (no recording) keep working unchanged.

### 4. Verification (end-to-end)
- Manually open the Log-a-call dialog in the preview, screenshot Save button idle + hover.
- Run a short recording (10s of silence is enough to verify the upload, transcription edge-function call returns, and the row is updated with `recording_url` + `ai_processed_at`).
- Confirm the row shows up in the Calls tab with a play button, and the AI summary panel renders.

## Technical details

- DB migration adds: storage bucket `call-recordings` (private) with RLS so brokers can only read/write under their own `{auth.uid()}/` prefix; new columns on `broker_call_logs` listed above; GRANTs unchanged (table already granted).
- Edge functions: `broker-call-process` (POST, requires auth, validates broker owns the log row), `broker-call-live-coach` (POST, requires auth, throttled). Both use the existing CORS + `getClaims` pattern.
- Reuses: `video-transcribe` (ElevenLabs Scribe v2), Lovable AI Gateway (`openai/gpt-5.5`), `MediaRecorder` pattern from the meeting summarizer.
- Memory: add core rule "No white text/icons on champagne; verify idle+hover in preview" and a constraint memory file `mem://constraints/no-white-on-champagne-buttons`.
- No existing features removed. CTA tokens and the navy CTA standard are reused as-is.
